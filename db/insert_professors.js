const yaml = require('js-yaml');
const fs   = require('fs');
const db = require('better-sqlite3')('./db/graduate.db');
db.pragma('journal_mode = WAL');

try {
  const doc = yaml.load(fs.readFileSync('./db/NTHUdepartment.yml', 'utf8'));
  prof_obj = {};
  for(let profs of doc){
    for(let prof of profs.profs){
      let prof_name;
      if(prof != prof.replace(' ','')){
        let rex = /[^\u4e00-\u9fa5]/;
        if(!rex.test(prof[0])){
          prof_name = prof.replace(' ','');
        }else{
          prof_name = prof;
        }
      } else {
        prof_name = prof;
      }
      
      if(prof_obj[prof_name]){
        prof_obj[prof_name].push(profs.department);
      }
      else{
        prof_obj[prof_name] = [profs.department];
      }
    }
  }

  console.log(Object.keys(prof_obj).length);

  
  // insert all professors' name
  for(prof of Object.keys(prof_obj)){
    db.prepare('INSERT INTO professors (name) VALUES (?)').run(prof);
  }

  // update all professors' departments
  for(prof in prof_obj){
    // console.log(prof, prof_obj[prof]);
    // let query = db.prepare('SELECT * FROM professors WHERE name  = ?').get(prof);
    // console.log(query);
    db.prepare('UPDATE professors SET departments = ? WHERE name = ?').run(prof_obj[prof].join(','), prof);
    // query = db.prepare('SELECT * FROM professors WHERE name  = ?').get(prof);
    // console.log(query);
  }
  
  let query = db.prepare('SELECT * FROM professors').all();
  console.log(query);
  
} catch (e) {
  console.log(e);
}