/*
这个文件是用来抓取上海疫情数据的。
一共有2种数据：
1。每日新增数字
"新增本土新冠肺炎确诊病例3238例和无症状感染者21582例，其中1177例确诊病例为此前无症状感染者转归，1754例确诊病例和21167例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。"
[上海2022年4月16日，新增本土新冠肺炎确诊病例3238例 新增本土无症状感染者21582例](https://wsjkw.sh.gov.cn/xwfb/20220417/00308b74d3b74d9894cf8e7746ac6d3b.html)

2。每日新增病例所在地址
"2022年4月16日，浦东新区新增1002例本土确诊病例，新增9789例本土无症状感染者，分别居住于：
八灶村郭家宅，
白桦路266弄，"
[4月16日（0-24时）本市各区确诊病例、无症状感染者居住地信息](https://mp.weixin.qq.com/s/dRa-PExJr1qkRis88eGCnQ)

数据来源有2个：卫健委官网 和 上海发布微信公众号。
上海发布的数据更快。而每个区的公众号又比上海发布更快。

 */

const fs = require('fs');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

async function main() {
    // await getListPage();
    getWechat();
}

async function getListPage() {
    const fromDate = new Date('2022-03-01 00:00:00').getTime();
    const result = await getTopicsFromWsjListPages(1);
    const ret = result.filter((item) => {
        const itemDate = new Date(item[0]).getTime();
        return itemDate >= fromDate;
    });
    ret.sort((a, b) => new Date(a[0]).getTime() > new Date(b[0]).getTime());
    ret.forEach((item) => {
        console.log(`date: ${item[0]}`);
        console.log(`title: ${item[2]}`);
        console.log(`url: ${item[1]}`);
    });
}

function getWechat() {
    const url = process.argv.slice(2)[0];
    // const url = 'https://mp.weixin.qq.com/s?__biz=MjM5NTA5NzYyMA==&mid=2654522433&idx=1&sn=7c55d1f38d41f388afde2f5e6c6d6e75&chksm=bd31d13a8a46582c2bc466f28366f5140b6404f528c3597e181db67787ff7b3e7596424dbaa4&mpshare=1&scene=23&srcid=0330DDHpcBFRBI4PzCNNbbGv&sharer_sharetime=1648605658815&sharer_shareid=b547167d055d935fd3f9f56094533f76%23rd';
    getAddressFromWechat(url).then(result => {
        if (result) {
            fs.writeFileSync(`${__dirname}/data/${result.date}.json`, JSON.stringify(result.addresses), 'utf8');
        }
    });
}

/*
从卫健委网站获取每日播报数据的文章链接
 */
async function getTopicsFromWsjListPages(maxPageNum) {
    const getPageUrl = (pageNum) => {
        // if (pageNum === 0) return 'https://wsjkw.sh.gov.cn/xwfb/index.html';
        // else return `https://wsjkw.sh.gov.cn/xwfb/index_${pageNum+1}.html`;
        // 官网列表页，从第10页开始数据丢失，只能改用搜索页的数据
        return `https://ss.shanghai.gov.cn/search?page=${pageNum+1}&view=&contentScope=1&dateOrder=2&tr=1&dr=&format=1&uid=00000180-3d55-851b-52bb-a9dd280219fe&sid=00000180-3d55-851b-0277-4156fe63c148&re=2&all=1&debug=&siteId=wsjkw.sh.gov.cn&siteArea=all&q=%E6%96%B0%E5%A2%9E%E6%9C%AC%E5%9C%9F%E6%96%B0%E5%86%A0%E8%82%BA%E7%82%8E%E7%A1%AE%E8%AF%8A%E7%97%85%E4%BE%8B`;
    }
    const ret = [];
    let i = 0;
    while (i <= maxPageNum) {
        let url = getPageUrl(i);
        const result = await getWsjMatchedLinksFromUrl(url);
        ret.push(...result);
        i++;
    }
    return ret;
}

async function getWsjMatchedLinksFromUrl(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const ret = [];
    const regex = /上海(\d+)年(\d+)月(\d+)日，新增本土新冠肺炎确诊病例/;

    const $ = jQuery = require('jquery')(window);
    // $('#main .main-container .container ul a').each((index, item) => {
    $('#results a.restitle').each((index, item) => {
        const title = $(item).text().trim();
        const result = title.match(regex);
        if (result) {
            const path = completeUrl($(item).attr('href'), url);
            ret.push([[result[1], result[2], result[3]].join('-'), path, title]);
        }
    });

    return ret;
}

async function getMetadataFromWsjTopicPage(url) {
    /*
    新增本土新冠肺炎确诊病例3例和无症状感染者62例，1例病例因症就诊发现，其余在隔离管控中发现。
    新增本土新冠肺炎确诊病例8例（含1例由无症状感染者转为确诊病例）和无症状感染者150例，其中1例确诊病例和69例无症状感染者在隔离管控中发现，1例无症状感染者为外省返沪人员协查中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例24例和无症状感染者734例，其中22例确诊病例和652例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例4例和无症状感染者979例，其中4例确诊病例和878例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例38例和无症状感染者2231例，其中5例确诊病例为此前无症状感染者转归，3例确诊病例和1773例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
     */
}

/**
 * if path starts with '/', prepend the domain from baseUrl
 * @param path
 * @param baseUrl
 * @returns {string}
 */
function completeUrl(path, baseUrl) {
    let ret = path;
    if (path.startsWith('/')) {
        const url = new URL(baseUrl);
        const domain = url.protocol + '//' + url.host;
        ret = domain + path;
    }
    return ret;
}

// TODO: 从卫健委网站每日播报数据的文章链接获取病患地址信息
async function getAddress(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const {document} = window;
    const addresses = [];

    const $ = jQuery = require('jquery')(window);
    // TODO: why document.title return ''?
    // const title = document.title;
    const title = $('#ivs_title').text();
    const match = title.match('(\\d+)月(\\d+)日（0-24时）');
    if (!match) {
        console.log('文章不匹配， exit。');
        return false;
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const date = `2022-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    console.log(`date: ${date}`);

    $('#js_content section[data-role=title]').each((index, item) => {
        const areaName = $(item).find('section[data-brushtype="text"]').text();
        // console.log(`areaName: ${areaName}`);
        $(item).find('section section[data-autoskip="1"] p').each((index, addressItem) => {
            let address = $(addressItem).find('span').text();
            if (address === '' || address.startsWith('2022年') || address.startsWith('已对相关居住地落实终末消毒措施')) {
                return true;
            }
            /*
            Samples:
            嘉定工业区陆渡村、草庵村、艾米公寓。
            窑墩村，
            周祝公路35号。
             */
            if (address.substr(-1) === '。' || address.substr(-1) === '，' || address.substr(-1) === '、') {
                address = address.substring(0, address.length - 1);
            }

            let results = [];
            if (address.indexOf('、') > -1) {
                results = address.split('、');
            } else {
                results = [address];
            }
            results.forEach(item => {
                addresses.push(`${areaName}${item}`);
            });
        });
    });

    console.log(`addresses.length: ${addresses.length}`);
    window.close();

    return {
        date: date, addresses: addresses,
    };
}

// 从上海发布微信公众号的每日播报数据文章链接获取病患地址信息。因为微信发布的更早
async function getAddressFromWechat(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const {document} = window;
    const addresses = [];

    const $ = jQuery = require('jquery')(window);
    // TODO: why document.title return ''?
    // const title = document.title;
    const title = $('#activity-name').text();
    const match = title.match('(\\d+)月(\\d+)日（0-24时）');
    if (!match) {
        console.log('文章不匹配， exit。');
        return null;
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const date = `2022-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    console.log(`date: ${date}`);

    let areaName = null;
    $('#js_content section[data-role=title],#js_content section[data-id="72469"]').each((index, item) => {
        if ($(item).attr('data-role') === 'title') {
            areaName = $(item).find('section[data-brushtype="text"]').text();
        } else if ($(item).attr('data-id') === '72469') {
            $(item).find('section section[data-autoskip="1"] p').each((index, addressItem) => {
                let address = $(addressItem).find('span').text();
                if (!address.trim() || address.startsWith('2022年') || address.startsWith('已对相关居住地落实终末消毒措施')) {
                    return true;
                }
                address = address.trim();
                /*
                Samples:
                嘉定工业区陆渡村、草庵村、艾米公寓。
                窑墩村，
                周祝公路35号。
                 */
                if (address.substr(-1) === '。' || address.substr(-1) === '，' || address.substr(-1) === '、') {
                    address = address.substring(0, address.length - 1);
                }

                let results = [];
                if (address.indexOf('、') > -1) {
                    results = address.split('、');
                } else {
                    results = [address];
                }
                results.forEach(item => {
                    addresses.push(`${areaName}${item}`);
                });
            });
        } else {
            console.log('something wrong!');
        }
    });

    console.log(`addresses.length: ${addresses.length}`);
    window.close();

    return {
        date: date, addresses: addresses,
    };
}

main();
