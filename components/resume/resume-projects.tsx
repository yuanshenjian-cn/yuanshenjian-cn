import { authorProfile } from "@/lib/author-profile";
import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

export function ResumeProjects() {
  const { projects } = authorProfile;

  return (
    <section id={projects.id} className="py-16 max-w-2xl mx-auto">
      <SectionTitle title={projects.heading} />

      <div className="bg-card rounded-2xl p-8 shadow-sm border">
        <div className="space-y-6">
          {projects.items.map((project, index) => (
            <ScrollAnimation key={index}>
              <div className="bg-secondary/20 rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-sm">
                <div className="p-6 flex flex-col lg:flex-row gap-4 bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex-1">
                    <p className="text-primary font-medium text-sm mb-2">
                      {project.period}
                    </p>
                    <h3 className="text-foreground text-xl font-medium mb-1">
                      {project.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {project.role}
                    </p>
                  </div>

                  <div className="lg:w-72 bg-background/80 rounded-lg p-4">
                    <h4 className="text-xs font-medium text-foreground/70 mb-2 uppercase tracking-wide">
                      核心成果
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {project.achievements.map((achievement, i) => (
                        <li key={i} className="relative pl-4">
                          <span className="absolute left-0 text-primary">
                            ▸
                          </span>
                          {achievement.metric && (
                            <span className="text-primary font-medium">
                              {achievement.metric}
                            </span>
                          )}
                          {achievement.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {project.description}
                  </p>

                  {project.highlights && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">
                        主要职责和贡献
                      </h4>
                      <ul className="space-y-2">
                        {project.highlights.map((highlight, i) => (
                          <li
                            key={i}
                            className="relative pl-5 text-sm text-muted-foreground"
                          >
                            <span className="absolute left-0 text-primary font-medium">
                              ✓
                            </span>
                            {highlight.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {project.techs && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-2">
                        {project.techs.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-secondary rounded-full text-xs text-muted-foreground"
                          >
                            {tech.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
