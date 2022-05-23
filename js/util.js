// Util Functions
function getHashParameter(key){
    var params = getHashParameters();
    return params[key];
}

function getHashParameters(){
    var arr = (location.hash || "").replace(/^\#/,'').split("&");
    var params = {};
    for(var i=0; i<arr.length; i++){
        var data = arr[i].split("=");
        if(data.length === 2){
            params[data[0]] = decodeURIComponent(data[1]);
        }
    }
    return params;
}

function setHashParameter(key, value){
    var params = getHashParameters();
    if (value == null) {
        delete params[key];
    } else {
        params[key] = value;
    }
    var keys = Object.keys(params);
    var arr = [];
    for(var i=0; i<keys.length; i++){
        if (params[keys[i]]) {
            arr.push([keys[i] + '=' + encodeURIComponent(params[keys[i]])]);
        }
    }
    location.hash = '#' + arr.join('&');
}

/**
 *
 * @param date Date object
 * @returns {string} '2022-05-10'
 */
function parseDate(date) {
    var yyyy = date.getFullYear();
    var mm = date.getMonth() + 1;
    mm = mm >= 10 ? mm : '0' + mm;
    var dd = date.getDate();
    dd = dd >= 10 ? dd : '0' + dd;
    return `${yyyy}-${mm}-${dd}`;
}

/**
 *
 * @param date 2022-05-10
 * @returns {string} 2022年5月10日
 */
function formatDate(date) {
    return parseInt(date.split('-')[0], 10) + '年' + parseInt(date.split('-')[1], 10) + '月' + parseInt(date.split('-')[2], 10) + '日';
}

/**
 *
 * @returns {string} 20220523111339
 */
function getTimestamp() {
    var now = new Date();
    var fixTen = (num) => num < 10 ? '0' + num : num;
    return [now.getFullYear(), fixTen(now.getMonth() + 1), fixTen(now.getDate()),
        fixTen(now.getHours()), fixTen(now.getMinutes()), fixTen(now.getSeconds())].join('');
}
