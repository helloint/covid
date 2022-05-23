$(()=>{
    initMap();
    initUI();
    // 上海各区版图
    renderDistricts();
    // 古美街道版图
    // renderTownBoundary(mhgmPoints);

    fsm.init();
    render();
    renderLocationControl();
    renderCopyright();

    /*
     TODO list
     增加搜索框 https://lbsyun.baidu.com/jsdemo.htm#yCityLocation 搜索定位
     */
});

function render() {
    var mode = getHashParameter("mode");
    mode === '1' ? renderRegionStatus() : renderUI();
}

function initMap() {
    map.centerAndZoom(new BMapGL.Point(...mapCenter), mapZoom);
    // FIXME: why animation doesn't work?
    // map.setViewport({center: new BMapGL.Point(...mapCenter), zoom: mapZoom}, {enableAnimation: true});
    map.enableScrollWheelZoom(true);
    map.addEventListener('click', function (e) {
        console.log(`'${e.latlng.lng}, ${e.latlng.lat}',`);
    });

    map.addEventListener("zoomend", function () {
        // 根据缩放显示和隐藏文本
        var currZoom = this.getZoom();
        console.log(`currentZoom: ${currZoom}`);
        if (currZoom >= zoomToDisplayLabel && prevZoom < zoomToDisplayLabel) {
            isLabelDisplay = true;
            showHideMarkerLabel(isLabelDisplay);
        } else if (currZoom < zoomToDisplayLabel && prevZoom >= zoomToDisplayLabel) {
            isLabelDisplay = false;
            showHideMarkerLabel(isLabelDisplay);
        }
        prevZoom = currZoom;
    });
}

function initUI() {
    const date = new Date();
    date.setDate(date.getDate()-1); // 第二天才知道前一天的数据
    const beginDate = new Date(2022, 2, 6, 0, 0, 0);
    while(date > beginDate) {
        $('#dateSelector').append(`<option>${parseDate(date)}</option>`);
        date.setDate(date.getDate()-1);
    }

    $('#districtSelector').append(`<option selected>上海市</option>`);
    districts.forEach(name => {
        $('#districtSelector').append(`<option>${name}</option>`);
    });

    $(window).on('hashchange', function(e) {
        // Review: Better to monitor data flow not hash change
        render();
    });

    $('#dateSelector').change(function (e) {
        setHashParameter('date', e.target.value);
    });
    if (getHashParameter('date')) {
        $('#dateSelector').val(getHashParameter('date'));
    }

    $('#keepData').change(function (e) {
        !$(this).is(':checked') && map.clearOverlays();
        setHashParameter('keep', $(this).is(':checked') ? 1 : 0);
    });
    if (getHashParameter('keep')) {
        $('#keepData').attr("checked", true);
    }

    $('#mapMode').change(function (e) {
        setHashParameter('mode', $(this).is(':checked') ? 1 : 0);
    });
    if (getHashParameter('mode')) {
        $('#mapMode').attr("checked", true);
    }

    $('#showEstateBoundary').change(function (e) {
        // FIXME: handle deeplink
        setHashParameter('estate', $(this).is(':checked') ? 1 : 0);
    });
    if (getHashParameter('estate')) {
        $('#showEstateBoundary').attr("checked", true);
    }

    $('#districtSelector').change(function (e) {
        getPoint(e.target.value, function(point){
            if (point) {
                map.setCenter(point, {noAnimation: false});
                if (e.target.value === '上海市') {
                    map.setZoom(12);
                } else {
                    map.setZoom(14);
                }
            }
        }, "上海市");
        render();
    });
}

function renderRegionStatus() {
    fetch(`data/region.json`)
        .then(response => response.json())
        .then(json => {
            !$('#keepData').is(':checked') && map.clearOverlays();

            json.forEach((names, i) => {
                names.forEach((name) => {
                    renderEstate(name, undefined, i);
                });
            });
        });

    const date = new Date();
    document.getElementById('pageTitle').innerText = parseDate(date);
}

function renderUI() {
    var currentDate = getHashParameter("date");
    if (!currentDate) {
        var d = new Date();
        d.setDate(d.getDate()-1); // 第二天才知道前一天的数据
        currentDate = parseDate(d);
    }
    fetchData(currentDate, function(data) {
        renderAddresses(currentDate, data);
    });
}

function renderAddresses(date, addresses) {
    !$('#keepData').is(':checked') && map.clearOverlays();
    // 直接画点
    // addresses.forEach(renderAddress);
    // 根据点, 获取小区, 如果有小区数据, 优先画小区, 否则降级到点
    var districtName = $('#districtSelector').val();
    addresses.forEach((address) => {
        if (districtName === '上海市' || address.startsWith(districtName)) {
            renderEstate(address);
        }
    });
    document.getElementById('pageTitle').innerText = date;
}

function renderAddress(address) {
    getPoint(address, function(point) {
        if (point) {
            var marker = new BMapGL.Marker(new BMapGL.Point(point.lng, point.lat));
            marker.setIcon(covidIcon);
            var label = new BMapGL.Label(address, {offset: new BMapGL.Size(address.length * -5,-35)});
            !isLabelDisplay && label.hide();
            marker.setLabel(label);
            map.addOverlay(marker);
        }
    });
}

// 根据小区名绘制label+边界
function renderEstate(name, isUnblocked = false, type = -1) {
    getEstateInfo(name, function({point, points, title}) {
        let labelTitle = name;
        const labelOffset = [labelTitle.length * -5,-35];
        // 能取到就是小区, 否则降级画点
        if (points) {
            // labelTitle = title + '<br>' + labelTitle;
            labelTitle = title;
            labelOffset[0] = labelTitle.length * -6;
            // labelOffset[1] = -44;

            (isUnblocked || $('#showEstateBoundary').is(':checked')) && renderEstateBoundary(points, isUnblocked, type);
        }

        var marker = new BMapGL.Marker(point);
        switch(type) {
            case 0:
                marker.setIcon(iconType0);
                break;
            case 1:
                marker.setIcon(iconType1);
                break;
            case 2:
                marker.setIcon(iconType2);
                break;
            default:
                isUnblocked ? marker.setIcon(unblockIcon) : marker.setIcon(covidIcon);
        }
        var label = new BMapGL.Label(labelTitle, {offset: new BMapGL.Size(...labelOffset)});
        var labelStyle = defaultLabelStyle;
        if (isUnblocked) {
            labelStyle = unblockLabelStyle;
        } else if (type !== -1) {
            labelStyle = $.extend({}, defaultLabelStyle, {borderColor: eval('color' + type)});
        }
        label.setStyle(labelStyle);
        !isLabelDisplay && label.hide();
        marker.setLabel(label);
        isUnblocked && marker.disableMassClear();
        map.addOverlay(marker);
    });
}

/**
 *
 * @param addressOrName
 * @param callback {point, points, title}
 */
function getEstateInfo(addressOrName, callback) {
    /*
    优先取小区数据. 'tags'包含 ['小区/楼盘'] 的就是小区, 一般都会有边界数据. 但要过滤掉末尾是'X门'的结果
    双相匹配：
    鸿发家园/闵行区古美西路899弄/dffd631c1dd32ebd38221c1c
    春意苑/闵行区虹莘路1518弄28支弄/6d9bafcdb9a874cd715e8084
    不匹配：
    1. 需要把'弄'改成'号'
    春江景庐/闵行区古美西路752弄->闵行区古美西路752弄
    2. 需要设置别名
    君莲小区e块->君莲幸福苑
    3. 需要扩大搜索结果数量到: 50
    '浦东新区崂山路645弄'-> '潍坊十村二小区' 45
     */
    /*
    location cache data structure:
    address (地址):
        - point (原始点)
        - points (边界信息)  ㄱ
        - name (小区名)     ⊥ 这两个数据比较大，做异步加载。小cache，大cache，只有点显示小区，才加载大cache。
     */
    const name = estateAliasMap[addressOrName] || addressOrName;
    if (estateCache.get(name) === undefined) {
        const local = new BMapGL.LocalSearch(map, {
            // Doc: https://mapopen-pub-jsapi.bj.bcebos.com/jsapi/reference/jsapi_webgl_1_0.html#a8b3
            renderOptions:{
                map: map,
                autoViewport: false,    // 关闭自动聚焦定位到搜索结果
            },
            pageCapacity: 50,
        });
        local.setMarkersSetCallback(function(pois){
            if (pois && pois.length > 0) {
                // '批发市场/集市' 浦东新区高青路960号 新联丰农贸市场
                // '宾馆', '旅店' 浦东新区康桥路1200号 '聚沁园时尚宾馆'
                // '村庄' 浦东新区东风村
                var poi = pois.find((poi) => !poi.title.endsWith('门') && !poi.title.includes('-')
                    && poi.tags
                    && (poi.tags.includes('小区/楼盘') || poi.tags.includes('宾馆')
                        || poi.tags.includes('村庄') || poi.tags.includes('批发市场/集市')));
                if (!poi || estateAliasMap[addressOrName]) poi = pois[0];
                var resultIndex = pois.indexOf(poi);
                //根据uid尝试获取边界信息
                getPointsByUid(poi.uid, (points) => {
                    const data = {
                        points, title: poi.title, point: poi.point,
                    };
                    callback(data);
                    // console.log(`pageCapacity: ${resultIndex}, name: ${name}, title: ${poi.title}`);
                    if (points) {
                        // console.log(`points found, name: ${name}, uid: ${poi.uid}`);
                        // TODO: think about merge the 2 cache data
                        estateCache.set(name, data);
                    } else {
                        console.log(`points not found, name: ${name}, uid: ${poi.uid}`);
                        // TODO: maybe better to use data from getPoint()
                        estateCache.set(name, {name, point: poi.point});
                    }
                });
            } else {
                console.log(`poi not found, name: ${name}`);
                getPoint(name, function(point) {
                    estateCache.set(name, {name, point});
                    callback({point});
                });
            }

            // 同步执行的话, 这个API会抛个exception, 所以异步执行
            setTimeout(()=>{
                // 清除地图上强制绘出的结果点位. 没找到其他方法可以做到
                local.clearResults();
            });
        });
        local.search(name, {forceLocal: true});
    } else {
        callback(estateCache.get(name));
    }
}

function renderDistricts() {
    districts.forEach(name => {
        getBoundary(name, function(rs){
            var ply = new BMapGL.Polygon(rs.boundaries, districtPolygonOptions); //建立多边形覆盖物
            ply.disableMassClear();
            map.addOverlay(ply);  //添加覆盖物
        });
    });
}

// 绘制行政边界图
function renderTownBoundary(points) {
    var polygon = new BMapGL.Polygon([points.join(';')], regionPolygonOptions);
    // avoid being cleared after `map.clearOverlays()` https://www.jb51.net/article/133766.htm
    polygon.disableMassClear();
    map.addOverlay(polygon);
}

function renderEstateBoundary(points, keepOverlay, type = -1) {
    var options = null;
    switch(type) {
        case 0:
            options = regionPolygonOptions0;
            break;
        case 1:
            options = regionPolygonOptions1;
            break;
        case 2:
            options = regionPolygonOptions2;
            break;
        default:
            options = estatePolygonOptions;
    }
    var polygon = new BMapGL.Polygon([points.join(';')], options);  //创建多边形
    keepOverlay && polygon.disableMassClear();
    map.addOverlay(polygon);
}

function showHideMarkerLabel(show) {
    var allOverlay = map.getOverlays();
    allOverlay.forEach(overlay => {
        if (overlay instanceof BMapGL.Marker) {
            var currLabel = overlay.getLabel();
            if (currLabel) {
                if (show) {
                    currLabel.show();
                } else {
                    currLabel.hide();
                }
            }
        }
    });
}

function renderLocationControl() {
    // 创建定位控件
    var locationControl = new BMapGL.LocationControl({
        // 控件的停靠位置（可选，默认左上角）
        anchor: BMAP_ANCHOR_BOTTOM_LEFT,
        // 控件基于停靠位置的偏移量（可选）
        offset: new BMapGL.Size(10, 50)
    });
    // 将控件添加到地图上
    map.addControl(locationControl);
}

function renderCopyright() {
    var cr = new BMapGL.CopyrightControl({
        anchor: BMAP_ANCHOR_TOP_RIGHT,
        offset: new BMapGL.Size(10, 10)
    });
    map.addControl(cr);
    var bs = map.getBounds();
    cr.addCopyright({
        id: 1,
        content: "<a href='https://github.com/helloint/covid' style='font-size:16px;color:#000; opacity: 0.5;'>@helloint</a>",
        bounds: bs
    });
}

/**
 * State Machine
 * state:
 * 0: idle, show PLAY icon
 * 1: playing, show STOP icon
 *
 * action:
 * 0 -> 1 start()
 * 1 -> 0 stop()
 */
var fsm = new StateMachine({
    transitions: [
        {name: 'init', from: 'none', to: 'idle'},
        {name: 'start', from: 'idle', to: 'playing'},
        {name: 'stop', from: 'playing', to: 'idle'},
    ],
    data: {
        debug: false,
        selector: null,
        iid: null,
    },
    methods: {
        onInit: function () {
            // A bug: this triggered after onIdle? no matter if I use `init: 'idle'` or transitions
        },
        onLeaveNone: function () {
            this.debug && console.log('onLeaveNone');
            this.selector = $('#dateSelector')[0];
            $('#playBtn').click(function(){
                fsm.start();
            });
            $('#stopBtn').click(function(){
                fsm.stop();
            });
        },
        onIdle: function () {
            this.debug && console.log('onIdle');
            $('#playBtn').show();
            $('#stopBtn').hide();
            this.selector.disabled = false;
        },
        onLeaveIdle: function () {
            this.debug && console.log('onLeaveIdle');
            // make selector readonly https://stackoverflow.com/a/368834/8175165
            this.selector.disabled = true;
        },
        onPlaying: function () {
            this.debug && console.log('onPlaying');
            $('#playBtn').hide();
            $('#stopBtn').show();

            // For resume and play
            let index = this.selector.selectedIndex;
            this.iid = setInterval(()=>{
                index = index - 1;
                if (index >= 0) {
                    this.selector.selectedIndex = index;
                    this.selector.dispatchEvent(new Event('change'));
                } else {
                    fsm.stop();
                }
            }, 1000);
        },
        onStop: function () {
            this.debug && console.log('onStop');
            this.iid && clearInterval(this.iid);
            this.iid = null;
        },
    }
});

var dailyData = null;
function fetchData(date, callback) {
    if (dailyData === null) {
        fetch(`data/addressTotal.json`)
            .then(response => response.json())
            .then(json => {
                dailyData = json;
                callback(dailyData[date] || []);
            });
    } else {
        callback(dailyData[date] || []);
    }
}