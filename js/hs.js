var labels = {
    'name': '名称',
    'distance': '距离(米)',
    'address': '地址',
    'serviceHours': '服务时间',
    'lat': '纬度',
    'lng': '经度',
};

var dataColumns = [
    'name',
    'distance',
    'serviceHours',
    'address',
    // 'lat',
    // 'lng',
];

function init() {
    fetch(`data/hs.json`)
        .then(response => response.json())
        .then(data => {
            renderUI(processData(data));
        });
}

function processData(data) {
    var ret = [];
    data.forEach(item => {
        ret.push({
            name: item.collectionPoint.split('【')[0].split('采集点')[0],
            distance: parseInt(item.distance, 10) + '米',
            address: item.collectionAddress,
            serviceHours: processServiceHours(item.serviceHours),
            lat: item.lat,
            lng: item.lng,
        });
    });
    return ret;
}

function processServiceHours(str) {
    // (周一,周三,周五,周日)18:00-21:00
    // (周一至周日)09:00-11:30(周一至周日)13:00-17:00
    var ret = '';
    var arr = [];
    str.split('(').forEach(item => {
        if (item !== '') {
            arr.push({
                day: processDay(item.split(')')[0]),
                time: item.split(')')[1],
            });
        }
    });
    arr.forEach((item, idx, arr) => {
        var dayStr = item.day.join(',');
        var dayClass = '';
        if (dayStr === '一,二,三,四,五,六,日') {
            dayStr = '全天';
            dayClass = 'all-day';
        } else if (dayStr === '一,三,五,日') {
            dayClass = 'odd-day';
        } else if (dayStr === '二,四,六') {
            dayClass = 'even-day';
        } else if (dayStr === '一,二,三,四,五') {
            dayClass = 'work-day';
        }

        if (idx === 0) {
            ret = `(<span class="${dayClass}">${dayStr}</span>) ${item.time}`;
        } else {
            if (item.day.join(',') === arr[idx - 1].day.join(',')) {
                ret += ` ${item.time}`;
            } else {
                ret += `<br>(<span class="${dayClass}">${dayStr}</span>)${item.time}`
            }
        }
    });
    return ret;
}

function processDay(str) {
    // 周一,周三,周五,周日
    // 周一至周二,周四,周六至周日
    // 一二三四五六日
    var ret = [];
    var regex = /周([\u4e00-\u9fa5])至周([\u4e00-\u9fa5])/;
    var days = ['一','二','三','四','五','六','日'];
    str.split(',').forEach(item => {
        var result = item.match(regex);
        if (result) {
            var start = result[1];
            var end = result[2];
            var started = false;
            days.forEach(day => {
                if (start === day) {
                    started = true;
                }
                if (started) {
                    ret.push(day);
                }
                if (end === day) {
                    started = false;
                }
            });
        } else {
            ret.push(item.substring(1));
        }
    });
    return ret;
}


function renderUI(data) {
    renderTable(data);
}

function renderTable(data) {
    var html = `<table id="covidData" class="dataTable display cell-border compact hover nowrap row-border"><thead><tr>`;
    dataColumns.forEach((key) => {
        html += `<th>${labels[key]}</th>`;
    });

    html += `</tr></thead><tbody>`;
    data.forEach(item => {
        var row = `<tr>`;
        dataColumns.forEach((key) => {
            row += `<td>${item[key]}</td>`;
        });
        row += `</tr>`;
        html += row;
    });
    html += `</tbody></table>`;
    $('#container').html(html);
    $('#covidData').DataTable({
        fixedHeader: true,
        // fixedColumns: true,
        // paging: false,
        pageLength: 50,
        // searching: false,
        ordering:  false,
    });
}