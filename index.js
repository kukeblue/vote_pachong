const puppeteer = require('puppeteer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const qs = require('qs');
const { time } = require('console');


const categoryId = '1685669363080691713'
const search = '空心胶囊'
const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyQ29udGV4dCI6IntcInVzZXJuYW1lXCI6XCJhZG1pblwiLFwibmlja05hbWVcIjpcIui2hee6p-euoeeQhuWRmFwiLFwiZmFjZVwiOlwiaHR0cHM6Ly9saWxpc2hvcC1vc3Mub3NzLWNuLWJlaWppbmcuYWxpeXVuY3MuY29tL2RkZGQ2MGUxZTY5ZjQ1MjdhYzEzZGE1MzM2NWI2YzM4LnBuZ1wiLFwiaWRcIjpcIjEzMzczMDYxMTAyNzc0NzYzNTJcIixcImxvbmdUZXJtXCI6ZmFsc2UsXCJyb2xlXCI6XCJNQU5BR0VSXCIsXCJpc1N1cGVyXCI6dHJ1ZX0iLCJzdWIiOiJhZG1pbiIsImV4cCI6MTY5NTg3ODcxMX0.SNzMR0aXxySlIdA_YwBi960SyrCIpmU27am5cdbOQXI'

async function submit(data) {
    data = qs.stringify(data);
    var config = {
      method: 'post',
      url: 'http://vote.qgyw.org.cn/api/manager/goods/brand',
      headers: { 
          'accessToken': accessToken, 
      },
      data : data
    };

  const res = await axios(config)
}


async function downloadImage(url, destPath) {
  const writer = fs.createWriteStream(destPath);

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(error);
  }
}

async function uploadImageWithFormData(imagePath) {

  const localImagePath = './image.jpg';
  await downloadImage(imagePath, localImagePath);

  // 读取图片文件
  const file = fs.createReadStream(localImagePath);
  
  // 创建 FormData 对象
  const formData = new FormData();
  formData.append('file', file);

  try {
    // 发起 POST 请求
    const response = await axios({
      method: 'post',
      url: 'http://vote.qgyw.org.cn/api/common/common/upload/file',
      data: formData,
      headers: {
        ...formData.getHeaders(), // 获取 FormData 的 Headers
        accessToken // 设置 accessToken
      }
    });

    console.log(response.data.result); // 打印上传结果
    return response.data.result
  } catch (error) {
    console.error(error);
  }
}




function sleep(milliSeconds) {
  var StartTime = new Date().getTime();
  let i = 0;
  while (new Date().getTime() < StartTime + milliSeconds);
}

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

function main() {

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    });
    const page2 = await browser.newPage();
    const page = await browser.newPage();
    await page.goto('https://b2b.baidu.com/m/');
    sleep(30000)
    // await page.type(".c-input", "hello world");
    // 或者使用以下代码，等待输入框出现并聚焦后再输入
    const inputSelector = '.c-input'; // 输入框的类名
    const textToType = search; // 要输入的文字
    await page.waitForSelector(inputSelector);
    await page.click(inputSelector);
    await page.focus(inputSelector);
    await page.keyboard.type(textToType);
    await page.keyboard.press('Enter');
    sleep(3000)
    // 点击厂家
    const changjiaElementSelector = '.c-navs-common-full-height'; // 要点击的元素的类名
    // 获取所有匹配的元素
    let elements = await page.$$(changjiaElementSelector);
    // 确保存在至少两个以上的匹配元素
    if (elements.length >= 2) {
      // 点击第二个元素
      await elements[2].click();
    }
    await scrollToBottom(page);
    await scrollToBottom(page);
    await scrollToBottom(page);

    let itemsElementSelector = '.c-touchable-feedback-content .top-left';
    elements = await page.$$(itemsElementSelector);
    console.log('找到匹配的元素', elements.length)
    let count = elements.length
    if (count > 35) count == 35
    // 点击第二个元素
    for (let i = 5; i < 35; i++) {
      let data = {
        companyName: '--',
        companyProfile: '--',
        logo: '--',
        name: '--',
        categoryId,
      }
      try {
        elements = await page.$$(itemsElementSelector);
        console.log('================= 开始爬取第' + (i + 1) + "个项目======================")
        
        await elements[i].click();
        await page.waitForNavigation();
        let url = await page.url();
        await page2.goto(url);
        const nameElementSelector = '.name';
        await page2.waitForSelector(nameElementSelector);
        let nameEl = await page2.$$(nameElementSelector);
        if (nameEl.length >= 1) {
          let res = await page2.$eval('.name', el => el.innerHTML);
          const filteredString = res.match(/[\u4E00-\u9FA5a-zA-Z]+/g).join('');
          console.log('公司名称', filteredString);
          data.companyName = filteredString
          data.name = filteredString
          if (filteredString) {
            const imgSelector = '.c-img-img';
            await page2.waitForSelector(imgSelector);
            const src = await page2.$eval(imgSelector, img => img.getAttribute('src'));
            const logo = await uploadImageWithFormData(src)
            console.log('logo地址:', logo);
            data.logo = logo
            await page2.$eval(imgSelector, img => {
              img.click(); // 点击图片
            });
            await page2.waitForNavigation();
            let url = await page2.url();
            console.log('url', url)
            if (url.includes('aiqicha')) {
              console.log('获取公司地址');
              let valueSelector = '.child-addr-poptip';
              // 等待元素加载完成
              await page2.waitForSelector(valueSelector);
              // 获取文字内容
              let textContent = await page2.$eval(valueSelector, element => element.textContent);
              let ret = textContent.match(/[\u4e00-\u9fa5a-zA-Z,\.]+/g).join('');
              console.log(ret);
              data.companyProfile = data.companyProfile + ret
              console.log('获取公司简介');
              let spread = 'body > div.base.page-detail.has-search-tab > div.aqc-content-wrapper.has-footer > div > div.detail-header-container > div.detail-header > div.header-top > div.header-content > div.content-info > div:nth-child(4) > div > span.fold'
              await page2.waitForSelector(spread);
              await page2.$eval(spread, async spread => {
                spread.click(); // 点击图片
              });
              valueSelector = 'body > div.base.page-detail.has-search-tab > div.aqc-content-wrapper.has-footer > div > div.detail-header-container > div.detail-header > div.header-top > div.header-content > div.content-info > div:nth-child(4) > div';
              // 等待元素加载完成
              await page2.waitForSelector(valueSelector);
              // 获取文字内容
              textContent = await page2.$eval(valueSelector, element => element.textContent);
              // const ret = textContent.match(/[\u4e00-\u9fa5a-zA-Z,\.]+/g).join('');
              textContent = await page2.$eval(valueSelector, element => element.textContent);
              ret = textContent.replace(/简介：|收起|\s/g, "");
              data.companyProfile = data.companyProfile + '。' + ret
              console.log(ret);
            } else {
              console.log('获取公司地址');
              let valueSelector = '.basic-wrap .list .list-line:nth-child(3) .value';
              // 等待元素加载完成
              await page2.waitForSelector(valueSelector);
              // 获取文字内容
              let textContent = await page2.$eval(valueSelector, element => element.textContent);
              console.log(textContent);
              data.companyProfile = data.companyProfile  + textContent
              console.log('获取公司简介');
              valueSelector = '.basic-wrap .list .list-line:nth-child(4) .value';
              // 等待元素加载完成
              await page2.waitForSelector(valueSelector);
              // 获取文字内容
              textContent = await page2.$eval(valueSelector, element => element.textContent);
              data.companyProfile = data.companyProfile + '。' + textContent
            }
          }
        }
      } catch {

        console.log(' ****************** 爬取第' + (i + 1) + "个项目失败 ********************* ")

      }
      submit(data)
      page.goBack()
      await scrollToBottom(page);
    }
    // await page.screenshot({ path: 'example.png' });
    sleep(30000)
    await browser.close();
  })()
};

main()