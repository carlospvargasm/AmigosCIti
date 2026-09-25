const fs=require("fs"),path=require("path");
const dir=path.join(process.cwd(),"data"), file=path.join(dir,"store.json");
fs.mkdirSync(dir,{recursive:true});
function load(){try{return JSON.parse(fs.readFileSync(file,"utf8"));}catch{return {topics:{},dates:{}};}}
function save(x){fs.writeFileSync(file,JSON.stringify(x,null,2));}
const key=id=>String(id);
module.exports={
 topics(id){const x=load();return x.topics[key(id)]||[];},
 addTopic(id,t){const x=load(),k=key(id);x.topics[k]=x.topics[k]||[];if(!x.topics[k].some(v=>v.toLowerCase()===t.toLowerCase()))x.topics[k].push(t);save(x);},
 delTopic(id,t){const x=load(),k=key(id);x.topics[k]=(x.topics[k]||[]).filter(v=>v.toLowerCase()!==t.toLowerCase());save(x);},
 dates(id){const x=load();return x.dates[key(id)]||[];},
 addDate(id,d){const x=load(),k=key(id);x.dates[k]=x.dates[k]||[];x.dates[k].push({...d,id:Date.now(),last_notified:null});save(x);},
 due(stamp){const x=load(),md=stamp.slice(5);const out=[];for(const [chat,rows] of Object.entries(x.dates))for(const r of rows){if((r.date===stamp||r.date==="0000-"+md)&&r.last_notified!==stamp)out.push({chat,r});}return out;},
 mark(chat,id,stamp){const x=load();const r=(x.dates[key(chat)]||[]).find(v=>v.id===id);if(r)r.last_notified=stamp;save(x);}
};
