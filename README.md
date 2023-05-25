# earthFlyLine
## [项目地址](#https://github.com/JavaScriptam/earth-flyLine)
https://github.com/JavaScriptam/earth-flyLine

## 项目介绍

基于three.js 构建3D大屏地球可视化，居家必备，搬砖神器节约时间。

## ✨ 特性

+ 📦 开箱即用：简单快速集成，基本零成本上手。
+ 🛡 Typescript开发：提供完整的类型定义文件。

## 目录

- [使用说明](#使用说明)
  - [示例](#-示例)
- [文档](#-文档)
- [本地构建](#-本地构建)


# 使用说明

```bash
npm install earth-flyLine -S
```



## 🐸 示例

```javascript
import earthFlyLine from "earth-flyLine";
//请先下载地图文件（可去第三方下载） 然后注册地图 本项目的地图文件在src/map/world
import geojson from 'xxx/path/world.json'
chart.registerMap("world", geojson);
//获取dom节点作为容器 注：该节点请设置宽高
const dom = document.getElementById("container");
const chart = earthFlyLine.init({
      dom,
      map: "world",
    });
chart.addData("flyLine", [
 {
   from:{
      lon: 112.45, //经度
      lat: 34.62, //维度
     ...extraField // 其他自定义字段
    },
    to:{
      lon: 14, //经度
      lat: 52, //维度
      ...extraField // 其他自定义字段
    },
 }
])
.then(() => {
  console.log('塞入数据成功');
});
```



### 😱先这样，然后再那样，成了！🙀

![image-20230522204834295](markdownImage/earth.png)

## 📄 文档
```javascript
earthFlyLine.init({
  dom,
  config: {
    R: 140,
    earth: {
      color: "#13162c",
    },
    map: "world",
    mapStyle: {
      areaColor: "#2e3564",
      lineColor: "#797eff",
    },
    spriteColor: "#797eff", //光圈
    pathStyle: {
      color: "#cd79ff", //飞线路径配置
    },
    flyWireStyle: {
      //飞线样式配置
      color: "#cd79ff",
    },
    scatterStyle: {
      //涟漪
      color: "#cd79ff",
    },
  },
})

```



## 🛠️ 本地构建
在根目录下执行命令，需要[Node.js](https://nodejs.org)(v16+版本)环境。
```bash
# 通过 npm 安装依赖
npm install

# 打包文件
npm run build
```
构建好的文件在`dist`文件夹。

