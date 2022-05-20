/**
 * 把地址转换成latlng坐标
 * 调用了百度地图API实现的, 然后另外增加了一层缓存, 否则会影响画点的渲染速度
 * @param address "永泰路630弄"
 * @param callback {"lng":121.52411305537956,"lat":31.145365857319558}
 */
function getPoint(address, callback) {
    if (pointCache.has(address)) {
        callback(pointCache.get(address));
    } else {
        mapGeo.getPoint(address, (point) => {
            pointCache.set(address, point);
            callback(point);
        }, "上海市");
    }
}

function getBoundary(name, callback) {
    initBoundaryData(() => {
        if (boundaryCache.get(name) === undefined) {
            mapBoundary.get(name, function (rs) {
                callback(rs);
                boundaryCache.set(name, rs);
            });
        } else {
            callback(boundaryCache.get(name));
        }
    });
}

// TODO: wrap to a util function
let boundaryCache = null;
const boundaryDataRequestPool = [];
let boundaryDataRequesting = false;
function initBoundaryData(callback) {
    if (boundaryCache == null) {
        if (!boundaryDataRequesting) {
            boundaryDataRequesting = true;
            fetch(`data/boundaryCache.json`)
                .then(response => response.json())
                .then(json => {
                    boundaryCache = new Map(json);
                    callback();
                    boundaryDataRequesting = false;

                    if (boundaryDataRequestPool.length > 0) {
                        while (boundaryDataRequestPool.length) {
                            var request = boundaryDataRequestPool.pop();
                            request && request();
                        }
                    }
                });
        } else {
            boundaryDataRequestPool.push(callback);
        }
    } else {
        callback();
    }
}

/**
 * 根据小区Uid获取小区边界
 * Deps: jQuery, coordinateToPoints
 * @param uid
 * @param callback
 */
function getPointsByUid(uid, callback) {
    $.ajax({
        async: false,
        url: "https://map.baidu.com/?pcevaname=pc4.1&qt=ext&ext_ver=new&l=12&uid=" + uid,
        dataType: 'jsonp',
        jsonp: 'callback',
        success: function (result) {
            if (result.content.geo) {
                var geo = result.content.geo;
                var points = coordinateToPoints(geo);
                callback(points);
            } else {
                callback(null);
            }
        },
        timeout: 10000,
    });
}

/**
 * 提取百度米坐标字符串，转为经纬度坐标数组
 * Deps: map, BMapGL
 * @param coordinate
 * @returns {*[]}
 */
function coordinateToPoints(coordinate) {
    var points = [];
    if (coordinate) {
        if (coordinate && coordinate.indexOf("-") >= 0) {
            coordinate = coordinate.split('-');
        }
        //取点集合
        var tempco = coordinate[1];
        if (tempco && tempco.indexOf(",") >= 0) {
            tempco = tempco.replace(";","").split(",");
        }
        //分割点，两个一组，组成百度米制坐标
        var temppoints=[];
        for(var i = 0, len = tempco.length; i < len; i++){
            var obj = {};
            obj.lng=tempco[i];
            obj.lat=tempco[i+1];
            temppoints.push(obj);
            i++;
        }
        var projection = map.getProjection();
        //遍历米制坐标，转换为经纬度
        for ( var i = 0, len = temppoints.length; i < len; i++) {
            var pos = temppoints[i];
            var point = projection.pointToLngLat(new BMapGL.Pixel(pos.lng, pos.lat));
            points.push([ point.lng, point.lat ].toString());
        }
    }
    return points;
}