<h4 align="right"><a href="https://github.com/hululuuuuu/GlobeStream3D/blob/main/README_EN.md">English</a> | <strong>简体中文</strong></h4>

# GlobeStream3D

轨道线、站点编辑和数据导入的优先级与验收条件见[功能需求清单](./ROADMAP.md)，欢迎在 issue 里分享使用场景。

大功能开发周期长的考虑延后再做，毕竟咱也是码农，要给老板打工，空不出来太多时间。

项目的成长离不开大家的奇思妙想，对于合理的方案我会尽量采纳，即使逻辑上不合理我也会真心感谢你的建议。

## 项目介绍

基于three.js 构建3D地球，居家必备，搬砖神器节约时间。

## ✨ 特性

+ 📦 开箱即用：简单快速集成，基本零成本上手。
+ 🛡 Typescript开发：提供完整的类型定义。
+ 🎨 高可扩展：丰富的样式配置和API。
+ 💪 逻辑统一:同时支持3D地球2D地图,一份参数3D和2D的一致的样式和动画。
+ 城市雷达（1.7.0 起）支持在经纬度位置绘制距离环和旋转扇面，可按站点设置颜色、覆盖半径和扫描速度。

用 `npm run dev` 打开城市雷达演示，在列表或地球上选中上海，点击「暂停扫描」。调整覆盖半径后点击「继续扫描」，扇面从暂停角度按原速度继续。负速度可使扇面反向扫描。

```js
await chart.setData("radar", [
  { id: "shanghai", lon: 121.47, lat: 31.23, style: { radius: 8, speed: 0.25 } },
]);
const selectedId = "shanghai";
chart.updateRadarStyle(selectedId, { speed: 0 });    // 暂停时调用
chart.updateRadarStyle(selectedId, { speed: 0.25 }); // 继续时调用，每 4 秒一圈
```

v1.8.0 新增同步方法 `chart.updateRadarStyle(id: string | number, patch: Partial<RadarStyle>): boolean`。它更新所有标识匹配的站点，显式 ID 按字符串比较，省略 ID 时使用 `${lon}-${lat}`。可传入颜色字符串 `color`、半径 `radius`（大于 0 且不超过 45）、有符号的每秒圈数 `speed` 或不透明度 `opacity`（自动限制在 0 到 1）。每次调整都保留当前扫描角度。

成功返回 `true`。站点不存在、图表已销毁或任一数值无效时，返回 `false`。要临时隐藏整层并保持扫描时间推进，可调用 `chart.setLayerVisible("radar", false)`。见[实例方法](https://globestream3d.netlify.app/reference/methods/#updateradarstyle)。

## 📄 在线预览及文档

中文文档提供地图预览、安装指南、示例与 API 参考。[打开使用文档](https://globestream3d.netlify.app/)



## 项目维护

组件代码合入 GitHub 后，使用同一提交在本地构建、打包并同步到 npm。版本号、发布命令和校验方法见[组件发布规范](./AGENTS.md)。

## Issues

使用过程中的问题或者建议欢迎提 [issue](https://github.com/hululuuuuu/GlobeStream3D/issues) ，如果该项目为您提供了帮助希望来一个star万分感谢。


## 🤗 感谢

感谢这些开源项目提供的功能。

 [tween.js](https://github.com/tweenjs/tween.js/)

 [lodash](https://github.com/lodash/lodash)

 [delaunator](https://github.com/mapbox/delaunator) 

