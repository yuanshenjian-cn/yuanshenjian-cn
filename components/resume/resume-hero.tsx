import Image from "next/image";

export function ResumeHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/resume/hero-bg.webp')`,
          }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="w-36 h-36 mx-auto mb-8 bg-background rounded-full flex items-center justify-center shadow-xl border-4 border-background/50 overflow-hidden">
          <Image
            src="/images/resume/ysj-avator.webp"
            alt="袁慎建"
            width={150}
            height={150}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-medium mb-4 text-foreground drop-shadow-sm">
          袁慎建
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 mb-8">
          后端工程师（AI Agent） | 研发效能专家 | 敏捷开发教练
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-8 text-foreground/70">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>18192235667</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>yuanshenjian@foxmail.com</span>
          </div>
        </div>

        <p className="text-base text-foreground/75 leading-relaxed max-w-2xl mx-auto">
          在Thoughtworks 10年多年，经历多个国内外交付、咨询和技术人员培养项目，精通敏捷软件工程实践和研发效能提升，擅长软件架构设计和服务器端应用开发。有代码洁癖和优秀的业务Sense，具备良好的快速学习、解决问题和团队协作能力，热爱技术写作和分享。
        </p>
      </div>
    </section>
  );
}
