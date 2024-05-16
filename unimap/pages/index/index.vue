<template>
	<body>
		 <div class="input-row">
		    <input type="number"  placeholder="最小值" v-model="minValue" />
		    <input type="number"  placeholder="最大值" v-model="maxValue" />
		    <input type="number"  placeholder="步长" v-model="stepValue" />
			
			<checkbox-group @change="handleSelect">
				<label v-for="item in items" :key="item.value">
					<label>
						<checkbox :value="item.value" :checked="item.checked" />
					</label>
					<label>{{item.name}}</label>
				</label>
			</checkbox-group>
			
			<button @click="updateFunction_vue">上传</button>
		</div>
		<slider value="100" min="0" max="100" step="1" @changing="handleSlider" id="Slider"></slider>
		
		<div id="container"></div>
	</body>
</template>

<script>
	// 原先requrest.js变量
	var minInput;
	var maxInput;
	var stepInput;

	// map.js
	var map;
	var l_d;
	var r_u;
	
	export default {
		data(){
			return {
				key: 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77',
				minValue: null,
			    maxValue: null,
			    stepValue: 1,
				array: ['中国', '美国', '巴西', '日本'],
				index: 0,
			    items: [{
					value: 'node',
					name: '节点显示'
				},
				{
					value: 'slid',
					name: '滑动显示'
				}]
			}
		},
		onLoad(){
			this.init_vue();
		},
		methods: {
			bindPickerChange: function(e) {
			    console.log('picker发送选择改变，携带值为', e.detail.value)
			    this.index = e.detail.value
			},
			loadScript(){
				var script = document.createElement('script');
				script.src = `./static/xlsx.full.min.js`;
				document.body.appendChild(script);
				
				var script = document.createElement('script');
				script.src = `./static/everpolate.browserified.min.js`;
				document.body.appendChild(script);
				
				var script = document.createElement('script');
				script.src = `./static/usedfunction.js`;
				document.body.appendChild(script);
				
				var script = document.createElement('script');
				script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${this.key}&libraries=visualization&callback=mapInit`;
				document.body.appendChild(script);
				
				var script = document.createElement('script');
				script.src = `./static/turf.min.js`;
				document.body.appendChild(script);
			},
			init_vue(){
				this.loadScript();
			},
			async updateFunction_vue() {
				minInput = this.minValue;
				maxInput = this.maxValue;
				stepInput = this.stepValue;
				console.log(minInput)
				console.log(maxInput)
				console.log(stepInput)
				// 1.选择文件
				const { tempFiles } = await uni.chooseFile({
				type: 'file',
				count: 1
				})

				if(!tempFiles.length) return

				var file = tempFiles[0];
				updateFunction(file, minInput, maxInput, stepInput);
			},
			handleSlider(e) {
				clearTimeout(timer);
				timer = setTimeout(function () {
					now_draw = parseInt(e.detail.value * now_length / 100 , 10);
					drawcontour();
				}, 1); // 1ms内不再触发事件，才执行函数
			},
			handleSelect: function (e) {
				var items = this.items,	values = e.detail.value;
				for (var i = 0, lenI = items.length; i < lenI; ++i) {
					const item = items[i]
					if(values.includes(item.value)){
						this.$set(item,'checked',true)
					}else{
						this.$set(item,'checked',false)
					}
				}
				
				// 写逻辑
				if (e.detail.value.includes('node')){
					displayFunction();
				}else{
					closeFunction();
				}
				
				if (e.detail.value.includes('slid')){
					setslider();
				}else{
					resetslider();
				}
			}
		}
	}
	
	
	
</script>

<style scoped>
#container {
  width: 100%;
  height: 97%;
}

.input-row {
  display: flex;
  align-items: center;
}

.input-row input {
  margin-right: 10px;
  width: 100px;
  height: 30px;
}

.input-row button {
  margin-left: 50px;
  height: 40px;
  font-size: 15px;
}
</style>