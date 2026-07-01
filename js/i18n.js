/* ============================================
   PhysicalAI Pulse — Internationalization (i18n)
   中英文双语支持
   ============================================ */

const I18N = {
    zh: {
        // Header
        logoSub: '全球物理AI企业实时资讯',
        live: '实时',

        // Stats
        statCompanies: '追踪企业',
        statFunding: '融资总额',
        statUpdates: '今日更新',
        statSectors: '活跃领域',

        // Nav
        navAll: '全部',
        navDynamics: '企业动态',
        navFinancing: '融资估值',
        navTech: '技术突破',
        navVoices: '大佬言论',

        // Module titles
        modDynamicsTitle: '企业最新动态',
        modDynamicsDesc: '全球物理AI企业最新产品发布、合作与战略动向',
        modFinancingTitle: '融资与估值',
        modFinancingDesc: '物理AI领域最新融资轮次、估值变动与投资动向',
        modTechTitle: '物理AI技术突破',
        modTechDesc: '具身智能、机器人学习、感知与控制等前沿技术进展',
        modVoicesTitle: '科技界大佬言论',
        modVoicesDesc: '全球科技领袖对物理AI与具身智能的最新观点与洞察',

        // Buttons
        refresh: 'AI生成',
        loading: 'AI正在生成最新资讯...',

        // Card labels
        tagDynamics: '企业动态',
        tagFinancing: '融资',
        tagTech: '技术',
        tagVoices: '言论',
        valuation: '估值',
        investors: '投资方',
        round: '轮次',
        significance: '意义',
        source: '来源',
        aiGenerated: 'AI生成',

        // Empty state
        emptyText: '暂无资讯',
        emptyHint: '点击"AI生成"按钮获取最新内容',

        // Toast
        toastSuccess: '资讯生成成功',
        toastError: '生成失败，请稍后重试',
        toastLoading: '正在生成中，请稍候...',

        // Footer
        footerDesc: '全球物理AI企业实时资讯平台 · 由智谱GLM-4.5-Flash驱动',

        // Stat suffixes
        fundingUnit: '亿美元',
        companiesUnit: '家',
        updatesUnit: '条',
        sectorsUnit: '个',

        // Prompts for Zhipu API
        promptDynamics: `你是一个专业的物理AI行业资讯编辑。请生成5条关于全球物理AI（Physical AI / Embodied AI）企业的最新动态新闻。

要求：
1. 涵盖 Figure AI、Tesla Optimus、Boston Dynamics、Unitree、1X Technologies、Agility Robotics、Apptronik、Sanctuary AI、Skild AI、Physical Intelligence 等知名企业
2. 每条新闻包含：企业名称、新闻标题、内容摘要（2-3句话）、日期、分类标签
3. 内容应真实可信，基于2024-2026年的行业发展趋势
4. 分类标签包括：产品发布、战略合作、市场扩张、人事变动、政策法规

请严格以JSON数组格式返回，不要包含其他文字。格式如下：
[{"company":"企业名","title":"标题","summary":"摘要","date":"YYYY-MM-DD","tag":"分类"}]`,

        promptFinancing: `你是一个专业的物理AI行业投资分析师。请生成5条关于全球物理AI（Physical AI / Embodied AI）企业的最新融资与估值信息。

要求：
1. 涵盖 Figure AI、Tesla Optimus、Unitree、Skild AI、Physical Intelligence、1X Technologies、Agility Robotics、Apptronik、Sanctuary AI、NVIDIA等企业
2. 每条包含：企业名称、融资轮次、融资金额、估值、主要投资方、内容摘要、日期
3. 金额和估值以美元为单位，基于2024-2026年的实际融资趋势
4. 融资轮次包括：种子轮、A轮、B轮、C轮、D轮、战略投资、并购等

请严格以JSON数组格式返回，不要包含其他文字。格式如下：
[{"company":"企业名","round":"融资轮次","amount":"融资金额","valuation":"估值","investors":"投资方","summary":"摘要","date":"YYYY-MM-DD"}]`,

        promptTech: `你是一个专业的物理AI技术分析师。请生成5条关于物理AI（Physical AI / Embodied AI）领域的最新技术突破。

要求：
1. 涵盖具身智能、机器人学习、视觉-语言-动作模型(VLA)、灵巧操作、Sim-to-Real迁移、人形机器人控制、自主导航等技术方向
2. 涉及企业/研究机构：NVIDIA、Figure AI、Google DeepMind、OpenAI、Stanford、MIT、Tesla、Boston Dynamics等
3. 每条包含：技术标题、技术描述（2-3句话）、所属企业/机构、技术意义、日期
4. 内容应基于2024-2026年的前沿技术进展

请严格以JSON数组格式返回，不要包含其他文字。格式如下：
[{"title":"技术标题","summary":"技术描述","company":"企业/机构","significance":"技术意义","date":"YYYY-MM-DD"}]`,

        promptVoices: `你是一个专业的科技行业观察者。请生成5条全球科技界大佬关于物理AI（Physical AI / Embodied AI）的最新言论。

要求：
1. 涵盖人物：Elon Musk (Tesla)、Brett Adcock (Figure AI)、Jensen Huang (NVIDIA)、Sam Altman (OpenAI)、Demis Hassabis (Google DeepMind)、Cesare Stone (Boston Dynamics)等
2. 每条包含：人物姓名、职位/公司、言论内容、背景语境、日期
3. 言论应体现对物理AI发展前景、技术路线、商业应用等方面的观点
4. 内容应基于2024-2026年的公开言论和行业趋势

请严格以JSON数组格式返回，不要包含其他文字。格式如下：
[{"name":"人物姓名","title":"职位/公司","quote":"言论内容","context":"背景语境","date":"YYYY-MM-DD"}]`
    },

    en: {
        // Header
        logoSub: 'Real-Time Global Physical AI Intelligence',
        live: 'LIVE',

        // Stats
        statCompanies: 'Companies',
        statFunding: 'Total Funding',
        statUpdates: 'Updates Today',
        statSectors: 'Active Sectors',

        // Nav
        navAll: 'All',
        navDynamics: 'Dynamics',
        navFinancing: 'Funding',
        navTech: 'Tech',
        navVoices: 'Voices',

        // Module titles
        modDynamicsTitle: 'Enterprise Latest Dynamics',
        modDynamicsDesc: 'Latest product launches, partnerships and strategic moves of global Physical AI companies',
        modFinancingTitle: 'Financing & Valuation',
        modFinancingDesc: 'Latest funding rounds, valuation changes and investment trends in Physical AI',
        modTechTitle: 'Physical AI Tech Breakthroughs',
        modTechDesc: 'Frontier advances in embodied intelligence, robot learning, perception and control',
        modVoicesTitle: 'Industry Leaders\' Voices',
        modVoicesDesc: 'Latest insights and opinions from global tech leaders on Physical AI',

        // Buttons
        refresh: 'AI Generate',
        loading: 'AI is generating latest news...',

        // Card labels
        tagDynamics: 'Dynamics',
        tagFinancing: 'Funding',
        tagTech: 'Tech',
        tagVoices: 'Voices',
        valuation: 'Valuation',
        investors: 'Investors',
        round: 'Round',
        significance: 'Impact',
        source: 'Source',
        aiGenerated: 'AI Generated',

        // Empty state
        emptyText: 'No news available',
        emptyHint: 'Click "AI Generate" button to fetch latest content',

        // Toast
        toastSuccess: 'News generated successfully',
        toastError: 'Generation failed, please try again later',
        toastLoading: 'Generating, please wait...',

        // Footer
        footerDesc: 'Real-time global Physical AI enterprise intelligence platform · Powered by Zhipu GLM-4.5-Flash',

        // Stat suffixes
        fundingUnit: 'B USD',
        companiesUnit: '',
        updatesUnit: '',
        sectorsUnit: '',

        // Prompts for Zhipu API
        promptDynamics: `You are a professional Physical AI industry news editor. Generate 5 latest news items about global Physical AI / Embodied AI companies.

Requirements:
1. Cover companies like Figure AI, Tesla Optimus, Boston Dynamics, Unitree, 1X Technologies, Agility Robotics, Apptronik, Sanctuary AI, Skild AI, Physical Intelligence
2. Each item includes: company name, headline, summary (2-3 sentences), date, category tag
3. Content should be realistic, based on 2024-2026 industry trends
4. Category tags: Product Launch, Partnership, Market Expansion, Personnel, Regulation

Return strictly as a JSON array, no other text. Format:
[{"company":"Company","title":"Headline","summary":"Summary","date":"YYYY-MM-DD","tag":"Category"}]`,

        promptFinancing: `You are a professional Physical AI investment analyst. Generate 5 latest funding and valuation updates for global Physical AI / Embodied AI companies.

Requirements:
1. Cover Figure AI, Tesla Optimus, Unitree, Skild AI, Physical Intelligence, 1X Technologies, Agility Robotics, Apptronik, Sanctuary AI, NVIDIA
2. Each item includes: company name, funding round, amount, valuation, key investors, summary, date
3. Amounts in USD, based on 2024-2026 actual funding trends
4. Rounds: Seed, Series A, Series B, Series C, Series D, Strategic, M&A

Return strictly as a JSON array, no other text. Format:
[{"company":"Company","round":"Round","amount":"Amount","valuation":"Valuation","investors":"Investors","summary":"Summary","date":"YYYY-MM-DD"}]`,

        promptTech: `You are a professional Physical AI technology analyst. Generate 5 latest technology breakthroughs in the Physical AI / Embodied AI field.

Requirements:
1. Cover embodied intelligence, robot learning, vision-language-action models (VLA), dexterous manipulation, sim-to-real transfer, humanoid control, autonomous navigation
2. Involve companies/labs: NVIDIA, Figure AI, Google DeepMind, OpenAI, Stanford, MIT, Tesla, Boston Dynamics
3. Each item includes: tech title, description (2-3 sentences), company/institution, significance, date
4. Based on 2024-2026 frontier tech advances

Return strictly as a JSON array, no other text. Format:
[{"title":"Title","summary":"Description","company":"Company/Lab","significance":"Significance","date":"YYYY-MM-DD"}]`,

        promptVoices: `You are a professional tech industry observer. Generate 5 latest statements from global tech leaders about Physical AI / Embodied AI.

Requirements:
1. Cover: Elon Musk (Tesla), Brett Adcock (Figure AI), Jensen Huang (NVIDIA), Sam Altman (OpenAI), Demis Hassabis (Google DeepMind), Robert Playter (Boston Dynamics)
2. Each item includes: person name, title/company, statement, context, date
3. Statements should reflect views on Physical AI prospects, tech roadmaps, commercial applications
4. Based on 2024-2026 public statements and industry trends

Return strictly as a JSON array, no other text. Format:
[{"name":"Name","title":"Title/Company","quote":"Statement","context":"Context","date":"YYYY-MM-DD"}]`
    }
};

// Current language
let currentLang = 'zh';

// Apply translations to all elements with data-i18n attribute
function applyTranslations(lang) {
    currentLang = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (I18N[lang][key]) {
            el.textContent = I18N[lang][key];
        }
    });

    // Update language toggle UI
    document.querySelector('.lang-cn').classList.toggle('active', lang === 'zh');
    document.querySelector('.lang-en').classList.toggle('active', lang === 'en');
}

// Get translated string
function t(key) {
    return I18N[currentLang][key] || key;
}

// Get current language
function getLang() {
    return currentLang;
}
