from flask import Flask, request, render_template, jsonify
import numpy as np
import pandas as pd
from pykrige.ok import OrdinaryKriging
import json


from DataPreprocessing import datapreprocessing

app = Flask(__name__)

@app.route('/get_data', methods=['POST'])
def get_data():
    data = request.json
    gridx = data.get('gridx')
    gridy = data.get('gridy')

    Dataframe = pd.DataFrame((gridx, gridy))
    Dataframe = Dataframe.T
    Dataframe.to_csv('files/grid.csv', index=False, header=False, sep=',')

    # 在这里调用相应的函数处理参数，并获取数据
    result = process_data(gridx, gridy)

    # 返回处理后的数据给前端
    return jsonify(result)

def process_data(gridx, gridy):
    # 在这里处理参数并获取数据的逻辑
    Tmp, _ = OK.execute('points', gridx, gridy)
    # 保存到文件
    z = []
    for i in range(len(Tmp)):
        z.append(Tmp[i])
    return {'result': z}

def getmodel(x, y, z):
    global OK
    print(len(x), len(y), len(z))
    OK = OrdinaryKriging(
        x,
        y,
        z,
        variogram_model="spherical",
        variogram_parameters={'psill': 100, 'range': 1, 'nugget': 1},
        verbose=False,
        enable_plotting=False,
        coordinates_type="geographic",
    )

@app.route('/upload', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']
    if uploaded_file:
        # 处理上传的文件逻辑
        file_path = "files/raw.xlsx"  # 保存文件的路径和名称，注意文件后缀应为.xlsx
        uploaded_file.save(file_path)  # 保存文件到指定路径
        x, y, z = datapreprocessing()
        getmodel(x, y, z)
        print('haha')
        return "文件上传成功"
    else:
        return "未收到文件"

@app.route('/')
def index():
    return render_template('main.html')

if __name__ == '__main__':
    app.run(host='localhost', port=5000)