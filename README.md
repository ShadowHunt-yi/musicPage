# 云音乐播放器 - Cloudflare Worker 版本

这是一个基于Cloudflare Worker的在线音乐播放器，可以搜索和播放来自多个音乐平台的歌曲。

## 功能特点

- 支持多个音乐平台搜索（网易云音乐、QQ音乐、酷我音乐等）
- 播放音乐，支持播放控制（播放/暂停、上一首/下一首）
- 显示歌词并自动滚动高亮
- 音频可视化效果
- 支持下载音乐和歌词
- 支持解析网易云歌单
- 响应式设计，适配不同设备

## 部署说明

### 前提条件

- 安装 [Node.js](https://nodejs.org/) (版本 14 或更高)
- 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 部署步骤

1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

2. 登录到你的 Cloudflare 账户

```bash
wrangler login
```

3. 部署 Worker

```bash
wrangler publish
```

4. 访问你的 Worker URL

部署成功后，Wrangler 会提供一个 URL，通常格式为 `https://music-player.<your-subdomain>.workers.dev`

## 本地开发

1. 启动本地开发服务器

```bash
wrangler dev
```

2. 在浏览器中访问 `http://localhost:8787`

## 项目结构

- `worker.js` - Cloudflare Worker 主代码文件，包含 HTML 内容和 API 处理逻辑
- `wrangler.toml` - Wrangler 配置文件
- `index.html` - 原始 HTML 文件（仅作参考，实际部署使用的是 worker.js 中的内容）

## 注意事项

- 此项目使用的 API 来自 `https://music-api.gdstudio.xyz/api.php`，如果 API 服务不可用，播放器将无法正常工作
- Worker 作为代理转发 API 请求，避免了跨域问题
- 音频可视化功能需要浏览器支持 Web Audio API

## 许可证

MIT