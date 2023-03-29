const yaml = require('js-yaml');
const fs   = require('fs');
const db = require('better-sqlite3')('./db/graduate.db');
db.pragma('journal_mode = WAL');

let professors = db.prepare("SELECT DISTINCT p.name FROM professors p JOIN students s ON ',' || s.professor_ids || ',' LIKE '%,' || p.professor_id || ',%'").all();
professors = professors.map((p) => { return p.name; });

let departments = new Set();
let output = new Set();
for(ps of professors){
  let de = db.prepare('SELECT * FROM professors WHERE name  = ?').get(ps);
  // console.log(de);
  de.departments.split(',').forEach(departments.add, departments);
  output.add(de);
}
console.log(output);
console.log(departments);

const data = {
  output: Array.from(output), // Convert Set to array
  departments: Array.from(departments)
};

const yamlStr = yaml.dump(data);
fs.writeFileSync('./db/list.yml', yamlStr);