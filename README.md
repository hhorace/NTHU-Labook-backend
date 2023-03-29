# NTHU Labook: backend - scraper

## usage
0. Install the packages
```
npm install
```
**WARNING**: I think installing and configing Browers Driver is difficult. Sorry for not providing install details of it.
PLease follow [puppeteer](https://pptr.dev/#getting-started)'s guide to make sure the [example](https://pptr.dev/#example) is work.

1. Build database first:
```
sqlite3 db/graduate.db
```

2. Define tables: (with schema below)
```
CREATE TABLE professors(
	professor_id INTEGER PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
  departments TEXT
);

CREATE TABLE students(
	student_id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	title_c TEXT NOT NULL,
	title_e TEXT NOT NULL,
	link_nthu TEXT NOT NULL,
	link_tw TEXT NOT NULL,
	date TEXT NOT NULL,
	graduate_year TEXT NOT NULL,
	keyword_c TEXT NOT NULL,
	keyword_e TEXT NOT NULL,
	period TEXT NOT NULL,
	note TEXT NOT NULL,
	professor_ids TEXT NOT NULL
);
```
E.g.
```
{
  professor_id: 1,
  name: '王教授',
  departments: '爬文所, 清大所'
},
{
  student_id: 123456789,
  name: '王大明',
  title_c: '王大明的中文碩論名稱',
  title_e: 'English title of Da-Ming Wang\'s thesis',
  link_nthu: 'https://etd.lib.nctu.edu.tw/cgi-bin/gs32/hugsweb.cgi?o=dnthucdr&s=id=%22ABCDEFGHIJKL%22.&searchmode=basic',
  link_tw: 'https://hdl.handle.net/12345/aaaaaa',
  date: '2023-03-29',
  graduate_year: '111',
  keyword_c: '中文、關鍵字、們',
  keyword_e: 'English、keywords、ss',
  period: '2.34',
  note: '碩',
  professor_ids: '123, 456'
}
```
Note to mention that both `departments` and `professor_ids` would be multiple values separating by ", ".
Also, both `link_tw` and `date` could be "not found", making `period` be "0.00' or "(竹教大學號無法計算)".

Some sqlite3 usual command
```
sqlite> .tables
sqlite> .schema
sqlite> .exit
```

3. insert professors (by reading `NTHUdepartment.yml`)
```
node db/insert_professors.js 
```

4. scrape the professors (with loggging result to a file)
Before run the script, make sure you have set the right Id(s) to scrape, e.g. 
(1) Select ALL Ids to scrape: `let slice_profs = professors.slice(0, professors.length);`
(2) Select some Ids (19, 21, 24, 203~242) to scrape: `selectedIds = [19, 21, 24, ...Array.from({ length: 242 - 203 + 1 }, (_, i) => i + 203)]`

You can also set how many papers to scrape for each professor in `scrape_all_professors()`:
```
scrape(p.name, -1, browser) //  set -1 to scrape all papers for the professor
scrape(p.name, 2, browser) //  set 2 to scrape 2 papers for the professor
```

Therefore, there's a simplest test to make sure the script is work i.e. only scrape 1 paper for the professor with professor_id = 1: `selectedIds = [1]` and `scrape(p.name, 1, browser)`

After all settings, you can run the script to scrape with logging results to a file:
```
node scrape.js | tee log.txt
```

5. After scraping, run `node db/update_list.js` to update the professors list becaute we only show the professors with non-zero papers in the website.

6. Copy and paste `db/graduate.db` and `list.yml` to the `./db/` folder of the website.