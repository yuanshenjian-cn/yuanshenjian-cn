#!/usr/bin/env python3
"""
Resume Builder 自测脚本 - 验证skill的逻辑自洽性
"""

import sys
import tempfile
import shutil
from pathlib import Path

# 添加skill路径
skill_dir = Path(__file__).parent.parent
sys.path.insert(0, str(skill_dir / "scripts"))

from build import ResumeBuilder


def test_skill():
    """测试skill完整性"""
    print("=" * 60)
    print("Resume Builder Skill 自测")
    print("=" * 60)

    # 1. 检查必要文件
    print("\n[1/6] 检查必要文件...")
    required_files = [
        "SKILL.md",
        "README.md",
        "scripts/build.py",
        "template.html",
        "sections/introduction.md",
        "sections/skills.md",
        "sections/education.md",
        "sections/experience.md",
        "sections/projects.md",
        "sections/hobbies.md",
    ]

    all_exist = True
    for file in required_files:
        file_path = skill_dir / file
        if file_path.exists():
            print(f"  ✓ {file}")
        else:
            print(f"  ✗ {file} (缺失)")
            all_exist = False

    if not all_exist:
        print("\n❌ 缺少必要文件，测试终止")
        return False

    # 2. 测试默认模板
    print("\n[2/6] 测试默认模板...")
    template_path = skill_dir / "template.html"
    if template_path.exists():
        template_content = template_path.read_text(encoding="utf-8")
        placeholders = [
            "{{NAME}}",
            "{{JOB_TITLE}}",
            "{{INITIALS}}",
            "{{PHONE}}",
            "{{EMAIL}}",
            "{{SUMMARY}}",
            "{{SKILL_CARDS}}",
            "{{CERTIFICATES}}",
            "{{SCHOOL_NAME}}",
            "{{SCHOOL_URL}}",
            "{{MAJOR}}",
            "{{EDU_DATE}}",
            "{{TIMELINE_ITEMS}}",
            "{{PROJECT_CARDS}}",
            "{{PUBLICATIONS}}",
            "{{FITNESS}}",
            "{{INVESTMENT}}",
        ]
        missing = [p for p in placeholders if p not in template_content]
        if missing:
            print(f"  ✗ 模板缺少占位符: {', '.join(missing)}")
            return False
        else:
            print(f"  ✓ 模板包含所有 {len(placeholders)} 个占位符")

    # 3. 测试Markdown解析
    print("\n[3/6] 测试Markdown解析...")
    sections_source = skill_dir / "sections"

    # 创建临时目录进行测试
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # 复制sections到临时目录
        for md_file in sections_source.glob("*.md"):
            shutil.copy2(md_file, tmp_path / md_file.name)

        # 测试解析
        config = {
            "sections_dir": str(tmp_path),
            "template_file": str(template_path),
            "output_file": str(tmp_path / "test_output.html"),
        }

        builder = ResumeBuilder(config)

        try:
            if builder.load_sections():
                print("  ✓ 成功加载所有sections")

                # 检查解析的数据结构
                checks = []

                # 检查introduction
                intro = builder.data.get("introduction", {})
                if "基本信息" in intro and "items" in intro.get("基本信息", {}):
                    checks.append("introduction结构正确")

                # 检查skills
                skills = builder.data.get("skills", {})
                if "核心技能" in skills:
                    checks.append("skills结构正确")

                # 检查education
                edu = builder.data.get("education", {})
                school_keys = [k for k in edu.keys() if k != "title"]
                if school_keys:
                    checks.append("education结构正确")

                # 检查experience
                exp = builder.data.get("experience", {})
                jobs = [k for k in exp.keys() if k != "title"]
                if jobs:
                    checks.append(f"experience包含 {len(jobs)} 段经历")

                # 检查projects
                projects = builder.data.get("projects", {})
                proj_names = [k for k in projects.keys() if k != "title"]
                if proj_names:
                    checks.append(f"projects包含 {len(proj_names)} 个项目")

                # 检查hobbies
                hobbies = builder.data.get("hobbies", {})
                hobby_sections = [k for k in hobbies.keys() if k != "title"]
                if hobby_sections:
                    checks.append(f"hobbies包含 {len(hobby_sections)} 个类别")

                for check in checks:
                    print(f"    ✓ {check}")
            else:
                print("  ✗ 加载sections失败")
                return False
        except Exception as e:
            print(f"  ✗ 解析错误: {e}")
            import traceback

            traceback.print_exc()
            return False

    # 4. 测试HTML生成
    print("\n[4/6] 测试HTML生成...")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # 准备测试环境
        sections_dir = tmp_path / "sections"
        sections_dir.mkdir()

        for md_file in sections_source.glob("*.md"):
            shutil.copy2(md_file, sections_dir / md_file.name)

        config = {
            "sections_dir": str(sections_dir),
            "template_file": str(template_path),
            "output_file": str(tmp_path / "resume.html"),
        }

        builder = ResumeBuilder(config)

        try:
            html = builder.generate()

            # 检查生成的HTML
            if "{{NAME}}" in html or "{{" in html:
                print("  ✗ HTML中仍有未替换的占位符")
                # 找出未替换的占位符
                import re

                unmatched = re.findall(r"\{\{[A-Z_]+\}\}", html)
                if unmatched:
                    print(f"    未替换: {', '.join(list(set(unmatched))[:5])}")
                return False
            else:
                print("  ✓ 所有占位符已正确替换")

            # 检查文件是否生成
            output_file = tmp_path / "resume.html"
            if output_file.exists():
                size = output_file.stat().st_size
                print(f"  ✓ 输出文件生成成功 ({size} bytes)")
            else:
                print("  ✗ 输出文件未生成")
                return False

        except Exception as e:
            print(f"  ✗ 生成错误: {e}")
            import traceback

            traceback.print_exc()
            return False

    # 5. 测试备份功能
    print("\n[5/6] 测试备份功能...")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # 创建现有文件
        existing_file = tmp_path / "index.html"
        existing_file.write_text("<html>old</html>")

        # 准备环境
        sections_dir = tmp_path / "sections"
        sections_dir.mkdir()
        for md_file in sections_source.glob("*.md"):
            shutil.copy2(md_file, sections_dir / md_file.name)

        config = {
            "sections_dir": str(sections_dir),
            "template_file": str(template_path),
            "output_file": str(existing_file),
        }

        builder = ResumeBuilder(config)

        try:
            builder.update()

            # 检查备份
            backup_file = tmp_path / "index.html.backup"
            if backup_file.exists():
                print("  ✓ 备份文件创建成功")
            else:
                print("  ⚠ 备份文件未创建（可能backup=false）")

            # 检查新文件
            if existing_file.exists():
                content = existing_file.read_text()
                if "old" not in content and "袁慎建" in content:
                    print("  ✓ 文件更新成功")
                else:
                    print("  ✗ 文件内容未正确更新")
                    return False

        except Exception as e:
            print(f"  ✗ 更新错误: {e}")
            import traceback

            traceback.print_exc()
            return False

    # 6. 测试预览功能
    print("\n[6/6] 测试预览功能...")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        sections_dir = tmp_path / "sections"
        sections_dir.mkdir()
        for md_file in sections_source.glob("*.md"):
            shutil.copy2(md_file, sections_dir / md_file.name)

        config = {
            "sections_dir": str(sections_dir),
        }

        builder = ResumeBuilder(config)

        try:
            # 预览不应该抛出异常
            builder.preview()
            print("  ✓ 预览功能正常")
        except Exception as e:
            print(f"  ✗ 预览错误: {e}")
            return False

    print("\n" + "=" * 60)
    print("✅ 所有测试通过！Skill逻辑自洽")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_skill()
    sys.exit(0 if success else 1)
