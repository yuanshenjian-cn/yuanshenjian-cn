#!/bin/bash
set -euo pipefail

CORE_URL="http://localhost:8001"
ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"
ORIGIN="http://localhost:5173"

echo '创建术语: 研发效能'
curl -s   -X POST 'http://localhost:8001/api/v1/admin/knowledge-terms'   -H "Content-Type: application/json"   -H 'Origin: http://localhost:5173'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"研发效能","aliases":["Engineering Productivity","研发提效"],"definition":"衡量并持续提升研发团队从需求到交付全过程效率与质量的能力。","explanation":"研发效能关注的不只是“写代码快不快”，而是需求流转、开发、测试、发布、反馈整个链路能否更稳定、更高质量地交付结果。它通常会看交付周期、发布频率、缺陷率、返工率和等待时间等指标。一个典型例子是通过改进需求拆分、自动化测试和发布流水线，把一次功能上线从两周缩短到几天，同时降低回滚和线上故障概率。","related_article_slugs":[],"domains":["author"],"scenes":["author"],"status":"enabled","notes":"作者页术语补充。","updated_by":"opencode"}'
echo

echo '更新术语: 敏捷开发'
curl -s   -X PUT 'http://localhost:8001/api/v1/admin/knowledge-terms/7cb5ecc7-4c66-4f6e-8de1-95eca1fb714a'   -H "Content-Type: application/json"   -H 'Origin: http://localhost:5173'   -H "Authorization: Bearer ${ADMIN_API_KEY}"   -d '{"term":"敏捷开发","aliases":["Agile Development","敏捷"],"definition":"通过小步迭代和快速反馈交付价值的软件开发方法。","explanation":"敏捷开发是一种以人为核心、迭代演进的软件开发方式，强调小批量交付、持续反馈和响应变化。关键要点包括：1）将大需求拆分为可在短周期内完成的增量；2）通过每日站会、迭代评审等机制保持团队同步；3）优先交付高价值功能以尽早验证假设。典型场景是需求频繁变化的互联网产品团队。例如，一个电商团队每两周发布一次可购物的增量版本，根据用户点击数据调整下一迭代的优先级，而不是一次性开发完整平台再上线。","related_article_slugs":["summary-for-2015","a-different-journey-in-thoughtworks","summary-for-2016"],"domains":["article","author"],"scenes":["article","author"],"status":"enabled","notes":"扩展到作者页术语高亮。","updated_by":"opencode"}'
echo

echo "术语库同步完成"
