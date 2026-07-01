# PhysicalAI Pulse | 全球物理AI企业资讯平台

> 实时动态发布全球物理AI（Physical AI / Embodied AI）企业资讯的平台，由智谱 GLM-4.5-Flash 驱动。

## 功能模块

- **企业最新动态** — 全球物理AI企业产品发布、合作与战略动向
- **融资与估值** — 物理AI领域最新融资轮次、估值变动与投资动向
- **物理AI技术突破** — 具身智能、机器人学习、感知与控制等前沿技术进展
- **科技界大佬言论** — 全球科技领袖对物理AI与具身智能的最新观点与洞察

## 特性

- 中英文双语支持（一键切换）
- 智谱 GLM-4.5-Flash 实时AI内容生成
- Neo-Industrial 科技控制台风格设计
- 响应式布局，支持桌面/平板/手机
- 模块化导航与筛选
- 实时时钟与数据统计

## 技术栈

- 纯原生 HTML/CSS/JS（无框架依赖）
- 智谱 GLM-4.5-Flash API
- Google Fonts (Chakra Petch + Outfit + JetBrains Mono)
- GitHub Pages 部署

## 本地运行

```bash
cd physai-platform
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 项目结构

```
physai-platform/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── i18n.js         # 国际化（中英文翻译）
│   ├── api.js          # 智谱GLM-4.5-Flash API集成
│   └── app.js          # 主应用逻辑
└── README.md
```

## License

MIT
