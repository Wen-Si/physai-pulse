# PhysicalAI Pulse | 全球物理AI企业资讯平台

> 实时动态发布全球物理AI（Physical AI / Embodied AI）企业资讯的平台，由智谱 GLM-4.5-Flash 驱动，RPA每日定时全球采集。

## 功能模块

- **企业最新动态** — 全球物理AI企业产品发布、合作与战略动向
- **融资与估值** — 物理AI领域最新融资轮次、估值变动与投资动向
- **物理AI技术突破** — 具身智能、机器人学习、感知与控制等前沿技术进展
- **科技界大佬言论** — 全球科技领袖对物理AI与具身智能的最新观点与洞察

## 数据采集架构

平台采用 **RPA + AI 双层数据架构**：

```
┌─────────────────────────────────────────────────┐
│              GitHub Actions (每日定时)            │
│                                                   │
│  ┌─────────────┐    ┌──────────────────────────┐ │
│  │  RPA 采集器  │───▶│  智谱 GLM-4.5-Flash     │ │
│  │             │    │  结构化处理 (中/英)      │ │
│  │ • Google News│   │                          │ │
│  │ • TechCrunch │   │  • 分类: 动态/融资/技术/  │ │
│  │ • The Verge  │   │    言论                  │ │
│  │ • RSS订阅源  │   │  • 润色 & 摘要           │ │
│  │ • 企业博客   │   │  • 中英文双语输出         │ │
│  └─────────────┘    └───────────┬──────────────┘ │
│                                  ▼                │
│                      data/news_data.json          │
│                      (自动提交到仓库)              │
└──────────────────────────────────┬────────────────┘
                                   ▼
┌─────────────────────────────────────────────────┐
│              前端 (GitHub Pages)                  │
│                                                   │
│  1. 优先加载 data/news_data.json (RPA采集数据)    │
│  2. 显示 "RPA已更新" 徽章 + 最后采集时间           │
│  3. 用户可点击"AI生成"实时调用智谱API生成新内容    │
│  4. 中英文一键切换                                │
└─────────────────────────────────────────────────┘
```

### RPA数据源

| 数据源 | 类型 | 覆盖内容 |
|--------|------|----------|
| Google News RSS | 多关键词多语言搜索 | physical AI, humanoid robot, 人形机器人, 具身智能等 |
| TechCrunch | 科技媒体 RSS | 机器人行业新闻 |
| The Verge | 科技媒体 RSS | 机器人版块 |
| Ars Technica | 科技媒体 RSS | AI/机器人技术报道 |
| VentureBeat | 科技媒体 RSS | AI行业新闻 |
| Boston Dynamics Blog | 企业官方博客 | 产品更新 |
| Agility Robotics Blog | 企业官方博客 | 产品更新 |

### 定时采集

- **运行时间**: 每天北京时间 08:00（UTC 00:00）
- **运行方式**: GitHub Actions cron 定时触发
- **支持手动触发**: 在 GitHub 仓库 Actions 页面手动运行
- **采集流程**: RPA搜集原始新闻 → 智谱GLM-4.5-Flash结构化处理 → 自动提交到仓库

## 特性

- **RPA每日定时全球采集** — 从多源RSS搜集物理AI最新资讯
- **中英文双语支持** — 一键切换，RPA数据双语并行输出
- **智谱GLM-4.5-Flash** — AI结构化处理 + 用户实时生成
- **Neo-Industrial科技控制台风格** — 深色主题、网格背景、实时时钟
- **响应式布局** — 支持桌面/平板/手机
- **RPA更新徽章** — 显示最后采集日期

## 技术栈

- **前端**: 纯原生 HTML/CSS/JS（无框架依赖）
- **AI**: 智谱 GLM-4.5-Flash API
- **RPA采集**: Python + feedparser + requests + BeautifulSoup4
- **CI/CD**: GitHub Actions（定时RPA采集 + GitHub Pages部署）
- **字体**: Google Fonts (Chakra Petch + Outfit + JetBrains Mono)

## 本地运行

```bash
cd physai-platform
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 手动运行RPA采集

```bash
cd physai-platform
pip install -r scripts/requirements.txt
export ZHIPU_API_KEY="your-api-key"
python scripts/rpa_collector.py
# 数据将保存到 data/news_data.json
```

## GitHub Secrets 配置

在仓库 Settings → Secrets and variables → Actions 中设置：

| Secret名称 | 值 |
|------------|-----|
| `ZHIPU_API_KEY` | 智谱API密钥 |

## 项目结构

```
physai-platform/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── i18n.js             # 国际化（中英文翻译）
│   ├── api.js              # 智谱API集成 + RPA数据加载
│   └── app.js              # 主应用逻辑
├── scripts/
│   ├── rpa_collector.py    # RPA全球新闻采集器
│   └── requirements.txt    # Python依赖
├── data/
│   └── news_data.json      # RPA采集的结构化数据（自动生成）
├── .github/
│   └── workflows/
│       └── daily-collect.yml  # GitHub Actions定时工作流
└── README.md
```

## License

MIT
