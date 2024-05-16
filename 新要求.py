import folium
import webbrowser as wb
from folium.plugins import MarkerCluster
import pandas as pd


m = folium.Map(location=[32.03,118.85],zoom_start=16)
# folium.TileLayer(
#     tms=True,
#     tiles="http://rt1.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=vector&style=0",
#     attr="Tencent"
# ).add_to(m)
marker_cluster = MarkerCluster().add_to(m)

data = pd.read_csv('files/processed.csv').values
x = data[:,0]
y = data[:,1]

# for i in range(len(x)):
#     folium.Marker(
#         location=[y[i],x[i]]
#     ).add_to(marker_cluster)

# 画热力图
data = []
for i in range(len(x)):
    data.append([y[i],x[i]])
folium.plugins.HeatMap(data).add_to(m)

m.save("m.html")
wb.open("m.html")