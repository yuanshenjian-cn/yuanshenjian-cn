import Image from "next/image";
import { authorProfile } from "@/lib/author-profile";
import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

export function ResumeEducation() {
  const { education } = authorProfile;

  return (
    <section id={education.id} className="py-16 max-w-2xl mx-auto">
      <SectionTitle title={education.heading} />

      <ScrollAnimation>
        <div className="bg-card rounded-2xl p-8 shadow-sm border">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-16 h-16 rounded-full bg-background shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
              <Image
                src="/images/resume/changan-university-logo.webp"
                alt="长安大学校徽"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h3 className="text-foreground text-lg font-medium mb-1">
                <a
                  href={education.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {education.school}
                </a>
              </h3>
              <p className="text-muted-foreground text-sm">{education.major}</p>
              <p className="text-primary font-medium mt-1 text-sm">
                {education.period}
              </p>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
