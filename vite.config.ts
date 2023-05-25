import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import dts from "vite-plugin-dts";
import viteCompression from "vite-plugin-compression";
// https://vitejs.dev/config/
export default defineConfig({
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
    lib: {
      entry: resolve(__dirname, "src/entry.ts"),
      name: "earth-flywire",
      fileName: (format) => `index.${format}.js`,
    },
    minify: "terser",
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
