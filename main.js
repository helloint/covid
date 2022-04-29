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
    var type = process.argv.slice(2)[0];
    var url = process.argv.slice(2)[1];
    switch(type) {
        case 'list':
            await getListPage();
        case 'shaddr':
            // url = 'https://mp.weixin.qq.com/s\?__biz\=MjM5NTA5NzYyMA\=\=\&mid\=2654530127\&idx\=2\&sn\=e8993a4b13a2ef3311d4d1df73d454c7\&chksm\=bd31f7348a467e22baf607b06fb3454e4f2914e100244fc81221c6a58ae31614046706b21e4a\&mpshare\=1\&scene\=23\&srcid\=0426WlF93Py0H7rgfsERy50r\&sharer_sharetime\=1650941828872\&sharer_shareid\=b547167d055d935fd3f9f56094533f76%23rd';
            getWechat(url);
            break;
        case 'mhaddr':
            // url = 'https://mp.weixin.qq.com/s?__biz=MzA3NzEzNzAwOQ==&mid=2650544187&idx=2&sn=70cd89bbfbd407a038dcf893dd7fc4ed&chksm=875e2d25b029a4339f5ee51bff2c616132f9e2ee1746ec04507b87e84e66619f07a55300487a&mpshare=1&scene=23&srcid=0427F3X92JT0J2iKGKDwMlcx&sharer_sharetime=1651025378365&sharer_shareid=b547167d055d935fd3f9f56094533f76%23rd';
            getMhWechat(url);
            break;
        case 'level':
            // url = 'https://mp.weixin.qq.com/s?__biz=MzA3NzEzNzAwOQ==&mid=2650536904&idx=1&sn=003379bebf1b0a85eaa2f81c95a9a5f8&chksm=8759ced6b02e47c0379092302a0a20048a47b0ed9a92f2ddf6d58005ba728513821245df7fa4&mpshare=1&scene=23&srcid=0421CMdtMTbZHi7DR5xJTfX0&sharer_sharetime=1650499140777&sharer_shareid=b547167d055d935fd3f9f56094533f76%23rd';
            getRegionStatusList(url);
            break;
        case 'num':
            // url = 'https://mp.weixin.qq.com/s?__biz=MjM5NTA5NzYyMA==&mid=2654530350&idx=1&sn=fa9dc80ae6d99baad6ca0299c5f87029&chksm=bd31f6558a467f435267bac04a11866d5e5c2fe28b0b8e013396e838018d23c4e80ae5c54a1c&mpshare=1&scene=23&srcid=0428EWMT2eYoWpbSoM4x5yky&sharer_sharetime=1651103424781&sharer_shareid=b547167d055d935fd3f9f56094533f76%23rd';
            getNumByRegion(url);
            break;
        default:
            console.log('No match type.');
    }
}

async function getNumByRegion(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const regionData = {};
    const $ = jQuery = require('jquery')(window);
    var regions = ['浦东新区','黄浦区','静安区','徐汇区','长宁区','虹口区','杨浦区','普陀区','闵行区','宝山区','嘉定区','金山区','松江区','青浦区','奉贤区','崇明区'];

    var summary = $('#js_content section[data-id="106156"] p:first').text().trim();
    var summaryRegex = /市卫健委今早（\d+日）通报：\d+年\d+月\d+日0—24时，新增本土新冠肺炎确诊病例(\d+)和无症状感染者(\d+)例，其中(\d+)例确诊病例为既往无症状感染者转归，(\d+)例确诊病例和(\d+)例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。/;
    var result = summary.match(summaryRegex);
    if (result) {
        // output summary data
        console.log([result[1], result[2], result[3], result[4], result[5]].join(','));
    }

    /*
    无症状感染者1—无症状感染者3571，居住于浦东新区，
    无症状感染者3572—无症状感染者6086，居住于黄浦区，
    无症状感染者6087—无症状感染者7208，居住于徐汇区，
    病例1—病例26，居住于浦东新区，
    均为本市闭环隔离管控人员
    在风险人群筛查中发现新冠病毒核酸检测结果异常，即被隔离管控。
    为此前报告的本土无症状感染者
     */
    $('#js_content section[data-id="109677"]').each((i, item)=>{
        // 本土病例情况
        // 本土无症状感染者情况
        var subjectTitle = $(item).find('section section:first').text().trim();
        var type = null;
        var region = null;
        var regex = null;
        var startIndex = 0;
        if (subjectTitle === '本土病例情况') {
            startIndex = 0;
            regex = /病例(\d+)([—、]病例(\d+))?，居住于([\u4e00-\u9fa5]+)，/;
        } else if (subjectTitle === '本土无症状感染者情况') {
            startIndex = 3;
            regex = /无症状感染者(\d+)([—、]无症状感染者(\d+))?，居住于([\u4e00-\u9fa5]+)，/;
        }

        var indexOffset = 0;
        $(item).find('section section p').each((j, row) => {
            // "均为"
            var content = $(row).text().trim();
            if (content.startsWith('均为')) {
                indexOffset = startIndex === 0 ? 2 : 1;
            } else if (content.startsWith('在风险人群筛查中发现')) {
                indexOffset = 1;
            }

            if (content) {
                var count = 0;
                // 病例676，居住于黄浦区，
                // 病例678—病例681，居住于虹口区，
                var result = content.match(regex);
                if (result && result.length === 5) {
                    var start = parseInt(result[1], 10);
                    var end = result[3] ? parseInt(result[3], 10) : start;
                    count = end - start + 1;
                    region = regions.indexOf(result[4]);

                    if (!regionData[result[4]]) {
                        regionData[result[4]] = [0,0,0,0,0];
                    }
                    var tmp = regionData[result[4]];
                    tmp[startIndex + indexOffset] = count;
                    regionData[result[4]] = tmp;
                }
            }
        });
    });

    const ret = [];
    regions.forEach((item, i) => {
        if (regionData[item]) {
            ret.push([item, ...regionData[item]]);
        } else {
            ret.push([item, 0, 0]);
        }
    });
    ret.forEach((item, i) => {
        // output the log into Excel
        console.log(item.join(','));
    });
}

async function getRegionStatusList(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const {document} = window;
    const addresses = [];

    const $ = jQuery = require('jquery')(window);
    var type = -1; // 0: 防范区; 1: 管控区; 2: 封控区;
    var ret = [];
    $('#js_content table').each((i, item) => {
        $(item).find('tbody tr').each((j, tr) => {
            // 跳过标题栏
            if (j !== 0) {
                var regionName = $(tr).find('td:eq(2)').text().trim();
                if (regionName === '防范区') {
                    type = 0;
                } else if (regionName === '管控区') {
                    type = 1;
                } else if (regionName === '封控区') {
                    type = 2;
                }
                if (ret[type] === undefined) {
                    ret[type] = [];
                }
                var address = $(tr).find('td:eq(1)').text().trim();
                ret[type].push('闵行区' + address);
            }
        });
    });

    fs.writeFileSync(`${__dirname}/data/region.json`, JSON.stringify(ret), 'utf8');
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

function getWechat(url) {
    getAddressFromWechat(url).then(({date, addresses}) => {
        if (addresses) {
            const dailyFeed = `${__dirname}/data/daily.json`;
            const dailySingleFeed = `${__dirname}/data/daily/${date}.json`;
            const dailyData = JSON.parse(fs.readFileSync(dailyFeed, 'utf8'));
            dailyData[date] = addresses;
            fs.writeFileSync(dailyFeed, JSON.stringify(dailyData), 'utf8');
            fs.writeFileSync(dailySingleFeed, JSON.stringify(addresses), 'utf8');
        }
    });
}

function getMhWechat(url) {
    getAddressFromMhWechat(url).then(result => {
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

// 从闵行微信公众号获取区级数据。
async function getAddressFromMhWechat(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const {document} = window;
    const addresses = [];

    const $ = jQuery = require('jquery')(window);
    // TODO: why document.title return ''?
    // const title = document.title;
    const title = $('#activity-name').text();
    const match = title.match('(\\d+)月(\\d+)日闵行新增');
    if (!match) {
        console.log('文章不匹配， exit。');
        return null;
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const date = `2022-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    console.log(`date: ${date}`);

    let areaName = '闵行区';
    $('#js_content>section>section>section>p').each((index, item) => {
        let address = $(item).text().trim();
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

    console.log(`addresses.length: ${addresses.length}`);
    window.close();

    return {
        date: date, addresses: addresses,
    };
}

main();
