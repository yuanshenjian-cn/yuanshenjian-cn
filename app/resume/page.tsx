import { Metadata } from "next";
import { ResumeHero } from "@/components/resume/resume-hero";
import { ResumeSkills } from "@/components/resume/resume-skills";
import { ResumeEducation } from "@/components/resume/resume-education";
import { ResumeExperience } from "@/components/resume/resume-experience";
import { ResumeProjects } from "@/components/resume/resume-projects";
import { ResumeExtras } from "@/components/resume/resume-extras";
import { ShareButtons } from "@/components/share-buttons";
import { config } from "@/lib/config";
import { Download } from "lucide-react";

const ogImageUrl = `${config.site.url}/images/og-default.webp`;

export const metadata: Metadata = {
  title: "简历 | 袁慎建",
  description:
    "AI 软件工程师·研发效能专家·敏捷开发教练 - 10多年深耕软件交付与咨询，用AI工具和敏捷方法帮助企业提升研发效能，具备代码洁癖与优秀业务Sense的技术实践者",
  openGraph: {
    title: "简历 | 袁慎建",
    description: "AI 软件工程师·研发效能专家·敏捷开发教练，10多年深耕软件交付与咨询，用AI工具和敏捷方法帮助企业提升研发效能，具备代码洁癖与优秀业务Sense的技术实践者",
    type: "profile",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "袁慎建的简历",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "简历 | 袁慎建",
    description: "AI 软件工程师·研发效能专家·敏捷开发教练，10多年深耕软件交付与咨询，用AI工具和敏捷方法帮助企业提升研发效能，具备代码洁癖与优秀业务Sense的技术实践者",
    images: [ogImageUrl],
  },
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
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <ShareButtons
            url={resumeUrl}
            title="袁慎建的简历"
            description="AI 软件工程师 | 研发效能专家 | 敏捷开发教练"
          />
          <a
            href="/docs/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-medium rounded-full transition-colors"
            aria-label="下载简历 PDF"
          >
            <Download className="w-2.5 h-2.5" />
            <span>下载 PDF</span>
          </a>
        </div>
      </section>
    </main>
  );
}
