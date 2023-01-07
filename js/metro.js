const scale = 2;
const dataUrl = './data/shmetro.json';

function init() {
    renderUI();
}

function renderUI() {
    fetch(dataUrl).then(function (response) {
        return response.json()
    }).then(jsonData => {
        renderCalendar(jsonData);
        renderHistory(jsonData);
    });
}

function renderCalendar(data) {
    const calendarData = [];
    const dayOfWeek = (new Date(data[data.length - 1][0])).getDay();
    const totalDisplayDay = 28 + (dayOfWeek ? dayOfWeek : 7);
    data.forEach(([date, num]) => {
        calendarData.push([date, num]);
        if (calendarData.length > totalDisplayDay) {
            calendarData.shift();
        }
    });
    const option = {
        title: {
            top: 10,
            left: 'center',
            text: '上海地铁客流统计',
            subtext: '数据来源于微博@上海地铁shmetro',
            sublink: 'https://weibo.com/u/1742987497',
        },
        visualMap: {
            min: 0,
            max: 1500,
            type: 'piecewise',
            orient: 'horizontal',
            left: 'center',
            inRange: {
                color: ['#5291FF', 'red']
            },
            // top: 25,
            bottom: 10,
        },
        calendar: {
            top: 100,
            left: 40,
            right: 20,
            bottom: 50,
            cellSize: [30, 'auto'],
            splitLine: {
                lineStyle: {
                    color: '#fff'
                }
            },
            orient: 'vertical',
            range: [calendarData[0][0], calendarData[calendarData.length - 1][0]],
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
            // type: 'effectScatter',
            type: 'heatmap',
            coordinateSystem: 'calendar',
            // symbolSize: function (val) {
            //     return Math.log2(val[1]);
            // },
            label: {
                show: true,
                formatter: function (params) {
                    var d = echarts.number.parseDate(params.value[0]);
                    return d.getDate() + '日' + '\n\n' + params.value[1] + 'w';
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
    const chart = echarts.init(document.getElementById('calendar'), 'dark', {devicePixelRatio: scale});
    chart.setOption(option);
}

function renderHistory(data) {
    const option = {
        title: {
            text: '历史数据',
            left: 'center',
        },
        tooltip: {
            trigger: 'axis',
        },
        grid: {
            left: '8%',
            right: '3%',
            bottom: '16%',
        },
        xAxis: {},
        yAxis: {},
        toolbox: {
            right: 10,
            feature: {
                dataZoom: {
                    yAxisIndex: 'none',
                },
                restore: {},
                saveAsImage: {
                    type: 'png',
                },
            },
        },
        dataZoom: [
            {
                startValue: '2020-03-09',
            },
            {
                type: 'inside',
            },
        ],
        visualMap: {
            min: 0,
            max: 1500,
            type: 'piecewise',
            inRange: {
                color: ['#5291FF', 'red']
            },
            top: 50,
            right: 0,
            show: false,
        },
        series: {
            name: '万人次',
            type: 'line',
            markPoint: {
                data: [
                    { type: 'max', name: 'Max' },
                    { type: 'min', name: 'Min' }
                ]
            },
        },
    };
    option.xAxis.data = data.map(function (item) {
        return item[0];
    });
    option.series.data = data.map(function (item) {
        return item[1];
    });
    const chart = echarts.init(document.getElementById('history'), 'dark', {devicePixelRatio: scale});
    chart.setOption(option);
}
