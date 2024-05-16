//定义全局变量
var map;
var heat;

var l_d;
var r_u;

var l_d_html = document.getElementById("l-d");
var r_u_html = document.getElementById("r-u");

function initMap() {
    map = new TMap.Map("container", {
        pitch: 45,
        zoom: 13,
        center: new TMap.LatLng(32.032771, 118.839729)
    });

    map.on("bounds_changed", function() {
        var mapBounds = map.getBounds();
        l_d = [mapBounds.getSouthWest().getLat().toFixed(6), mapBounds.getSouthWest().getLng().toFixed(6)];
        r_u = [mapBounds.getNorthEast().getLat().toFixed(6), mapBounds.getNorthEast().getLng().toFixed(6)];
        l_d_html.textContent = l_d;
        r_u_html.textContent = r_u;
        drawcontourThrottled(l_d, r_u);
    })
}

function loadScript() {
    //创建script标签，并设置src属性添加到 body 中
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://map.qq.com/api/gljs?v=1.exp&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77&callback=initMap";
    document.body.appendChild(script);
}

window.onload = loadScript;