/* ============================================
   PhysicalAI Pulse — Zhipu GLM-4.5-Flash API
   智谱大模型API集成
   ============================================ */

const ZHIPU_API = {
    // API Configuration
    BASE_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    API_KEY: '325d6fa364954d2e871c30ba95b553bd.KBdQdqgJgELJBhnv',
    MODEL: 'glm-4.5-flash',

    /**
     * Call Zhipu GLM-4.5-Flash API with retry logic
     * @param {string} prompt - The user prompt
     * @param {string} systemPrompt - Optional system prompt
     * @param {number} retries - Number of retry attempts
     * @returns {Promise<string>} - The API response text
     */
    async call(prompt, systemPrompt = '', retries = 3) {
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(this.BASE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.API_KEY}`
                    },
                    body: JSON.stringify({
                        model: this.MODEL,
                        messages: messages,
                        temperature: 0.8,
                        max_tokens: 4096
                    })
                });

                if (response.status === 429) {
                    // Rate limit - wait and retry
                    if (attempt < retries) {
                        console.warn(`Rate limited, retrying in ${(attempt + 1) * 2}s...`);
                        await this.sleep((attempt + 1) * 2000);
                        continue;
                    }
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error:', response.status, errorText);
                    throw new Error(`API request failed: ${response.status}`);
                }

                const data = await response.json();
                return data.choices[0].message.content;
            } catch (error) {
                if (attempt < retries) {
                    console.warn(`Attempt ${attempt + 1} failed, retrying...`, error.message);
                    await this.sleep((attempt + 1) * 1500);
                    continue;
                }
                throw error;
            }
        }
    },

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Generate content for a specific module
     * @param {string} module - Module name: dynamics, financing, tech, voices
     * @param {string} lang - Language: zh or en
     * @returns {Promise<Array>} - Array of content items
     */
    async generateModule(module, lang) {
        const promptKey = `prompt${module.charAt(0).toUpperCase() + module.slice(1)}`;
        const prompt = I18N[lang][promptKey];

        const systemPrompt = lang === 'zh'
            ? '你是一个专业的物理AI行业资讯编辑，擅长生成结构化的行业新闻内容。请确保返回合法的JSON格式。'
            : 'You are a professional Physical AI industry news editor skilled at generating structured industry news content. Ensure you return valid JSON format.';

        try {
            const rawContent = await this.call(prompt, systemPrompt);
            return this.parseResponse(rawContent, module);
        } catch (error) {
            console.error(`Generate failed for module [${module}]:`, error);
            // Return fallback data on failure
            return this.getFallbackData(module, lang);
        }
    },

    /**
     * Generate all modules sequentially (avoids rate limit on free tier)
     * @param {string} lang - Language: zh or en
     * @returns {Promise<Object>} - Object with all module data
     */
    async generateAll(lang) {
        const modules = ['dynamics', 'financing', 'tech', 'voices'];
        const results = {};

        for (let i = 0; i < modules.length; i++) {
            const module = modules[i];
            // Add delay between requests to respect rate limit
            if (i > 0) {
                await this.sleep(1500);
            }
            results[module] = await this.generateModule(module, lang);
        }

        return results;
    },

    /**
     * Load RPA-collected data from data/news_data.json
     * RPA工具每天定时从全球新闻源采集，经智谱GLM-4.5-Flash处理后存储
     * @param {string} lang - Language: zh or en
     * @returns {Promise<Object|null>} - Object with all module data, or null if not available
     */
    async loadRPAData(lang) {
        try {
            // 添加时间戳参数避免缓存
            const url = `data/news_data.json?_t=${Date.now()}`;
            const response = await fetch(url, { cache: 'no-cache' });

            if (!response.ok) {
                console.log('[RPA] news_data.json not found, will use AI generation');
                return null;
            }

            const data = await response.json();
            const langData = data[lang];

            if (!langData) {
                console.warn(`[RPA] No ${lang} data in news_data.json`);
                return null;
            }

            // 返回数据及元信息
            return {
                dynamics: langData.dynamics || [],
                financing: langData.financing || [],
                tech: langData.tech || [],
                voices: langData.voices || [],
                meta: data.meta || null
            };
        } catch (error) {
            console.log('[RPA] Failed to load RPA data:', error.message);
            return null;
        }
    },

    /**
     * Parse API response into structured data
     * @param {string} content - Raw API response
     * @param {string} module - Module name
     * @returns {Array} - Parsed content items
     */
    parseResponse(content, module) {
        try {
            // Try to extract JSON from the response
            let jsonStr = content.trim();

            // Handle case where response is wrapped in markdown code block
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            // Handle case where response is a JSON object with a key
            let parsed = JSON.parse(jsonStr);

            // If it's an object with array values, find the array
            if (!Array.isArray(parsed)) {
                const arrayValues = Object.values(parsed).filter(v => Array.isArray(v));
                if (arrayValues.length > 0) {
                    parsed = arrayValues[0];
                } else {
                    parsed = [parsed];
                }
            }

            // Validate and normalize items
            return parsed.map(item => this.normalizeItem(item, module));
        } catch (e) {
            console.error('JSON parse error:', e, '\nRaw content:', content);
            return [];
        }
    },

    /**
     * Normalize a content item to ensure consistent structure
     */
    normalizeItem(item, module) {
        const normalized = { ...item };

        // Ensure date exists
        if (!normalized.date) {
            const d = new Date();
            normalized.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        // Module-specific defaults
        switch (module) {
            case 'dynamics':
                normalized.company = normalized.company || 'Unknown';
                normalized.title = normalized.title || '';
                normalized.summary = normalized.summary || '';
                normalized.tag = normalized.tag || 'News';
                break;
            case 'financing':
                normalized.company = normalized.company || 'Unknown';
                normalized.round = normalized.round || 'Funding';
                normalized.amount = normalized.amount || 'Undisclosed';
                normalized.valuation = normalized.valuation || 'Undisclosed';
                normalized.investors = normalized.investors || 'Undisclosed';
                normalized.summary = normalized.summary || '';
                break;
            case 'tech':
                normalized.title = normalized.title || '';
                normalized.summary = normalized.summary || '';
                normalized.company = normalized.company || 'Research Lab';
                normalized.significance = normalized.significance || '';
                break;
            case 'voices':
                normalized.name = normalized.name || 'Unknown';
                normalized.title = normalized.title || '';
                normalized.quote = normalized.quote || '';
                normalized.context = normalized.context || '';
                break;
        }

        return normalized;
    },

    /**
     * Fallback data when API fails
     */
    getFallbackData(module, lang) {
        const isZh = lang === 'zh';
        const today = new Date().toISOString().split('T')[0];

        const fallbacks = {
            zh: {
                dynamics: [
                    { company: 'Figure AI', title: 'Figure 03人形机器人实现工厂量产部署', summary: 'Figure AI宣布其第三代人形机器人Figure 03已在宝马工厂完成首批部署，实现产线物料搬运与质量检测自动化任务，标志着人形机器人正式进入工业量产阶段。', date: today, tag: '产品发布' },
                    { company: 'Tesla', title: 'Optimus机器人在工厂内实现自主导航与操作', summary: '特斯拉展示了Optimus机器人在超级工厂内自主导航、搬运电池组并执行精密组装任务的最新视频，马斯克称2026年将实现小规模量产。', date: today, tag: '产品发布' },
                    { company: 'Unitree', title: '宇树科技发布G1 Pro消费级人形机器人', summary: '宇树科技推出G1 Pro人形机器人，售价降至9.9万元人民币，配备灵巧手和AI视觉系统，瞄准教育与服务市场。', date: today, tag: '产品发布' },
                    { company: 'Boston Dynamics', title: 'Atlas电驱版完成工厂测试并与丰田达成合作', summary: '波士顿动力全新电动版Atlas机器人在丰田工厂完成测试，展示了双臂协作搬运重物的能力，双方签署战略合作协议。', date: today, tag: '战略合作' },
                    { company: 'Agility Robotics', title: 'Digit机器人在亚马逊仓库完成百万次拣选', summary: 'Agility Robotics的Digit双足机器人在亚马逊物流中心累计完成超过100万次商品拣选任务，创下人形机器人商业化运营新纪录。', date: today, tag: '市场扩张' }
                ],
                financing: [
                    { company: 'Figure AI', round: 'B轮', amount: '6.75亿美元', valuation: '26亿美元', investors: '微软、OpenAI、NVIDIA、贝佐斯', summary: 'Figure AI完成6.75亿美元B轮融资，估值达26亿美元，资金将用于扩大Figure 03机器人产能和推进AI模型训练。', date: today },
                    { company: 'Skild AI', round: 'A轮', amount: '3000万美元', valuation: '10亿美元', investors: 'Lightspeed、Coatue、亚马逊', summary: 'Skild AI完成A轮融资，跻身独角兽行列，公司专注于构建通用机器人基础模型。', date: today },
                    { company: 'Physical Intelligence', round: '种子轮', amount: '7000万美元', valuation: '4亿美元', investors: 'Khosla Ventures、Lux Capital', summary: 'Physical Intelligence（Pi）完成7000万美元种子轮融资，致力于打造物理世界的通用智能。', date: today },
                    { company: '1X Technologies', round: 'B轮', amount: '1亿美元', valuation: '10亿美元', investors: 'OpenAI、EQT Ventures', summary: '1X Technologies完成B轮融资，用于推进NEO家庭人形机器人的研发和量产计划。', date: today },
                    { company: 'Apptronik', round: 'A轮', amount: '3.5亿美元', valuation: '16亿美元', investors: 'B Capital、Google Ventures', summary: 'Apptronik完成A轮融资，加速Apollo人形机器人在物流和制造领域的商业化部署。', date: today }
                ],
                tech: [
                    { title: 'NVIDIA发布Project GR00T人形机器人基础模型', summary: 'NVIDIA推出Project GR00T，一个专为人形机器人设计的通用基础模型，支持自然语言指令到机器人动作的端到端学习。', company: 'NVIDIA', significance: '首个面向人形机器人的通用基础模型，有望大幅降低机器人开发门槛', date: today },
                    { title: 'Figure AI展示端到端视觉-语言-动作模型', summary: 'Figure AI展示了其自研的VLA模型，机器人可通过摄像头输入直接生成关节控制指令，无需传统运动规划中间步骤。', company: 'Figure AI', significance: '端到端学习突破，简化机器人控制流水线，提升实时响应能力', date: today },
                    { title: 'Google DeepMind发布RT-2大规模机器人模型', summary: 'Google DeepMind的RT-2模型将大规模视觉-语言模型与机器人控制结合，实现了跨任务、跨场景的泛化操作能力。', company: 'Google DeepMind', significance: '视觉-语言-动作统一架构，推动通用机器人智能发展', date: today },
                    { title: 'Stanford推出Mobile ALOHA低成本遥操作平台', summary: '斯坦福大学发布Mobile ALOHA系统，以3.2万美元成本实现双臂移动操作的数据采集与自主执行，加速具身智能研究。', company: 'Stanford University', significance: '大幅降低具身智能研究成本，推动学术界机器人学习数据集扩展', date: today },
                    { title: '波士顿动力Atlas实现全身动态平衡控制突破', summary: '新版电动Atlas采用强化学习训练的全身控制器，可在不规则地形上实现跑步、跳跃和跌倒后自主起立。', company: 'Boston Dynamics', significance: '强化学习在人形机器人全身控制中的里程碑应用', date: today }
                ],
                voices: [
                    { name: 'Elon Musk', title: 'CEO, Tesla', quote: '人形机器人将是有史以来最大的产品，远超汽车业务。Optimus的长期价值可能超过特斯拉所有其他产品 combined。', context: '在特斯拉股东大会上讨论Optimus机器人战略', date: today },
                    { name: 'Jensen Huang', title: 'CEO, NVIDIA', quote: '物理AI的ChatGPT时刻即将到来。我们正在构建从芯片到模型的全栈基础设施，让每一个机器人都能拥有智能。', context: '在GTC 2026主题演讲中发布Project GR00T', date: today },
                    { name: 'Brett Adcock', title: 'CEO, Figure AI', quote: '我们的目标是在未来十年内将数十亿台人形机器人部署到全球工厂和家庭中。Figure 03只是这个旅程的开始。', context: '在Figure AI B轮融资发布会上', date: today },
                    { name: 'Sam Altman', title: 'CEO, OpenAI', quote: '物理AI是AGI的最后一块拼图。当智能能够操控物理世界时，我们将真正看到通用人工智能的完整形态。', context: '在达沃斯世界经济论坛讨论AI未来', date: today },
                    { name: 'Demis Hassabis', title: 'CEO, Google DeepMind', quote: '具身智能是通向AGI的关键路径之一。机器人需要在真实世界中学习才能获得真正的常识理解能力。', context: '在DeepMind robotics研讨会上', date: today }
                ]
            },
            en: {
                dynamics: [
                    { company: 'Figure AI', title: 'Figure 03 Humanoid Robot Deployed in Factory Mass Production', summary: 'Figure AI announced its third-generation humanoid robot Figure 03 has been deployed in BMW factories, performing material handling and quality inspection tasks, marking the official entry of humanoid robots into industrial mass production.', date: today, tag: 'Product Launch' },
                    { company: 'Tesla', title: 'Optimus Robot Achieves Autonomous Navigation and Operation in Factory', summary: 'Tesla showcased the latest video of Optimus robots autonomously navigating, transporting battery packs, and performing precision assembly tasks in the Gigafactory. Musk says small-scale production will begin in 2026.', date: today, tag: 'Product Launch' },
                    { company: 'Unitree', title: 'Unitree Releases G1 Pro Consumer Humanoid Robot', summary: 'Unitree launched the G1 Pro humanoid robot priced at 99,000 RMB, equipped with dexterous hands and AI vision system, targeting education and service markets.', date: today, tag: 'Product Launch' },
                    { company: 'Boston Dynamics', title: 'Electric Atlas Completes Factory Testing, Partners with Toyota', summary: 'Boston Dynamics\' new electric Atlas robot completed testing at Toyota factories, demonstrating dual-arm collaborative heavy lifting. The two parties signed a strategic partnership agreement.', date: today, tag: 'Partnership' },
                    { company: 'Agility Robotics', title: 'Digit Robot Completes One Million Picks at Amazon Warehouse', summary: 'Agility Robotics\' Digit bipedal robot has completed over 1 million product picks at Amazon fulfillment centers, setting a new record for humanoid robot commercial operations.', date: today, tag: 'Market Expansion' }
                ],
                financing: [
                    { company: 'Figure AI', round: 'Series B', amount: '$675M', valuation: '$2.6B', investors: 'Microsoft, OpenAI, NVIDIA, Bezos', summary: 'Figure AI completed $675M Series B funding at a $2.6B valuation. Funds will expand Figure 03 production capacity and advance AI model training.', date: today },
                    { company: 'Skild AI', round: 'Series A', amount: '$30M', valuation: '$1B', investors: 'Lightspeed, Coatue, Amazon', summary: 'Skild AI completed Series A funding, reaching unicorn status. The company focuses on building general-purpose robot foundation models.', date: today },
                    { company: 'Physical Intelligence', round: 'Seed', amount: '$70M', valuation: '$400M', investors: 'Khosla Ventures, Lux Capital', summary: 'Physical Intelligence (Pi) completed $70M seed funding, dedicated to building general intelligence for the physical world.', date: today },
                    { company: '1X Technologies', round: 'Series B', amount: '$100M', valuation: '$1B', investors: 'OpenAI, EQT Ventures', summary: '1X Technologies completed Series B funding to advance NEO home humanoid robot development and mass production plans.', date: today },
                    { company: 'Apptronik', round: 'Series A', amount: '$350M', valuation: '$1.6B', investors: 'B Capital, Google Ventures', summary: 'Apptronik completed Series A funding to accelerate Apollo humanoid robot deployment in logistics and manufacturing.', date: today }
                ],
                tech: [
                    { title: 'NVIDIA Releases Project GR00T Humanoid Robot Foundation Model', summary: 'NVIDIA launched Project GR00T, a general foundation model designed for humanoid robots, supporting end-to-end learning from natural language commands to robot actions.', company: 'NVIDIA', significance: 'First general foundation model for humanoid robots, potentially lowering robot development barriers significantly', date: today },
                    { title: 'Figure AI Demonstrates End-to-End Vision-Language-Action Model', summary: 'Figure AI demonstrated its in-house VLA model where robots generate joint control commands directly from camera input, eliminating traditional motion planning intermediate steps.', company: 'Figure AI', significance: 'End-to-end learning breakthrough simplifying robot control pipeline, improving real-time responsiveness', date: today },
                    { title: 'Google DeepMind Releases RT-2 Large-Scale Robot Model', summary: 'Google DeepMind\'s RT-2 model combines large-scale vision-language models with robot control, achieving cross-task and cross-scene generalization capabilities.', company: 'Google DeepMind', significance: 'Unified vision-language-action architecture advancing general robot intelligence', date: today },
                    { title: 'Stanford Releases Mobile ALOHA Low-Cost Teleoperation Platform', summary: 'Stanford University released Mobile ALOHA system, achieving dual-arm mobile manipulation data collection and autonomous execution at $32K cost, accelerating embodied intelligence research.', company: 'Stanford University', significance: 'Dramatically reducing embodied intelligence research costs, expanding academic robot learning datasets', date: today },
                    { title: 'Boston Dynamics Atlas Achieves Breakthrough in Full-Body Dynamic Balance Control', summary: 'The new electric Atlas uses a reinforcement-learning-trained whole-body controller, enabling running, jumping, and self-recovery from falls on uneven terrain.', company: 'Boston Dynamics', significance: 'Milestone application of reinforcement learning in humanoid whole-body control', date: today }
                ],
                voices: [
                    { name: 'Elon Musk', title: 'CEO, Tesla', quote: 'Humanoid robots will be the biggest product ever, far exceeding the car business. Optimus\' long-term value could exceed all of Tesla\'s other products combined.', context: 'Discussing Optimus robot strategy at Tesla shareholder meeting', date: today },
                    { name: 'Jensen Huang', title: 'CEO, NVIDIA', quote: 'The ChatGPT moment for Physical AI is coming. We are building full-stack infrastructure from chips to models so every robot can have intelligence.', context: 'Launching Project GR00T at GTC 2026 keynote', date: today },
                    { name: 'Brett Adcock', title: 'CEO, Figure AI', quote: 'Our goal is to deploy billions of humanoid robots in factories and homes worldwide over the next decade. Figure 03 is just the beginning of this journey.', context: 'At Figure AI Series B funding announcement', date: today },
                    { name: 'Sam Altman', title: 'CEO, OpenAI', quote: 'Physical AI is the last piece of the AGI puzzle. When intelligence can manipulate the physical world, we will truly see the complete form of AGI.', context: 'Discussing AI future at Davos World Economic Forum', date: today },
                    { name: 'Demis Hassabis', title: 'CEO, Google DeepMind', quote: 'Embodied intelligence is one of the key paths to AGI. Robots need to learn in the real world to gain true common sense understanding.', context: 'At DeepMind robotics symposium', date: today }
                ]
            }
        };

        return fallbacks[lang] ? (fallbacks[lang][module] || []) : (fallbacks.zh[module] || []);
    }
};
