import { Metadata } from "next";
import { ResumeHero } from "@/components/resume/resume-hero";
import { ResumeSkills } from "@/components/resume/resume-skills";
import { ResumeEducation } from "@/components/resume/resume-education";
import { ResumeExperience } from "@/components/resume/resume-experience";
import { ResumeProjects } from "@/components/resume/resume-projects";
import { ResumeExtras } from "@/components/resume/resume-extras";

export const metadata: Metadata = {
  title: "简历 | 袁慎建",
  description:
    "后端工程师（AI Agent） | 研发效能专家 | 敏捷开发教练 - 袁慎建的个人简历",
};

export default function ResumePage() {
  return (
    <main className="min-h-screen">
      <ResumeHero />
      <ResumeSkills />
      <ResumeEducation />
      <ResumeExperience />
      <ResumeProjects />
      <ResumeExtras />
    </main>
  );
}
