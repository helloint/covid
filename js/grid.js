var labels = {
    "date": "日期",
    // "link": "链接",
    "confirm": "确诊",
    "wzz": "无症状",
    "zhuangui": "转归",
    "confirm_bihuan": "隔离管控确诊",
    "wzz_bihuan": "隔离管控无症状",
    "death": "死亡新增",
    "curr_confirm": "在院治疗",
    "cured": "新增治愈",
    "total_cured": "累计治愈",
    "curr_heavy": "现有重症",
    "curr_cri": "现有危重",
    "total": "阳性",
    "confirm_shaicha": "风险排查确诊",
    "wzz_shaicha": "风险排查无症状",
    "bihuan": "隔离管控",
    "shaicha": "风险排查",
    "history_total_cured": "历史累计治愈",
    "confirm-wzz_percent": "确诊/无症状比例",
    "wzz-zhuangui_percent": "无症状转归比例",
    "total_confirm": "累计确诊",
    "total_wzz": "累计无症状",
    "total_zhuangui": "累积转归",
    "total_wzz_correct": "累积无症状（去除转归）",
    "total_death": "累计死亡",
};

var dataColumns = [
    'confirm',
    'wzz',
    'zhuangui',
    'confirm_bihuan',
    'wzz_bihuan',
    'confirm_shaicha',
    'wzz_shaicha',
    'curr_confirm',
    'curr_heavy',
    'curr_cri',
    'cured',
    'total_cured',
    'death',
    'bihuan',
    'shaicha',
    'confirm-wzz_percent',
    'wzz-zhuangui_percent',
    'total_confirm',
    'total_wzz',
    'total_zhuangui',
    'total_wzz_correct',
    'total',
    'total_death',
    'history_total_cured',
];

function init() {
    fetch(`data/dailyTotal.json`)
        .then(response => response.json())
        .then(data => {
            renderUI(extendCalcData(data));
        });
}

function renderUI(data) {
    renderTable(data);
}

function renderTable(data) {
    var html = `<table id="covidData" class="dataTable display cell-border compact hover nowrap row-border"><thead><tr>`;
    html += `<th>${labels['date']}</th>`;
    dataColumns.forEach((key) => {
        html += `<th>${labels[key]}</th>`;
    });

    html += `</tr></thead><tbody>`;
    Object.entries(data.daily).forEach(([date, dailyData]) => {
        var row = `<tr>`;
        row += `<td>${date}</td>`;
        dataColumns.forEach((key) => {
            row += `<td>${dailyData[key] !== undefined ? dailyData[key] : 'n/a'}</td>`;
        });
        row += `</tr>`;
        html += row;
    });
    html += `</tbody></table>`;
    $('#container').html(html);
    $('#covidData').DataTable({
        fixedHeader: true,
        fixedColumns: true,
        paging: false,
        searching: false,
        ordering:  false,
    });
}