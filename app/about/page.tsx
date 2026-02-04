import { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 | 个人博客",
  description: "关于博客作者的信息",
};

export default function AboutPage() {
  return (
    <main className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-medium mb-4">关于我</h1>
          <p className="text-muted-foreground">
            程序员
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-medium mb-3">简介</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><span className="text-foreground">姓名：</span>袁慎建 | YUAN SHENJIAN</p>
              <p><span className="text-foreground">职业：</span>程序员</p>
              <p><span className="text-foreground">领域：</span>软件研发</p>
              <p><span className="text-foreground">兴趣：</span>运动健身、投资理财</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">核心技能</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-muted-foreground">敏捷工程实践</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-muted-foreground">软件设计</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-muted-foreground">测试策略</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-muted-foreground">Java技术栈</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-muted-foreground">AI Agent开发</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-muted-foreground">AI辅助编程</span>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">工作经历</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>2025.05 ~ 2025.12，Locammend 智能顾问 - 技术负责人</li>
              <li>2023.02 ~ 2025.02，保时捷Super App - Tech Leader & 架构师</li>
              <li>2019.06 ~ 2023.01，Thoughtworks - 技术教练 & 咨询顾问</li>
              <li>2015.03 ~ 2019.05，Thoughtworks - 服务端开发</li>
              <li>2013.06 ~ 2015.02，早期职业生涯</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">认证资质</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-sm text-muted-foreground">CSM（2020年）</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-sm text-muted-foreground">CAC敏捷教练（2021年）</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-sm text-muted-foreground">ATD培训师（2023年）</span>
              <span className="px-3 py-1.5 bg-secondary/50 rounded-full text-sm text-muted-foreground">CBBA高级健身教练（2025年）</span>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">著作发表</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.yuque.com/yuanshenjian/agile-software-design"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  整洁软件设计
                </a>
              </li>
              <li>
                <a
                  href="https://www.yuque.com/yuanshenjian/agile-things"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  敏捷那些事儿
                </a>
              </li>
              <li>
                <a
                  href="https://www.yuque.com/yuanshenjian/my-tw-10-years"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  TW十年，我敏捷了吗？
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
