const fs = require('fs');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

// TODO: 从卫健委网站获取每日播报数据的文章链接
async function getTopic(url) {

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

const url = process.argv.slice(2)[0];
// const url = 'https://mp.weixin.qq.com/s?__biz=MjM5NTA5NzYyMA==&mid=2654522433&idx=1&sn=7c55d1f38d41f388afde2f5e6c6d6e75&chksm=bd31d13a8a46582c2bc466f28366f5140b6404f528c3597e181db67787ff7b3e7596424dbaa4&mpshare=1&scene=23&srcid=0330DDHpcBFRBI4PzCNNbbGv&sharer_sharetime=1648605658815&sharer_shareid=b547167d055d935fd3f9f56094533f76%23rd';

getAddressFromWechat(url).then(result => {
    if (result) {
        fs.writeFileSync(`${__dirname}/data/${result.date}.json`, JSON.stringify(result.addresses), 'utf8');
    }
});

// const dom = new JSDOM(`
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <script type="text/javascript" src="https://api.map.baidu.com/api?type=webgl&v=1.0&ak=FOghoenHAy69lWj3HgkVW5kz4IRgbQSi"></script>
//     <title>Baidu Map</title>
// </head>
// <body>
// <div id='container'></div>
// </body>
// </html>
// `, { runScripts: "dangerously", resources: "usable" });
// console.log(dom.window.BMapGL); // "Hello world"
