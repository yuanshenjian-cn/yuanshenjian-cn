import { Metadata } from "next";

import { ContextualAIAdvisorSurface } from "@/components/ai/ContextualAIAdvisorSurface";
import { TermHighlighter } from "@/components/article/TermHighlighter";
import { ResumeEducation } from "@/components/resume/ResumeEducation";
import { ResumeExperience } from "@/components/resume/ResumeExperience";
import { ResumeExtras } from "@/components/resume/ResumeExtras";
import { ResumeHero } from "@/components/resume/ResumeHero";
import { ResumeOpenSourceProjects } from "@/components/resume/ResumeOpenSourceProjects";
import { ResumeProjects } from "@/components/resume/ResumeProjects";
import { ResumeSkills } from "@/components/resume/ResumeSkills";
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
    <main className="author-term-content min-h-screen">
      <ResumeHero />
      {config.ai.contextualAdvisorEnabled ? (
        <section className="term-highlight-ignore py-8 px-6">
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
      <TermHighlighter scene="author" domain="author" containerSelector=".author-term-content" />
    </main>
  );
}
