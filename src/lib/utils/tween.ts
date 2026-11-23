import { Group, Tween } from "@tweenjs/tween.js";
import type { Object3D } from "three";
import type { TweenConfig } from "@/lib/interface";

type Values = Record<string, any>;

export class SceneAnimations extends Group {
  private readonly byOwner = new WeakMap<Object3D, Set<Tween<Values>>>();
  disposed = false;

  setTween(
    owner: Object3D,
    from: Values,
    to: Values,
    update: (values: Values) => void,
    config: TweenConfig & { data?: unknown } = {}
  ) {
    if (this.disposed) return;
    const tweens = this.byOwner.get(owner) ?? new Set<Tween<Values>>();
    const tween = new Tween(from, this)
      .to(to, config.duration ?? 2000)
      .delay(config.delay ?? 0)
      .repeat(config.repeat ?? Infinity)
      .onUpdate(update);
    const release = () => {
      tweens.delete(tween);
      if (!tweens.size) this.byOwner.delete(owner);
    };
    tween.onStop(release).onComplete(() => {
      release();
      config.onComplete?.(config.data);
    });
    tweens.add(tween);
    this.byOwner.set(owner, tweens);
  }

  // A failed or discarded build never enters the instance's update group.
  startLayer(layer: Object3D) {
    if (this.disposed) return;
    layer.traverse(owner => this.byOwner.get(owner)?.forEach(tween => tween.start()));
  }

  stopLayer(layer: Object3D) {
    layer.traverse(owner => {
      this.byOwner.get(owner)?.forEach(tween => tween.stop());
      this.byOwner.delete(owner);
    });
  }

  dispose() {
    this.disposed = true;
    this.getAll().forEach(tween => tween.stop());
  }
}
