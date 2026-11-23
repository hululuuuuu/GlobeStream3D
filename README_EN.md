<h4 align="right"><strong>English</strong> | <a href="https://github.com/hululuuuuu/GlobeStream3D/blob/main/README.md">简体中文</a></h4>

# GlobeStream3D

The Chinese documentation includes map previews, an installation guide, examples, and API references. [Open the documentation](https://globestream3d.netlify.app/)

### Please let us know if you encounter any [issues](https://github.com/hululuuuuu/GlobeStream3D/issues) while using our project. Your feedback is valuable and will help us improve it.If you find our project helpful, please give us a star to support us. Thank you for support！！！
## Introduction

Building 3D large screen earth visualization based on three.js, essential for home, High efficiency component。


## ✨ Features

+ 📦  **Out of the box:** Simple and fast integration, basically zero cost to get started.
+ 🛡 **Typescript development:** Provide complete type definition files.
+ 🎨 **Highly scalable:** With rich style configuration and API, the function can be extended as you like.
+ **City radar (development version)** overlays range rings and a rotating sweep at geographic coordinates in 2D and 3D. Run `npm run dev`, select a city in the station list or on the globe, and adjust its scan speed and coverage radius. Use `chart.setData("radar", [{ lon: 121.47, lat: 31.23 }])` to add a station to a chart. Toggle it with `chart.setLayerVisible("radar", false)` and `chart.setLayerVisible("radar", true)` to keep the stations and their scan phase.



## 📦 Install

```bash
npm install earth-flyline
```

## 🚗 Get Start

```javascript
import earthFlyLine from "earth-flyline";
//Please download the map file first (can be downloaded from a third party) and then register the map file for this project in the "src/map/world"
//If you don't want to use a map file, you can also do it in the form of a picture file. For more information, please see the document.
import geojson from 'xxx/path/world.json'
earthFlyLine.registerMap("world", geojson);
//Get dom node as container Note: please set width and height for this node
const dom = document.getElementById("container");
const chart = earthFlyLine.init({
      dom,
      map: "world",
    });
//Adding new data
chart.addData("flyLine", [
 {
   from:{
     id:1,//string | number
      lon: 112.45, //Longitude
      lat: 34.62, //Latitude
     ...userData 
    },
    to:{
      id:2,//string | number
      lon: 14, 
      lat: 52, 
      ...userData
    },
 }
])
.then(() => {
  console.log('success');
});
//remove data
chart.remove('flyLine',['1-2']) //1-2 The splicing of from.id and to.id in the original data  `${from.id}-${to.id}`
```

## 📄 Docs

```bash
earthFlyLine.init(options)=>Chart
```

### :smile:Example

```javascript
const chart = earthFlyLine.init({
  dom,
  map: "world",
  config: {
    R: 140,
    earth: {
      color: "#13162c",
    },
    mapStyle: {
      areaColor: "#2e3564",
      lineColor: "#797eff",
    },
    spriteStyle: {
        color:"#797eff"
    }, 
    pathStyle: {
      color: "#cd79ff", 
    },
    flyLineStyle: {
      color: "#cd79ff",
    },
    scatterStyle: {
      color: "#cd79ff",
    },
    hoverRegionStyle: {
      areaColor: "#cd79ff",
    },
    regions: {
      China: {
        areaColor: "#2e3564",
      },
    },
  },
})
```

### options

| Property        | Type         | Description                           | Default | Required |
| ----------- | ------------ | ------------------------------ | -------- | ----------- |
| dom         | HTMLElement  |                                | true     | true |
| config      | object       | For more information, please see the config configuration below. | -    | false |
| autoRotate  | boolean      | The earth rotates              | True | false |
| rotateSpeed | number       | Speed of rotation of the earth | 0.01 | false |
| map         | string       | Name of the registered map     | - | true |
| mode        | '3d' \| '2d' | Rendering mode defaults to 3d  | '3d' | false |
| stopRotateByHover | boolean | Mouse hover and rotate to stop | true | false |
| limitFps | boolean | lock 30 frames | false | false |
|  |  |  |  |  |

>  ### config
>  | Property         | Type   | Description                                                  | Default | Required |
>  | ---------------- | ------ | ------------------------------------------------------------ | ------- | -------- |
>  | R                | number | The larger the radius of the earth, the bigger the earth.    | 150     | false    |
>  | texture          | String | Picture url (if you use a map, the map area color and other related configurations will not take effect) | -       | false    |
>  | earth            | object | Earth configuration                                          | -       | false    |
>  | mapStyle         | object | Map style configuration                                      | -       | false    |
>  | spriteStyle      | object | Earth background aperture color configuration                | -       | false    |
>  | pathStyle        | object | Flying line path configuration                               | -       | false    |
>  | flyLineStyle     | object | Flying line configuration                                    | -       | false    |
>  | scatterStyle     | object | Scatter configuration                                        | -       | false    |
>  | hoverRegionStyle | object | The mouse hover map will not work unless it is highlighted   | -       | false    |
>  | regions          | object | Configuring the color of a separate map area does not work unless passed | -       | false    |
>  | bgStyle          | object | Scene background style                                       |         | false    |
>
>  >  flyLineStyle & scatterStyle
>  >
>  >  | Property     | Type                | Description                                                  | Default           | Required |
>  >  | ------------ | ------------------- | ------------------------------------------------------------ | ----------------- | -------- |
>  >  | color        | RGB \| RGBA \| HEX  | color                                                        | #cd79ff           | false    |
>  >  | size         | number              | Size (the flying line appears as thickness and the scatter shows as size) | -                 | false    |
>  >  | duration     | number              | Time (in milliseconds) to complete the animation, with lower values indicating faster animation | 2000              | false    |
>  >  | delay        | number              | Deferred execution time default                              | 0                 | false    |
>  >  | repeat       | number              | Number of loops                                              | Infinity 无限循环 | false    |
>  >  | onComplete   | (params:void)=>void | A callback when the repeat loop runs out of times            | -                 | false    |
>  >  | customFigure | Object              | Custom coordinate marker                                     |                   |          |
>  >
>  >  scatterStyle.customFigure（For the animated field, please refer to [tween.js](https://github.com/tweenjs/tween.js/blob/main/README.md)）
>  >
>  >  ```javascript
>  >  { 
>  >    	
>  >    texture: imgUrl or svgUrl, //note: that the picture or svg in the texture field needs to be white. You can refer to (/ src/image/triangel) svg and png images under this item. The color can be controlled through the scatterStyle.color field.
>  >    animate: { //If animate is not configured, there will be no animation.
>  >      from: {
>  >        size?: 11,
>  >        opacity?: 0,
>  >      },
>  >      to: {
>  >        size?: [22,11],
>  >        opacity?: [1,0],
>  >      },
>  >    },
>  >  },
>  >  
>  >  
>  >  ```
>  >
>  >  bgStyle
>  >
>  >  ````javascript
>  >  {
>  >    color: "#040D21",
>  >    opacity: 1,
>  >  }
>  >  ````
>  >
>  >  earth
>  >
>  >  Currently, only color (which can be understood as the color of the ocean) is supported, and more api such as reflective materials will be exposed later.
>  >
>  >  ````javascript
>  >  {
>  >    color: "#13162c",
>  >  }
>  >  ````
>  >
>  >  mapStyle
>  >
>  >  ````javascript
>  >  {
>  >    areaColor: "#2e3564", 
>  >    lineColor: "#797eff",
>  >  }
>  >  ````
>  >
>  >  spriteStyle
>  >
>  >  ````javascript
>  >  {
>  >    color: "#797eff",
>  >    show: true,
>  >  }
>  >  ````
>  >
>  >  pathStyle
>  >
>  >  ```javascript
>  >  {
>  >    color: "#cd79ff", 
>  >  }
>  >  ```
>








### Methods

> ``` javascript
> chart.addData(type,data)
> ```
>
> > **addData parameter explained** 
> >
> > - type: Add a data model type, currently supporting 'flyLine' and 'point'
> >
> > - data:Array[object]
> >
> >   ```javascript
> >   type === 'flyLine' 
> >   Corresponding data data structure
> >   [
> >     {
> >       from:{
> >         id:1,
> >         lon: 112.45, //longitude
> >         lat: 34.62, //Latitude
> >         style:scatterStyle //See "config.scatterStyle" for configuration
> >         ...userData // Other custom fields
> >       },
> >       to:{
> >         id:2,
> >         lon: 14, //longitude
> >         lat: 52, //Latitude
> >         style:scatterStyle //See "config.scatterStyle" for configuration
> >         ...userData // Other custom fields
> >       },
> >       style:{
> >         pathStyle:pathStyle //See "config.pathStyle" for configuration
> >         flyLineStyle：flyLineStyle //See "config.flyLineStyle" for configuration
> >       }
> >     }
> >   ]
> >   
> >   type === 'point' 
> >   Corresponding data data structure
> >   [
> >     {
> >         id:1,
> >         lon: 112.45, //longitude
> >         lat: 34.62, //Latitude
> >         style:scatterStyle //See "config.scatterStyle" for configuration
> >         ...userData // Other custom fields
> >       }
> >   ]
> >   
> >   ```
> >
> >   The data contains two fields, from and to, which represent the starting and ending points. lon and lat represent the latitude and longitude, respectively. Finally, a flying line with two ripple points is generated。
> >
> >   About the id field: The ids from and to will eventually be concatenated together id=\`${from.id}-${to.id}\` ,or concatenated by latitude and longitude if no id is passed: id = \`${from.lon}${from.lat}-${to.lon}${to.lat}\` this id is used to remove the corresponding type of model
> >
> > - 

> 
>
> ``` javascript
> chart.remove(type,ids)
> ```
>
> > ### **remove parameter explained**
> >
> > - type: Removed data model type, now supports 'flyLine' and 'scatter'
> >
> > - ids: string[] | 'removeAll'
> >
> >   Removes all components of the current type on Earth when ids is 'removeAll'。
> >
> >    When ids are of type string[], the data for the corresponding id on Earth is removed. For example: [ \`${from.id}-${to.id}\` ]  removes the set of flylines associated with the data
> >   
> >   ``` javascript
> >   chart.remove('flyLine',['1-2'])
> >   ```
>

## Event

```javascript
//You can add add handlers through on.
//'click'、'dblclick'、'mousedown'、'mousemove'、'mouseup'、'mouseover'、'mouseout'、'globalout'、'contextmenu'
chart.on("click", (params) => {
  console.log(params)
});

chart.on("mouseover", (params) => {
  chart.options.autoRotate = false;
});
```





## 🚀 Development progress

- [x] The map supports mouse hover highlighting
- [x] Map areas support custom colors
- [x] Support 2D map rendering and fly line highlighting and other functions
- [x] Supports Earth mapping
- [x] It supports the separate addition and deletion of ripple modules and the color and size of scatter modules
- [x] Support fly line more configuration such as speed, number of cycles, etc
- [ ] Logical reconstruction of 2D map flying line drawing (in progress)
- [ ] Support scatter custom image style



## 🛠️ Build

To execute the command in the root directory, you need [Node.js](https://nodejs.org)(v16+) environment.

```bash
# Install the dependencies from NPM:
npm install

# development
npm run dev
```


## 🤗 THANKS

Thanks for the features provided by these awesome projects.

 [tween.js](https://github.com/tweenjs/tween.js/)

 [lodash](https://github.com/lodash/lodash)

 [delaunator](https://github.com/mapbox/delaunator) 
