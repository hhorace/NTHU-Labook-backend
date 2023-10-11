const puppeteer = require('puppeteer');
const fs = require('fs');
const similarity = require('./similarity.js');

function cal_period(date, student_id, degree){
  // ref: [清大100學年度起學生學號編碼原則](https://registra.site.nthu.edu.tw/var/file/211/1211/img/327248576.pdf)
  // 起始時間: 提早入學以2/1計算、其餘以8/1計算
  let add_ROC_year = 0;
  if(date != null){
    add_ROC_year = (parseInt(date.split('-')[0]) < 1911) ? 0 : 1911;
  }
  
  if(student_id.length != 9 || student_id[0]!='1'){
    return ['(竹教大學號無法計算)', degree[0]];
  }
  else if(degree == '博士' && (student_id[6] == '4'||student_id[6] == '5'||student_id[6] == '6')){ //碩逕博
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year;
    let start_date = new Date(start_year, 7, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '碩逕博'];
  }
  else if (degree == '博士' && student_id[6] == '7'){ //碩逕博(提早入學)
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year + 1;
    let start_date = new Date(start_year, 1, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '碩逕博(提早入學)'];
  }
  else if (degree == '博士' && student_id[6] == '8'){ //博
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year;
    let start_date = new Date(start_year, 7, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '博'];
  }
  else if (degree == '博士' && student_id[6] == '9'){ //學逕博
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year;
    let start_date = new Date(start_year, 7, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '學逕博'];
  }
  else if (degree == '碩士' && (student_id[6] == '5'||student_id[6] == '6')){ //碩
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year;
    let start_date = new Date(start_year, 7, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '碩'];
  }
  else if (degree == '碩士' && student_id[6] == '7'){ //碩(提早入學)
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year + 1 ;
    let start_date = new Date(start_year, 1, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '碩(提早入學)'];
  }
  else if (degree == '碩士' && student_id[6] == '4'){ //碩(外籍生)
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year;
    let start_date = new Date(start_year, 7, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '碩(外籍生)'];
  }
  else if (degree == '碩士' && (student_id[6] == '8' ||student_id[6] == '9')){ //碩(博降轉碩)
    let start_year = parseInt(student_id.substring(0,3)) + add_ROC_year;
    let start_date = new Date(start_year, 7, 1); //注意月份值由 0 開始
    let end_date = new Date(date);
    let year = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24)) / 365.0;
    return [year.toFixed(2), '碩(博降轉碩)'];
  }
  else{
    return ['(竹教大學號無法計算)', degree[0]];
  }
}

async function scrape(professor, num_paper, browser) {
  let professor_id = db.prepare('SELECT * FROM professors WHERE name  = ?').get(professor).professor_id;
  if(!professor_id){
    throw new Error('Can not find the professsor in DB.');
  }
  
  const page = await browser.newPage();

  // goto 清大博碩士論文
  await page.goto('https://etd.lib.nctu.edu.tw/cgi-bin/gs32/hugsweb.cgi?o=dnthucdr');

  // key in professor's name
  await page.type('#ysearchinput0', professor);
  
  // unclick "論文名稱"
  await page.click('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td > input[type=checkbox]:nth-child(1)');
  // click "指導教授"
  await page.click('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(5) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(2) > td > input[type=checkbox]:nth-child(3)');
  // search
  await page.click('#gs32search');
  // wait "檢索結果"
  await page.waitForSelector('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr > td > h3', { timeout: 60000 });
  
  // 筆數
  await page.waitForSelector('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > table.brwrestable > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(2)', { timeout: 60000 });
  let result_num = await page.$eval('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > table.brwrestable > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(2)', el => el.textContent);
  if(parseInt(result_num) == 0){
    throw professor +' not found in 清大博碩士論文網.';
  }
  if(num_paper == -1) num_paper = parseInt(result_num);

  // // 因為清大碩博士論文系統的排序是拉基...(民國99 > 民國 100 > 民國 98) 所以照出版年排序也沒用
  // // sort with 出版年遞減
  // await page.select('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(4) > td > div > table > tbody > tr > td:nth-child(4) > select', '-pyr');
  // // wait "檢索結果"
  // await page.waitForSelector('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > table:nth-child(1) > tbody > tr > td > h3', { timeout: 60000 });

  // click the first result
  await page.waitForSelector('#tablefmt1 > tbody > tr:nth-child(2) > td.tdfmt1-content > div > div.leftdiv > table > tbody > tr:nth-child(1) > td > a > span', { timeout: 60000 });
  await page.click('#tablefmt1 > tbody > tr:nth-child(2) > td.tdfmt1-content > div > div.leftdiv > table > tbody > tr:nth-child(1) > td > a > span');

  let insert_num = 0;
  for(let i = 0; i<num_paper;i++){
    console.log("\n",i);
    // wait "詳目顯示"
    await page.waitForSelector('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(6) > td > div.cont_l2 > table > tbody > tr:nth-child(1) > td > h3', { timeout: 60000 });
    // wait for table loading
    await page.waitForSelector('#format0_disparea > tbody', { timeout: 60000 });
    
    let name = null, title_c = null, title_e = null, student_id = null, degree = null, keyword_c = null, keyword_e = null, graduate_year = null;
    let results = await page.$eval('#format0_disparea > tbody', tbody => [...tbody.rows].map(r => [...r.cells].map(c => c.innerText)));
    for(let j=0;j<results.length;j++){
      if (results[j][0] == '作者(中文):') name = results[j][1].replace(/\n/g, '');
      else if (results[j][0] == '論文名稱(中文):') title_c = results[j][1].replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g,"");
      else if (results[j][0] == '論文名稱(外文):') title_e = results[j][1].replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g,"");
      else if (results[j][0] == '學號:') student_id = results[j][1];
      else if (results[j][0] == '學位類別:') degree = results[j][1];
      else if (results[j][0] == '中文關鍵詞:') keyword_c = results[j][1];
      else if (results[j][0] == '外文關鍵詞:') keyword_e = results[j][1];
      else if (results[j][0] == '畢業學年度:') graduate_year = results[j][1];
    }
    if(name == null){
      console.log("作者(中文) not found: ", professor, i);
      name = 'not found';
    }
    if(title_c == null){
      console.log("論文名稱(中文) not found: ", name, professor, i);
      title_c = 'not found';
    }
    if(title_e == null){
      console.log("論文名稱(外文) not found: ", name, professor, i);
      title_e = 'not found';
    }
    if(student_id == null){
      console.log("學號 not found: ", name, professor, i);
      student_id = '-1'; //length < 8, would be not recorded in DB
    }
    if(degree == null){
      console.log("學位類別 not found: ", name, professor, i);
      degree = 'not found';
    }
    if(keyword_c == null){
      console.log("中文關鍵詞 not found: ", name, professor, i);
      keyword_c = 'not found';
    }
    if(keyword_e == null){
      console.log("外文關鍵詞 not found: ", name, professor, i);
      keyword_e = 'not found';
    }
    if(graduate_year == null){
      console.log("畢業學年度 not found: ", name, professor, i);
      graduate_year = 'not found';
    }

    // db已有資料: 檢查是否有共同指導教授的情況
    let query = db.prepare('SELECT * FROM students WHERE title_c  = ?').get(title_c);
    if(query){
      let professor_id_arr = query['professor_ids'].split(',').map(e => { return parseInt(e) });

      if (professor_id_arr.includes(professor_id)) // 已紀錄該指導教授
        console.log(`${name} with same professor_id (${professor_id}) has existed in DB.`); 
      
      else { // 未紀錄該指導教授
        professor_id_arr.push(professor_id);
        db.prepare('UPDATE students SET professor_ids = ? WHERE student_id = ?').run(professor_id_arr.join(','), student_id);
        console.log(`${name} have update professor_ids with adding new professor_id (${professor_id}).`);
      }

      if(query['link_tw']!='not found'){
        // goto next result
        await page.click('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(6) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(4)');
        continue;
      }
    }

    // 學號包含非數字
    if(!(/^\d+$/.test(student_id))){
      console.log("student_id:", student_id, "學號包含非數字。教授名字:", professor);
      // break;
      // goto next result
      await page.click('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(6) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(4)');
      continue;
    }

    // 民國100年以前入學不計
    if(student_id.length<8){
      console.log("student_id:", student_id, "100學年以前不採計。教授名字:", professor); 
      // break;
      // goto next result
      await page.click('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(6) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(4)');
      continue; // 因為清大碩博士論文系統的排序是拉基... （民國99 > 民國 100 > 民國 98？！？！
    }

    // wait "引用網址"
    await page.waitForSelector('#gs32_usercommand > ul > li:nth-child(4)', { timeout: 60000 });
    await page.click('#gs32_usercommand > ul > li:nth-child(4)');
    await page.waitForSelector('#fe_text_refurl', { timeout: 60000 });
    let link_nthu = await page.$eval('#fe_text_refurl', el => el.value);
    
    // goto 台灣博碩士論文系統網址 ("以作者查詢臺灣博碩士論文系統"的網址)
    await page.waitForSelector('#fb32fmt0disparea > tbody > tr > td > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > a', { timeout: 60000 });
    let link_tw = await page.$eval('#fb32fmt0disparea > tbody > tr > td > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(2) > a', el => el.getAttribute("onclick"));
    await page.goto(link_tw.split("'")[3]);
    // wait loading
    await page.waitForSelector('#maincontent', { timeout: 60000 });
    
    let date = null;
    
    // 檢查同名作者的情況：
    // 當頁面找得到「檢索結果共 x 筆資料」，x>0代表出現同名作者情況，需進一步搜尋論文名稱；x=0代表沒有同名作者，即在台灣博碩士論文系統找不到該論文；
    // 當找不到「檢索結果共 x 筆資料」，則代表沒有同名情況，此時`parseInt(result_num_tw)==-1`，但不代表就是出現的就一定是同篇論文，仍需檢查論文名稱(is_same_paper)
    let result_num_tw = await page.$eval('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > table.brwrestable > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(2)', el => el.textContent).catch(() => -1);
    if(parseInt(result_num_tw)>0){ 
      let found = false;
      // 輸入論文名稱
      let title_c_tmp = title_c.replace(/[─—–╴―「」《》（）]/g, " ").replace(/["]/g, ' '); // 取代標點符號改成space，因為台灣博碩士論文系統有bug, e.g. 搜尋"─「"會回到首頁、搜尋「"」會syntex error
      await page.type('#research', title_c_tmp);
      await page.click('#researchdivid > input');
      // 等待"檢索結果"
      await page.waitForSelector('#result > h3', { timeout: 60000 });
      let result_num_tw_tmp = await page.$eval('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(4) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > table.brwrestable > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(2)', el => el.textContent).catch(() => -1);

      for(let j=0;j<parseInt(result_num_tw_tmp);j++){
        let selector = '#tablefmt1 > tbody > tr:nth-child('+ (j+2) +') > td.tdfmt1-content > div > div.leftdiv > table > tbody > tr:nth-child(2) > td > a > span';
        await page.waitForSelector(selector, { timeout: 60000 });
        let title_tmp = await page.$eval(selector, el => el.textContent);
        if(similarity(title_tmp,title_c)>=0.8 || similarity(title_tmp,title_e)>=0.8){ // 也檢查英文(因為有白癡中英文打反
          await page.click(selector);
          found = true;
          break;
        }
      }
      if (!found){ //找不到相同論文名
        console.log(`${name} link_tw not found.`);
        link_tw = 'not found';
        result_num_tw = '-2';
      }
    }
    else if(parseInt(result_num_tw)==0){
      // console.log(result_num_tw);
      console.log(`${name} link_tw not found.`);
      link_tw = 'not found';
    }

    let is_same_paper = false;
    if(parseInt(result_num_tw)>0 || parseInt(result_num_tw) == -1){
      // update to "永久網址"
      await page.waitForSelector('#fe_text1', { timeout: 60000 });
      link_tw = await page.$eval('#fe_text1', el => el.value);
      await page.waitForSelector('#format0_disparea', { timeout: 60000 });

      // get "口試日期"
      // wait for table loading
      await page.waitForSelector('#format0_disparea > tbody', { timeout: 60000 });
      results = await page.$eval('#format0_disparea > tbody', tbody => [...tbody.rows].map(r => [...r.cells].map(c => c.innerText)))
      for(let j=0;j<results.length;j++){
        if(results[j][0] == '論文名稱:'){
          if (similarity(results[j][1], title_c)>=0.8 || similarity(results[j][1], title_e)>=0.8){ // 也檢查英文(因為有白癡中英文打反
            is_same_paper = true;
          }
        }
        else if (results[j][0] == '口試日期:'){
          // 日期接受格式：'yyyy-mm-dd', 'yyy-mm-dd', 'yyyymm-dd', 'yyyy-mmdd', 'yyyy-m-d', 'yyyy--mm--d--'等
          // 但無法接受 'yyymm-dd', e.g. '10804-07'
          let date_arr = results[j][1].replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]+/g,"")
                                      .replace(/\s/g, '')
                                      .match(/^(\d{3,4})-?-?(\d{2}|\d)-?-?(\d{2}|\d)-?$/); 
          if(date_arr != null){
            let yyyy = (parseInt(date_arr[1]) < 1911) ? (parseInt(date_arr[1])+1911).toString() : date_arr[1];
            let mm = parseInt(date_arr[2]).toString().padStart(2, '0');
            let dd =  parseInt(date_arr[3]).toString().padStart(2, '0');
            date = `${yyyy}-${mm}-${dd}`
          }
          else{
            console.log("Error: 口試日期格式錯誤: ", results[j][1]);
          }
          break;
        }
      }
    }

    let [period, note] = cal_period(date, student_id, degree);
    
    if(date == null || !is_same_paper){
      link_tw = (!is_same_paper) ? 'not found' : link_tw;
      console.log("口試日期 not found: ", link_tw);
      period = (period == '(竹教大學號無法計算)') ? period : '0.00';
      date = 'not found';
    }
    
    let paper = {
      'student_id': student_id,
      'name': name,
      'title_c': title_c,
      'title_e': title_e,
      'link_nthu': link_nthu,
      'link_tw': link_tw,
      'date': date,
      'graduate_year': graduate_year,
      'keyword_c': keyword_c,
      'keyword_e': keyword_e,
      'period': period,
      'note': note,
      'professor_id': professor_id.toString()
    }
    
    if(query){
      if(query['link_tw']=='not found'){
        console.log("student_id(%s) new link_tw(%s), date(%s), period(%s)", student_id, link_tw, date, period);
        db.prepare('UPDATE students SET link_tw = ?, date = ?, period = ? WHERE student_id = ?')
        .run(link_tw, date, period, student_id);
      }  
    }
    else{
      console.log(paper);
      db.prepare('INSERT INTO students VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(student_id, name, title_c, title_e, link_nthu, link_tw, date, graduate_year, keyword_c, keyword_e, period, note, professor_id.toString());
    }
    
    insert_num += 1;
    await page.waitForTimeout(60000); // sleep for 60 sec, 避免被鎖IP

    // 回到清大碩博士論文網
    if(parseInt(result_num_tw)>0){
      await page.goBack();
      await page.waitForSelector('#result > h3', { timeout: 60000 });
      await page.goBack();
      await page.waitForSelector('#result > h3', { timeout: 60000 });
      await page.goBack();
      await page.waitForSelector('#result > h3', { timeout: 60000 });
    }
    else if(parseInt(result_num_tw)== -2){ // have same name but no same title
      await page.goBack();
      await page.waitForSelector('#result > h3', { timeout: 60000 });
      await page.goBack();
      await page.waitForSelector('#result > h3', { timeout: 60000 });
    }
    else { // no same name (no this paper or only one with this name) (-1)

    }
    await page.goBack();
    
    // wait "詳目顯示"
    await page.waitForSelector('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(6) > td > div.cont_l2 > table > tbody > tr:nth-child(1) > td > h3', { timeout: 60000 });
    // goto next result
    await page.click('#bodyid > form > div > table > tbody > tr:nth-child(1) > td.etds_mainct > table > tbody > tr:nth-child(6) > td > div.cont_l2 > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(4)');
  }
  return insert_num;
};

async function scrape_all_professors(professors){
  for (const p of professors){
    console.log("-----------------------------------------------");
    console.log("now scrape:", p.name, "(", p.professor_id, ")");
    const browser = await puppeteer.launch({headless: false}); // default is true
    
    try{
      await scrape(p.name, -1, browser) // set -1 to search all papers, or give a number to scrape a certain number of papers
          .then((insert_num) => {
            console.log("\n",insert_num,"have been inserted.");
          })
          .catch((err) => {
            console.log(err);
          });
    }
    finally {
      await browser.close();
    };
  }
}

const db = require('better-sqlite3')('./db/graduate.db');
db.pragma('journal_mode = WAL');

let professors = db.prepare('SELECT * FROM professors').all();


// // Select some Ids to scrape
// const selectedIds = [
//   19, 21, 24,
//   ...Array.from({ length: 242 - 203 + 1 }, (_, i) => i + 203), // use spread operator to add numbers 203 to 242
//   ...Array.from({ length: 356 - 327 + 1 }, (_, i) => i + 327), // use spread operator to add numbers 220 to 356
//   ...Array.from({ length: 777 - 245 + 1 }, (_, i) => i + 245), // use spread operator to add numbers 245 to 777
// ].map(id => id - 1);
// let slice_profs = professors.filter((_, index) => selectedIds.includes(index));


// Select ALL Ids to scrape
// let slice_profs = professors.slice(777, professors.length);
let slice_profs = professors.slice(83, 84);
// let slice_profs = professors.slice(0, 100);

// const selectedIds = [
//   23, 25, 34, 38, 69, 84,
// ].map(id => id - 1);
// let slice_profs = professors.filter((_, index) => selectedIds.includes(index));

console.log(slice_profs);
scrape_all_professors(slice_profs);