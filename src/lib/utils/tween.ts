import * as TWEEN from "@tweenjs/tween.js";
import { merge } from "lodash-es";
export function setTween(
  from: Record<any, any>,
  to: Record<any, any>,
  cb: (params: Record<any, any>) => void,
  config?: Record<any, any>
) {
  const myConfig = {
    duration: 2000,
    delay: 0,
    repeat: Infinity,
  };
  merge(myConfig, config);
  const ro = new TWEEN.Tween(from); //创建tween动画实例
  ro.to(to, myConfig.duration); //变化后的对象以及动画持续时间
  ro.delay(myConfig.delay);
  ro.easing(TWEEN.Easing.Linear.None); //动画缓动函数
  ro.onUpdate(function (e: Record<any, any>) {
    cb(e);
  }); //执行回调
  ro.start();
  ro.repeat(myConfig.repeat);
  if (config && config.onComplete) {
    ro.onComplete(() => {
      config.onComplete(config.data);
    });
  }

  return ro;
}
