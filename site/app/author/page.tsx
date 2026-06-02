import { Metadata } from "next";
import { AuthorAiAssistant } from "@/components/ai/author-ai-assistant";
import { PageAIAssistantProvider } from "@/components/ai/page-ai-assistant-provider";
import { ResumeHero } from "@/components/resume/resume-hero";
import { ResumeSkills } from "@/components/resume/resume-skills";
import { ResumeEducation } from "@/components/resume/resume-education";
import { ResumeExperience } from "@/components/resume/resume-experience";
import { ResumeProjects } from "@/components/resume/resume-projects";
import { ResumeExtras } from "@/components/resume/resume-extras";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";

const RESUME_DESCRIPTION =
  "AI 效率工程师·研发效能专家·敏捷开发教练 - 10多年深耕软件交付与咨询，用AI工具和敏捷方法帮助企业提升研发效能，具备代码洁癖与优秀业务Sense的技术实践者";

export const metadata: Metadata = generateListPageSEO(
  "简历",
  RESUME_DESCRIPTION,
  `${config.site.url}/author`,
);

export default function ResumePage() {
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
              turnstileTimeoutMs={config.ai.turnstile.timeoutMs.pageAssistant.author}
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

    </main>
  );
}
