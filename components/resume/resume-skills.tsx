import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";
import { authorProfile } from "@/lib/author-profile";

export function ResumeSkills() {
  const { skills } = authorProfile;

  return (
    <section id={skills.id} className="py-16 max-w-2xl mx-auto">
      <SectionTitle title={skills.heading} />

      <ScrollAnimation>
        <div className="bg-card rounded-2xl p-8 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.items.map((skill, index) => (
              <div
                key={index}
                className={`p-5 rounded-xl border-l-4 ${
                  skill.level === "master"
                    ? "border-l-neutral-800"
                    : skill.level === "proficient"
                    ? "border-l-neutral-500"
                    : "border-l-neutral-300"
                } bg-secondary/30`}
              >
                <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium ${
                      skill.level === "master"
                        ? "bg-neutral-800 text-white"
                        : skill.level === "proficient"
                        ? "bg-neutral-500 text-white"
                        : "bg-neutral-300 text-neutral-800"
                    }`}
                  >
                    {skill.icon}
                  </span>
                  {skill.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 rounded-xl bg-secondary/30">
              <h3 className="text-lg font-medium mb-3 text-foreground">
                专业认证
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.certificates.map((cert, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-background rounded-full text-sm text-muted-foreground border"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
