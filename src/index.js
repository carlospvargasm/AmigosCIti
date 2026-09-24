require("dotenv").config();
const {Client,LocalAuth}=require("whatsapp-web.js");
const qrcode=require("qrcode-terminal"),cron=require("node-cron"),OpenAI=require("openai"),db=require("./db");
const BOT=process.env.BOT_NAME||"AmigosCiti", GROUP=process.env.WHATSAPP_GROUP_NAME||"";
const ai=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;
const client=new Client({authStrategy:new LocalAuth({clientId:"amigosciti"}),puppeteer:{headless:true,args:["--no-sandbox","--disable-setuid-sandbox"]}});
client.on("qr",qr=>{console.log("\nEscanea este QR desde el WhatsApp de AmigosCiti:\n");qrcode.generate(qr,{small:true});});
client.on("ready",()=>console.log("AmigosCiti conectado."));
const topics=id=>db.prepare("SELECT topic FROM topics WHERE chat_id=? ORDER BY topic").all(id).map(x=>x.topic);
const dates=id=>db.prepare("SELECT id,label,date,annual FROM dates WHERE chat_id=? ORDER BY date").all(id);
function norm(s){const m=s.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?/);if(!m)return null;const d=String(+m[1]).padStart(2,"0"),mo=String(+m[2]).padStart(2,"0");return m[3]?m[3]+"-"+mo+"-"+d:"0000-"+mo+"-"+d;}
async function ask(text,id){if(!ai)return "Todavía no tengo configurada mi clave de IA. Sí puedo guardar y consultar fechas y temas.";const allowed=topics(id);const input="Eres "+BOT+", asistente breve y amistoso de un grupo de amigos. Solo responde sobre estos temas elegidos: "+(allowed.join(", ")||"(ninguno)")+". Si la consulta no corresponde, indica brevemente que no está entre las preferencias. No inventes datos. Consulta: "+text;const r=await ai.responses.create({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",input});return r.output_text;}
client.on("message",async msg=>{try{const chat=await msg.getChat();if(!chat.isGroup||(GROUP&&chat.name!==GROUP))return;const raw=msg.body.trim();if(!raw.toLowerCase().includes(BOT.toLowerCase()))return;const text=raw.replace(new RegExp(BOT,"ig"),"").replace(/^[:,\s@-]+/,"").trim();let m;
if((m=text.match(/^agrega(?:r)?\s+(?:tema|preferencia)\s*[:\-]?\s*(.+)$/i))){db.prepare("INSERT OR IGNORE INTO topics(chat_id,topic) VALUES(?,?)").run(chat.id._serialized,m[1].trim());return msg.reply("✓ Agregué “"+m[1].trim()+"” a los temas.");}
if((m=text.match(/^elimina(?:r)?\s+(?:tema|preferencia)\s*[:\-]?\s*(.+)$/i))){db.prepare("DELETE FROM topics WHERE chat_id=? AND lower(topic)=lower(?)").run(chat.id._serialized,m[1].trim());return msg.reply("✓ Eliminé “"+m[1].trim()+"”.");}
if(/^(ver|qué|que|lista).*temas|^temas$/i.test(text)){const t=topics(chat.id._serialized);return msg.reply(t.length?"Temas guardados: "+t.join(", "):"Todavía no hay temas guardados.");}
if((m=text.match(/^(?:recuerda|agrega(?:r)? fecha)\s+(.+?)\s+(?:el\s+)?(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)$/i))){const d=norm(m[2]);db.prepare("INSERT INTO dates(chat_id,label,date,annual) VALUES(?,?,?,?)").run(chat.id._serialized,m[1].trim(),d,d.startsWith("0000")?1:0);return msg.reply("✓ Guardado: "+m[1].trim()+" — "+m[2]+".");}
if(/^(ver|qué|que|lista).*fechas|^fechas$/i.test(text)){const d=dates(chat.id._serialized);return msg.reply(d.length?"Fechas guardadas:\n"+d.map(x=>"• "+x.label+": "+x.date).join("\n"):"Todavía no hay fechas guardadas.");}
return msg.reply(await ask(text,chat.id._serialized));}catch(e){console.error(e);}});
cron.schedule("0 9 * * *",async()=>{const n=new Date(),mo=String(n.getMonth()+1).padStart(2,"0"),d=String(n.getDate()).padStart(2,"0"),y=String(n.getFullYear()),stamp=y+"-"+mo+"-"+d;const rows=db.prepare("SELECT * FROM dates WHERE (date=? OR date=?) AND (last_notified IS NULL OR last_notified<>?)").all("0000-"+mo+"-"+d,stamp,stamp);for(const r of rows){await client.sendMessage(r.chat_id,"📅 AmigosCiti recuerda: hoy es "+r.label+".");db.prepare("UPDATE dates SET last_notified=? WHERE id=?").run(stamp,r.id);}}, {timezone:process.env.TZ||"America/Santiago"});
client.initialize();
