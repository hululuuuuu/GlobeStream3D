import { InitConfig, Options, StoreConfig } from "@/lib/interface";
import { merge } from "lodash";

class Store {
  mode: "2d" | "3d" = "3d";
  config = {
    ...InitConfig,
  };
  //存储以存在的飞线
  flyLineMap: Record<any, true> = {};
  setConfig(options: Partial<Options>) {
    this.mode = options.mode || "3d";
    this.config = merge({}, this.config, options.config);
  }
  getConfig(): StoreConfig {
    return this.config as StoreConfig;
  }
}
export default Store;
