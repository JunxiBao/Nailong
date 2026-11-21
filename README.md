# 奶龙游乐园

三款奶龙游戏的独立静态主页，延续暖黄色、奶油色和圆润卡通风格。点击游戏卡片即可进入正式线上游戏：

| 游戏 | 正式地址 |
| --- | --- |
| 奶龙消消乐 | https://nailong-match3.junxibao.com |
| 奶龙大冒险 | https://nailong-mario.junxibao.com |
| 奶龙跑酷 | https://nailong-parkour.junxibao.com |

主页不依赖其他游戏项目目录，游戏和在线排行榜由各自的正式站点提供。

## 查看主页

可以直接用浏览器打开 `index.html` 查看主页，游戏卡片使用 HTTPS 地址，进入游戏需要联网。

也可使用 Node.js 20 或更新版本，在本目录运行：

```bash
npm run dev
```

打开 **http://127.0.0.1:8787/**。主页没有 npm 依赖，无需安装。macOS 可双击 `启动奶龙游乐园.command` 启动服务，然后自行在可用浏览器中输入地址；脚本不会自动打开浏览器。

端口被占用时，可使用 `PORT=8788 npm run dev`。按 `Ctrl+C` 停止。

## 静态发布

```bash
npm run build
npm run preview
```

构建只将 `index.html`、`css/`、`js/` 和 `assets/` 复制到 `dist/`，不读取、构建或复制其他游戏。`npm run preview` 在同一本地地址预览构建结果。

将整个 `dist/` 上传至任意静态站点服务即可。也可直接发布主页源文件及三个资源目录，无需配置后端。

角色图片已包含在 `assets/` 中。可选的 `scripts/export-art.cjs` 仅用于重新生成角色素材，需要相邻的 `NAILONG_ADVENTURE` 或 `NAILONG_A Adventure` 项目；正常运行、构建和发布无需执行该脚本。
