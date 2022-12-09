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
const config = require('./config.js');
const axios = require("axios");
const createBrowser = require('browserless');
const dataFilePath = `${__dirname}/../data`;

if (!config.token) {
    config.token = process.env.TOKEN;
    config.cookie = process.env.COOKIE;
    config.key = process.env.KEY;
}

async function main() {
    var type = process.argv.slice(2)[0];
    var arg0 = process.argv.slice(2)[1];
    switch (type) {
        case 'run' :
            await run(arg0);
            break;
        case 'daily':
            // arg0 = 'https://mp.weixin.qq.com/s/CkRhicZw_2PR12Y8vonA2w';
            await processDailyData(arg0);
            break;
        case 'address':
            // arg0 = 'https://mp.weixin.qq.com/s/EH49z-wuXPbNqLrZzZQrqQ';
            await processAddressFromWechat(arg0);
            break;
        case 'addressmh':
            // arg0 = 'https://mp.weixin.qq.com/s/t-fxXIdQqb2BLwO3rCoP8A';
            processAddressFromWechatMh(arg0);
            break;
        case '3':
            // arg0 = 'https://mp.weixin.qq.com/s?__biz=MzA3NzEzNzAwOQ==&mid=2650536904&idx=1&sn=003379bebf1b0a85eaa2f81c95a9a5f8&chksm=8759ced6b02e47c0379092302a0a20048a47b0ed9a92f2ddf6d58005ba728513821245df7fa4&mpshare=1&scene=23&srcid=0421CMdtMTbZHi7DR5xJTfX0&sharer_sharetime=1650499140777&sharer_shareid=b547167d055d935fd3f9f56094533f76%23rd';
            await getRegionStatusList(arg0);
            break;
        case 'listwsj':
            await getTopicsFromWsj(arg0, '2022-01-01 00:00:00', true);
            break;
        case 'listnhc':
            await getTopicsFromNhc(arg0, '2022-01-01 00:00:00', true);
            break;
        case 'listwechat':
            await getLatestTopicsFromWeChat(arg0, true);
            break;
        case 'history':
            // await processHistory();
            processNhcData();
            break;
        case 'addrhistory':
            await processAddressHistory();
            break;
        case 'nhchistory':
            await processNhcHistory();
            break;
        case 'fetch':
            const browser = createBrowser();
            await fetchProtectedUrl(browser, 'http://www.nhc.gov.cn/xcs/yqtb/list_gzbd.shtml');
            await browser.close();
            break;
        default:
            console.log('No match type.');
    }
}

async function processHistory() {
    for (const link of config.links) {
        await processDailyData(link[1], false, true);
    }
}

async function processAddressHistory() {
    for (const link of config.addressLinks) {
        await processAddressFromWechat(link);
    }
}

/**
 * 忽略时区，强制获取中国（+0800）时间
 * 如果当前时间在中国时区是：
 * Mon May 16 2022 09:37:39 GMT+0800 (中国标准时间)
 * 那么如果在美国时区，则会返回：
 * Mon May 16 2022 09:37:07 GMT-0400 (北美东部夏令时间)
 *
 * @returns {Date}
 */
function now() {
    return new Date(new Date().getTime() + (480 + new Date().getTimezoneOffset()) * 60 * 1000)
}

async function run(override) {
    override = override === 'true'; // original override is string type, 'true': 'false'
    const yesterday = new Date(now().getTime() - 1000 * 60 * 60 * 24);
    const yesterdayStr = parseDate(yesterday);

    const dailyFeed = `${dataFilePath}/daily.json`;
    const dailyData = JSON.parse(fs.readFileSync(dailyFeed, 'utf8'));
    const addressFeed = `${dataFilePath}/address.json`;
    const addressData = JSON.parse(fs.readFileSync(addressFeed, 'utf8'));
    const nhcFeed = `${dataFilePath}/nhcTotal.json`;
    const nhcData = JSON.parse(fs.readFileSync(nhcFeed, 'utf8'));

    console.log('Processing daily data...');
    if (!override
        && dailyData.date === yesterdayStr
        && addressData.date === yesterdayStr
        && Object.keys(nhcData)[0] === yesterdayStr
    ) {
        console.log('Today data already generated. Quit!');
        return;
    }

    if (override
        || dailyData.date !== yesterdayStr
        || addressData.date !== yesterdayStr
    ) {
        console.log('Processing wechat data...');
        if (config.token) {
            var topics = await getLatestTopicsFromWeChat();
            if (topics) {
                let topic = null;
                var yesterdayLocalStr = [(yesterday.getMonth() + 1), '月', yesterday.getDate(), '日'].join('');
                if (override || dailyData.date !== yesterdayStr) {
                    topic = topics.find((item) => {
                        const regex = new RegExp(yesterdayLocalStr + '（0-24时）上海(?:无)?新增本土(?:新冠肺炎)?确诊病例');
                        const res = item.title.match(regex);
                        if (res) {
                            return true;
                        }
                    });
                    if (topic) {
                        await processDailyData(topic.url);
                        console.log('Wechat data done.');
                        sendNotify('covid_daily_done');
                    } else {
                        console.log('Wechat topic not ready.');
                    }
                }

                if (override || addressData.date !== yesterdayStr) {
                    topic = topics.find((item) => {
                        // 5月10日（0-24时）本市各区确诊病例、无症状感染者居住地信息
                        // 6月16日（0-24时）本市各区确诊病例、无症状感染者居住地和当前全市风险地区信息
                        const regex = new RegExp(yesterdayLocalStr + '（0-24时）本市各区确诊病例、无症状感染者居住地');
                        const res = item.title.match(regex);
                        if (res) {
                            return true;
                        }
                    });
                    if (topic) {
                        console.log('processing address data...');
                        await processAddressFromWechat(topic.url);
                        sendNotify('covid_address_done');
                    } else {
                        console.log('Address topic not ready.');
                    }
                }
            } else {
                console.log('No wechat topics.');
            }
        } else {
            console.log('Wechat token not set, skipped.');
        }
    }

    // nhc
    if (override || Object.keys(nhcData)[0] !== yesterdayStr) {
        console.log('Processing nhc data...');
        var nhcTopics = await getTopicsFromNhc(1);
        if (nhcTopics && nhcTopics.length > 0) {
            if (nhcTopics[0][0] === yesterdayStr) {
                const result = await processNhcDaily(nhcTopics[0][0], nhcTopics[0][1]);
                if (result) {
                    console.log('Nhc data done.');
                    sendNotify('nhc_daily_done');
                }
            } else {
                console.log(`Nhc topic not ready. last one is: ${nhcTopics[0][0]}`);
            }
        } else {
            console.log('No nhc Topics.');
        }
    }
}

/**
 * This will return latest topics from wechat public account
 */
async function getLatestTopicsFromWeChat(total = 5, enableLog) {
    const dateOptions = {
        hourCycle: 'h23',
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    };
    const ret = [];
    let pageNum = 0;
    do {
        try {
            const result = await getLatestTopicsFromWeChatByPage(pageNum);
            if (result != null) {
                ret.push(...result);
                enableLog && result.forEach(topic => {
                    console.log(`[${new Date(topic.date).toLocaleString('zh-CN', dateOptions)}]${topic.title} ${topic.url}`);
                });
            } else {
                break;
            }
        } catch (e) {
            console.log(e);
            !enableLog && sendNotify('covid_session_expired');
            break;
        }
        pageNum++;
    } while (ret.length < total)

    return ret;
}

async function getLatestTopicsFromWeChatByPage(pageNum) {
    const url = 'https://mp.weixin.qq.com/cgi-bin/appmsg';
    const pageSize = 5;
    const queryData = {
        action: 'list_ex',
        begin: pageNum * pageSize,
        count: pageSize, // 这个参数没起作用。现在固定返回5个appmsgid，而每条appmsgid里可能有多篇文章。
        fakeid: config.fakeid, // 公众号的唯一标识
        type: 9,
        query: '',
        token: config.token,
        lang: 'zh_CN',
        f: 'json',
        ajax: 1
    };
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
        "cookie": config.cookie,
    }
    const response = await axios.get(url, {params: queryData, headers: headers});
    if (response.status === 200) {
        if (response.data && response.data.app_msg_list) {
            return response.data.app_msg_list.map((item) => {
                return {date: item.create_time * 1000, title: item.title, url: item.link};
            });
        } else {
            if (response.data && response.data.base_resp && response.data.base_resp.err_msg) {
                throw new Error(response.data.base_resp.err_msg);
            } else {
                console.log(`No 'app_msg_list' found.`);
            }
        }
    }

    return null;
}

function sendNotify(errCode) {
    if (config.key) {
        const webHookUrl = `https://maker.ifttt.com/trigger/${errCode}/json/with/key/${config.key}`;
        axios.get(webHookUrl);
        console.log(`webHookUrl: ${webHookUrl}`);
    } else {
        console.log('no webHook key, skipped');
    }
}

async function processDailyData(url, showRegions = true, reset = false) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const regionData = {};
    const $ = jQuery = require('jquery')(window);
    var regions = ['浦东新区', '黄浦区', '静安区', '徐汇区', '长宁区', '虹口区', '杨浦区', '普陀区', '闵行区', '宝山区', '嘉定区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'];

    var summary = $('#js_content section[data-id="106156"]').text().trim();
    if (!summary) {
        // 12月8日的数据，修改了模版，不再有原先的高亮section了。
        summary = $('#js_content section[data-id="92620"]').text().trim();
    }
    var dateRegex = /(\d{4})年(\d+)月(\d+)日/;
    var dateResult = summary.match(dateRegex);
    var dataDate = new Date(parseInt(dateResult[1], 10), parseInt(dateResult[2], 10) - 1, parseInt(dateResult[3], 10));
    var dataDateDisplay = parseDate(dataDate);
    console.log(dataDateDisplay);
    var data = {};
    /*
    Template 1:
    新增本土新冠肺炎确诊病例1249和无症状感染者8932例，其中985例确诊病例为既往无症状感染者转归，264例确诊病例和8932例无症状感染者在隔离管控中发现。
    新增本土新冠肺炎确诊病例5487和无症状感染者9545例，其中5062例确诊病例为既往无症状感染者转归，418例确诊病例和9444例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例1931例和无症状感染者15698例，其中143例确诊病例为此前无症状感染者转归，1685例确诊病例和15551例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例31例和无症状感染者865例，其中30例确诊病例和749例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例5例和无症状感染者78例，其中4例本土确诊病例和57例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例41例（含2例由无症状感染者转为确诊病例）和无症状感染者128例，其中2例本土确诊病例为此前的无症状感染者转归，32例本土确诊病例和90例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例8例（含1例由无症状感染者转为确诊病例）和无症状感染者150例，其中2例确诊病例和69例无症状感染者在隔离管控中发现，1例无症状感染者为外省返沪人员协查中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例9例（其中4例3月14日已通报）和无症状感染者130例（其中34例3月14日已通报），其中5例确诊病例和102例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例3例和无症状感染者7例，其中7例无症状感染者在隔离管控中发现。
    新增本土新冠肺炎确诊病例3例和无症状感染者7例，其中7例确诊病例在隔离管控中发现。
    新增本土新冠肺炎确诊病例4例和无症状感染者5例，均在隔离管控中发现。
    新增本土新冠肺炎确诊病例39例和无症状感染者327例。
    新增本土新冠肺炎确诊病例11例和无症状感染者119例，其中2例确诊病例和2例无症状感染者在社会面常态化核酸检测中发现，9例确诊病例和117例无症状感染者在隔离管控中发现。
    新增本土新冠肺炎确诊病例16例和无症状感染者128例，其中3例确诊病例和1例无症状感染者在社会面核酸检测中发现，13例确诊病例和127例无症状感染者在隔离管控中发现。

    Template 2:
    新增本土新冠肺炎确诊病例1292（含既往无症状感染者转为确诊病例858例）和无症状感染者9330例，432例确诊病例和9140例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。
    新增本土新冠肺炎确诊病例3084例（含既往无症状感染者转为确诊病例974例）和无症状感染者17332例，实际新增本土阳性感染者19442例，其中1894例确诊病例和16998例无症状感染者在隔离管控中发现，其余在相关风险人群排查中发现。

    summaryResultData = ['confirm', 'wzz', 'zhuangui', 'confirm_bihuan', 'wzz_bihuan'];
     */
    var summaryRegex = new RegExp([
        '新增本土',
        '(?:新冠肺炎确诊病例(\\d+)[例]?)?', // 1: confirm
        '(?:（其中\\d+例\\d+月\\d+日已通报）)?(?:（含\\d+例由无症状感染者转为确诊病例）)?',
        '(?:和)?',
        '(?:(?:，新增本土)?无症状感染者(\\d+)例)?', // 2: wzz
        '(?:（其中\\d+例\\d+月\\d+日已通报）)?',
        '(?:，其中)?',
        '(?:\\d+例确诊病例)?',
        '(?:和)?',
        '(?:\\d+例无症状感染者在社会面(?:常态化)?核酸检测中发现，)?',
        '(?:(\\d+)例(?:本土)?确诊病例为(?:既往|此前的?)无症状感染者转归，)?', // 3: zhuangui
        '(?:(\\d+)例(?:本土)?确诊病例)?', // 4: confirm_bihuan
        '(?:和)?',
        '(?:(\\d+)例无症状感染者)?', // 5: wzz_bihuan
        '(?:在隔离管控中发现)?',
        '(?:，\\d+例无症状感染者为外省返沪人员协查中发现)?',
        '(?:，其余在相关风险人群排查中发现)?',
        '(?:，(均在隔离管控中发现))?', // 6:
        '。'
    ].join(''));
    var summaryResult = summary.match(summaryRegex);
    var summaryResultData = [];
    if (summaryResult != null) {
        summaryResultData = [parseNum(summaryResult[1]), parseNum(summaryResult[2]), parseNum(summaryResult[3]), parseNum(summaryResult[4]), parseNum(summaryResult[5])];
        if (summaryResultData[3] === 0 && summaryResultData[4] === 0) {
            // 有'均在隔离管控中发现'这句话（12/7这句话没有了），表示所有人都是隔离管控，也就意味着 confirm_bihuan = confirm, wzz_bihuan = wzz
            summaryResultData[3] = summaryResultData[0];
            summaryResultData[4] = summaryResultData[1];
        }
    } else {
        summaryRegex = /新增本土新冠肺炎确诊病例(\d+)[例]?（含既往无症状感染者转为确诊病例(\d+)例）和无症状感染者(\d+)例，(?:实际新增本土阳性感染者\d+例，其中)?(\d+)例确诊病例和(\d+)例无症状感染者在隔离管控中发现(?:，其余在相关风险人群排查中发现)?。/;
        summaryResult = summary.match(summaryRegex);
        if (summaryResult != null) {
            summaryResultData = [parseNum(summaryResult[1]), parseNum(summaryResult[3]), parseNum(summaryResult[2]), parseNum(summaryResult[4]), parseNum(summaryResult[5])];
        } else {
            summaryRegex = /无新增本土新冠肺炎确诊病例和(?:本土)?无症状感染者/;
            summaryResult = summary.match(summaryRegex);
            if (summaryResult != null) {
                summaryResultData = [0, 0, 0, 0, 0];
            } else {
                console.log(`summary pattern doesn't match. summary: \r\n${summary}`);
                throw new Error('summary pattern doesn\'t match');
            }
        }
    }
    /*
    Template:
    新增本土死亡11例。
    新增本土死亡病例6例。
     */
    var regexDeath = /新增本土死亡(?:病例)?(\d+)例/;
    var deathResult = null;
    /*
    新增治愈 cured
    新增本土新冠肺炎确诊病例144例，含106例由既往无症状感染者转为确诊病例。新增治愈出院【432】例。
    新增本土新冠肺炎确诊病例260例，含2例由无症状感染者转为确诊病例。治愈出院23例
    新增本土新冠肺炎确诊病例31例。治愈出院8例。
     */
    var regexCured = /新增本土新冠肺炎确诊病例(?:\d+例)?(?:，含\d+例由(?:既往)?无症状感染者转为确诊病例)?。(?:新增)?治愈出院(\d+)例/;
    var curedResult = null;

    /*
    无症状感染者1—无症状感染者3571，居住于浦东新区，
    无症状感染者3572—无症状感染者6086，居住于黄浦区，
    无症状感染者6087—无症状感染者7208，居住于徐汇区，
    病例1—病例26，居住于浦东新区，
    该病例居住于宝山区，
    该无症状感染者居住于宝山区，
    均为本市闭环隔离管控人员
    在风险人群筛查中发现新冠病毒核酸检测结果异常，即被隔离管控。
    为此前报告的本土无症状感染者
     */
    $('#js_content section[data-id="109677"]').each((i, item) => {
        // 本土病例情况
        // 本土无症状感染者情况
        var subjectTitle = $(item).find('section section:first').text().trim();
        var regex = null;
        var singleRegex = null;
        var startIndex = 0;
        if (subjectTitle === '本土病例情况') {
            startIndex = 0;
            /*
            Template:
            病例676，居住于黄浦区，
            病例678—病例681，居住于虹口区，
            病例1，男，23岁，居住于闵行区，
            病例1，女，57岁，居住于宝山区丹霞山路257弄，
             */
            regex = /^病例(\d+)([—、]病例(\d+))?，(?:[男女]，)?(?:[\d]+岁，)?居住于([\u4e00-\u9fa5]+区)/;
            singleRegex = /^该病例居住于([\u4e00-\u9fa5]+区)/;
        } else if (subjectTitle === '本土无症状感染者情况') {
            startIndex = 3;
            regex = /^无症状感染者(\d+)([—、]无症状感染者(\d+))?，(?:[男女]，)?(?:[\d]+岁，)?居住于([\u4e00-\u9fa5]+区)/;
            singleRegex = /^该无症状感染者居住于([\u4e00-\u9fa5]+区)/;
        }

        var indexOffset = 0;
        /*
        0 隔离管控确诊 95
        1 隔离管控转归 1356
        2 风险排查确诊 5
        3 隔离管控无症状 1950
        4 风险排查无症状 66
         */
        var tempData = {};
        $(item).find('section section p, section section section').each((j, row) => {
            var content = $(row).text().trim();
            if (content) {
                var count = 0;
                var result = content.match(regex);
                if (result && result.length === 5) {
                    var start = parseInt(result[1], 10);
                    var end = result[3] ? parseInt(result[3], 10) : start;
                    count = end - start + 1;

                    tempData[result[4]] = (tempData[result[4]] ? tempData[result[4]] : 0) + count;
                } else {
                    result = content.match(singleRegex);
                    if (result) {
                        tempData[result[1]] = (tempData[result[1]] ? tempData[result[1]] : 0) + 1;
                    }
                }

                /*
                "均为"前面的，是【隔离管控】0，3
                "在风险人群筛查中发现"前面的，是【社会面】2，4
                "为此前报告的本土无症状感染者"前面的，是【无症状转归确诊】1
                 */
                var sectionEnded = false;
                if (content.startsWith('均为本市闭环隔离管控人员') || content.startsWith('为本市闭环隔离管控人员')) {
                    indexOffset = startIndex === 0 ? 0 : 0;
                    sectionEnded = true;
                } else if (content.startsWith('在风险人群筛查中发现')) {
                    indexOffset = startIndex === 0 ? 2 : 1;
                    sectionEnded = true;
                } else if (content.startsWith('为此前报告的本土无症状感染者')) {
                    indexOffset = 1;
                    sectionEnded = true;
                }

                if (sectionEnded) {
                    regions.forEach((region, i) => {
                        if (!regionData[region]) {
                            regionData[region] = [0, 0, 0, 0, 0];
                        }
                        if (tempData[region]) {
                            regionData[region][startIndex + indexOffset] = tempData[region];
                        }
                    });
                    tempData = {};
                }

                if (content.match(regexDeath)) {
                    deathResult = content.match(regexDeath);
                }

                if (content.match(regexCured)) {
                    curedResult = content.match(regexCured);
                }
            }
        });
    });

    /*
    现有确诊 curr_confirm
    累计治愈 total_cured
    现有重型 curr_heavy
    现有危重 curr_cri
    累计本土确诊56527例，治愈出院50629例，在院治疗5333例（其中重型349例，危重型61例）。
    累计本土确诊7720例，治愈出院1407例，在院治疗6306例，死亡7例。
    累计本土确诊15284例，治愈出院2600例，在院治疗12684例（其中重症10例）。
    累计本土确诊24529例，治愈出院4675例，在院治疗19851例（其中重症16例），死亡3例。
    累计本土确诊6806例，治愈出院1116例，在院治疗5683例，死亡7例（2020年疫情初期发生）。
    累计本土确诊57717例，治愈出院54396例，在院治疗2736例（其中重型135例，危重型38例），现有待排查的疑似病例0例。

    新增出院34例，其中本土27例，境外输入7例；新增解除医学观察无症状感染者270例，其中本土207例，境外输入63例。
     */
    var totalRegex = /治愈出院(\d+)例，在院治疗(\d+)例(?:（其中重(?:型|症)(\d+)例(?:，危重型(\d+)例)?）)?(?:，死亡\d+例)?(?:（2020年疫情初期发生）)?[，。]/;
    var totalResult = null;
    $('#js_content section[data-id="92620"]').each((i, item) => {
        var content = $(item).text().trim();
        if (content.match(totalRegex)) {
            totalResult = content.match(totalRegex);
        }
    });
    if (totalResult == null) {
        var content = $('#js_content section[data-id="92620"]').text().trim();
        var result = content.match(/新增出院(?:\d+)例，其中本土(\d+)例/);
        if (result) {
            const theDayBeforeYesterday = new Date(now().getTime() - 1000 * 60 * 60 * 48);
            const theDayBeforeYesterdayStr = parseDate(theDayBeforeYesterday);
            const dailyTotalFeed = `${dataFilePath}/dailyTotalSlim.json`;
            const dailyTotalData = JSON.parse(fs.readFileSync(dailyTotalFeed, 'utf8'));
            // 在院治疗（需要计算）=昨天的数据+今天的确诊-今天的出院
            const currConfirm = parseInt(dailyTotalData['daily'][theDayBeforeYesterdayStr]['curr_confirm'], 10);
            const totalCured = parseInt(dailyTotalData['daily'][theDayBeforeYesterdayStr]['total_cured'], 10);
            const cured = parseInt(result[1], 10);
            totalResult = ["", totalCured + cured, currConfirm + summaryResultData[0] - cured];
            curedResult = ["", cured];
        }
    }
    var totalResultData = [0, totalResult[1], totalResult[2], totalResult.length >= 4 && totalResult[3] ? totalResult[3] : 0, totalResult.length >= 5 && totalResult[4] ? totalResult[4] : 0];
    // 累计治愈数据修正。4/14之前的数据，包含了历史疫情。
    if (dataDateDisplay < '2022-04-14') {
        totalResultData[1] = totalResultData[1] - 385;
    }

    var deathResultData = [0, deathResult ? parseNum(deathResult[1]) : 0];
    if (curedResult == null) {
        // 没新增也没关系，靠累计计算。
        curedResult = ["", 0];
    }

    var summaryData = [
        summaryResultData[0], summaryResultData[1], summaryResultData[2], summaryResultData[3], summaryResultData[4],
        deathResultData[0],
        totalResultData[2],
        curedResult[1], totalResultData[1], totalResultData[3], totalResultData[4],
    ];
    console.log(summaryData.join(','));
    data.daily = {
        "total": summaryResultData[0] + summaryResultData[1],
        "confirm": summaryResultData[0],
        "wzz": summaryResultData[1],
        "zhuangui": summaryResultData[2],
        "confirm_bihuan": summaryResultData[3],
        "wzz_bihuan": summaryResultData[4],
        "death": deathResultData[0],
        "confirm_shaicha": summaryResultData[0] - summaryResultData[2] - summaryResultData[3],
        "wzz_shaicha": summaryResultData[1] - summaryResultData[4],
        "bihuan": summaryResultData[3] + summaryResultData[4],
        "shaicha": summaryResultData[0] - summaryResultData[2] - summaryResultData[3] + summaryResultData[1] - summaryResultData[4],
        "cured": parseInt(curedResult[1], 10),
        "curr_confirm": parseInt(totalResultData[2], 10),
        "total_cured": parseInt(totalResultData[1], 10),
        "curr_heavy": parseInt(totalResultData[3], 10),
        "curr_cri": parseInt(totalResultData[4], 10),
        /*
        API获取的文章链接是长链接：
        https://mp.weixin.qq.com/s\?__biz\=MjM5NTA5NzYyMA\=\=\&mid\=2654547041\&idx\=1\&sn\=e6da7b2138e7f9317929040d1e80a3cd\&chksm\=bd30311a8a47b80cd3a0cf0d9ad2d360cef6757a171c3e5d9e65da7993cddf30657b45401bb4\#rd
        目前好像没办法通过API获取如下短链接：
        https://mp.weixin.qq.com/s/qfDsNNAmHN9IFg-1L-XAOg
        据说短链接里的参数是基于长链接query string里的sn生成的，逻辑在微信app里，就看有谁能反编译出来了。
        Reference：https://soaked.in/2020/08/wechat-platform-url/#url-formats-overview
         */
        "url": url,
    };

    const ret = [];
    regions.forEach((item, i) => {
        if (regionData[item]) {
            ret.push([item, ...regionData[item]]);
        } else {
            ret.push([item, 0, 0, 0, 0, 0]);
        }
    });
    data.regions = [];
    ret.forEach((item, i) => {
        // output the log into Excel
        showRegions && console.log(item.join(','));
        data.regions.push(
            {
                "region": item[0],
                "total": item[1] + item[2] + item[3] + item[4] + item[5],
                "confirm": item[1] + item[2] + item[3],
                "wzz": item[4] + item[5],
                "zhuangui": item[2],
                "confirm_bihuan": item[1],
                "wzz_bihuan": item[4],
                "confirm_shaicha": item[3],
                "wzz_shaicha": item[5],
                "bihuan": item[1] + item[4],
                "shaicha": item[3] + item[5],
            }
        );
    });

    const dailyFeed = `${dataFilePath}/daily.json`;
    const dailyTotalFeed = `${dataFilePath}/dailyTotal.json`;
    const dailyTotalSlimFeed = `${dataFilePath}/dailyTotalSlim.json`;
    const dailyTotalData = JSON.parse(fs.readFileSync(dailyTotalFeed, 'utf8'));
    data.date = parseDate(dataDate);
    if (reset && dailyTotalData.daily[data.date]) delete dailyTotalData.daily[data.date];
    if (reset && dailyTotalData.regions[data.date]) delete dailyTotalData.regions[data.date];
    dailyTotalData.daily[data.date] = data.daily;
    dailyTotalData.regions[data.date] = data.regions;
    var totalNums = {
        confirm: 0,
        wzz: 0,
        death: 0
    };
    Object.entries(dailyTotalData.daily).forEach(([key, value]) => {
        totalNums.confirm = totalNums.confirm + value.confirm;
        totalNums.wzz = totalNums.wzz + value.wzz;
        totalNums.death = totalNums.death + value.death;
    });
    dailyTotalData.total = totalNums;
    data.total = totalNums;
    let dailyTotalSlimData = JSON.parse(JSON.stringify(dailyTotalData));
    delete dailyTotalSlimData.regions;
    Object.entries(dailyTotalSlimData.daily).forEach(([k, v]) => delete v.url);
    fs.writeFileSync(dailyTotalFeed, JSON.stringify(dailyTotalData), 'utf8');
    fs.writeFileSync(dailyTotalSlimFeed, JSON.stringify(dailyTotalSlimData), 'utf8');
    fs.writeFileSync(dailyFeed, JSON.stringify(data), 'utf8');
}

async function getRegionStatusList(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;

    const $ = jQuery = require('jquery')(window);
    var type = -1; // 0: 防范区; 1: 管控区; 2: 封控区;
    var ret = [];
    var count = 0;
    $('#js_content table').each((i, item) => {
        $(item).find('tbody tr').each((j, tr) => {
            // 跳过标题栏
            if (j >= 2) {
                var regionName = $(tr).find('td:eq(3)').text().trim();
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
                var estateName = $(tr).find('td:eq(1)').text().trim();
                count++;
                ret[type].push(estateName);
            }
        });
    });

    console.log(`count: ${count}`);
    fs.writeFileSync(`${dataFilePath}/region.json`, JSON.stringify(ret), 'utf8');
}

async function processAddressFromWechat(url) {
    const {date, addresses} = await getAddressFromWechat(url);
    if (addresses) {
        writeDailyAddressesToFile(date, addresses);
    }
}

function processAddressFromWechatMh(url) {
    getAddressFromWechatMh(url).then(({date, addresses}) => {
        if (addresses) {
            writeDailyAddressesToFile(date, addresses);
        }
    });
}

function writeDailyAddressesToFile(date, addresses) {
    if (addresses) {
        const dailyTotalFeed = `${dataFilePath}/addressTotal.json`;
        const dailyData = JSON.parse(fs.readFileSync(dailyTotalFeed, 'utf8'));
        dailyData[date] = addresses;
        fs.writeFileSync(dailyTotalFeed, JSON.stringify(dailyData), 'utf8');
        const dailyFeed = `${dataFilePath}/address.json`;
        fs.writeFileSync(dailyFeed, JSON.stringify({date, addresses}), 'utf8');
    }
}

/**
 * 从上海市卫健委网站获取每日播报数据的文章链接
 * @param total
 * @param startDate
 * @param enableLog
 * @returns {Promise<*[]>}
 */
async function getTopicsFromWsj(total = 10, startDate = '2022-02-26 00:00:00', enableLog = false) {
    const getTopics = async (total, fromDate) => {
        const getPageUrl = (pageNum) => {
            return `https://ss.shanghai.gov.cn/search?page=${pageNum + 1}&view=&contentScope=1&dateOrder=2&tr=1&dr=&format=1&uid=00000180-3d55-851b-52bb-a9dd280219fe&sid=00000180-3d55-851b-0277-4156fe63c148&re=2&all=1&debug=&siteId=wsjkw.sh.gov.cn&siteArea=all&q=%E6%96%B0%E5%A2%9E%E6%9C%AC%E5%9C%9F%E6%96%B0%E5%86%A0%E8%82%BA%E7%82%8E%E7%A1%AE%E8%AF%8A%E7%97%85%E4%BE%8B`;
        }

        /**
         * 过滤出疫情数据文章
         * @param url
         * @returns {Promise<{result: *[], exceeded: boolean}>}
         */
        const filterMatchedTopics = async (url, fromDate) => {
            const dom = await JSDOM.fromURL(url);
            const {window} = dom;
            const ret = [];
            const regex = /上海(\d+)年(\d+)月(\d+)日，无?新增本土新冠肺炎确诊病例/;

            const $ = jQuery = require('jquery')(window);
            let exceeded = false;
            $('#results a.restitle').each((index, item) => {
                const title = $(item).text().trim();
                const result = title.match(regex);
                if (result) {
                    const path = completeUrl($(item).attr('href'), url);
                    const date = [result[1], result[2], result[3]].join('-');
                    ret.push([date, path, title]);

                    if (fromDate) {
                        const itemDate = new Date(date).getTime();
                        if (itemDate <= fromDate) {
                            exceeded = true;
                            return false;
                        }
                    }
                }
            });

            return {
                result: ret, exceeded
            };
        }

        const ret = [];
        let pageNum = 0;
        enableLog && console.log(`total: ${total}`);
        let dateExceeded = false;
        while (!dateExceeded && ret.length <= total) {
            let url = getPageUrl(pageNum);
            const {result, exceeded} = await filterMatchedTopics(url, fromDate);
            ret.push(...result);
            pageNum++;
            enableLog && console.log(`count: ${ret.length}`);
            if (exceeded) {
                dateExceeded = true;
            }
        }
        return ret;
    }

    const fromDate = startDate ? new Date(startDate).getTime() : null;
    const result = await getTopics(total, fromDate);
    enableLog && result.forEach((item) => {
        console.log(`[${item[0]}]${item[2]} ${item[1]}`);
    });

    return result;
}

/**
 * 从国家卫生健康委员会网站获取疫情数据文章列表
 * http://www.nhc.gov.cn/xcs/yqtb/list_gzbd.shtml
 * http://www.nhc.gov.cn/xcs/yqtb/list_gzbd_2.shtml
 *
 * @param total
 * @param startDate
 * @param enableLog
 * @returns {Promise<*[]>}
 */
async function getTopicsFromNhc(total = 5, startDate = '2021-12-31 00:00:00', enableLog = false) {
    const browser = createBrowser();
    const getTopics = async (total, fromDate) => {
        const getPageUrl = (pageNum) => {
            return `http://www.nhc.gov.cn/xcs/yqtb/list_gzbd${pageNum === 0 ? '' : `_${pageNum + 1}`}.shtml`;
        }

        /**
         * 过滤出疫情数据文章
         * @param url
         * @param fromDate
         * @returns {Promise<{result: *[], exceeded: boolean}>}
         */
        const filterMatchedTopics = async (url, fromDate) => {
            const html = await fetchProtectedUrl(browser, url);
            const dom = new JSDOM(html);
            const {window} = dom;
            const ret = [];
            const titleRegex = /截至(\d+)月(\d+)日24时新型冠状病毒肺炎疫情最新情况/;
            const titleDateRegex = /(\d+)-(\d+)-(\d+)/;

            const $ = jQuery = require('jquery')(window);
            let exceeded = false;
            const topicNum = $('ul.zxxx_list li').length;
            if (topicNum === 0) {
                console.log(html);
            }
            console.log('Nhc Topic length:' + topicNum);
            $('ul.zxxx_list li').each((index, item) => {
                const title = $(item).find('a').text().trim();
                const titleDate = $(item).find('span.ml').text().trim();
                const titleResult = title.match(titleRegex);
                const titleDateResult = titleDate.match(titleDateRegex);
                if (titleResult && titleDateResult) {
                    const path = completeUrl($(item).find('a').attr('href'), url);
                    const summaryDate = new Date(titleDateResult[1], titleDateResult[2] - 1, titleDateResult[3]);
                    summaryDate.setDate(summaryDate.getDate() - 1);
                    const dateStr = `${summaryDate.getFullYear()}-${(summaryDate.getMonth() + 1) < 10 ? '0' : ''}${summaryDate.getMonth() + 1}-${summaryDate.getDate() < 10 ? '0' : ''}${summaryDate.getDate()}`;
                    ret.push([dateStr, path, title]);

                    if (fromDate) {
                        const itemDate = new Date(titleDate).getTime();
                        if (itemDate <= fromDate) {
                            exceeded = true;
                            return false;
                        }
                    }
                }
            });

            return {
                result: ret, exceeded
            };
        }

        const ret = [];
        let pageNum = 0;
        enableLog && console.log(`total: ${total}`);
        let dateExceeded = false;
        while (!dateExceeded && ret.length <= total) {
            let url = getPageUrl(pageNum);
            const {result, exceeded} = await filterMatchedTopics(url, fromDate);
            ret.push(...result);
            pageNum++;
            enableLog && console.log(`count: ${ret.length}`);
            if (exceeded) {
                dateExceeded = true;
            }
        }
        return ret;
    }

    const fromDate = startDate ? new Date(startDate).getTime() : null;
    const result = await getTopics(total, fromDate);
    enableLog && result.forEach((item) => {
        console.log(`[${item[0]}]${item[2]} ${item[1]}`);
    });

    await browser.close();
    return result;
}

async function fetchProtectedUrl(browser, url) {
    const browserless = await browser.createContext({retry: 0});
    const ping = browserless.evaluate((page, response) => ({
        page,
        response,
    }));

    const result = await ping(url);
    let html = null;
    if (result.response.status() === 200) {
        html = result.page.html();
    } else {
        console.log(`http statusCode=${result.response.status()}, retry...`);
        html = await browserless.html(url);
        // console.log(html);
    }

    return html;
}

async function processNhcDaily(date, url) {
    const feed = `${dataFilePath}/nhcTotal.json`;
    const totalData = JSON.parse(fs.readFileSync(feed, 'utf8'));
    const browser = createBrowser();
    const result = processNhcData(extractNhcSummary(await fetchProtectedUrl(browser, url)));
    await browser.close();
    if (result) {
        const newData = {};
        newData[date] = result;
        console.log(date, result);
        Object.keys(totalData).forEach(date => {
            newData[date] = totalData[date];
        });
        fs.writeFileSync(feed, JSON.stringify(newData), 'utf8');
        return true;
    } else {
        console.log(`process failed, result: ${result}`);
        return false;
    }
}

async function processNhcHistory() {
    const browser = createBrowser();
    const feed = `${dataFilePath}/nhcTotal.json`;
    const totalData = JSON.parse(fs.readFileSync(feed, 'utf8'));
    const empties = [];
    const newData = {};
    for (const [date, url] of config.nhclinks) {
        // 只处理未处理过的日期
        if (!totalData[date]) {
            const result = processNhcData(extractNhcSummary(await fetchProtectedUrl(browser, url)));
            if (result) {
                newData[date] = result;
                console.log(date, result);
            } else {
                empties.push(date);
            }
        } else {
            newData[date] = totalData[date];
        }
    }
    console.log(`empties: ${empties}`);
    fs.writeFileSync(feed, JSON.stringify(newData), 'utf8');
    await browser.close();
}

function extractNhcSummary(html) {
    const dom = new JSDOM(html);
    const {window} = dom;
    const $ = jQuery = require('jquery')(window);
    const summary = $('#xw_box').text();
    if (!summary) {
        console.log('summary is empty, title=' + $('title').text());
    }
    return summary;
}

function processNhcData(summary) {
    if (!summary) {
        console.log('summary is empty');
        return null;
    }
    var regions = [['北京', 'bj'], ['天津', 'tj'], ['河北', 'heb'], ['山西', 'sx'], ['内蒙古', 'nm'], ['辽宁', 'ln'], ['吉林', 'jl'], ['黑龙江', 'hlj'], ['上海', 'sh'], ['江苏', 'js'], ['浙江', 'zj'], ['安徽', 'ah'], ['福建', 'fj'], ['江西', 'jx'], ['山东', 'sd'], ['河南', 'hen'], ['湖北', 'hub'], ['湖南', 'hun'], ['广东', 'gd'], ['广西', 'gx'], ['海南', 'hn'], ['重庆', 'cq'], ['四川', 'sc'], ['贵州', 'gz'], ['云南', 'yn'], ['西藏', 'xz'], ['陕西', 'sax'], ['甘肃', 'gs'], ['青海', 'qh'], ['宁夏', 'nx'], ['新疆', 'xj'], ['兵团', 'bt'],];
    var confirmSummary = null;
    var wzzSummary = null;
    // 确诊
    var confirmPattern = [
        '31个省（自治区、直辖市）和新疆生产建设兵团报告新增确诊病例(?<totalconfirm>\\d+)例\\*?。',
        '其中境外输入病例(?<totalconfirmoutside>\\d+)例\\*?（',
        '(?<regionsoutside>(?:[\u4e00-\u9fa5\\（\\）]+\\d+例\\*?[、，]?)*)）',
        '(?:，含\\d+例由无症状感染者转为确诊病例\\*?（)?',
        // （均在XX），（在XX）
        '(?:(?:[\u4e00-\u9fa5\\（\\）]+\\d+例\\*?[、，]?)*)?',
        '(?:均?在[\u4e00-\u9fa5\\（\\）]+)?',
        '(?:）)?；',
        '本土病例(?<totalconfirminside>\\d+)例\\*?（',
        '(?<regionsinside>(?:[\u4e00-\u9fa5\\（\\）]+(?:\\d+例)?\\*?[、，；]?)*)）'
    ];
    var confirmRegex = new RegExp(confirmPattern.join(''));
    var confirmResult = summary.match(confirmRegex);
    if (confirmResult) {
        confirmSummary = confirmResult.groups.regionsinside;
        console.log('确诊: ' + confirmSummary);
    } else {
        console.log(confirmResult);
    }

    var wzzPattern = [
        '31个省（自治区、直辖市）和新疆生产建设兵团报告新增无症状感染者(?<totalwzz>\\d+)例\\*?，',
        '其中境外输入(?<totalwzzoutside>\\d+)例\\*?，',
        '本土(?<totalwzzinside>\\d+)例\\*?（',
        '(?<regionsinside>(?:[\u4e00-\u9fa5\\（\\）]+(?:\\d+例)?\\*?[、，；]?)*)）',
    ];
    // 均为境外输入
    var wzzRegex = new RegExp(wzzPattern.join(''));
    var wzzResult = summary.match(wzzRegex);
    if (wzzResult) {
        wzzSummary = wzzResult.groups.regionsinside;
        console.log('无症状: ' + wzzSummary);
    } else {
        var wzzRegex2 = new RegExp('31个省（自治区、直辖市）和新疆生产建设兵团报告新增无症状感染者(?<totalwzz>\\d+)例（均为境外输入）');
        if (wzzRegex2) {
            wzzSummary = '均为境外输入';
            console.log('无症状: ' + wzzSummary);
        } else {
            console.log(wzzResult);
        }
    }

    if (confirmSummary && wzzSummary) {
        const regionData = {};
        regions.forEach(region => {
            const regionConfirmResult = confirmSummary.match(`${region[0]}(\\d+)例`);
            const regionWzzResult = wzzSummary.match(`${region[0]}(\\d+)例`);
            regionData[region[1]] = [regionConfirmResult ? parseInt(regionConfirmResult[1]) : 0, regionWzzResult ? parseInt(regionWzzResult[1]) : 0];
        });
        // console.log(regionData);
        return regionData;
    } else {
        return null;
    }
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

/**
 * 从卫健委网站每日播报数据的文章链接获取病患地址信息
 * @param url
 * @returns {Promise<{date: string, addresses: *[]}|boolean>}
 */
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
    const addresses = [];

    const $ = jQuery = require('jquery')(window);
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

    let districtName = null;
    /*
    TODO: try to handle new pattern
    2022年12月3日，浦东新区新增5例本土确诊病例、125例本土无症状感染者，其中128例在隔离管控中发现。
    2022年12月3日，黄浦区新增1例本土确诊病例，新增25例无症状感染者。其中1例确诊病例因症就诊发现（12月3日已发布），其余无症状感染者均在隔离管控中发现。
    2022年12月3日0-24时，静安区无新增本土确诊病例，新增14例本土无症状感染者，其中1例无症状感染者在常态化核酸检测中发现（12月3日已通报），另13例无症状感染者在隔离管控中发现。
    2022年12月3日0-24时，徐汇区无新增本土新冠肺炎确诊病例，新增无症状感染者19例，均在隔离管控中发现。
    2022年12月3日，长宁区新增4例本土确诊病例，新增23例本土无症状感染者，其中1例确诊病例在社会面核酸检测中发现（12月3日已发布），其余均在隔离管控中发现，
    2022年12月3日（0—24时），普陀区新增2例本土确诊病例，新增18例本土无症状感染者，均在隔离管控中发现。其中，7人外省来沪返沪后即被隔离管控，13人为此前报告的本土感染者的密切接触者。
    2022年12月3日0-24时，虹口区新增本土确诊病例3例和本土无症状感染者13例，均在隔离管控中发现。
    2022年12月3日，杨浦区新增1例本土确诊病例，新增27例本土无症状感染者，均在隔离管控中发现。
    2022年12月3日，宝山区新增4例本区确诊病例、19例本土无症状感染者，其中1例因身体不适就诊核酸检测发现（已通报）；1例在常态化核酸检测中发现（已通报）；7例为外省来沪返沪人员，抵沪后被落实管控中发现；其余14例为密切接触者，在隔离管控中发现
    2022年12月3日，闵行区新增4例本土确诊病例，新增41例本土无症状感染者，1例本土确诊病例在常态化核酸检测发现，其余在隔离管控中发现。
    2022年12月3日，嘉定区新增本土确诊病例2例，新增本土无症状感染者26例，均在隔离管控中发现，
    2022年12月3日，金山区无新增本土确诊病例，新增5例本土无症状感染者，均在隔离管控中发现。
    2022年12月3日，松江区新增本土新冠肺炎确诊病例4例和本土无症状感染者38例，其中3例新冠肺炎确诊病例在常态化核酸检测中发现，其余在隔离管控中发现。
    2022年12月3日，青浦区新增本土新冠确诊病例4例，新增无症状感染者26例，其中27例在隔离管控中发现。
    2022年12月3日，奉贤区新增2例本土新冠肺炎确诊病例，新增28例本土无症状感染者，均在隔离管控中发现。其中7例为此前本市报告的本土感染者的密切接触者，23例为外省来沪返沪人员。
    2022年12月3日，崇明区新增3例新冠肺炎本土无症状感染者，其中2例为外省来崇人员、1例为闭环管理人员，均在闭环管控中发现。
     */
    $('#js_content section[data-role=title]').each((index, item) => {
        if ($(item).attr('data-role') === 'title') {
            districtName = $(item).find('section[data-brushtype="text"]').text();

            if (districtName) {
                console.log(`districtName ${districtName}`);
                $(item).next().find('section section[data-autoskip="1"] p').each((index, addressItem) => {
                    let addressContent = $(addressItem).find('span:first').text();
                    let results = parseAddress(addressContent);
                    if (results) {
                        results.forEach(item => {
                            addresses.push(`${districtName}${item}`);
                        });
                    }
                });
            }
        }
    });

    console.log(`addresses.length: ${addresses.length}`);
    window.close();

    return {
        date: date, addresses: addresses,
    };
}

// 从闵行微信公众号获取区级数据。
async function getAddressFromWechatMh(url) {
    const dom = await JSDOM.fromURL(url);
    const {window} = dom;
    const addresses = [];

    const $ = jQuery = require('jquery')(window);
    const title = $('#activity-name').text();
    const match = title.match('(\\d+)月(\\d+)日闵行[区]?新增');
    if (!match) {
        console.log('文章不匹配， exit。');
        return null;
    }

    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const date = `2022-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
    console.log(`date: ${date}`);

    let districtName = '闵行区';
    // '已对相关居住地落实终末消毒措施等。'
    var $item = null;
    $('#js_content section, #js_content p').each((index, item) => {
        if ($(item).text().trim() === '已对相关居住地落实终末消毒措施等。') {
            $item = $(item);
            return false;
        }
    });
    $item.siblings().each((index, item) => {
        let address = $(item).text().trim();
        let results = parseAddress(address);
        if (results) {
            results.forEach(item => {
                addresses.push(`${districtName}${item}`);
            });
        }
    });

    console.log(`addresses.length: ${addresses.length}`);
    window.close();

    return {
        date: date, addresses: addresses,
    };
}

function parseAddress(content) {
    content = content && content.trim();
    if (!content || content.startsWith('2022年') || content.startsWith('已对相关居住地')) {
        return null;
    }

    if (content.indexOf('已通报') > -1) {
        content = content.replace(/（\d+月\d+日已通报）/, '');
    }
    if (content.indexOf('住宅') > -1) {
        content = content.replace(/（住宅）/, '').replace(/住宅小区/, '');
    }

    let ret = [];
    /*
    Samples:
    周祝公路35号。
    窑墩村，
    嘉定工业区陆渡村、草庵村、艾米公寓。
     */
    if (content.substr(-1) === '。' || content.substr(-1) === '，' || content.substr(-1) === '、') {
        content = content.substring(0, content.length - 1);
    }

    if (content.indexOf('、') > -1) {
        ret = content.split('、');
    } else {
        ret = [content];
    }

    return ret;
}

/**
 * format date
 * @param date
 * @returns {string}  yyyy-MM-dd
 */
function parseDate(date) {
    var yyyy = date.getFullYear();
    var mm = date.getMonth() + 1;
    date.set
    mm = mm >= 10 ? mm : '0' + mm;
    // FIXME: 这里有时差问题。
    var dd = date.getDate();
    dd = dd >= 10 ? dd : '0' + dd;
    return `${yyyy}-${mm}-${dd}`;
}

function parseNum(str) {
    return str ? parseInt(str, 10) : 0;
}

main();
