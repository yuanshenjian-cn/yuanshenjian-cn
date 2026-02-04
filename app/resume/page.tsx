import { Metadata } from "next";
import Image from "next/image";
import { Suspense, lazy } from "react";

const ResumeHero = lazy(() => import("@/components/resume/resume-hero").then((mod) => ({ default: mod.ResumeHero })));
const ResumeSkills = lazy(() => import("@/components/resume/resume-skills").then((mod) => ({ default: mod.ResumeSkills })));
const ResumeEducation = lazy(() => import("@/components/resume/resume-education").then((mod) => ({ default: mod.ResumeEducation })));
const ResumeExperience = lazy(() => import("@/components/resume/resume-experience").then((mod) => ({ default: mod.ResumeExperience })));
const ResumeProjects = lazy(() => import("@/components/resume/resume-projects").then((mod) => ({ default: mod.ResumeProjects })));
const ResumeExtras = lazy(() => import("@/components/resume/resume-extras").then((mod) => ({ default: mod.ResumeExtras })));

export const metadata: Metadata = {
  title: "简历 | 袁慎建",
  description:
    "后端工程师（AI Agent） | 研发效能专家 | 敏捷开发教练 - 袁慎建的个人简历",
};

function ResumeSectionSkeleton() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    </div>
  );
}

export default function ResumePage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="min-h-[70vh] bg-muted animate-pulse"></div>}>
        <ResumeHero />
      </Suspense>

      <Suspense fallback={<ResumeSectionSkeleton />}>
        <ResumeSkills />
      </Suspense>

      <Suspense fallback={<ResumeSectionSkeleton />}>
        <ResumeEducation />
      </Suspense>

      <Suspense fallback={<ResumeSectionSkeleton />}>
        <ResumeExperience />
      </Suspense>

      <Suspense fallback={<ResumeSectionSkeleton />}>
        <ResumeProjects />
      </Suspense>

      <Suspense fallback={<ResumeSectionSkeleton />}>
        <ResumeExtras />
      </Suspense>
    </main>
  );
}
