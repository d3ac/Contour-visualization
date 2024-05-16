import pandas as pd
import numpy as np
import re
from queue import Queue

def get_pos_form_str(S):
    matches = re.findall(r'\d+\.\d+', S)
    first_two_numbers = matches[:2]
    return eval(first_two_numbers[0]), eval(first_two_numbers[1])

def getdis(x1, y1, x2, y2):
    disx = abs(x1 - x2)/0.006641999999999371*1000
    disy = abs(y1 - y2)/0.008443999999997231*1000
    return np.sqrt(disx**2 + disy**2)

def cluster(x, y, z):
    newx = []
    newy = []
    newz = []
    book = []

    # 定义队列
    que = Queue()
    for i in range(len(x)):
        if i in book:
            continue
        book.append(i)

        if z[i] < 20:
            continue
        
        que.put(i)

        tempx = 0
        tempy = 0
        tempz = 0
        cnt = 0

        while not que.empty():
            top = que.get()
            
            tempx += x[top]
            tempy += y[top]
            # tempz = max(tempz, z[top])
            tempz += z[top]
            cnt += 1

            for j in range(len(x)):
                if j in book:
                    continue
                if getdis(x[top], y[top], x[j], y[j]) <= 50: #TODO 调整这个阈值
                    book.append(j)
                    que.put(j)
                    
        newx.append(tempx / cnt)
        newy.append(tempy / cnt)
        # newz.append(tempz)
        newz.append(tempz / cnt)
    return newx, newy, newz

def datapreprocessing():
    data = pd.read_excel('files/raw.xlsx')

    x = []
    y = []
    z = []

    for i in range(len(data)):
        x_, y_ = get_pos_form_str(data.iloc[i, 2])
        x.append(x_)
        y.append(y_)
        z.append(data.iloc[i, 1])
    
    x, y, z = cluster(x, y, z)
    Data = pd.DataFrame({'x': x, 'y': y, 'z': z})
    Data.to_csv('files/processed.csv', index=False, sep=',')
    return x, y, z