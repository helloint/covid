let lastDay = null; // '2022-05-22'
let currentDate = null; // '2022-05-10'
let originalData = null;
let timeMachineIntervalId = null;
function init() {
    fetch(`data/dailyTotal.json`)
        .then(response => response.json())
        .then(data => {
            extendCalcData(data);
            lastDay = Object.keys(data.daily)[Object.keys(data.daily).length - 1];
            currentDate = lastDay;
            originalData = data;

            renderUI();
            renderCalendar();
            initTimeMachine();
        });
}

function initTimeMachine() {
    const handle = $("#slider .ui-slider-handle");
    const startDate = new Date('2022-03-06');
    const lastDate = new Date(lastDay);
    const diffTime = Math.abs(lastDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    $("#slider").slider({
        orientation: "vertical",
        value: 0,
        min: -diffDays,
        max: 0,
        create: function () {
            var thatDate = getDateByOffset(lastDay, $(this).slider("value"));
            handle.text(formatDate(thatDate).split('年')[1]);
        },
        slide: function (event, ui) {
            var thatDate = getDateByOffset(lastDay, ui.value);
            handle.text(formatDate(thatDate).split('年')[1]);
            if (currentDate !== thatDate) {
                currentDate = thatDate;
                renderUI();
            }
        },
        change: function (event, ui) {
            var thatDate = getDateByOffset(lastDay, ui.value);
            handle.text(formatDate(thatDate).split('年')[1]);
            if (currentDate !== thatDate) {
                currentDate = thatDate;
                renderUI();
            }
        }
    });

    $('#playBtn').click(() => {
        if ($('#playBtn').attr('src') === 'images/play.svg') {
            $('#playBtn').attr('src', 'images/stop.svg');
            let val = $("#slider").slider('value');
            if (val === 0) val = -diffDays;
            timeMachineIntervalId = setInterval(() => {
                $("#slider").slider('value', ++val);
                if (val === 0) {
                    clearInterval(timeMachineIntervalId);
                    $('#playBtn').attr('src', 'images/play.svg');
                }
            }, 200);
        } else {
            clearInterval(timeMachineIntervalId);
            $('#playBtn').attr('src', 'images/play.svg');
        }
    });
}

/**
 * Input '2022-05-22', -1, return '2022-05-21'
 * @param date string '2022-05-22'
 * @param dayOffset integer -1
 * @returns {string} '2022-05-21'
 */
function getDateByOffset(date, dayOffset) {
    var thatDay = new Date(new Date(date).getTime() + dayOffset * 3600 * 24 * 1000);
    return parseDate(thatDay);
}

function renderUI() {
    $('#date').text(formatDate(currentDate));
    const data = cutData(originalData, currentDate);
    renderKanban(data);
    renderCharts(processTableData(data));
    renderRegion(data);
}

/**
 * Cut the data that after the currentDate
 * @param data
 * @param endDate
 * @returns {{regions: {}, daily: {}}}
 */
function cutData(data, endDate) {
    var daily = {};
    Object.entries(data.daily).forEach(([date, item]) => {
        if (date <= endDate) {
            daily[date] = item;
        }
    });
    var regions = {};
    Object.entries(data.regions).forEach(([date, item]) => {
        if (date <= endDate) {
            regions[date] = item;
        }
    });
    return {daily, regions};
}

function renderKanban(data) {
    const dailyData = data.daily;
    const dailyDay0 = dailyData[currentDate];
    $('#kanban .col1 .num').text('+' + dailyDay0.confirm);
    $('#kanban .col2 .num').text('+' + dailyDay0.wzz);
    $('#kanban .col3 .num').text('+' + dailyDay0.cured);
    $('#kanban .col4 .num').text('+' + dailyDay0.death);
    $('#kanban .col5 .num').text(dailyDay0.total_confirm);
    $('#kanban .col6 .num').text(dailyDay0.total_wzz_correct);
    $('#kanban .col7 .num').text(dailyDay0.total_cured);
    $('#kanban .col8 .num').text(dailyDay0.total_death);
}

const regionTrendChartOption = {
    grid: {
        top: '10%',
        left: 0,
        right: 0,
        bottom: '10%',
    },
    xAxis: {
        type: 'category',
        show: false,
    },
    yAxis: {
        type: 'value',
        show: false,
        splitLine: {
            show: false
        }
    },

    visualMap: {
        top: 50,
        right: 10,
        pieces: [
            {
                max: 1,
                color: '#6bdab4'
            },
            {
                min: 1,
                max: 100000,
                color: 'red'
            },
        ],
        outOfRange: {
            color: '#999'
        }
    },
    series: [
        {
            type: 'line',
            lineStyle: {
                width: 1,
            },
            color: 'red',
            smooth: true,
            symbol: 'circle',
            symbolSize: 3,
            animation: false,
        }
    ],
};

function renderRegion(data) {
    $('#regionGrid').html($('#regionGridTmpl').html());
    const regionData = data.regions;
    const regionSummary = [];
    // 计算1，3，7历史数据均值
    // index = 0,1,0,1,0,0,0,1
    let dayIndex = 0;
    let recentMax = 0;
    for (let i = Object.keys(regionData).length - 1; i > 0; i--) {
        regionData[Object.keys(regionData)[i]].forEach((region, regionIndex) => {
            if (dayIndex === 0) {
                // {区名 name, 当天 today, 累计 total, 昨天 yesterday, 3天均值 avg3, 7天均值 avg7}
                regionSummary.push({
                    name: region.region,
                    confirm_bihuan: region.confirm_bihuan,
                    zhuangui: region.zhuangui,
                    confirm_shaicha: region.confirm_shaicha,
                    wzz_bihuan: region.wzz_bihuan,
                    wzz_shaicha: region.wzz_shaicha,
                    today: region.total,
                    total: 0,
                    yesterday: 0,
                    avg3: 0,
                    avg7: 0,
                    recent: [region.total]
                });
            } else {
                regionSummary[regionIndex].total = regionSummary[regionIndex].total + region.total;
                if (dayIndex === 1) {
                    regionSummary[regionIndex].yesterday = region.total;
                } else if (dayIndex === 3) {
                    regionSummary[regionIndex].avg3 = regionSummary[regionIndex].total / 3;
                } else if (dayIndex === 7) {
                    regionSummary[regionIndex].avg7 = regionSummary[regionIndex].total / 7;
                }

                if (dayIndex < 7) {
                    regionSummary[regionIndex].recent.push(region.total);
                    recentMax = Math.max(recentMax, region.total);
                }
            }
        });
        dayIndex++;
    }
    let tbody = '';
    regionSummary.sort((a, b) => b.today - a.today);
    regionSummary.forEach((region) => {
        tbody += `<tr class="region region-${region.name}">
                    <th>${region.name}</th>
                    <td class="total ${!region.today ? 'zero' : ''}">${region.today}</td>
                    <td class="confirm num-confirm-bihuan ${!region.confirm_bihuan ? 'zero' : ''}">${region.confirm_bihuan}</td>
                    <td class="confirm num-zhuangui ${!region.zhuangui ? 'zero' : ''}">${region.zhuangui}</td>
                    <td class="confirm num-confirm-shaicha ${!region.confirm_shaicha ? 'zero' : ''}">${region.confirm_shaicha}</td>
                    <td class="wzz num-wzz-bihuan ${!region.wzz_bihuan ? 'zero' : ''}">${region.wzz_bihuan}</td>
                    <td class="wzz num-wzz-shaicha ${!region.wzz_shaicha ? 'zero' : ''}">${region.wzz_shaicha}</td>
                    <td class="diff num-diff-1 ${calcPercent(region.today, region.yesterday)[0]}">-</td>
                </tr>`;
    });
    $('#regionGrid tbody').append(tbody);

    regionSummary.forEach((region) => {
        const chart = echarts.init($(`.region-${region.name} .num-diff-1`)[0]);
        chart.setOption($.extend(true, {}, regionTrendChartOption, {
            // yAxis: {
            //     max: recentMax,
            // },
            series: [
                {
                    data: region.recent.reverse(),
                }
            ],
        }));
    });

    const dailyData = data.daily;
    const currentDateStr = formatDate(currentDate);
    $('#regionGrid .currentDate').text(currentDateStr + ' 上海');
    const currentDailyData = dailyData[currentDate];
    let currentDailySummary = {};  // 用于计算最近几天的比较数据
    dayIndex = 0;
    for (let i = Object.keys(dailyData).length - 1; i > 0; i--) {
        const daily = dailyData[Object.keys(dailyData)[i]];
        if (dayIndex === 0) {
            // {当天today, 累计total, 昨天yesterday, 3天均值avg3, 7天均值avg7}
            currentDailySummary = {
                today: daily.total, total: 0,
                yesterday: 0, avg3: 0, avg7: 0,
                recent: [daily.total]
            };
        } else {
            currentDailySummary.total = currentDailySummary.total + daily.total;
            if (dayIndex === 1) {
                currentDailySummary.yesterday = daily.total;
            } else if (dayIndex === 3) {
                currentDailySummary.avg3 = currentDailySummary.total / 3;
            } else if (dayIndex === 7) {
                currentDailySummary.avg7 = currentDailySummary.total / 7;
            }

            if (dayIndex < 7) {
                currentDailySummary.recent.push(daily.total);
            }
        }
        dayIndex++;
    }
    const tfoot = `<tr class="region-total">
                <th rowspan="2">合计</th>
                <th rowspan="2" class="num-total">${currentDailyData.total}</th>
                <th class="num-confirm-bihuan">${currentDailyData.confirm_bihuan}</th>
                <th class="num-zhuangui">${currentDailyData.zhuangui}</th>
                <th class="num-confirm-shaicha">${currentDailyData.confirm_shaicha}</th>
                <th class="num-wzz-bihuan">${currentDailyData.wzz_bihuan}</th>
                <th class="num-wzz-shaicha">${currentDailyData.wzz_shaicha}</th>
                <th rowspan="2" class="num-diff-1">-</th>
            </tr>
            <tr class="region-total-2">
                <th colspan="3" class="num-confirm">${currentDailyData.confirm}</th>
                <th colspan="2" class="num-wzz">${currentDailyData.wzz}</th>
            </tr>`;
    $('#regionGrid tfoot').append(tfoot);
    const chart = echarts.init($('.region-total .num-diff-1')[0]);
    chart.setOption($.extend(true, {}, regionTrendChartOption, {
        series: [
            {
                data: currentDailySummary.recent.reverse(),
            }
        ],
    }));
}

function getDailyData(data, key) {
    var ret = [];
    Object.values(data).forEach((dailyData) => {
        ret.push(dailyData[key]);
    });
    return ret;
}

const charts = [];
const chartsDownloadDefaultSetting = [[1, 1, 1], [0, 0, 0, 1, 1, 1]];

const commonChartOption = {
    title: {
        padding: [5, 20],
        left: 'center',
        textStyle: {
            fontSize: 28,
        }
    },
    tooltip: {
        trigger: 'axis',
    },
    legend: {
        top: 15,
        left: 20,
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
    },
    toolbox: {
        feature: {
            // saveAsImage: {},
        }
    },
    xAxis: {
        type: 'category',
        boundaryGap: true,
        axisLabel: {
            interval:0,
            rotate:40,
        }
    },
    yAxis: {
        type: 'value',
    }
};

function renderCharts(data) {
    var confirmChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '确诊 & 无症状',
        },
        xAxis: {
            data: Object.keys(data.recentDaily),
        },
        series: [
            {
                name: '确诊',
                type: 'line',
                label: {
                    show: true,
                },
                color: '#e47d7e',
                smooth: true,
                animation: false,
                data: getDailyData(data.recentDaily, 'confirm'),
            },
            {
                name: '无症状',
                type: 'line',
                label: {
                    show: true,
                },
                color: '#fdc368',
                smooth: true,
                animation: false,
                data: getDailyData(data.recentDaily, 'wzz'),
            }
        ],
    });
    var shaichaChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '风险排查（社会面） 确诊 & 无症状',
        },
        xAxis: {
            data: Object.keys(data.recentDaily),
        },
        series: [
            {
                name: '确诊',
                type: 'line',
                label: {
                    show: true,
                    position: 'inside',
                    // offset: [5, -6]
                },
                color: '#e47d7e',
                smooth: true,
                animation: false,
                data: getDailyData(data.recentDaily, 'confirm_shaicha'),
            },
            {
                name: '无症状',
                type: 'line',
                label: {
                    show: true,
                },
                color: '#fdc368',
                smooth: true,
                animation: false,
                data: getDailyData(data.recentDaily, 'wzz_shaicha'),
            }
        ],
    });
    var curedChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '在院治疗 & 新增治愈',
        },
        xAxis: {
            data: Object.keys(data.recentDaily),
            axisLabel: {
                interval: 'auto',
            }
        },
        series: [
            {
                name: '在院治疗',
                type: 'bar',
                label: {
                    show: true,
                    position: 'top',
                },
                color: '#e47d7e',
                animation: false,
                data: getDailyData(data.recentDaily, 'curr_confirm'),
            },
            {
                name: '新增治愈',
                type: 'bar',
                label: {
                    show: true,
                    position: 'top',
                },
                color: '#6bdab4',
                animation: false,
                data: getDailyData(data.recentDaily, 'cured'),
            }
        ],
    });
    var deathChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '死亡病例',
        },
        xAxis: {
            data: Object.keys(data.recentDaily),
        },
        series: [
            {
                name: '死亡病例',
                type: 'bar',
                label: {
                    show: true,
                    position: 'top',
                    // offset: [5, -6]
                },
                color: '#4e5a65',
                animation: false,
                data: getDailyData(data.recentDaily, 'death'),
            },
        ],
    });
    var completeConfirmCuredChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '本轮疫情：确诊 & 治愈',
        },
        xAxis: {
            data: Object.keys(data.daily),
            axisLabel: {
                interval: 'auto',
            }
        },
        series: [
            {
                name: '确诊',
                type: 'line',
                color: '#e47d7e',
                showSymbol: false,
                smooth: true,
                animation: false,
                data: getDailyData(data.daily, 'confirm'),
            },
            {
                name: '治愈',
                type: 'line',
                color: '#6bdab4',
                showSymbol: false,
                smooth: true,
                animation: false,
                data: getDailyData(data.daily, 'cured'),
            }
        ],
    });
    var completeShaichaChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '本轮疫情：风险排查 & 阳性总数',
        },
        xAxis: {
            data: Object.keys(data.daily),
            axisLabel: {
                interval: 'auto',
            }
        },
        series: [
            {
                name: '风险排查',
                type: 'line',
                color: '#e58e51',
                animation: false,
                showSymbol: false,
                data: getDailyData(data.daily, 'shaicha'),
            },
            {
                name: '阳性总数',
                type: 'line',
                color: '#4f6fc7',
                animation: false,
                showSymbol: false,
                data: getDailyData(data.daily, 'total'),
            }
        ],
    });
    var completeConfirmWzzChartOption = $.extend(true, {}, commonChartOption, {
        title: {
            text: '本轮疫情：确诊 & 无症状',
        },
        xAxis: {
            data: Object.keys(data.daily),
            axisLabel: {
                interval: 'auto',
            }
        },
        series: [
            {
                name: '确诊',
                type: 'line',
                color: '#e47d7e',
                animation: false,
                showSymbol: false,
                data: getDailyData(data.daily, 'confirm'),
            },
            {
                name: '无症状',
                type: 'line',
                color: '#fdc368',
                animation: false,
                showSymbol: false,
                data: getDailyData(data.daily, 'wzz'),
            }
        ],
    });

    var options = [
        confirmChartOption,
        shaichaChartOption,
        curedChartOption,
        deathChartOption,
        completeConfirmCuredChartOption,
        completeShaichaChartOption,
        completeConfirmWzzChartOption
    ];

    const $container = $('#chartsContainer');
    $container.empty();
    options.forEach((option, i) => {
        $container.append(`<div id="chart${i}" class="chart-container"></div>`);
        const chart = echarts.init(document.getElementById('chart' + i), 'dark');
        chart.setOption(option);
        charts.push(chart);

        $('#chartWrap').append(`<input type="checkbox" name="downloadChoice0" value="${i}"
            ${chartsDownloadDefaultSetting[0][i] ? 'checked="checked"' : ''} style="position: absolute; right: -29px; top: ${35 + i * 20}px;"/>`);
        $('#chartWrap').append(`<input type="checkbox" name="downloadChoice1" value="${i}"
            ${chartsDownloadDefaultSetting[1][i] ? 'checked="checked"' : ''} style="position: absolute; right: -64px; top: ${35 + i * 20}px;"/>`);
    });
}

function processTableData(data) {
    var daily = {};
    // 最近20天
    var recentDayLimit = 20;
    var recentDaily = {};
    var totalNum = Object.keys(data.daily).length;
    var index = 0;
    Object.entries(data.daily).forEach(([date, dailyData]) => {
        index++;
        var dateStr = parseInt(date.split('-')[1], 10) + '月' + parseInt(date.split('-')[2], 10) + '日';
        if (index > totalNum - recentDayLimit) {
            recentDaily[dateStr] = dailyData;
        }
        daily[dateStr] = dailyData;
    });

    return {total: data.total, daily: daily, recentDaily: recentDaily};
}

function downloadTable() {
    html2canvas(document.querySelector("#regionGrid")).then(canvas => {
        var link = document.createElement('a');
        link.download = `region.${getTimestamp()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

function downloadChart(index) {
    let downloadSettings = [];
    $('input[name=downloadChoice' + index + ']').each((i, item) => {
        downloadSettings.push($(item).prop('checked') ? 1 : 0);
    });
    Promise.all([
        html2canvas(document.querySelector("#chartTitle")),
        html2canvas(document.querySelector("#kanban")),
        html2canvas(document.querySelector("#footer")),
    ]).then(([titleCanvas, kanbanCanvas, footerCanvas]) => {
        // Calculate total height first
        let totalHeight = titleCanvas.height;
        if (downloadSettings[0]) totalHeight += kanbanCanvas.height;
        charts.forEach((chart, i) => {
            if (downloadSettings[i + 1]) {
                totalHeight += chart.getRenderedCanvas().height;
            }
        });
        totalHeight += footerCanvas.height;
        const bigCanvas = document.createElement('canvas');
        bigCanvas.width = titleCanvas.width;
        bigCanvas.height = totalHeight;

        // Draw canvas one by one
        const ctx = bigCanvas.getContext('2d');
        ctx.drawImage(titleCanvas, 0, 0);
        let currentHeightOffset = titleCanvas.height;
        if (downloadSettings[0]) {
            ctx.drawImage(kanbanCanvas, 0, titleCanvas.height);
            currentHeightOffset += kanbanCanvas.height;
        }

        charts.forEach((chart, i) => {
            if (downloadSettings[i + 1]) {
                const canvas = chart.getRenderedCanvas();
                ctx.drawImage(canvas, 0, currentHeightOffset);
                currentHeightOffset = currentHeightOffset + canvas.height;
            }
        });

        ctx.drawImage(footerCanvas, 0, currentHeightOffset);

        const link = document.createElement('a');
        link.download = `chart.${getTimestamp()}.png`;
        link.href = bigCanvas.toDataURL("image/png");
        link.click();
    });
}


function renderCalendar() {
    var calendarData = [];
    Object.entries(originalData.daily).forEach(([date, item]) => {
        calendarData.push([date, item.total]);
    });
    const option = {
        title: {
            top: 10,
            left: 'center',
            text: '2022上海新冠疫情'
        },
        visualMap: {
            min: 0,
            max: 30000,
            type: 'piecewise',
            orient: 'horizontal',
            left: 5,
            right: 0,
            top: 45,
        },
        calendar: {
            top: 110,
            left: 30,
            right: 10,
            bottom: 10,
            cellSize: [40, 'auto'],
            splitLine: {
                lineStyle: {
                    color: '#fff'
                }
            },
            orient: 'vertical',
            range: ['2022-02-26', calendarData[calendarData.length - 1][0]],
            itemStyle: {
                borderWidth: 0.5,
            },
            dayLabel: {
                firstDay: 1,
                margin: 15,
                nameMap: 'ZH',
            },
            monthLabel: {
                nameMap: 'ZH',
            },
            yearLabel: { show: false }
        },
        series: {
            type: 'effectScatter',
            coordinateSystem: 'calendar',
            symbolSize: function (val) {
                return Math.log2(val[1]);
            },
            label: {
                show: true,
                formatter: function (params) {
                    var d = echarts.number.parseDate(params.value[0]);
                    return d.getDate() + '日' + '\n\n' + params.value[1] + '例';
                },
                color: '#fff'
            },
            data: calendarData,
        },
        toolbox: {
            feature: {
                saveAsImage: {
                    type: 'png',
                },
            },
        },
    };
    const chart = echarts.init(document.getElementById('calendar'), 'dark');
    chart.setOption(option);
}

/**
 * return ['plus', '12.90%'], ['minus', '-11.65%']
 * @param a 分子
 * @param b 分母
 */
function calcPercent(a, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    var result = b !== 0 ? (a / b - 1) : a;
    return [result <= 0 ? 'minus' : 'plus', parseInt(result * 10000, 10) / 100 + '%'];
}
