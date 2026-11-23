# 组件发布规范

组件仓库和配套文档仓库默认直接推送 `main`。开始修改前运行 `git switch main` 和 `git pull --ff-only origin main`，验证改动后提交并运行 `git push origin main`。若远端已有新提交，先同步并重新验证，再正常推送。需要协作评审或分支规则要求时才创建 PR。

把组件代码推送到 GitHub 的 `main` 后，本次交付还包括在本地构建 `earth-flyline`、发布到公共 npm 仓库，并核对远端包。负责推送的维护者或编码代理负责完成这条流程。

1. 推送前按改动选择符合语义化版本的新版本号，同时更新 `package.json` 和 `package-lock.json`。修复问题可运行 `npm version patch --no-git-tag-version`，新增向后兼容的功能时使用 `minor`。版本变更随代码合入。
2. 推送后从与远端 `main` 对应的干净提交，在组件仓库根目录执行下列命令。保存 `npm pack --json` 输出的 `filename` 和 `integrity`，核对文件清单包含 `dist/index.es.js`、`dist/index.umd.js`、`dist/entry.d.ts` 以及入口引用的类型声明。
3. 将已核对的本地 `.tgz` 原样发布。以下命令用于稳定版，预发布版使用对应的预发布标签。发布后核对 npm 返回的版本、完整性摘要和分发标签。
4. 重试时先查询目标版本。若远端摘要与本地包一致，则复用已有发布结果并核对标签。若同一版本已对应其他内容，则更新版本号，推送后重新构建。如果某一步失败，记录失败原因，并保留已生成的包供重试。远端核对通过后再报告发布完成。

### 本地构建与打包

```sh
npm run lib
npm pack --json
```

### 发布稳定版并核对 npm

```sh
version=$(node -p "require('./package.json').version")
archive="./earth-flyline-${version}.tgz"
registry=https://registry.npmjs.org/

npm publish "$archive" --registry="$registry" --tag latest
npm view "earth-flyline@$version" version dist.integrity --registry="$registry"
npm view earth-flyline dist-tags.latest --registry="$registry"
```

交付说明列出 Git 提交、npm 版本和本地包路径。组件功能发布后，配套使用文档同步更新可用版本和示例。
