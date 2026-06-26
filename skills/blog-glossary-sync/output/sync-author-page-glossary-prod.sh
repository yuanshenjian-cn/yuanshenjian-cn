#!/bin/bash
set -euo pipefail

CORE_URL="https://api.yuanshenjian.cn"
ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"
ORIGIN="https://admin.yuanshenjian.cn"

echo '创建术语: XP'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"XP","aliases":["Extreme Programming","极限编程"],"definition":"一种强调工程实践与快速反馈的软件开发方法，常与 Scrum 等敏捷框架配合使用。","explanation":"XP（Extreme Programming，极限编程）是一套以工程质量和快速反馈为核心的软件开发方法。它强调结对编程、测试驱动开发、持续集成、重构、简单设计和小步快跑，以降低需求变化带来的风险。作者在简历里提到精通 XP，主要是强调其在敏捷交付之外，也长期深度实践面向工程质量的具体技术方法。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自技能与项目经历。","updated_by":"opencode"}'
echo

echo '创建术语: DDD'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"DDD","aliases":["Domain-Driven Design","领域驱动设计"],"definition":"一种围绕领域模型组织复杂业务软件设计与实现的方法。","explanation":"DDD（领域驱动设计）强调先理解业务领域，再通过统一语言、领域模型、边界上下文、聚合等概念，把复杂业务规则稳定地映射到软件系统中。作者在作者页中多次提到 DDD 和 DDD 分层架构，意在表达其不仅做技术实现，也能承担复杂业务建模、系统边界划分和架构设计工作。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自技能与多个项目亮点。","updated_by":"opencode"}'
echo

echo '创建术语: LangGraph'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"LangGraph","aliases":[],"definition":"一个用于编排多步骤 LLM 与 Agent 工作流的开发框架。","explanation":"LangGraph 是面向 Agent 和多步骤 LLM 流程编排的框架，适合表达节点、状态、分支和循环等复杂执行路径。作者在作者页中把它与 Spring AI、MCP、RAG 一起列出，说明其在 AI Agent 应用开发上不仅关注模型调用，还关注工作流编排、状态管理和可控执行。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；用于解释 AI Agent 技术栈。","updated_by":"opencode"}'
echo

echo '创建术语: RAG'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"RAG","aliases":["Retrieval-Augmented Generation","检索增强生成"],"definition":"一种把外部知识检索与大模型生成结合起来的 AI 应用模式。","explanation":"RAG（检索增强生成）通过先检索相关知识，再把检索结果作为上下文交给大模型生成答案，从而提升回答的准确性、时效性和可解释性。作者在作者页中提到动态 RAG、RAG 等能力，主要是表达其具备将知识库、搜索与大模型应用整合起来的实践经验，而不是只会单轮调用模型接口。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；用于解释 AI 应用设计能力。","updated_by":"opencode"}'
echo

echo '创建术语: Prompt Engineering'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Prompt Engineering","aliases":["提示词工程"],"definition":"围绕提示设计、上下文组织和输出约束来提升模型结果质量的方法。","explanation":"提示词工程不只是写一句提示语，而是系统地设计角色、上下文、示例、约束、结构化输出和调用链路，让模型在特定业务任务中更稳定地产出高质量结果。作者在作者页中提到熟练运用提示词工程，意味着其关注模型使用的工程化落地，而不是把 AI 当作纯聊天工具。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；用于解释 AI 工程实践。","updated_by":"opencode"}'
echo

echo '创建术语: VSM'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"VSM","aliases":["Value Stream Mapping","价值流图"],"definition":"一种分析端到端交付流程、识别瓶颈和浪费的改进方法。","explanation":"VSM（价值流图）常用于研发效能与流程改进，通过把需求从提出到交付的全过程可视化，识别等待、返工、切换和审批等低效环节。作者在简历里提到使用 VSM 调研交付组瓶颈，这说明其在效能提升工作中不是凭经验拍脑袋，而是通过结构化诊断来定位问题并推动改进。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自研发效能项目经历。","updated_by":"opencode"}'
echo

echo '创建术语: Chat Memory'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Chat Memory","aliases":["会话记忆"],"definition":"让 AI 系统在多轮对话中持续保留并利用用户上下文信息的能力。","explanation":"Chat Memory 指的是 AI 系统在多轮对话中记住用户偏好、目标、背景和历史上下文，并在后续交互中继续使用这些信息。它通常涉及会话状态管理、长期记忆抽取、召回和权限边界控制。作者在项目经历中把 Chat Memory 作为企业级能力提出，说明其做过可落地的 AI 产品能力设计，而不仅是简单接入聊天接口。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自 AI 项目经历。","updated_by":"opencode"}'
echo

echo '创建术语: SAFe'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"SAFe","aliases":["SAFe 6.0","Scaled Agile Framework"],"definition":"一种面向大型组织协同交付的规模化敏捷框架。","explanation":"SAFe（Scaled Agile Framework）用于帮助大型组织在多个团队、多条价值流和复杂治理约束下实施规模化敏捷协作。它常涉及 ART、PI Planning、跨团队对齐和组织级治理。作者在保时捷 Super App 经历中提到 SAFe 6.0，主要是强调其有在大型复杂组织环境里推动敏捷与架构落地的经验，而不仅是在小团队内做单点实践。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自大型组织交付经历。","updated_by":"opencode"}'
echo

echo '创建术语: Pre-Prod'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Pre-Prod","aliases":["预生产环境","Pre Production"],"definition":"上线前用于集成验证和风险预演的预生产环境。","explanation":"Pre-Prod 通常指与生产环境尽量接近、但不直接对真实用户开放的预生产环境，用于做端到端联调、性能验证、发布演练和质量把关。作者在项目经历中提到设计 App 端 Pre-Prod 集成测试方案，体现其不仅关注代码开发，也重视交付链路中的发布质量控制。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自交付质量与测试体系实践。","updated_by":"opencode"}'
echo

echo '创建术语: Agentic Agile Delivery'
curl -s   -X POST 'https://api.yuanshenjian.cn/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: https://admin.yuanshenjian.cn'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"Agentic Agile Delivery","aliases":["aa-delivery","Agentic Agile Delivery process"],"definition":"一种把敏捷交付流程拆解为可编排 Agent 工作单元的 AI 原生交付框架。","explanation":"Agentic Agile Delivery 是作者在开源项目和实践中反复强调的一种交付思路：把需求、设计、实现、验证、验收等环节结构化，并交给不同 Agent 或工作流协同完成，从而提升 AI 参与研发时的可控性、质量和可追踪性。作者页中提到 aa-delivery 和相关 OpenCode 插件，主要是为了表达其在 AI 时代重构研发流程的实践方向。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页候选术语；来自作者自有方法论与开源项目。","updated_by":"opencode"}'
echo

echo "术语库同步完成"
