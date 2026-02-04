import { ScrollAnimation } from "./scroll-animation";

export function ResumeExperience() {
  const experiences = [
    {
      period: "2025.05 ~ 2025.12",
      title: "Locammend 智能顾问 - 技术负责人",
      description:
        "聚焦在AI辅助效能提升和AI应用开发。作为技术负责人，在Locammend负责系统架构设计和落地，引入SDD开发框架提升AI辅助研发的质量，采用AWS云原生架构进行部署。",
    },
    {
      period: "2023.02 ~ 2025.02",
      title: "保时捷Super App - Tech Leader & 架构师",
      description:
        "在保时捷Super App项目上做架构方案设计和落地，推动研发效能提升，支撑10多个垂直业务团队顺畅完成业务目标。",
    },
    {
      period: "2019.06 ~ 2023.01",
      title: "Thoughtworks - 技术教练 & 咨询顾问",
      list: [
        "推动客户研发效能提升，显著缩短交付前置时间以及降低需求返工率",
        "主导设计6+个技术学习项目，交付60+场技术训练营，涵盖了500+中、高级技术人员",
      ],
    },
    {
      period: "2015.03 ~ 2019.05",
      title: "Thoughtworks - 服务端开发",
      description:
        "经历了多个交付项目，项目涉及金融、物流、IT、汽车等领域。项目均采用敏捷交付方式，前后作为核心开发人员、Tech Lead在项目中推动和践行敏捷工程实践落地和改进，带领团队做架构设计，遗留系统重构、测试优化、持续部署流水线优化等工作。",
    },
    {
      period: "2013.06 ~ 2015.02",
      title: "早期职业生涯",
      list: [
        "2014.10 ~ 2015.02：软件开发工作室（自由创业）",
        "2013.06 ~ 2014.09：西安美林数据股份有限公司",
      ],
    },
  ];

  return (
    <section id="experience" className="py-16 px-6 max-w-4xl mx-auto">
      <ScrollAnimation>
        <h2
          className="text-2xl font-medium mb-8 text-left pb-3 inline-block"
          style={{ borderBottom: "2px solid hsl(var(--primary))" }}
        >
          经历概览
        </h2>
      </ScrollAnimation>

      <div className="bg-card rounded-2xl p-8 shadow-sm border">
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 rounded-full bg-primary/50" />

          {experiences.map((exp, index) => (
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
                      <p>{exp.description}</p>
                    </div>
                  )}

                  {exp.list && (
                    <ul className="text-muted-foreground text-sm leading-relaxed space-y-2">
                      {exp.list.map((item, i) => (
                        <li key={i} className="relative pl-5">
                          <span className="absolute left-0 text-primary font-medium">
                            ▸
                          </span>
                          {item}
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
