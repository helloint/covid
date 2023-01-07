var iid = null;
var dataObj = {};
function startScan() {
    const regex = new RegExp('【地铁网络客流】(\\d+)月(\\d+)日上海地铁总客流为([\\d\\.]+)万人次。');
    iid = setInterval(() => {
        document.querySelectorAll('.Feed_body_3R0rO').forEach(item => {
            const publishDate = item.querySelector('.head-info_time_6sFQg').getAttribute('title').split(' ')[0];
            const msg = item.querySelector('.detail_wbtext_4CRf9').innerText;
            const result = msg.match(regex);
            if (result) {
                const year = parseInt(publishDate.split('-')[0], 10) - (publishDate.endsWith('01-01') ? 1 : 0);
                const dateStr = [
                    year,
                    result[1].length === 1 ? '0' + result[1] : result[1],
                    result[2].length === 1 ? '0' + result[2] : result[2],
                ].join('-');
                dataObj[dateStr] = parseFloat(result[3].toString());
            }
        });
    }, 200);
}

function getScanResult() {
    var ret = [];
    for (let [key, value] of Object.entries(dataObj)) {
        ret.push([key, value])
    }

    ret.sort();
    console.log(ret, null, 4);
}
