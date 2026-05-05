import { Metadata } from "next";
import { AuthorAiAssistant } from "@/components/ai/author-ai-assistant";
import { PageAIAssistantProvider } from "@/components/ai/page-ai-assistant-provider";
import { ResumeHero } from "@/components/resume/resume-hero";
import { ResumeSkills } from "@/components/resume/resume-skills";
import { ResumeEducation } from "@/components/resume/resume-education";
import { ResumeExperience } from "@/components/resume/resume-experience";
import { ResumeProjects } from "@/components/resume/resume-projects";
import { ResumeExtras } from "@/components/resume/resume-extras";
import { ShareButtons } from "@/components/share-buttons";
import { authorProfile, getAuthorSummary } from "@/lib/author-profile";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";
import { Download } from "lucide-react";

const RESUME_DESCRIPTION =
  "AI 软件工程师·研发效能专家·敏捷开发教练 - 10多年深耕软件交付与咨询，用AI工具和敏捷方法帮助企业提升研发效能，具备代码洁癖与优秀业务Sense的技术实践者";

export const metadata: Metadata = generateListPageSEO(
  "简历",
  RESUME_DESCRIPTION,
  `${config.site.url}/author`,
);

export default function ResumePage() {
  const resumeUrl = `${config.site.url}/author`;
  const authorSummary = getAuthorSummary(authorProfile);

  return (
    <main className="min-h-screen">
      <ResumeHero />
      {config.ai.pageAssistantEnabled ? (
        <section className="py-8 px-6">
          <div className="max-w-2xl mx-auto">
            <PageAIAssistantProvider
              scene="author"
              context={{ page: "author" }}
              workerUrl={config.ai.workerUrl}
              turnstileSiteKey={config.ai.turnstileSiteKey}
              streamEnabled={config.ai.pageAssistantStreamEnabled}
              maxInputChars={config.ai.maxInputChars}
            >
              <AuthorAiAssistant />
            </PageAIAssistantProvider>
          </div>
        </section>
      ) : null}
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
            description={authorSummary}
          />
          <a
            href={authorProfile.hero.resumeHref}
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
