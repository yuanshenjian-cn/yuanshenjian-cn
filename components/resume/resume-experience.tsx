import { authorProfile } from "@/lib/author-profile";
import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

export function ResumeExperience() {
  const { experience } = authorProfile;

  return (
    <section id={experience.id} className="py-16 max-w-2xl mx-auto">
      <SectionTitle title={experience.heading} />

      <div className="bg-card rounded-2xl p-8 shadow-sm border">
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 rounded-full bg-primary/50" />

          {experience.items.map((exp, index) => (
            <div key={index} className="relative pb-12 last:pb-0">
              <div className="absolute left-[-26px] top-5 w-3 h-3 rounded-full bg-primary shadow-sm border-2 border-background" />

              <ScrollAnimation>
                <div className="pl-0">
                  <p className="text-primary font-medium text-sm mb-2">
                    {exp.period}
                  </p>
                  <h3 className="text-foreground text-lg font-medium mb-3">
                    {exp.title}
                  </h3>

                  {exp.description && (
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      <p className="text-sm">{exp.description}</p>
                    </div>
                  )}

                  {exp.list && (
                    <ul className="text-muted-foreground text-sm leading-relaxed space-y-2">
                      {exp.list.map((item, i) => (
                        <li key={i} className="relative pl-5 text-sm">
                          <span className="absolute left-0 text-primary font-medium">
                            ▸
                          </span>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ScrollAnimation>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
