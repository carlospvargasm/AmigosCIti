require("dotenv").config();
const {default:makeWASocket,useMultiFileAuthState,DisconnectReason,fetchLatestBaileysVersion}=require("@whiskeysockets/baileys");
const qrcode=require("qrcode-terminal"),cron=require("node-cron"),OpenAI=require("openai"),pino=require("pino"),store=require("./db");
const BOT=process.env.BOT_NAME||"AmigosCiti";
const ADMINS=(process.env.ADMIN_NUMBERS||"").split(",").map(x=>x.replace(/\D/g,"")).filter(Boolean);
const ai=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;
const number=j=>(j||"").split("@")[0].replace(/\D/g,"");
const isAdmin=m=>ADMINS.includes(number(m.key.participant||m.key.remoteJid));
const norm=s=>{const m=s.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{4}))?/);if(!m)return null;const d=String(+m[1]).padStart(2,"0"),mo=String(+m[2]).padStart(2,"0");return m[3]?m[3]+"-"+mo+"-"+d:"0000-"+mo+"-"+d;};
const body=m=>m.message?.conversation||m.message?.extendedTextMessage?.text||"";
async function ask(text,id){if(!ai)return "Todavía no tengo configurada mi IA. Sí puedo consultar los temas y fechas guardados.";const extra=store.topics(id);const input="Eres "+BOT+", asistente de un grupo internacional de amigos que se conocen del trabajo. Habla de forma cercana, natural y adulta, sin modismos nacionales. No hagas bromas salvo que te las pidan; si piden un chiste, prioriza humor de oficina, reuniones, compañeros, teletrabajo o tecnología. IA es siempre un tema permitido: aprender IA, herramientas, productividad, formación, búsqueda de empleo y oportunidades laborales relacionadas con IA. Temas adicionales permitidos: "+(extra.join(", ")||"(ninguno)")+". Si preguntan por algo fuera de estos temas, responde de forma natural que ese tema todavía no está entre los que siguen y que pueden pedir a un administrador que lo agregue. No inventes datos. Consulta: "+text;const r=await ai.responses.create({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",input});return r.output_text;}
let sock;
async function send(id,text){await sock.sendMessage(id,{text});}
async function start(){
 const {state,saveCreds}=await useMultiFileAuthState("auth");
 const {version}=await fetchLatestBaileysVersion();
 sock=makeWASocket({version,auth:state,logger:pino({level:"silent"}),printQRInTerminal:false,browser:["AmigosCiti","Chrome","1.0"]});
 sock.ev.on("creds.update",saveCreds);
 sock.ev.on("connection.update",({connection,lastDisconnect,qr})=>{if(qr){console.log("\nEscanea este QR desde WhatsApp > Dispositivos vinculados:\n");qrcode.generate(qr,{small:true});}if(connection==="open")console.log("AmigosCiti conectado.");if(connection==="close"&&lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut)setTimeout(start,2000);});
 sock.ev.on("messages.upsert",async({messages,type})=>{if(type!=="notify")return;for(const m of messages){try{if(!m.message||m.key.fromMe)continue;const id=m.key.remoteJid;if(id==="status@broadcast")continue;const group=id.endsWith("@g.us"),raw=body(m).trim();if(!raw)continue;if(group&&!raw.toLowerCase().includes(BOT.toLowerCase()))continue;const text=group?raw.replace(new RegExp(BOT,"ig"),"").replace(/^[:,\s@-]+/,"").trim():raw;let z;
 if((z=text.match(/^agrega(?:r)?\s+(?:tema|preferencia)\s*[:\-]?\s*(.+)$/i))){if(!isAdmin(m)){await send(id,"Ese cambio lo pueden hacer solamente los administradores.");continue;}store.addTopic(id,z[1].trim());await send(id,"✓ Agregué “"+z[1].trim()+"” a los temas.");continue;}
 if((z=text.match(/^elimina(?:r)?\s+(?:tema|preferencia)\s*[:\-]?\s*(.+)$/i))){if(!isAdmin(m)){await send(id,"Ese cambio lo pueden hacer solamente los administradores.");continue;}store.delTopic(id,z[1].trim());await send(id,"✓ Eliminé “"+z[1].trim()+"”.");continue;}
 if(/^(ver|qué|que|lista).*temas|^temas$/i.test(text)){const t=store.topics(id);await send(id,t.length?"Temas: IA, "+t.join(", "):"Tema permanente: IA.");continue;}
 if((z=text.match(/^(?:recuerda|agrega(?:r)? fecha)\s+(.+?)\s+(?:el\s+)?(\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{4})?)$/i))){if(!isAdmin(m)){await send(id,"Ese cambio lo pueden hacer solamente los administradores.");continue;}const d=norm(z[2]);store.addDate(id,{label:z[1].trim(),date:d,annual:d.startsWith("0000")});await send(id,"✓ Guardado: "+z[1].trim()+" — "+z[2]+".");continue;}
 if(/^(ver|qué|que|lista).*fechas|^fechas$/i.test(text)){const d=store.dates(id);await send(id,d.length?"Fechas guardadas:\n"+d.map(x=>"• "+x.label+": "+x.date).join("\n"):"Todavía no hay fechas guardadas.");continue;}
 await send(id,await ask(text,id));
 }catch(e){console.error("Mensaje:",e.message);}}});
}
cron.schedule("0 9 * * *",async()=>{if(!sock)return;const n=new Date(),stamp=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0");for(const x of store.due(stamp)){await send(x.chat,"📅 AmigosCiti recuerda: hoy es "+x.r.label+".");store.mark(x.chat,x.r.id,stamp);}}, {timezone:process.env.TZ||"America/Santiago"});
start().catch(console.error);
