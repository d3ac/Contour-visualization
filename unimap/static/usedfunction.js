var Longitude = [];
var Latitude = [];
var Value = [];
var markers = [];
var rowCount = null;
var uploaded = null;
var timer = null;
var now_length = 0;
var now_draw = 0;
var breaks = [];

var Dis = [];
var Hig = [];
var centerx = 118.750158;  //  如果中心（也就是发射塔）改变了的话，这个也要改
var centery = 32.065135;   //  如果中心（也就是发射塔）改变了的话，这个也要改
var Max_dis = 0;
var Min_dis = 100000000;
var interp_template_x = 0;
var interp_template_y = 0;
var isDrawing = false;  // 是否正在执行函数
var throttleInterval = 10;  // 限制调用频率的时间间隔（毫秒）
var average = 0;

var minInput;
var maxInput;
var stepInput;
var slider_flag=0;

var map;

var displayed_lines = []; // 存已经转好了的线
var displayed_words = []; // 存已经转好了的文字

function sortArrays(x, y) {    
    var combined = x.map(function(_, index) {
        return { x: x[index], y: y[index] };
    });
    
    combined.sort(function(a, b) {
        return a.x - b.x;
    });
    
    var sortedX = combined.map(function(data) {
        return data.x;
    });
    var sortedY = combined.map(function(data) {
        return data.y;
    });
    
    return [sortedX, sortedY];
}

function linear(interp, x, y, debug) {
	var newinterp = [];
	var [sortedX, sortedY] = sortArrays(x, y);
	var index = 0;
	for(let i = 0; i < interp.length; i++){
		index = 0;
		while(index != sortedX.length - 1 && sortedX[index] <= interp[i]) index ++;
		var x0 = sortedX[index-1];
		var x1 = sortedX[index];
		var y0 = sortedY[index-1];
		var y1 = sortedY[index];
		if(debug){
			console.log(index)
		}
		newinterp.push(y0 + (y1 - y0) * (interp[i] - x0) / (x1 - x0))
	}
	return newinterp;
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

function getdis(x1, y1, x2, y2){
	let disx = (x1 - x2) / 0.006641999999999371 * 1000;
	let disy = (y1 - y2) / 0.008443999999997231 * 1000;
	return Math.sqrt(disx*disx + disy*disy);
}

function preprocess(){
	len = Longitude.length;
	for(let i = 0; i < len; i++){
		Dis.push(this.getdis(Longitude[i], Latitude[i], centerx, centery) / 1000);
		Hig.push(Value[i]);
		if (Max_dis < Dis[i]) Max_dis = Dis[i];
		if (Min_dis > Dis[i]) Min_dis = Dis[i];
	}
	//linspace
	let linspace_step = (Max_dis - Min_dis) / 10000;
	let newx = [];
	for(let i = 0; i < 10000; i++){
		newx.push(linspace_step*i+Min_dis);
	}
	interpvalue = linear(newx ,Dis, Hig, 0);
	interp_template_x = newx;
	interp_template_y = this.sliding_average(newx, interpvalue, 500);
	
	for(let i = 0; i < interp_template_y.length; i++){
		average += interp_template_y[i];
	}
	average = average / interp_template_y.length;
}

function updateFunction(file, minInputfromvue, maxInputfromvue, stepInputfromvue) {
	minInput = minInputfromvue;
	maxInput = maxInputfromvue;
	stepInput = stepInputfromvue;
	if (file) {
		uploaded = 1;
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
				Value.push(Value_temp[i]);
			}
			rowCount = Longitude.length;
			preprocess(); // 预处理数据
		}
	}
	else {
		alert("请先选择文件");
	}
}

function sliding_average(x, y, k){
	let len = x.length;
	let new_y = []
	let sumofpre = 0
	for(let i = 0; i < x.length; i++){
		if(i < k){
			sumofpre += y[i];
			new_y.push(sumofpre / (i+1));
		}
		else{
			sumofpre = sumofpre + y[i] - y[i-k];
			new_y.push(sumofpre / k);
		}
	}
	return new_y;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

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



function drawcontour() {
	if (uploaded == null) {
		return;
	}

	l_d[0] = parseFloat(l_d[0]);
	l_d[1] = parseFloat(l_d[1]);
	r_u[0] = parseFloat(r_u[0]);
	r_u[1] = parseFloat(r_u[1]);

	var extend = [l_d[1], l_d[0], r_u[1], r_u[0]];
	var cellWidth = (r_u[1] - l_d[1]) / 200; // 先生成200*200的网格
	var pointGrid = turf.pointGrid(extend, cellWidth, { units: 'degrees' });
	// var pointGrid = turf.pointGrid([118.705314, 31.985797, 118.975259, 32.113394], 0.001349724999999964, { units: 'degrees' });

	gridx = [];
	gridy = [];
	for (var i = 0; i < pointGrid.features.length; i++) {
		gridx.push(pointGrid.features[i].geometry.coordinates[0]);
		gridy.push(pointGrid.features[i].geometry.coordinates[1]);
	}
	
	var tempdis = [];
	
	for(let i = 0; i < gridx.length; i++){
		dis = getdis(gridx[i], gridy[i], centerx, centery) / 1000;
		if(dis > Max_dis){
			tempdis.push(parseFloat(Max_dis));
		}
		else if(dis < Min_dis){
			tempdis.push(parseFloat(Min_dis));
		}
		else{
			tempdis.push(parseFloat(dis)); // funcdis 错了
		}
	}
	var z = [];
	z = linear(tempdis, interp_template_x, interp_template_y, 0);
	
	Minvalue = 9999.9;
	Maxvalue = -9999.9;

	for (var i = 0; i < pointGrid.features.length; i++) {
		pointGrid.features[i].properties.temperature = z[i];
		Minvalue = min(Minvalue, z[i]);
		Maxvalue = max(Maxvalue, z[i]);
	}
	breaks = []
	
	var minInput_for_breaks = max(minInput, Minvalue);
	var maxInput_for_breaks = min(maxInput, Maxvalue);

	for (var i = minInput_for_breaks; i <= maxInput_for_breaks; i += stepInput) {
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
	now_length = lines.features.length - 1;

	var Min_accept = 15;
	
	if (slider_flag) {
		var i = now_draw;
		
		try{
			lines.features[i].geometry;
		} catch (error){
			console.log('error')
			return
		}
		
		for (var j = 0; j < lines.features[i].geometry.coordinates.length; j++) { // 枚举每种高的等高线的条数
			var path = [];
			// 重复点的问题
			var diff = false;
			var diff_x = lines.features[i].geometry.coordinates[j][0][0][1]
			// 个数少的问题
			if (lines.features[i].geometry.coordinates[j][0].length < Min_accept) {
				continue;
			}
			for (var k = 0; k < lines.features[i].geometry.coordinates[j][0].length; k++) { // 枚举怎么连接的
				path.push(new TMap.LatLng(lines.features[i].geometry.coordinates[j][0][k][1], lines.features[i].geometry.coordinates[j][0][k][0]));
				if (lines.features[i].geometry.coordinates[j][0][k][1] != diff_x) {
					diff = true;
				}
			}
			if (!diff) {
				continue;
			}
			// 等高线
			var polygon = new TMap.MultiPolygon({
				map,
				styles: { // 多边形的相关样式
					'polygon': new TMap.PolygonStyle({
						'color': 'rgba(41,91,255,0.10)', // 面填充色
						'showBorder': true, // 是否显示拔起面的边线
						'borderColor': colorsB[i], // 边线颜色
						'borderWidth': 3, // 边线宽度
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
			var Pos = parseInt(max(Min_accept-1, lines.features[i].geometry.coordinates[j][0].length / 2));
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
						position: new TMap.LatLng(lines.features[i].geometry.coordinates[j][0][Pos][1], lines.features[i].geometry.coordinates[j][0][Pos][0]), // 标注点位置
						content: breaks[i].toFixed(1).toString(), // 标注文本
						properties: {
							// 标注点的属性数据
							title: 'label',
						},
					},
				],
			});
			displayed_words.push(word);
			break
		}
	}
	else {
		for (var i = 0; i < lines.features.length; i++) { // 枚举不同的等高线
			for (var j = 0; j < lines.features[i].geometry.coordinates.length; j++) { // 枚举每种高的等高线的条数
				var path = [];
				// 重复点的问题
				var diff = false;
				var diff_x = lines.features[i].geometry.coordinates[j][0][0][1]
				// 个数少的问题
				if (lines.features[i].geometry.coordinates[j][0].length < Min_accept) {
					continue;
				}
				for (var k = 0; k < lines.features[i].geometry.coordinates[j][0].length; k++) { // 枚举怎么连接的
					path.push(new TMap.LatLng(lines.features[i].geometry.coordinates[j][0][k][1], lines.features[i].geometry.coordinates[j][0][k][0]));
					if (lines.features[i].geometry.coordinates[j][0][k][1] != diff_x) {
						diff = true;
					}
				}
				if (!diff) {
					continue;
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
							// 'borderDashArray': [5, 5] // 虚线数组
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
				var Pos = parseInt(max(Min_accept-1, lines.features[i].geometry.coordinates[j][0].length / 2));
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
							position: new TMap.LatLng(lines.features[i].geometry.coordinates[j][0][Pos][1], lines.features[i].geometry.coordinates[j][0][Pos][0]), // 标注点位置
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
	}
}

function drawcontourThrottled(){
	if (isDrawing){
		return ;
	}
	isDrawing = true;
	drawcontour();
	setTimeout(function () {
		isDrawing = false;
	}, throttleInterval);
}

function displayFunction(){
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

function closeFunction(){
	for (let i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers = [];
}

function setslider(){
	slider_flag = 1;
}

function resetslider(){
	slider_flag = 0;
}

window.mapInit = function(){
	map = new TMap.Map("container", {
		pitch: 45,
		zoom: 13,
		center: new TMap.LatLng(32.332771, 118.839729)
	});
	
	map.on("bounds_changed", function() {
		var mapBounds = map.getBounds();
		l_d = [mapBounds.getSouthWest().getLat().toFixed(6), mapBounds.getSouthWest().getLng().toFixed(6)];
		r_u = [mapBounds.getNorthEast().getLat().toFixed(6), mapBounds.getNorthEast().getLng().toFixed(6)];
		drawcontourThrottled();
	})
}