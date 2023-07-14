<h4 align="right"><a href="https://github.com/JavaScriptam/earth-flyLine/blob/main/README_EN.md">English</a> | <strong>简体中文</strong></h4>

# earth-flyLine

### 使用过程中的问题或者建议欢迎提 [issue](https://github.com/JavaScriptam/earth-flyLine/issues) ，如果该项目为您提供了帮助希望来一个star万分感谢。

## 📄 在线预览

请[预览](https://javascriptam.github.io/earth-flyline-docs/)

## 项目介绍

基于three.js 构建3D大屏地球可视化，居家必备，搬砖神器节约时间。

![avatar](https://github.com/JavaScriptam/earth-flyLine/blob/main/markdownImage/earth.gif?raw=true)

## ✨ 特性

+ 📦 开箱即用：简单快速集成，基本零成本上手。
+ 🛡 Typescript开发：提供完整的类型定义。
+ 🎨 高可扩展：丰富的样式配置和API。

# 使用说明

```bash
npm install earth-flyline
```

## 🚗 开始

```javascript
import earthFlyLine from "earth-flyline";
//请先下载地图文件（可去第三方下载） 然后注册地图 本项目的地图文件在src/map/world
//注：如果不想使用地图文件也可以通过贴图的形式去做详情请查看文档
import geojson from 'xxx/path/world.json'
earthFlyLine.registerMap("world", geojson);
//获取dom节点作为容器 注：该节点请设置宽高
const dom = document.getElementById("container");
const chart = earthFlyLine.init({
      dom,
      map: "world",
    });
```

# 文档

请查看[文档](https://javascriptam.github.io/earth-flyline-docs/guides/start/)


## 🤗 感谢

感谢这些很棒的项目所提供的功能。

 [tween.js](https://github.com/tweenjs/tween.js/)

 [lodash](https://github.com/lodash/lodash)

 [delaunator](https://github.com/mapbox/delaunator) 

