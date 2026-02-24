#!/usr/bin/env python3
"""
Resume Builder - 简历生成器
根据sections/目录下的markdown文件生成或更新简历HTML

Usage:
    python build.py generate [--template FILE] [--output FILE]
    python build.py update [--template FILE] [--output FILE]
    python build.py preview
    python build.py validate
"""

import re
import sys
import json
import shutil
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any


class ResumeBuilder:
    """简历构建器"""

    def __init__(self, config: Optional[Dict] = None):
        """初始化配置"""
        self.config = {
            "sections_dir": "./sections",
            "template_file": "./template.html",
            "output_file": "./index.html",
            "images_dir": "./images",
            "backup": True,
        }
        if config:
            self.config.update(config)

        # 加载自定义配置
        self._load_custom_config()

        self.data: Dict[str, Any] = {}

    def _load_custom_config(self):
        """加载自定义配置文件"""
        config_file = Path("resume.config.json")
        if config_file.exists():
            try:
                with open(config_file, "r", encoding="utf-8") as f:
                    custom_config = json.load(f)
                    self.config.update(custom_config)
                    print(f"✓ 已加载自定义配置: {config_file}")
            except Exception as e:
                print(f"⚠ 配置文件读取失败: {e}")

    def _get_skill_dir(self) -> Path:
        """获取skill目录路径"""
        # 脚本所在目录向上两级就是skill根目录
        script_dir = Path(__file__).parent
        return script_dir.parent

    def parse_markdown(self, content: str) -> Dict:
        """解析markdown内容"""
        lines = content.split("\n")
        result: Dict[str, Any] = {}
        current_section: Optional[str] = None
        current_subsection: Optional[str] = None
        current_list: List[str] = []

        i = 0
        while i < len(lines):
            line = lines[i].rstrip()

            # 跳过空行
            if not line.strip():
                i += 1
                continue

            stripped = line.strip()

            # 一级标题
            if stripped.startswith("# ") and not stripped.startswith("## "):
                result["title"] = stripped[2:].strip()

            # 二级标题
            elif stripped.startswith("## "):
                # 保存之前的列表
                if current_section and current_list:
                    if current_subsection:
                        result[current_section][current_subsection] = current_list
                    else:
                        if "items" not in result[current_section]:
                            result[current_section]["items"] = []
                        result[current_section]["items"].extend(current_list)
                    current_list = []

                current_section = stripped[3:].strip()
                result[current_section] = {}
                current_subsection = None

            # 三级标题
            elif stripped.startswith("### "):
                # 保存之前的列表
                if current_section and current_list:
                    if current_subsection:
                        result[current_section][current_subsection] = current_list
                    else:
                        if "items" not in result[current_section]:
                            result[current_section]["items"] = []
                        result[current_section]["items"].extend(current_list)
                    current_list = []

                current_subsection = stripped[4:].strip()
                if current_section:
                    result[current_section][current_subsection] = []

            # 列表项
            elif stripped.startswith("- "):
                item = stripped[2:].strip()
                current_list.append(self._parse_formatting(item))

            # 段落文字（包含**加粗**格式）
            elif current_section and stripped.startswith("**"):
                match = re.match(r"\*\*(.+?)\*\*[：:]\s*(.+)", stripped)
                if match:
                    key, value = match.groups()
                    section_data = result.get(current_section, {})
                    if "paragraphs" not in section_data:
                        section_data["paragraphs"] = {}
                    section_data["paragraphs"][key] = value

            # 分隔符（项目之间）
            elif stripped == "---":
                if current_section and current_list:
                    if current_subsection:
                        result[current_section][current_subsection] = current_list
                    else:
                        if "items" not in result[current_section]:
                            result[current_section]["items"] = []
                        result[current_section]["items"].extend(current_list)
                    current_list = []

            i += 1

        # 处理最后的列表
        if current_section and current_list:
            if current_subsection:
                result[current_section][current_subsection] = current_list
            else:
                if "items" not in result[current_section]:
                    result[current_section]["items"] = []
                result[current_section]["items"].extend(current_list)

        return result

    def _parse_formatting(self, text: str) -> str:
        """解析文本格式（加粗、斜体、链接等）"""
        # 加粗 **text**
        text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
        # 斜体 *text*
        text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
        # Markdown 链接 [text](url)
        text = re.sub(
            r"\[([^\]]+)\]\(([^)]+)\)",
            r'<a href="\2" target="_blank" rel="noopener noreferrer"><span class="link-icon">🔗</span><span class="link-text">\1</span></a>',
            text,
        )
        return text

    def load_sections(self) -> bool:
        """加载所有section文件，返回是否成功"""
        sections = [
            "introduction",
            "skills",
            "education",
            "experience",
            "projects",
            "hobbies",
        ]
        sections_dir = Path(self.config["sections_dir"])

        missing_files = []

        for section in sections:
            file_path = sections_dir / f"{section}.md"
            if file_path.exists():
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    self.data[section] = self.parse_markdown(content)
                    print(f"✓ 已加载: {file_path}")
                except Exception as e:
                    print(f"✗ 加载失败 {file_path}: {e}")
                    missing_files.append(str(file_path))
            else:
                print(f"✗ 文件不存在: {file_path}")
                missing_files.append(str(file_path))

        if missing_files:
            print(f"\n⚠ 缺少 {len(missing_files)} 个必要文件")
            return False

        return True

    def generate_skill_cards(self) -> str:
        """生成技能卡片HTML"""
        skills = self.data.get("skills", {})
        if not skills or "核心技能" not in skills:
            return ""

        core_skills = skills["核心技能"]
        level_classes = {
            "精通级别": "master",
            "熟练级别": "proficient",
            "熟悉级别": "familiar",
        }

        html_parts: List[str] = []

        for level in ["精通级别", "熟练级别", "熟悉级别"]:
            if level in core_skills:
                for skill in core_skills[level]:
                    # 解析技能名称和描述
                    match = re.match(r"<strong>(.+?)</strong>[：:](.+)", skill)
                    if match:
                        name, desc = match.groups()
                        initial = name[0].upper()
                        html_parts.append(
                            f'<div class="skill-card {level_classes.get(level, "familiar")}">\n'
                            f'    <h4><span class="skill-icon">{initial}</span>{name}</h4>\n'
                            f"    <p>{desc}</p>\n"
                            f"</div>"
                        )

        return "\n".join(html_parts)

    def generate_certificates(self) -> str:
        """生成证书列表HTML"""
        skills = self.data.get("skills", {})
        certs = skills.get("专业认证", [])

        return "\n                ".join(
            f'<span class="cert-item">{cert}</span>' for cert in certs
        )

    def generate_timeline(self) -> str:
        """生成工作经历时间线HTML"""
        exp = self.data.get("experience", {})
        if not exp:
            return ""

        # 获取所有工作经历（排除title）
        jobs = [k for k in exp.keys() if k != "title"]
        html_parts: List[str] = []

        for job in jobs:
            job_data = exp[job]
            paragraphs = job_data.get("paragraphs", {})
            items = job_data.get("items", [])

            # 从键名中提取时间（如果paragraphs中没有）
            time_period = paragraphs.get("时间", "")

            # 构建内容
            content_parts: List[str] = []

            # 如果有纯文本段落
            if paragraphs.get("text"):
                content_parts.append(f"<p>{paragraphs['text']}</p>")

            # 如果有列表项
            if items:
                content_parts.append("<ul>")
                for item in items:
                    # 移除strong标签用于列表显示
                    clean_item = re.sub(r"<strong>(.+?)</strong>", r"\1", item)
                    content_parts.append(f"<li>{clean_item}</li>")
                content_parts.append("</ul>")

            content_html = "\n                    ".join(content_parts)

            html_parts.append(
                f'<div class="timeline-item">\n'
                f'    <div class="timeline-period">{time_period}</div>\n'
                f'    <h3 class="timeline-title">{job}</h3>\n'
                f'    <div class="timeline-content">\n'
                f"        {content_html}\n"
                f"    </div>\n"
                f"</div>"
            )

        return "\n".join(html_parts)

    def generate_projects(self) -> str:
        """生成项目卡片HTML"""
        projects = self.data.get("projects", {})
        if not projects:
            return ""

        project_names = [k for k in projects.keys() if k != "title"]
        html_parts: List[str] = []

        for idx, proj_name in enumerate(project_names, 1):
            proj = projects[proj_name]
            paragraphs = proj.get("paragraphs", {})

            time = paragraphs.get("时间", "")
            role = paragraphs.get("角色", "")
            desc = paragraphs.get("项目描述", "")
            tech_stack = paragraphs.get("技术栈", "")

            achievements = proj.get("核心成果", [])
            responsibilities = (
                proj.get("主要职责和贡献", [])
                or proj.get("核心职责和成果", [])
                or proj.get("核心职责", [])
            )

            # 生成成果列表
            achievements_html = "\n                        ".join(
                f"<li>{self._highlight_metrics(item)}</li>" for item in achievements
            )

            # 生成职责列表
            responsibilities_html = "\n                        ".join(
                f"<li>{item}</li>" for item in responsibilities
            )

            # 生成技术栈标签
            tech_html = ""
            if tech_stack:
                techs = [t.strip() for t in tech_stack.split(",")]
                tech_html = "\n                    ".join(
                    f'<span class="tech-tag">{tech}</span>' for tech in techs
                )
                tech_html = f'<div class="tech-stack">\n                    {tech_html}\n                </div>'

            html_parts.append(
                f"<!-- 项目{idx}: {proj_name.split()[0]} -->\n"
                f'<div class="project-card fade-in">\n'
                f'    <div class="project-header">\n'
                f'        <div class="project-header-left">\n'
                f'            <div class="project-period">{time}</div>\n'
                f'            <h3 class="project-name">{proj_name}</h3>\n'
                f'            <p class="project-role">{role}</p>\n'
                f"        </div>\n"
                f'        <div class="project-header-right">\n'
                f'            <div class="project-achievements">\n'
                f"                <h4>核心成果</h4>\n"
                f"                <ul>\n"
                f"                    {achievements_html}\n"
                f"                </ul>\n"
                f"            </div>\n"
                f"        </div>\n"
                f"    </div>\n"
                f'    <div class="project-body">\n'
                f'        <p class="project-desc">{desc}</p>\n'
                f'        <div class="project-highlights">\n'
                f"            <h4>主要职责和贡献</h4>\n"
                f"            <ul>\n"
                f"                {responsibilities_html}\n"
                f"            </ul>\n"
                f"        </div>\n"
                f"        {tech_html}\n"
                f"    </div>\n"
                f"</div>"
            )

        return "\n\n".join(html_parts)

    def _highlight_metrics(self, text: str) -> str:
        """高亮数字和百分比"""
        # 高亮数字、百分比、加号等
        return re.sub(
            r"(\d+%?|\d+\+?)", r'<span class="metric-highlight">\1</span>', text
        )

    def generate_hobbies(self) -> Dict[str, str]:
        """生成兴趣爱好HTML"""
        hobbies = self.data.get("hobbies", {})

        # 著作发表 - 处理可能的数据结构（列表或字典包含items）
        publications_raw = hobbies.get("著作发表", [])
        if isinstance(publications_raw, dict):
            publications = publications_raw.get("items", [])
        else:
            publications = publications_raw
        pubs_html: List[str] = []
        for item in publications:
            if "微信公众号" in item:
                pubs_html.append(
                    '<li class="wechat-item">\n'
                    "    微信公众号\n"
                    '    <div class="qrcode-container">\n'
                    '        <img src="images/ysj-qrcode.jpg" class="qrcode-img">\n'
                    '        <span class="qrcode-hint">扫码关注</span>\n'
                    "    </div>\n"
                    "</li>"
                )
            else:
                # 解析 Markdown 链接和格式
                parsed_item = self._parse_formatting(item)
                # 如果已经包含 <a> 标签（链接已解析），直接使用
                if "<a" in parsed_item:
                    pubs_html.append(f"<li>{parsed_item}</li>")
                else:
                    # 普通文本，包装成链接样式
                    pubs_html.append(
                        f'<li><a href="#" target="_blank" rel="noopener noreferrer">'
                        f'<span class="link-icon">🔗</span><span class="link-text">{parsed_item}</span></a></li>'
                    )

        # 运动健身
        fitness_raw = hobbies.get("运动健身", [])
        if isinstance(fitness_raw, dict):
            fitness = fitness_raw.get("items", [])
        else:
            fitness = fitness_raw
        fitness_html = [f"<li>{self._parse_formatting(item)}</li>" for item in fitness]

        # 理财投资
        investment_raw = hobbies.get("理财投资", [])
        if isinstance(investment_raw, dict):
            investment = investment_raw.get("items", [])
        else:
            investment = investment_raw
        investment_html = [
            f"<li>{self._parse_formatting(item)}</li>" for item in investment
        ]

        return {
            "publications": "\n                        ".join(pubs_html),
            "fitness": "\n                        ".join(fitness_html),
            "investment": "\n                        ".join(investment_html),
        }

    def _get_default_template(self) -> str:
        """获取默认模板"""
        # 首先查找skill目录下的默认模板（根目录）
        skill_dir = self._get_skill_dir()
        default_template = skill_dir / "template.html"

        if default_template.exists():
            return default_template.read_text(encoding="utf-8")

        # 如果没有默认模板，返回错误
        raise FileNotFoundError(
            f"未找到模板文件: {self.config['template_file']}\n"
            f"也未找到默认模板: {default_template}\n"
            "请提供template.html或使用--template指定模板路径"
        )

    def generate(self) -> str:
        """生成完整简历"""
        # 加载sections
        if not self.load_sections():
            raise ValueError("无法加载所有必要的sections文件")

        # 读取模板
        template_path = Path(self.config["template_file"])
        if not template_path.exists():
            # 使用skill内置的默认模板
            template = self._get_default_template()
            print(f"⚠ 未找到 {self.config['template_file']}，使用skill内置默认模板")
        else:
            template = template_path.read_text(encoding="utf-8")

        # 提取基本信息
        intro = self.data.get("introduction", {})
        basic_info = intro.get("基本信息", {}).get("items", [])

        info = {"姓名": "", "职位": "", "电话": "", "邮箱": ""}
        for item in basic_info:
            match = re.match(r"<strong>(.+?)</strong>[：:](.+)", item)
            if match:
                key, value = match.groups()
                if key in info:
                    info[key] = value.strip()

        # 个人总结
        summary_paragraphs = intro.get("个人总结", {}).get("paragraphs", {})
        summary = summary_paragraphs.get("text", "")

        # 生成缩写
        initials = "".join(c[0].upper() for c in info["姓名"]) if info["姓名"] else ""

        # 教育信息
        edu = self.data.get("education", {})
        school_keys = [k for k in edu.keys() if k != "title"]
        school_name = school_keys[0] if school_keys else ""
        school_data = edu.get(school_name, {})
        edu_paragraphs = school_data.get("paragraphs", {})

        # 生成兴趣爱好
        hobbies_data = self.generate_hobbies()

        # 替换占位符
        replacements = {
            "{{NAME}}": info["姓名"],
            "{{JOB_TITLE}}": info["职位"],
            "{{INITIALS}}": initials,
            "{{PHONE}}": info["电话"],
            "{{EMAIL}}": info["邮箱"],
            "{{SUMMARY}}": summary,
            "{{SKILL_CARDS}}": self.generate_skill_cards(),
            "{{CERTIFICATES}}": self.generate_certificates(),
            "{{SCHOOL_NAME}}": school_name,
            "{{SCHOOL_URL}}": edu_paragraphs.get("学校官网", "#"),
            "{{MAJOR}}": edu_paragraphs.get("专业", ""),
            "{{EDU_DATE}}": edu_paragraphs.get("时间", ""),
            "{{TIMELINE_ITEMS}}": self.generate_timeline(),
            "{{PROJECT_CARDS}}": self.generate_projects(),
            "{{PUBLICATIONS}}": hobbies_data["publications"],
            "{{FITNESS}}": hobbies_data["fitness"],
            "{{INVESTMENT}}": hobbies_data["investment"],
        }

        # 执行替换
        for placeholder, value in replacements.items():
            template = template.replace(placeholder, str(value))

        # 保存文件
        output_path = Path(self.config["output_file"])
        output_path.write_text(template, encoding="utf-8")
        print(f"\n✅ 简历已生成: {output_path.absolute()}")

        return template

    def update(self) -> str:
        """更新现有简历（自动备份）"""
        output_path = Path(self.config["output_file"])

        # 备份
        if output_path.exists() and self.config.get("backup", True):
            backup_suffix = self.config.get("backup_suffix", ".backup")
            backup_path = output_path.with_suffix(f".html{backup_suffix}")
            shutil.copy2(output_path, backup_path)
            print(f"📦 已备份原文件: {backup_path}")

        # 重新生成
        return self.generate()

    def preview(self):
        """预览变更"""
        if not self.load_sections():
            print("⚠ 无法加载所有sections，预览可能不完整")
            return

        print("\n" + "=" * 60)
        print("📋 简历内容预览")
        print("=" * 60)

        # 基本信息
        intro = self.data.get("introduction", {})
        basic = intro.get("基本信息", {}).get("items", [])
        print("\n【基本信息】")
        for item in basic:
            clean = re.sub(r"<strong>(.+?)</strong>", r"\1", item)
            print(f"  • {clean}")

        # 技能
        skills = self.data.get("skills", {})
        core_skills = skills.get("核心技能", {})
        print(f"\n【技能】")
        for level in ["精通级别", "熟练级别", "熟悉级别"]:
            if level in core_skills:
                print(f"  {level}: {len(core_skills[level])} 项")

        certs = skills.get("专业认证", [])
        print(f"  证书: {len(certs)} 个")

        # 教育
        edu = self.data.get("education", {})
        school_keys = [k for k in edu.keys() if k != "title"]
        print(f"\n【教育】")
        for school in school_keys:
            print(f"  • {school}")

        # 经历
        exp = self.data.get("experience", {})
        jobs = [k for k in exp.keys() if k != "title"]
        print(f"\n【工作经历】 {len(jobs)} 段")
        for job in jobs:
            print(f"  • {job}")

        # 项目
        projects = self.data.get("projects", {})
        proj_names = [k for k in projects.keys() if k != "title"]
        print(f"\n【项目经验】 {len(proj_names)} 个")
        for proj in proj_names:
            print(f"  • {proj}")

        # 爱好
        hobbies = self.data.get("hobbies", {})
        hobby_sections = [k for k in hobbies.keys() if k != "title"]
        print(f"\n【兴趣爱好】 {len(hobby_sections)} 类")
        for h in hobby_sections:
            items = hobbies.get(h, [])
            print(f"  • {h}: {len(items)} 项")

        print("\n" + "=" * 60)
        print("✨ 执行 'generate' 或 'update' 命令可生成实际文件")
        print("=" * 60)

    def validate(self) -> bool:
        """验证sections格式"""
        print("\n🔍 验证sections格式...")

        if not self.load_sections():
            print("✗ 验证失败：缺少必要文件")
            return False

        errors = []

        # 验证introduction
        intro = self.data.get("introduction", {})
        if "基本信息" not in intro:
            errors.append("introduction.md 缺少 '基本信息' 部分")
        if "个人总结" not in intro:
            errors.append("introduction.md 缺少 '个人总结' 部分")

        # 验证skills
        skills = self.data.get("skills", {})
        if "核心技能" not in skills:
            errors.append("skills.md 缺少 '核心技能' 部分")
        if "专业认证" not in skills:
            errors.append("skills.md 缺少 '专业认证' 部分")

        # 验证education
        edu = self.data.get("education", {})
        school_keys = [k for k in edu.keys() if k != "title"]
        if not school_keys:
            errors.append("education.md 缺少学校信息")

        # 验证experience
        exp = self.data.get("experience", {})
        jobs = [k for k in exp.keys() if k != "title"]
        if not jobs:
            errors.append("experience.md 缺少工作经历")

        # 验证projects
        projects = self.data.get("projects", {})
        proj_names = [k for k in projects.keys() if k != "title"]
        if not proj_names:
            errors.append("projects.md 缺少项目信息")

        if errors:
            print("\n✗ 发现以下问题：")
            for error in errors:
                print(f"  • {error}")
            return False
        else:
            print("\n✅ 所有sections格式正确！")
            return True


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="Resume Builder - 简历生成器",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python build.py generate                    # 生成新简历
  python build.py update                      # 更新现有简历（自动备份）
  python build.py preview                     # 预览内容
  python build.py validate                    # 验证格式
  python build.py generate --template custom.html --output resume.html
        """,
    )

    parser.add_argument(
        "command",
        choices=["generate", "update", "preview", "validate"],
        help="要执行的命令",
    )

    parser.add_argument(
        "--template",
        "-t",
        default="./template.html",
        help="HTML模板文件路径 (默认: ./template.html，未找到则使用skill内置模板)",
    )

    parser.add_argument(
        "--output",
        "-o",
        default="./index.html",
        help="输出文件路径 (默认: ./index.html)",
    )

    parser.add_argument(
        "--sections",
        "-s",
        default="./sections",
        help="sections目录路径 (默认: ./sections)",
    )

    parser.add_argument("--no-backup", action="store_true", help="更新时不备份原文件")

    args = parser.parse_args()

    # 创建builder实例
    config = {
        "sections_dir": args.sections,
        "template_file": args.template,
        "output_file": args.output,
        "backup": not args.no_backup,
    }

    builder = ResumeBuilder(config)

    try:
        if args.command == "generate":
            builder.generate()
        elif args.command == "update":
            builder.update()
        elif args.command == "preview":
            builder.preview()
        elif args.command == "validate":
            builder.validate()
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
