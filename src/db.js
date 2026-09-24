const Database=require("better-sqlite3");
const fs=require("fs"),path=require("path");
fs.mkdirSync(path.join(process.cwd(),"data"),{recursive:true});
const db=new Database(path.join(process.cwd(),"data","amigosciti.db"));
db.exec("CREATE TABLE IF NOT EXISTS topics(id INTEGER PRIMARY KEY AUTOINCREMENT,chat_id TEXT NOT NULL,topic TEXT NOT NULL,UNIQUE(chat_id,topic)); CREATE TABLE IF NOT EXISTS dates(id INTEGER PRIMARY KEY AUTOINCREMENT,chat_id TEXT NOT NULL,label TEXT NOT NULL,date TEXT NOT NULL,annual INTEGER NOT NULL DEFAULT 1,last_notified TEXT);");
module.exports=db;
