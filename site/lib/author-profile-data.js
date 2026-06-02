const authorProfileData = {
  hero: {
    id: "hero",
    heading: "个人简介",
    name: "袁慎建",
    roles: ["AI 效率工程师", "研发效能专家", "敏捷开发教练"],
    phone: "18192235667",
    email: "yuanshenjian@foxmail.com",
    summary: [
      "在 Thoughtworks 深耕 10多年，经历多个国内外交付、咨询和技术人才培养项目，长期关注 AI 软件工程、研发效能提升与敏捷实践落地",
      "擅长将 AI 工具、Agent 工作流与工程实践结合到真实研发场景中，提升代码开发、测试、重构和知识沉淀效率，同时具备扎实的软件架构设计与服务端开发能力",
      "具备良好的业务 Sense 和产品思维，有代码洁癖",
    ],
  },
  skills: {
    id: "skills",
    heading: "技能证书",
    items: [
      {
        level: "master",
        icon: "敏",
        title: "敏捷开发",
        description:
          "精通XP、Scrum、DevOps敏捷软件工程实践，如CI/CD、TDD、重构、简单设计",
      },
      {
        level: "master",
        icon: "软",
        title: "软件设计",
        description: "精通面向对象、设计模式、整洁软件设计",
      },
      {
        level: "master",
        icon: "测",
        title: "测试策略",
        description:
          "精通自动化分层测试策略和最佳实践，擅长软件交付质量内建体系搭建",
      },
      {
        level: "proficient",
        icon: "架",
        title: "架构设计",
        description: "熟练掌握高可用整洁架构设计，以及DDD实践、微服务设计、AI Agent 架构设计",
      },
      {
        level: "proficient",
        icon: "AI",
        title: "AI 效率工程",
        description:
          "熟练使用AI提效工具，如：OpenCode、Claude Code、Codex、Agent Skills、SDD框架。熟练设计 Agent工作流提升研发效率",
      },
      {
        level: "proficient",
        icon: "AI",
        title: "AI Agent",
        description:
          "熟练使用Spring AI、LangGraph开发AI Agent应用，熟练运用提示词工程、MCP、RAG",
      },
      {
        level: "proficient",
        icon: "J",
        title: "Java技术栈",
        description:
          "熟练Java、Spring Boot、Spring Cloud、MySQL、Redis、Kafka、RabbitMQ等服务器端技术",
      },
      {
        level: "familiar",
        icon: "业",
        title: "业务分析",
        description:
          "熟悉业务分析方法，如用户路程、用户故事地图、用户故事、服务蓝图",
      },
      {
        level: "familiar",
        icon: "P",
        title: "Python",
        description: "熟悉 Python、FastAPI、Pydantic-ai、LangChain",
      },
    ],
    certificates: [
      "CSM（2020年）",
      "CAC敏捷教练（2021年）",
      "ATD培训师（2023年）",
      "CBBA高级健身教练（2025年）",
    ],
  },
  education: {
    id: "education",
    heading: "教育背景",
    school: "长安大学（统招本科 211）",
    major: "软件工程（转）",
    period: "2009.09 ~ 2013.07",
    href: "https://www.chd.edu.cn/",
  },
  experience: {
    id: "experience",
    heading: "经历概览",
    items: [
      {
        period: "2025.05 ~ 2025.12",
        title: "Locammend 智能顾问 - 技术负责人",
        description:
          "聚焦在AI辅助效能提升和AI应用开发。作为技术负责人，在Locammend负责系统架构设计和落地，引入SDD开发框架提升AI辅助研发的质量，采用AWS云原生架构进行部署。",
      },
      {
        period: "2023.02 ~ 2025.02",
        title: "保时捷Super App - Tech Leader & 架构师",
        description:
          "在保时捷Super App项目上做架构方案设计和落地，推动研发效能提升，支撑10多个垂直业务团队顺畅完成业务目标。",
      },
      {
        period: "2019.06 ~ 2023.01",
        title: "Thoughtworks - 技术教练 & 咨询顾问",
        list: [
          "推动客户研发效能提升，显著缩短交付前置时间以及降低需求返工率",
          "主导设计6+个技术学习项目，交付60+场技术训练营，涵盖了500+中、高级技术人员",
        ],
      },
      {
        period: "2015.03 ~ 2019.05",
        title: "Thoughtworks - 服务端开发",
        description:
          "经历了多个交付项目，项目涉及金融、物流、IT、汽车等领域。项目均采用敏捷交付方式，前后作为核心开发人员、Tech Lead在项目中推动和践行敏捷工程实践落地和改进，带领团队做架构设计，遗留系统重构、测试优化、持续部署流水线优化等工作。",
      },
      {
        period: "2013.06 ~ 2015.02",
        title: "早期职业生涯",
        list: [
          "2014.10 ~ 2015.02：软件开发工作室（自由创业）",
          "2013.06 ~ 2014.09：西安美林数据股份有限公司",
        ],
      },
    ],
  },
  projects: {
    id: "projects",
    heading: "重要项目",
    items: [
      {
        period: "2025.05 ~ 2025.12",
        name: "Locammend 智能顾问 研发交付",
        role: "技术负责人 | 架构师 | 后端开发",
        achievements: [
          { metric: "Chat Memory", text: "企业级" },
          { metric: "AWS云原生", text: "架构设计与落地" },
          { text: "集成Google Search、Exa动态RAG" },
        ],
        description:
          "这是一个小团队创业项目，涉及服务端、iOS、Android端。作为技术负责人，负责整体应用架构设计、以及服务端交付和部署运维。",
        highlights: [
          { text: "深度参用户体验的梳理，引入用户旅程和用户故事提升协作效率" },
          { text: "负责架构设计，采用DDD分层架构，RESTFul API、Redis缓存中间件" },
          { text: "设计和落地AWS云原生部署架构，引入ALB、配置中心，服务注册和发现等微服务技术，降低服务治理和运维复杂度" },
          { text: "基于提示词工程，集成Google Search、Exa服务实现动态RAG，提升用户检索的精准度和可靠的推荐" },
          { text: "基于Cursor和Claude Code，采用Openspec框架提升AI辅助研发的质量规范" },
          { text: "实现企业级Chat Memory能力，使模型在多轮对话中仍能记忆用户有效信息，从全局层面理解用户意图" },
        ],
        techs: [
          { name: "Spring Boot" },
          { name: "Spring AI" },
          { name: "Spring Cloud" },
          { name: "MySQL" },
          { name: "Redis" },
          { name: "GitHub CI/CD" },
          { name: "AWS Cloud Native" },
          { name: "ECS" },
          { name: "ALB" },
          { name: "WAF" },
          { name: "Cloud Front" },
          { name: "S3" },
          { name: "RDS" },
        ],
      },
      {
        period: "2023.02 ~ 2025.02",
        name: "保时捷 - Super App 研发交付",
        role: "Tech Leader | 架构师",
        achievements: [
          { metric: "17", text: "个Scrum Team顺畅交付" },
          { text: "平台组件架构设计评审" },
          { text: "冷启动性能优化显著改善体验" },
          { text: "知识管理规范获团队一致好评" },
        ],
        description:
          "这是一个基于SAFe 6.0框架运作的大型敏捷IT组织研发的保时捷（10万+车主）Super App，该组织包含三个ART共计约17个Scrum Team。所在的Platform团队由来自多家不同公司、分布在多个城市的成员组成。",
        highlights: [
          { text: "深入到业务方梳理对齐业务问题和用户体验，主导App平台公共能力和组件（收银台、分享、勋章、客服，B25等）的架构方案设计和评审" },
          { text: "主导跨端（iOS、Android、Server、H5）架构方案的设计和评审，并推动方案在多个垂直交付团队落地" },
          { text: "赋能团队日常敏捷交付实践的落地执行和优化，推动质量内建在团队和组织中的落地，显著提升团队交付的质量，得到架构组和垂直业务团队的高度好评" },
          { text: "主导Super App冷启动性能诊断和分析，设计前后端缓存方案，并推动在相关垂直业务团队落地实施，大大缩短了全网广播后因突发流量的响应延迟时间，显著改善用户体验" },
          { text: "设计App端Pre-Prod环境的集成测试方案，推动该方案在业务团队落地，打通Pre-Prod端到端的集成测试能力，有效利用Pre-Prod做好生产环境质量把控" },
          { text: "积极推动知识管理，制定日常交付的质量规范包括业务建模、架构、API文档规范、代码规范以及测试策略，在组织内广泛传播，收到兄弟团队的技术人员的一致好评" },
        ],
        techs: [
          { name: "SAFe 6.0" },
          { name: "Spring Boot" },
          { name: "Spring Cloud" },
          { name: "Nacos" },
          { name: "Config Center" },
          { name: "Feign Client" },
          { name: "GitLab CI/CD" },
          { name: "MySQL" },
          { name: "Redis" },
          { name: "Kafka" },
          { name: "MQ" },
          { name: "AWS Cloud" },
        ],
      },
      {
        period: "2022.02 ~ 2023.01",
        name: "人保 - DevOps 研发效能提升",
        role: "DevOps研发效能教练 | 架构师",
        achievements: [
          { metric: "30%+", text: "需求交付前置时间缩短" },
          { metric: "60%", text: "测试覆盖率从15%提升至" },
          { metric: "约50%", text: "Bug返工率降低" },
          { metric: "4个交付组", text: "辅导" },
          { metric: "超50名技术人员", text: "辅导" },
        ],
        description:
          "作为驻场DevOps研发效能教练，深入中国人保核心交付团队，主导研发流程瓶颈诊断和效能提升。",
        highlights: [
          { text: "主导研发流程瓶颈诊断，采用VSM调研走访10来个核心交付组，识别出需求共识效率低、变更失败率高、交付前置时间长等核心瓶颈" },
          { text: "辅导核心系统4个交付组超过50名技术人员改善研发过程，引入高效能工程实践框架，优化需求管理、任务分解、CI/CD Pipeline等实践" },
          { text: "辅导8个组的Tech Leader和BA采用事件风暴、用户旅程、用户故事、DDD进行核心业务流程梳理和建模，显著提升业务共识效率" },
          { text: "指导团队引入DDD分层架构改造核心模块，制定分层测试策略，测试覆盖率从15%提升到60%，Bug返工率降低约50%" },
        ],
      },
      {
        period: "2019.06 ~ 2022.01",
        name: "Thoughtworks - 技术人员培养",
        role: "技术内训师 | 学习项目设计师",
        achievements: [
          { metric: "6+", text: "实战训练营" },
          { metric: "500+", text: "覆盖" },
          { metric: "明星项目", text: "面向对象训练营成" },
          { text: "培养技术骨干和技术Leader" },
        ],
        description:
          "作为Thoughtworks内训师，设计并交付高质量技术学习项目，帮助中高级技术人员提升工程实践能力和架构设计能力。",
        highlights: [
          { text: "高阶项目：微服务设计，技术领导力、大规模高效能工程实践" },
          { text: "中阶项目：重构实战、TDD实战、面向对象训练营（明星项目，口碑极佳）" },
          { text: "实战训练营涵盖500+中高级技术人员，显著提升团队技术能力和工程实践水平" },
        ],
      },
      {
        period: "2017.06 ~ 2019.05",
        name: "戴姆勒 - OTR 研发交付",
        role: "Tech Lead 2Tier",
        achievements: [
          { metric: "50%", text: "CI/CD Pipeline提速约" },
          { metric: "约40%", text: "需求Bug返工率降低" },
          { text: "设计微服务技术工作坊" },
          { text: "深度实践 Spring Cloud 微服务架构" },
        ],
        description:
          "这是一个手机App系统，为奔驰经销商提供一站式销售服务。后台采用了微服务架构。",
        highlights: [
          { text: "完成日常需求开发，推动团队敏捷工程实践的落地优化，比如Code Review、Tasking、TDD、测试策略" },
          { text: "推动技术债管理，带领技术栈小组优化系统的自动化测试策略，引入有效的进程内API功能测试和契约测试，大大提升了测试的有效性" },
          { text: "CI/CD Pipeline测试阶段从30~50分钟缩短至10分钟以内，需求Bug返工率降低约40%" },
          { text: "主导设计微服务技术工作坊，通过业务场景驱动从0到1搭建微服务架构，深度学习Spring Cloud原理和实战，包括服务注册和发现、负载均衡、配置中心、限流和熔断，服务运维监控" },
        ],
        techs: [
          { name: "Java 8" },
          { name: "Spring Cloud" },
          { name: "Consul" },
          { name: "Hystrix" },
          { name: "MongoDB" },
          { name: "MySQL" },
          { name: "GoCD" },
          { name: "Docker" },
          { name: "Redis" },
          { name: "React Native" },
          { name: "ELK" },
          { name: "K8S" },
        ],
      },
    ],
  },
  extras: {
    id: "extras",
    heading: "兴趣爱好",
    groups: [
      {
        title: "著作发表",
        items: [
          {
            type: "link",
            label: "整洁软件设计",
            href: "https://www.yuque.com/yuanshenjian/agile-software-design",
          },
          {
            type: "link",
            label: "敏捷那些事儿",
            href: "https://www.yuque.com/yuanshenjian/agile-things",
          },
          {
            type: "link",
            label: "我敏捷了吗？",
            href: "https://www.yuque.com/yuanshenjian/my-tw-10-years",
          },
        ],
      },
      {
        title: "运动健身",
        items: [
          { type: "text", label: "CBBA高级健身教练" },
          { type: "text", label: "极限健身实践者" },
          { type: "text", label: "擅长心肺体能训练" },
        ],
      },
      {
        title: "理财投资",
        items: [
          { type: "text", label: "长线主义" },
          { type: "text", label: "逆向投资者" },
          { type: "text", label: "聚焦中国优质资产" },
        ],
      },
    ],
  },
};

module.exports = {
  authorProfileData,
};
