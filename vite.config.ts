import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import dts from "vite-plugin-dts";
import viteCompression from "vite-plugin-compression";
// https://vitejs.dev/config/
export default ({ mode }) => {
  const libConfig = {};
  if (mode === "lib") {
    Object.assign(libConfig, {
      outDir: "dist",
      lib: {
        entry: resolve(__dirname, "src/entry.ts"),
        name: "earthFlyLine",
        fileName: (format) => `index.${format}.js`,
      },
    });
  } else {
    Object.assign(libConfig, {
      outDir: "docs",
    });
  }
  return defineConfig({
    server: {
      open: true,
      host: "0.0.0.0",
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "src"),
        },
      ],
    },
    build: {
      ...libConfig,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    css: {
      // 指定传递给 CSS 预处理器的选项; 文件扩展名用作选项的键
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    plugins: [
      dts({
        outputDir: ["dist"],
      }),
      vue(),
      vueJsx(),
      viteCompression(),
    ],
  });
};
