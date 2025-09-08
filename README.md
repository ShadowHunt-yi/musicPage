# 🎵 云音乐播放器 - Vue.js SPA版本

基于 **Vue.js 3** 和 **Cloudflare Worker** 构建的现代化单页面音乐播放器应用，支持多平台音乐搜索和在线播放。

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## ✨ 功能特点

### 🎶 音乐功能
- **多平台搜索** - 支持网易云音乐、QQ音乐、酷我音乐、酷狗音乐、咪咕音乐等
- **在线播放** - 高质量音乐播放，支持多种音质选择
- **播放控制** - 播放/暂停、上一首/下一首、进度控制
- **歌词显示** - 实时歌词同步高亮显示
- **专辑封面** - 动态获取和显示专辑封面

### 🚀 技术特性
- **Vue.js 3** - 使用最新的 Composition API 构建
- **SPA架构** - 单页面应用，流畅的用户体验
- **组件化设计** - 模块化组件，便于维护和扩展
- **状态管理** - 使用 Pinia 进行全局状态管理
- **响应式设计** - 完美适配桌面端和移动端
- **现代化UI** - 美观的界面设计和流畅的动画效果

### 🛠️ 工程化特性
- **边缘计算** - 基于 Cloudflare Worker 部署
- **零配置部署** - 无需服务器，一键部署
- **CDN加速** - 全球CDN加速访问
- **CORS处理** - 自动处理跨域请求
- **缓存优化** - 智能资源缓存策略

## 🚀 快速开始

### 📋 前提条件

- 安装 [Node.js](https://nodejs.org/) (版本 16 或更高)
- 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- 拥有 [Cloudflare](https://cloudflare.com/) 账户

### 🔧 部署步骤

1. **克隆项目**
```bash
git clone <your-repo-url>
cd musicPage
```

2. **安装 Wrangler CLI**
```bash
npm install -g wrangler
```

3. **登录到 Cloudflare**
```bash
wrangler login
```

4. **配置 Worker 名称**
编辑 `wrangler.toml` 文件中的 `name` 字段：
```toml
name = "your-music-player"  # 修改为你想要的名称
```

5. **部署到 Cloudflare Workers**
```bash
wrangler publish
```

6. **访问你的应用**
部署成功后，访问 `https://your-music-player.<your-subdomain>.workers.dev`

### 🎉 完成！
你的Vue.js音乐播放器现在已经在全球CDN上运行了！

## 💻 本地开发

### 开发环境设置

1. **启动本地开发服务器**
```bash
wrangler dev
```

2. **访问本地应用**
在浏览器中打开 `http://localhost:8787`

3. **实时开发**
修改 `worker.js` 文件，保存后自动重新加载

### 开发技巧
- 使用浏览器开发者工具调试Vue应用
- 查看Network面板监控API请求
- 使用Vue DevTools扩展调试组件状态

## 📁 项目结构

```
musicPage/
├── worker.js          # 🎯 主要文件：包含完整的Vue.js SPA应用
│   ├── 应用配置        # APP_CONFIG - 应用基本配置
│   ├── HTML模板        # BASE_HTML - 基础HTML结构
│   ├── CSS样式         # APP_STYLES - 完整的样式定义
│   ├── Vue.js应用      # VUE_APP - Vue应用代码
│   │   ├── Pinia状态管理    # 全局状态管理
│   │   ├── 音乐API服务      # 音乐搜索、播放等API
│   │   ├── 通知服务         # 用户交互反馈
│   │   ├── Vue组件          # HomePage、Player、Lyrics等
│   │   └── 路由配置         # Vue Router配置
│   └── Worker处理函数   # Cloudflare Worker请求处理
├── wrangler.toml      # 📝 Wrangler配置文件
├── index.html         # 📄 原始HTML文件（参考用）
└── README.md          # 📖 项目文档
```

## 🏗️ 技术架构

### 前端架构
```
Vue.js 3 (Composition API)
├── Vue Router 4        # 客户端路由
├── Pinia              # 状态管理
├── 组件系统
│   ├── HomePage       # 主页和搜索
│   ├── PlayerComponent # 音乐播放器
│   ├── LyricsComponent # 歌词显示
│   └── NotificationComponent # 通知系统
└── 服务层
    ├── useMusicAPI    # 音乐API服务
    └── useNotification # 通知服务
```

### 后端架构
```
Cloudflare Worker
├── 静态资源服务        # CSS、JS文件服务
├── API代理服务         # 音乐API请求代理
├── CORS处理           # 跨域请求处理
└── SPA路由支持        # 单页面应用路由
```

## ⚠️ 注意事项

- **API依赖**: 项目使用 `https://music-api.gdstudio.xyz/api.php` 提供音乐数据
- **浏览器兼容**: 需要支持ES6+和Web Audio API的现代浏览器  
- **网络环境**: 需要能够访问音乐API和CDN资源
- **CORS处理**: Worker自动处理跨域问题，无需额外配置

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- [Font Awesome](https://fontawesome.com/) - 图标库
- 音乐API提供方