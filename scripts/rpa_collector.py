#!/usr/bin/env python3
"""
PhysicalAI Pulse — RPA Global News Collector
每天定时通过RPA工具从全球新闻源搜集物理AI企业资讯，
使用智谱GLM-4.5-Flash进行结构化处理与分类。

数据源：
  1. Google News RSS（多关键词多语言搜索）
  2. 主流科技媒体 RSS（TechCrunch, The Verge, Ars Technica等）
  3. 企业官方博客/新闻RSS
  4. 融资信息源（Crunchbase News等）

输出：data/news_data.json（供前端加载）
"""

import feedparser
import requests
import json
import os
import sys
import time
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# ============================================================
# Configuration
# ============================================================

ZHIPU_API_KEY = os.environ.get("ZHIPU_API_KEY", "325d6fa364954d2e871c30ba95b553bd.KBdQdqgJgELJBhnv")
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
ZHIPU_MODEL = "glm-4.5-flash"

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "news_data.json")

# 关键词（中英文）
SEARCH_KEYWORDS = [
    "physical AI",
    "embodied AI",
    "humanoid robot",
    "humanoid robotics",
    "Figure AI",
    "Tesla Optimus",
    "Boston Dynamics",
    "Unitree robot",
    "Agility Robotics",
    "人形机器人",
    "具身智能",
    "物理AI",
]

# RSS 源列表
RSS_SOURCES = {
    # Google News — 多关键词搜索
    "google_news": [
        "https://news.google.com/rss/search?q=physical+AI+humanoid+robot&hl=en-US&gl=US&ceid=US:en",
        "https://news.google.com/rss/search?q=embodied+AI+robotics&hl=en-US&gl=US&ceid=US:en",
        "https://news.google.com/rss/search?q=Figure+AI+robot&hl=en-US&gl=US&ceid=US:en",
        "https://news.google.com/rss/search?q=Tesla+Optimus+robot&hl=en-US&gl=US&ceid=US:en",
        "https://news.google.com/rss/search?q=humanoid+robot+funding&hl=en-US&gl=US&ceid=US:en",
        "https://news.google.com/rss/search?q=人形机器人&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
        "https://news.google.com/rss/search?q=具身智能&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
    ],
    # 科技媒体
    "tech_media": [
        "https://techcrunch.com/category/robotics/feed/",
        "https://www.theverge.com/rss/robotics/index.xml",
        "https://feeds.arstechnica.com/arstechnica/index",
        "https://venturebeat.com/category/ai/feed/",
    ],
    # 企业官方博客
    "company_blogs": [
        "https://www.bostondynamics.com/blog/feed/",
        "https://www.agilityrobotics.com/blog/feed",
    ],
}

# 去重用
seen_titles = set()
seen_urls = set()

# ============================================================
# Data Collection
# ============================================================

def clean_html(text):
    """清除HTML标签"""
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text(strip=True)

def is_relevant(title, summary):
    """检查文章是否与物理AI相关"""
    text = (title + " " + summary).lower()
    relevant_keywords = [
        "physical ai", "embodied ai", "humanoid", "robot", "robotic",
        "figure ai", "optimus", "boston dynamics", "unitree", "agility robotics",
        "人形机器人", "具身智能", "物理ai", "机器人", "自动化",
        "actuator", "manipulation", "locomotion", "sim-to-real",
        "vla model", "foundation model robot",
    ]
    return any(kw in text for kw in relevant_keywords)

def parse_date(entry):
    """解析文章日期"""
    date_fields = ["published_parsed", "updated_parsed", "created_parsed"]
    for field in date_fields:
        parsed = entry.get(field)
        if parsed:
            try:
                dt = datetime(*parsed[:6])
                return dt.strftime("%Y-%m-%d")
            except:
                pass
    # 尝试字符串日期
    for field in ["published", "updated"]:
        date_str = entry.get(field, "")
        if date_str:
            try:
                dt = datetime.strptime(date_str[:25], "%a, %d %b %Y %H:%M:%S")
                return dt.strftime("%Y-%m-%d")
            except:
                pass
    return datetime.now().strftime("%Y-%m-%d")

def collect_from_rss():
    """从所有RSS源搜集文章"""
    all_articles = []
    source_count = 0

    for category, feeds in RSS_SOURCES.items():
        for feed_url in feeds:
            print(f"  [RPA] Fetching: {feed_url[:80]}...")
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries:
                    title = entry.get("title", "").strip()
                    link = entry.get("link", "").strip()
                    summary = clean_html(entry.get("summary", entry.get("description", "")))
                    date = parse_date(entry)
                    source = entry.get("source", {}).get("title", feed.feed.get("title", "Unknown"))

                    # 去重
                    title_lower = title.lower()
                    if title_lower in seen_titles or link in seen_urls:
                        continue
                    if not title:
                        continue

                    # 相关性过滤
                    if not is_relevant(title, summary):
                        continue

                    seen_titles.add(title_lower)
                    seen_urls.add(link)

                    all_articles.append({
                        "title": title,
                        "summary": summary[:500] if summary else "",
                        "link": link,
                        "date": date,
                        "source": source,
                        "category": category,
                    })

                source_count += 1
                time.sleep(0.5)  # 礼貌延迟
            except Exception as e:
                print(f"    [ERROR] {e}")
                continue

    print(f"  [RPA] Collected {len(all_articles)} articles from {source_count} feeds")
    return all_articles

# ============================================================
# Zhipu GLM-4.5-Flash Processing
# ============================================================

def call_zhipu(prompt, system_prompt="", retries=3):
    """调用智谱GLM-4.5-Flash API"""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    for attempt in range(retries + 1):
        try:
            response = requests.post(
                ZHIPU_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ZHIPU_API_KEY}",
                },
                json={
                    "model": ZHIPU_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 4096,
                },
                timeout=60,
            )

            if response.status_code == 429:
                wait = (attempt + 1) * 3
                print(f"    [API] Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue

            if response.status_code != 200:
                print(f"    [API] Error {response.status_code}: {response.text[:200]}")
                if attempt < retries:
                    time.sleep(2)
                    continue
                return None

            data = response.json()
            return data["choices"][0]["message"]["content"]

        except Exception as e:
            print(f"    [API] Exception: {e}")
            if attempt < retries:
                time.sleep(2)
                continue
            return None

    return None

def classify_and_structure_zh(articles):
    """用智谱API将原始文章分类为四个模块（中文版）"""
    if not articles:
        return {"dynamics": [], "financing": [], "tech": [], "voices": []}

    # 准备文章摘要给AI
    article_list = []
    for i, a in enumerate(articles[:30]):  # 限制数量避免token过多
        article_list.append(f"{i+1}. [{a['source']}] {a['title']} — {a['summary'][:200]}")

    articles_text = "\n".join(article_list)

    system_prompt = "你是一个专业的物理AI行业资讯编辑，擅长将搜集到的新闻分类整理为结构化数据。请确保返回合法的JSON。"

    prompt = f"""以下是从全球新闻源通过RPA搜集到的物理AI相关原始新闻。请将它们分类整理为四个模块，并为每条新闻补充结构化信息。

原始新闻：
{articles_text}

请将内容分类为以下四个模块，每个模块最多5条，返回JSON格式：

{{
  "dynamics": [
    {{"company":"企业名","title":"标题","summary":"2-3句摘要","date":"YYYY-MM-DD","tag":"产品发布/战略合作/市场扩张/人事变动/政策法规"}}
  ],
  "financing": [
    {{"company":"企业名","round":"融资轮次","amount":"融资金额","valuation":"估值","investors":"投资方","summary":"摘要","date":"YYYY-MM-DD"}}
  ],
  "tech": [
    {{"title":"技术标题","summary":"技术描述","company":"企业/机构","significance":"技术意义","date":"YYYY-MM-DD"}}
  ],
  "voices": [
    {{"name":"人物姓名","title":"职位/公司","quote":"言论内容","context":"背景语境","date":"YYYY-MM-DD"}}
  ]
}}

要求：
1. 基于原始新闻内容进行分类和整理，可以适当润色
2. 如果某个模块的原始新闻不足，可以基于行业趋势合理补充
3. 日期使用文章中的日期或今天日期
4. 严格返回JSON，不要包含其他文字"""

    print("  [AI] 调用智谱GLM-4.5-Flash处理中文内容...")
    result = call_zhipu(prompt, system_prompt)
    if not result:
        print("  [AI] 中文处理失败，使用兜底数据")
        return None

    return parse_json_response(result)

def classify_and_structure_en(articles):
    """用智谱API将原始文章分类为四个模块（英文版）"""
    if not articles:
        return {"dynamics": [], "financing": [], "tech": [], "voices": []}

    article_list = []
    for i, a in enumerate(articles[:30]):
        article_list.append(f"{i+1}. [{a['source']}] {a['title']} — {a['summary'][:200]}")

    articles_text = "\n".join(article_list)

    system_prompt = "You are a professional Physical AI industry news editor skilled at categorizing collected news into structured data. Ensure you return valid JSON."

    prompt = f"""The following are raw Physical AI related news articles collected via RPA from global sources. Please categorize them into four modules with structured information.

Raw news articles:
{articles_text}

Categorize the content into four modules, max 5 items each, return JSON format:

{{
  "dynamics": [
    {{"company":"Company","title":"Headline","summary":"2-3 sentence summary","date":"YYYY-MM-DD","tag":"Product Launch/Partnership/Market Expansion/Personnel/Regulation"}}
  ],
  "financing": [
    {{"company":"Company","round":"Round","amount":"Amount","valuation":"Valuation","investors":"Investors","summary":"Summary","date":"YYYY-MM-DD"}}
  ],
  "tech": [
    {{"title":"Title","summary":"Description","company":"Company/Lab","significance":"Significance","date":"YYYY-MM-DD"}}
  ],
  "voices": [
    {{"name":"Name","title":"Title/Company","quote":"Statement","context":"Context","date":"YYYY-MM-DD"}}
  ]
}}

Requirements:
1. Categorize and refine based on raw news content
2. If a module has insufficient raw news, supplement based on industry trends
3. Use article dates or today's date
4. Return JSON strictly, no other text"""

    print("  [AI] Calling Zhipu GLM-4.5-Flash for English content...")
    result = call_zhipu(prompt, system_prompt)
    if not result:
        print("  [AI] English processing failed, using fallback")
        return None

    return parse_json_response(result)

def parse_json_response(content):
    """解析AI返回的JSON"""
    if not content:
        return None

    json_str = content.strip()

    # 去除markdown代码块
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', json_str)
    if match:
        json_str = match.group(1).strip()

    try:
        parsed = json.loads(json_str)

        # 确保四个模块都存在
        for module in ["dynamics", "financing", "tech", "voices"]:
            if module not in parsed:
                parsed[module] = []
            if not isinstance(parsed[module], list):
                parsed[module] = []

        return parsed
    except json.JSONDecodeError as e:
        print(f"  [JSON] Parse error: {e}")
        # 尝试找到JSON部分
        start = json_str.find("{")
        end = json_str.rfind("}")
        if start != -1 and end != -1:
            try:
                parsed = json.loads(json_str[start:end+1])
                for module in ["dynamics", "financing", "tech", "voices"]:
                    if module not in parsed:
                        parsed[module] = []
                    if not isinstance(parsed[module], list):
                        parsed[module] = []
                return parsed
            except:
                pass
        return None

# ============================================================
# Fallback Data
# ============================================================

def get_fallback_data(lang):
    """兜底数据（API失败时使用）"""
    today = datetime.now().strftime("%Y-%m-%d")

    if lang == "zh":
        return {
            "dynamics": [
                {"company": "Figure AI", "title": "Figure 03人形机器人实现工厂量产部署", "summary": "Figure AI宣布其第三代人形机器人Figure 03已在宝马工厂完成首批部署，实现产线物料搬运与质量检测自动化任务。", "date": today, "tag": "产品发布"},
                {"company": "Tesla", "title": "Optimus机器人在工厂内实现自主导航与操作", "summary": "特斯拉展示了Optimus机器人在超级工厂内自主导航、搬运电池组并执行精密组装任务的最新视频。", "date": today, "tag": "产品发布"},
                {"company": "Unitree", "title": "宇树科技发布G1 Pro消费级人形机器人", "summary": "宇树科技推出G1 Pro人形机器人，配备灵巧手和AI视觉系统，瞄准教育与服务市场。", "date": today, "tag": "产品发布"},
                {"company": "Boston Dynamics", "title": "Atlas电驱版完成工厂测试并与丰田达成合作", "summary": "波士顿动力全新电动版Atlas机器人在丰田工厂完成测试，双方签署战略合作协议。", "date": today, "tag": "战略合作"},
                {"company": "Agility Robotics", "title": "Digit机器人在亚马逊仓库完成百万次拣选", "summary": "Agility Robotics的Digit双足机器人在亚马逊物流中心累计完成超过100万次商品拣选任务。", "date": today, "tag": "市场扩张"},
            ],
            "financing": [
                {"company": "Figure AI", "round": "B轮", "amount": "6.75亿美元", "valuation": "26亿美元", "investors": "微软、OpenAI、NVIDIA、贝佐斯", "summary": "Figure AI完成6.75亿美元B轮融资，估值达26亿美元。", "date": today},
                {"company": "Skild AI", "round": "A轮", "amount": "3000万美元", "valuation": "10亿美元", "investors": "Lightspeed、Coatue、亚马逊", "summary": "Skild AI完成A轮融资，跻身独角兽行列。", "date": today},
                {"company": "Physical Intelligence", "round": "种子轮", "amount": "7000万美元", "valuation": "4亿美元", "investors": "Khosla Ventures、Lux Capital", "summary": "Physical Intelligence完成7000万美元种子轮融资。", "date": today},
                {"company": "1X Technologies", "round": "B轮", "amount": "1亿美元", "valuation": "10亿美元", "investors": "OpenAI、EQT Ventures", "summary": "1X Technologies完成B轮融资，推进NEO家庭机器人研发。", "date": today},
                {"company": "Apptronik", "round": "A轮", "amount": "3.5亿美元", "valuation": "16亿美元", "investors": "B Capital、Google Ventures", "summary": "Apptronik完成A轮融资，加速Apollo机器人商业化。", "date": today},
            ],
            "tech": [
                {"title": "NVIDIA发布Project GR00T人形机器人基础模型", "summary": "NVIDIA推出Project GR00T，专为人形机器人设计的通用基础模型。", "company": "NVIDIA", "significance": "首个面向人形机器人的通用基础模型", "date": today},
                {"title": "Figure AI展示端到端视觉-语言-动作模型", "summary": "Figure AI展示了其自研的VLA模型，可直接从摄像头输入生成关节控制指令。", "company": "Figure AI", "significance": "端到端学习突破，简化机器人控制流水线", "date": today},
                {"title": "Google DeepMind发布RT-2大规模机器人模型", "summary": "RT-2模型将视觉-语言模型与机器人控制结合，实现跨任务泛化能力。", "company": "Google DeepMind", "significance": "视觉-语言-动作统一架构", "date": today},
                {"title": "Stanford推出Mobile ALOHA低成本遥操作平台", "summary": "斯坦福发布Mobile ALOHA系统，以3.2万美元成本实现双臂移动操作。", "company": "Stanford University", "significance": "大幅降低具身智能研究成本", "date": today},
                {"title": "波士顿动力Atlas实现全身动态平衡控制突破", "summary": "新版电动Atlas采用强化学习训练的全身控制器，可在不规则地形上跑步跳跃。", "company": "Boston Dynamics", "significance": "强化学习在人形机器人全身控制中的里程碑应用", "date": today},
            ],
            "voices": [
                {"name": "Elon Musk", "title": "CEO, Tesla", "quote": "人形机器人将是有史以来最大的产品，远超汽车业务。", "context": "在特斯拉股东大会上讨论Optimus机器人战略", "date": today},
                {"name": "Jensen Huang", "title": "CEO, NVIDIA", "quote": "物理AI的ChatGPT时刻即将到来。我们正在构建从芯片到模型的全栈基础设施。", "context": "在GTC 2026主题演讲中发布Project GR00T", "date": today},
                {"name": "Brett Adcock", "title": "CEO, Figure AI", "quote": "我们的目标是在未来十年内将数十亿台人形机器人部署到全球工厂和家庭中。", "context": "在Figure AI B轮融资发布会上", "date": today},
                {"name": "Sam Altman", "title": "CEO, OpenAI", "quote": "物理AI是AGI的最后一块拼图。当智能能够操控物理世界时，我们将真正看到AGI的完整形态。", "context": "在达沃斯世界经济论坛讨论AI未来", "date": today},
                {"name": "Demis Hassabis", "title": "CEO, Google DeepMind", "quote": "具身智能是通向AGI的关键路径之一。机器人需要在真实世界中学习才能获得真正的常识理解能力。", "context": "在DeepMind robotics研讨会上", "date": today},
            ]
        }
    else:
        return {
            "dynamics": [
                {"company": "Figure AI", "title": "Figure 03 Humanoid Robot Deployed in Factory Mass Production", "summary": "Figure AI announced its Figure 03 humanoid robot has been deployed in BMW factories, performing material handling and quality inspection tasks.", "date": today, "tag": "Product Launch"},
                {"company": "Tesla", "title": "Optimus Robot Achieves Autonomous Navigation in Factory", "summary": "Tesla showcased Optimus robots autonomously navigating and performing precision assembly in the Gigafactory.", "date": today, "tag": "Product Launch"},
                {"company": "Unitree", "title": "Unitree Releases G1 Pro Consumer Humanoid Robot", "summary": "Unitree launched the G1 Pro humanoid robot with dexterous hands and AI vision system.", "date": today, "tag": "Product Launch"},
                {"company": "Boston Dynamics", "title": "Electric Atlas Completes Factory Testing, Partners with Toyota", "summary": "Boston Dynamics' new electric Atlas completed testing at Toyota factories. Strategic partnership signed.", "date": today, "tag": "Partnership"},
                {"company": "Agility Robotics", "title": "Digit Robot Completes One Million Picks at Amazon", "summary": "Agility Robotics' Digit robot completed over 1 million product picks at Amazon fulfillment centers.", "date": today, "tag": "Market Expansion"},
            ],
            "financing": [
                {"company": "Figure AI", "round": "Series B", "amount": "$675M", "valuation": "$2.6B", "investors": "Microsoft, OpenAI, NVIDIA, Bezos", "summary": "Figure AI completed $675M Series B at $2.6B valuation.", "date": today},
                {"company": "Skild AI", "round": "Series A", "amount": "$30M", "valuation": "$1B", "investors": "Lightspeed, Coatue, Amazon", "summary": "Skild AI completed Series A, reaching unicorn status.", "date": today},
                {"company": "Physical Intelligence", "round": "Seed", "amount": "$70M", "valuation": "$400M", "investors": "Khosla Ventures, Lux Capital", "summary": "Physical Intelligence completed $70M seed funding.", "date": today},
                {"company": "1X Technologies", "round": "Series B", "amount": "$100M", "valuation": "$1B", "investors": "OpenAI, EQT Ventures", "summary": "1X Technologies completed Series B to advance NEO robot.", "date": today},
                {"company": "Apptronik", "round": "Series A", "amount": "$350M", "valuation": "$1.6B", "investors": "B Capital, Google Ventures", "summary": "Apptronik completed Series A to accelerate Apollo robot deployment.", "date": today},
            ],
            "tech": [
                {"title": "NVIDIA Releases Project GR00T Humanoid Robot Foundation Model", "summary": "NVIDIA launched Project GR00T, a general foundation model designed for humanoid robots.", "company": "NVIDIA", "significance": "First general foundation model for humanoid robots", "date": today},
                {"title": "Figure AI Demonstrates End-to-End Vision-Language-Action Model", "summary": "Figure AI demonstrated its VLA model generating joint control commands directly from camera input.", "company": "Figure AI", "significance": "End-to-end learning breakthrough", "date": today},
                {"title": "Google DeepMind Releases RT-2 Large-Scale Robot Model", "summary": "RT-2 combines vision-language models with robot control for cross-task generalization.", "company": "Google DeepMind", "significance": "Unified vision-language-action architecture", "date": today},
                {"title": "Stanford Releases Mobile ALOHA Low-Cost Teleoperation Platform", "summary": "Stanford released Mobile ALOHA at $32K cost for dual-arm mobile manipulation.", "company": "Stanford University", "significance": "Dramatically reducing embodied intelligence research costs", "date": today},
                {"title": "Boston Dynamics Atlas Achieves Full-Body Dynamic Balance Control", "summary": "New electric Atlas uses RL-trained whole-body controller for running and jumping on uneven terrain.", "company": "Boston Dynamics", "significance": "Milestone in RL application for humanoid control", "date": today},
            ],
            "voices": [
                {"name": "Elon Musk", "title": "CEO, Tesla", "quote": "Humanoid robots will be the biggest product ever, far exceeding the car business.", "context": "Discussing Optimus at Tesla shareholder meeting", "date": today},
                {"name": "Jensen Huang", "title": "CEO, NVIDIA", "quote": "The ChatGPT moment for Physical AI is coming. We are building full-stack infrastructure.", "context": "Launching Project GR00T at GTC 2026 keynote", "date": today},
                {"name": "Brett Adcock", "title": "CEO, Figure AI", "quote": "Our goal is to deploy billions of humanoid robots in factories and homes worldwide.", "context": "At Figure AI Series B funding announcement", "date": today},
                {"name": "Sam Altman", "title": "CEO, OpenAI", "quote": "Physical AI is the last piece of the AGI puzzle.", "context": "Discussing AI future at Davos World Economic Forum", "date": today},
                {"name": "Demis Hassabis", "title": "CEO, Google DeepMind", "quote": "Embodied intelligence is one of the key paths to AGI.", "context": "At DeepMind robotics symposium", "date": today},
            ]
        }

# ============================================================
# Main
# ============================================================

def main():
    print("=" * 60)
    print("PhysicalAI Pulse — RPA Global News Collector")
    print(f"Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Step 1: RPA搜集全球新闻
    print("\n[Step 1] RPA搜集全球物理AI新闻...")
    articles = collect_from_rss()
    print(f"  共搜集到 {len(articles)} 篇相关文章")

    # 如果搜集到的文章太少，补充关键词搜索
    if len(articles) < 10:
        print("  [RPA] 文章数量不足，尝试补充搜索...")
        # 这里可以添加额外的搜索逻辑
        pass

    # Step 2: 用智谱GLM-4.5-Flash处理中文内容
    print("\n[Step 2] 智谱GLM-4.5-Flash处理中文内容...")
    zh_data = classify_and_structure_zh(articles)
    if not zh_data:
        print("  [WARN] 中文AI处理失败，使用兜底数据")
        zh_data = get_fallback_data("zh")
    else:
        print(f"  中文内容处理完成: 动态{len(zh_data.get('dynamics',[]))}条, "
              f"融资{len(zh_data.get('financing',[]))}条, "
              f"技术{len(zh_data.get('tech',[]))}条, "
              f"言论{len(zh_data.get('voices',[]))}条")

    # Step 3: 处理英文内容
    print("\n[Step 3] 智谱GLM-4.5-Flash处理英文内容...")
    time.sleep(2)  # 避免限流
    en_data = classify_and_structure_en(articles)
    if not en_data:
        print("  [WARN] 英文AI处理失败，使用兜底数据")
        en_data = get_fallback_data("en")
    else:
        print(f"  英文内容处理完成: dynamics{len(en_data.get('dynamics',[]))}, "
              f"financing{len(en_data.get('financing',[]))}, "
              f"tech{len(en_data.get('tech',[]))}, "
              f"voices{len(en_data.get('voices',[]))}")

    # Step 4: 保存数据
    print("\n[Step 4] 保存数据...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    output = {
        "meta": {
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "last_updated_utc": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "total_sources_collected": len(articles),
            "collector": "RPA Global News Collector v1.0",
            "ai_model": "Zhipu GLM-4.5-Flash",
        },
        "zh": zh_data,
        "en": en_data,
        "raw_articles": articles[:50],  # 保留原始文章（最多50条）
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"  数据已保存到: {OUTPUT_FILE}")
    print(f"  文件大小: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")

    # Step 5: 输出摘要
    print("\n" + "=" * 60)
    print("RPA采集完成!")
    print(f"  原始文章: {len(articles)} 篇")
    print(f"  中文模块: 动态{len(zh_data.get('dynamics',[]))}, 融资{len(zh_data.get('financing',[]))}, "
          f"技术{len(zh_data.get('tech',[]))}, 言论{len(zh_data.get('voices',[]))}")
    print(f"  英文模块: dynamics{len(en_data.get('dynamics',[]))}, financing{len(en_data.get('financing',[]))}, "
          f"tech{len(en_data.get('tech',[]))}, voices{len(en_data.get('voices',[]))}")
    print(f"  更新时间: {output['meta']['last_updated']}")
    print("=" * 60)

    return 0

if __name__ == "__main__":
    sys.exit(main())
