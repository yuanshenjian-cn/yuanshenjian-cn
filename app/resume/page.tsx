import { Metadata } from "next";
import { ResumeHero } from "@/components/resume/resume-hero";
import { ResumeSkills } from "@/components/resume/resume-skills";
import { ResumeEducation } from "@/components/resume/resume-education";
import { ResumeExperience } from "@/components/resume/resume-experience";
import { ResumeProjects } from "@/components/resume/resume-projects";
import { ResumeExtras } from "@/components/resume/resume-extras";
import { ShareButtons } from "@/components/share-buttons";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "简历 | 袁慎建",
  description:
    "后端工程师（AI Agent） | 研发效能专家 | 敏捷开发教练 - 袁慎建的个人简历",
};

export default function ResumePage() {
  const resumeUrl = `${config.site.url}/resume`;

  return (
    <main className="min-h-screen">
      <ResumeHero />
      <ResumeSkills />
      <ResumeEducation />
      <ResumeExperience />
      <ResumeProjects />
      <ResumeExtras />

      {/* 简历分享 */}
      <section className="py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <ShareButtons
            url={resumeUrl}
            title="袁慎建的简历 - 后端工程师 | AI Agent 开发者"
            description="后端工程师（AI Agent） | 研发效能专家 | 敏捷开发教练"
          />
        </div>
      </section>
    </main>
  );
}
