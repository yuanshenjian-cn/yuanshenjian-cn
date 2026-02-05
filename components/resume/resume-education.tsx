import Image from "next/image";
import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

export function ResumeEducation() {
  return (
    <section id="education" className="py-16 max-w-2xl mx-auto">
      <SectionTitle title="教育背景" />

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
                  href="https://www.chd.edu.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  长安大学（统招本科 211）
                </a>
              </h3>
              <p className="text-muted-foreground text-sm">软件工程（转）</p>
              <p className="text-primary font-medium mt-1 text-sm">
                2009.09 ~ 2013.07
              </p>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
