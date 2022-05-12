# covid shanghai
## map
<https://helloint.xyz/covid/map.html>

## data process
`node main.js [type] [url]`  
For example:
```
node main.js address http://mp.weixin.qq.com/s?__biz=MjM5NTA5NzYyMA==&mid=2654534451&idx=2&sn=e598f4d52935e30bc0d3e25b2278a7f2&chksm=bd31e6488a466f5e4719a627375d5523858b12d1e414cef6c05e334423cf7c1a27a656fd92d8&mpshare=1&scene=23&srcid=0507dpTw4aGZn31mvL0y6jLp&sharer_sharetime=1651905829258&sharer_shareid=b547167d055d935fd3f9f56094533f76#rd
```
This will generate `2022/05/06` addresses into `./data/daily.json`

`node main.js `

## types
* `run` (no params)  
抓取《上海发布》公众号文章，获取当日 daily num 和 address 信息。
* `list` (no params)  
抓取上海市卫健委网页列表，查找所有数据发布页面的标题和链接。
* `daily`  
抓取《上海发布》每天早上发布的前一天的新冠感染者统计数据。此数据服务于我的《疫情早早报》的Excel统计表格。
* `address`  
抓取《上海发布》当天的新冠感染者地址信息。
* `addressmh`  
抓取《今日闵行》当天的新冠感染者地址信息。这个数据虽然不全，但要比上海发布的早1小时。
* `3`  
抓取三区划分数据。如果表格是以图片形式发布的，就抓不到数据了。
