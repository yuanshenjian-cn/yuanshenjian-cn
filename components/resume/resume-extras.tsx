import { ExternalLink } from "lucide-react";
import { authorProfile } from "@/lib/author-profile";
import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

export function ResumeExtras() {
  const { extras } = authorProfile;

  return (
    <section id={extras.id} className="py-16 max-w-2xl mx-auto">
      <SectionTitle title={extras.heading} />

      <ScrollAnimation>
        <div className="bg-card rounded-2xl p-8 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {extras.groups.map((group) => (
              <div key={group.title} className="bg-secondary/30 p-5 rounded-xl border">
                <h3 className="text-foreground text-lg font-medium mb-3">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, index) => (
                    <li
                      key={`${group.title}-${item.label}`}
                      className={index < group.items.length - 1 ? "border-b border-border pb-2 last:border-0" : "pb-2"}
                    >
                      {item.type === "link" ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors text-sm flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
