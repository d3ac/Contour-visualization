var Longitude = [];
var Latitude = [];

var rowCount = null;

var uploaded = null;

var minInput;
var maxInput;
var stepInput;

// ——————————————————————————从用户获取数据的函数——————————————————————————
function updateFunction() {
    minInput = parseFloat(document.getElementById("Min").value);
    maxInput = parseFloat(document.getElementById("Max").value);
    stepInput = parseFloat(document.getElementById("Step").value);

    // 定义好一个数组，用来存放数据
    var fileInput = document.getElementById("fileInput");
    var file = fileInput.files[0]; // 获取用户选择的文件
    if (file) {
        // python
        uploaded = 1;
        var formData = new FormData();
        formData.append("file", file);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload");
        xhr.onload = function () {
            if (xhr.status === 200) {
                alert("上传成功");
            } else {
                alert("上传失败");
            }
        }
        xhr.send(formData);
        // js
        rowCount = null;
        Longitude = [];
        Latitude = [];
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function (e) {
            var data = e.target.result;
            var wb = window.XLSX.read(data, { type: 'binary' });
            var sheets = wb.Sheets[wb.SheetNames[0]];

            var range = sheets["!ref"];
            rowCount = parseInt(range.split(":")[1].replace(/\D/g, ''));

            var Longitude_temp = [];
            var Latitude_temp = [];
            var Value_temp = [];

            // 读取数据
            for (let i = 2; i <= rowCount; i++) {
                let temp = sheets["C" + i].v;
                let regex = /[-+]?\d+(\.\d+)?/g; // 正则表达式匹配数字的模式
                let matches = temp.match(regex); // 匹配到的数字数组
                Longitude_temp.push(parseFloat(matches[0]));
                Latitude_temp.push(parseFloat(matches[1]));
                Value_temp.push(parseFloat(sheets["B" + i].v));
            }
            rowCount -= 1; // 首行是表头，不算在内

            // 数据去重
            var book = new Array(rowCount).fill(0);
            for (let i = 0; i < rowCount; i++) {
                if (book[i] == 1) {
                    continue;
                }

                var cnt = 1;
                var sum = Value_temp[i];

                for (let j = i + 1; j < rowCount; j++) {
                    if (Longitude_temp[i] == Longitude_temp[j] && Latitude_temp[i] == Latitude_temp[j]) {
                        cnt += 1;
                        sum += Value_temp[j];
                        book[j] = 1;
                    }
                }
                Longitude.push(Longitude_temp[i]);
                Latitude.push(Latitude_temp[i]);
            }
            rowCount = Longitude.length;
        }
    }
    else {
        alert("请先选择文件");
    }
}
//————————————————————————下面是显示和关闭 “点” 的函数————————————————————————
function handleSelect() {
    var selectElement = document.getElementById("select");
    var selectedValue = selectElement.value;

    if (selectedValue === "1") {
        displayFunction();
    }
    else if (selectedValue === "2") {
        closeFunction();
    }
}

var markers = [];

function displayFunction() {
    for (let i = 0; i < rowCount; i++) {
        let position = new TMap.LatLng(Latitude[i], Longitude[i]);
        let marker = new TMap.MultiMarker({
            id: 'marker-' + i,
            map: map,
            styles: {
                "marker": new TMap.MarkerStyle({
                    "width": 25,
                    "height": 35,
                    "anchor": { x: 16, y: 32 },
                    "src": 'https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png'
                })
            },
            geometries: [{
                "id": 'demo-' + i,
                "styleId": 'marker',
                "position": position,
                "properties": {
                    "title": "marker-" + i
                }
            }]
        });
        markers.push(marker);
    }
}

function closeFunction() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

//————————————————————————下面是绘制等高线的函数————————————————————————
var isDrawing = false;  // 是否正在执行函数
var throttleInterval = 100;  // 限制调用频率的时间间隔（毫秒）

function drawcontourThrottled(l_d, r_u) {
    if (isDrawing) {
        return;  // 如果正在执行函数，则直接返回
    }
    isDrawing = true;
    drawcontour(l_d, r_u);
    setTimeout(function () {
        isDrawing = false;
    }, throttleInterval);
}

function min(a, b) {
    if (a < b) {
        return a;
    }
    return b;
}

function max(a, b) {
    if (a > b) {
        return a;
    }
    return b;
}

var displayed_lines = []; // 存已经转好了的线
var displayed_words = []; // 存已经转好了的文字

function generateColors(n) {
    var colorsA = []; // 存储颜色值，格式为 '#RRGGBB'
    var colorsB = []; // 存储带有透明度的颜色值，格式为 'rgba(r, g, b, 1)'

    var startColor = [51, 102, 255]; // 初始颜色为冷色 '#3366ff'
    var endColor = [255, 0, 0]; // 结束颜色为暖色 '#ff0000'

    var step = [
        (endColor[0] - startColor[0]) / (n - 1),
        (endColor[1] - startColor[1]) / (n - 1),
        (endColor[2] - startColor[2]) / (n - 1)
    ];

    for (var i = 0; i < n; i++) {
        var r = Math.round(startColor[0] + step[0] * i);
        var g = Math.round(startColor[1] + step[1] * i);
        var b = Math.round(startColor[2] + step[2] * i);

        var colorA = '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
        colorsA.push(colorA);

        var colorB = 'rgba(' + r + ', ' + g + ', ' + b + ', 1)';
        colorsB.push(colorB);
    }

    return [colorsA, colorsB];
}

// 辅助函数，将0-255的颜色分量转换为两位的十六进制值
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function drawcontour(l_d, r_u) {
    if (uploaded == null) {
        return;
    }

    l_d[0] = parseFloat(l_d[0]);
    l_d[1] = parseFloat(l_d[1]);
    r_u[0] = parseFloat(r_u[0]);
    r_u[1] = parseFloat(r_u[1]);

    var extend = [l_d[1], l_d[0], r_u[1], r_u[0]];
    var cellWidth = (r_u[1] - l_d[1]) / 130; // 先生成200*200的网格
    var pointGrid = turf.pointGrid(extend, cellWidth, { units: 'degrees' });

    gridx = [];
    gridy = [];
    for (var i = 0; i < pointGrid.features.length; i++) {
        gridx.push(pointGrid.features[i].geometry.coordinates[0]);
        gridy.push(pointGrid.features[i].geometry.coordinates[1]);
    }

    // 使用fetch函数向后端发送POST请求
    fetch('/get_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gridx: gridx,
            gridy: gridy
        })
    })
        .then(response => response.json())
        .then(data => {
            // 在这里处理从后端获取到的数据
            Minvalue = 9999.9;
            Maxvalue = -9999.9;

            for (var i = 0; i < pointGrid.features.length; i++) {
                pointGrid.features[i].properties.temperature = data.result[i];
                Minvalue = min(Minvalue, data.result[i]);
                Maxvalue = max(Maxvalue, data.result[i]);
            }
            var breaks = []
            minInput = max(minInput, Minvalue);
            maxInput = min(maxInput, Maxvalue);

            for (var i = minInput; i <= maxInput; i += stepInput) {
                breaks.push(i);
            }

            var lines = turf.isobands(pointGrid, breaks, { zProperty: 'temperature' });
            // 获取等高线需要的颜色
            var temp = generateColors(breaks.length);
            var colorsA = temp[0];
            var colorsB = temp[1];
            //清除之前的等高线
            for (var i = 0; i < displayed_lines.length; i++) {
                displayed_lines[i].setMap(null);
            }
            for (var i = 0; i < displayed_words.length; i++) {
                displayed_words[i].setMap(null);
            }
            displayed_words = [];
            displayed_lines = [];
            //绘制等高线
            for (var i = 0; i < lines.features.length; i++) { // 枚举不同的等高线
                for (var j = 0; j < lines.features[i].geometry.coordinates.length; j++) { // 枚举每种高的等高线的条数
                    var path = [];
                    if (lines.features[i].geometry.coordinates[j][0].length < 15){
                        continue;
                    }
                    for (var k = 0; k < lines.features[i].geometry.coordinates[j][0].length; k++) { // 枚举怎么连接的
                        path.push(new TMap.LatLng(lines.features[i].geometry.coordinates[j][0][k][1], lines.features[i].geometry.coordinates[j][0][k][0]));
                    }
                    // 等高线
                    var polygon = new TMap.MultiPolygon({
                        map,
                        styles: { // 多边形的相关样式
                            'polygon': new TMap.PolygonStyle({
                                'color': 'rgba(41,91,255,0.00)', // 面填充色
                                'showBorder': true, // 是否显示拔起面的边线
                                'borderColor': colorsB[i], // 边线颜色
                                'borderWidth': 3, // 边线宽度
                                'borderDashArray': [5, 5] // 虚线数组
                            }),
                        },
                        geometries: [{
                            id: 'polygon-' + i + '-' + j,
                            styleId: 'polygon',
                            paths: path,
                        }],
                    });
                    displayed_lines.push(polygon);

                    // 文字
                    var word = new TMap.MultiLabel({
                        id: 'label-layer' + i + '-' + j,
                        map: map,
                        styles: {
                            label: new TMap.LabelStyle({
                                color: '#3777FF', // 颜色属性
                                size: 20, // 文字大小属性
                                offset: { x: 0, y: 0 }, // 文字偏移属性单位为像素
                                angle: 0, // 文字旋转属性
                                alignment: 'center', // 文字水平对齐属性
                                verticalAlignment: 'middle', // 文字垂直对齐属性
                            }),
                        },
                        geometries: [
                            {
                                id: 'label', // 点图形数据的标志信息
                                styleId: 'label', // 样式id
                                position: new TMap.LatLng(lines.features[i].geometry.coordinates[j][0][14][1], lines.features[i].geometry.coordinates[j][0][14][0]), // 标注点位置
                                content: breaks[i].toFixed(1).toString(), // 标注文本
                                properties: {
                                    // 标注点的属性数据
                                    title: 'label',
                                },
                            },
                        ],
                    });
                    displayed_words.push(word);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}