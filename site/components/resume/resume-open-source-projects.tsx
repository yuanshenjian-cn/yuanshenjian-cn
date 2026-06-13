import { ExternalLink, Github } from "lucide-react";

import { authorProfile } from "@/lib/author-profile";
import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

export function ResumeOpenSourceProjects() {
  const { openSourceProjects } = authorProfile;

  return (
    <section id={openSourceProjects.id} className="py-16 max-w-2xl mx-auto">
      <SectionTitle title={openSourceProjects.heading} />

      <ScrollAnimation>
        <div className="bg-card rounded-2xl p-8 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openSourceProjects.items.map((project) => (
              <article
                key={project.repositoryUrl}
                className="group flex h-full flex-col rounded-xl border bg-secondary/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary/30 hover:shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm border">
                      <Github className="h-4 w-4" />
                    </span>
                    <h3 className="text-foreground text-base font-medium leading-snug">
                      {project.name}
                    </h3>
                  </div>
                  <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {project.type}
                  </span>
                </div>

                <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>

                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  GitHub 仓库
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
