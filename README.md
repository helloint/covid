# covid shanghai
## product
- Map: <https://helloint.xyz/covid/map.html>
- Chart: <https://helloint.xyz/covid/chart.html>
- Data: <https://helloint.xyz/covid/grid.html>
- Address: <https://helloint.xyz/covid/address.html>

## introduction
[上海疫情地图数据报表的处理和自动化](https://zhuanlan.zhihu.com/p/515840359)(知乎)

## data process
`node main.js [type] [url]`  
For example:
```
node main.js daily https://mp.weixin.qq.com/s/zwbcfAnrreYuw9tUyRJspA
```
This will generate `2022/05/06` addresses into `./data/address.json`

```
node main.js run
```
This will detect if there is new daily and address report from 《上海发布》. If yes, process the data and upload.

## [types]
* `run` (no params)  
抓取《上海发布》公众号文章，获取当日 daily num 和 address 信息。
* `list` (no params)  
抓取上海市卫健委网页列表，查找所有数据发布页面的标题和链接。
* `daily`  
抓取《上海发布》每天早上发布的前一天的新冠感染者统计数据。此数据服务于我的《疫情早早报》的Excel统计表格。
* `address`  
抓取《上海发布》当天的新冠感染者地址信息。疫情后期，这个数据已经没有实际用途了，因为新发现的大都是隔离管控人员，对所在小区影响几乎没有。
* `addressmh`  
抓取《今日闵行》当天的新冠感染者地址信息。这个数据虽然不全，但要比上海发布的早1小时。理论上可以把每个区都爬出来，然后合并，就不用等上海发布的地址信息了。
* `3`  
抓取闵行区古美街道《三区划分》数据。如果表格是以图片形式发布的，就抓不到数据了。
