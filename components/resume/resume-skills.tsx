import { SectionTitle } from "./section-title";
import { ScrollAnimation } from "./scroll-animation";

interface Skill {
  level: "master" | "proficient" | "familiar";
  icon: string;
  title: string;
  description: string;
}

const skills: Skill[] = [
  {
    level: "master",
    icon: "A",
    title: "敏捷工程实践",
    description:
      "精通XP、Scrum、DevOps敏捷软件工程实践，如CI/CD、TDD、重构、简单设计",
  },
  {
    level: "master",
    icon: "D",
    title: "软件设计",
    description: "精通面向对象、设计模式、整洁软件设计",
  },
  {
    level: "master",
    icon: "T",
    title: "测试策略",
    description:
      "精通自动化分层测试策略和最佳实践，擅长软件交付质量内建体系搭建",
  },
  {
    level: "proficient",
    icon: "J",
    title: "Java技术栈",
    description:
      "熟练Java、Spring Boot、Spring Cloud、MySQL、Redis、Kafka、RabbitMQ等服务器端技术",
  },
  {
    level: "proficient",
    icon: "A",
    title: "架构设计",
    description: "熟练掌握高可用架构设计，以及DDD实践、微服务设计、分层架构",
  },
  {
    level: "proficient",
    icon: "I",
    title: "AI Agent开发",
    description:
      "熟练使用Spring AI、LangGraph开发AI Agent应用；熟练掌握AI软件工程实践，如Agent Skills、SDD框架",
  },
  {
    level: "proficient",
    icon: "AI",
    title: "AI辅助编程",
    description:
      "熟练使用AI辅助编程工具，如：Claude code、Cursor、OpenCode、Trae；熟悉提示词工程、MCP、RAG",
  },
  {
    level: "familiar",
    icon: "P",
    title: "Python技术栈",
    description: "熟悉Python、FastAPI、LangChain",
  },
  {
    level: "familiar",
    icon: "B",
    title: "业务分析",
    description:
      "熟悉业务分析方法，如用户路程、用户故事地图、用户故事、服务蓝图",
  },
];

const certificates = [
  "CSM（2020年）",
  "CAC敏捷教练（2021年）",
  "ATD培训师（2023年）",
  "CBBA高级健身教练（2025年）",
];

export function ResumeSkills() {
  return (
    <section id="skills" className="py-16 px-6 max-w-4xl mx-auto">
      <SectionTitle title="技能证书" />

      <ScrollAnimation>
        <div className="bg-card rounded-2xl p-8 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill, index) => (
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
                {certificates.map((cert, index) => (
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
