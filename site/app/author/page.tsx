import { Metadata } from "next";

import { ContextualAIAdvisorSurface } from "@/components/ai/ContextualAIAdvisorSurface";
import { ResumeHero } from "@/components/resume/resume-hero";
import { ResumeSkills } from "@/components/resume/resume-skills";
import { ResumeEducation } from "@/components/resume/resume-education";
import { ResumeExperience } from "@/components/resume/resume-experience";
import { ResumeProjects } from "@/components/resume/resume-projects";
import { ResumeOpenSourceProjects } from "@/components/resume/resume-open-source-projects";
import { ResumeExtras } from "@/components/resume/resume-extras";
import { buildAdvisorContext, defaultAdvisorQuickTopics } from "@/lib/advisor-context";
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
      {config.ai.contextualAdvisorEnabled ? (
        <section className="py-8 px-6">
          <div className="max-w-2xl mx-auto">
            <ContextualAIAdvisorSurface
              context={buildAdvisorContext({
                scene: "author",
                title: "简历",
                domain: "author",
                pageSlug: "author",
                quickTopics: defaultAdvisorQuickTopics("author"),
              })}
              cardTitle="AI 带你快速了解作者"
              cardDescription=""
              workerUrl={config.ai.workerUrl}
              turnstileSiteKey={config.ai.turnstileSiteKey}
              turnstileTimeoutMs={config.ai.turnstile.timeoutMs.contextualAdvisor}
              maxInputChars={config.ai.maxInputChars}
              historyRounds={config.ai.contextualAdvisorHistoryRounds}
            />
          </div>
        </section>
      ) : null}
      <ResumeSkills />
      <ResumeEducation />
      <ResumeExperience />
      <ResumeProjects />
      <ResumeOpenSourceProjects />
      <ResumeExtras />
    </main>
  );
}
