export function ResumeExtras() {
  return (
    <section id="extras" className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-medium mb-6 text-left pb-3 inline-block" style={{ borderBottom: "2px solid hsl(var(--primary))" }}>
        兴趣爱好
      </h2>

      <div className="bg-card rounded-2xl p-8 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary/30 p-5 rounded-xl border">
              <h3 className="text-foreground text-lg font-medium mb-3">
                著作发表
              </h3>
              <ul className="space-y-2">
                <li className="border-b border-border pb-2 last:border-0">
                  <a
                    href="https://www.yuque.com/yuanshenjian/agile-software-design"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    整洁软件设计
                  </a>
                </li>
                <li className="border-b border-border pb-2 last:border-0">
                  <a
                    href="https://www.yuque.com/yuanshenjian/agile-things"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    敏捷那些事儿
                  </a>
                </li>
                <li className="pb-2">
                  <a
                    href="https://www.yuque.com/yuanshenjian/my-tw-10-years"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors text-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    TW十年，我敏捷了吗？
                  </a>
                </li>
              </ul>
            </div>

          <div className="bg-secondary/30 p-5 rounded-xl border">
            <h3 className="text-foreground text-lg font-medium mb-3">
              运动健身
            </h3>
            <ul className="space-y-2">
              <li className="border-b border-border pb-2 last:border-0 text-muted-foreground text-sm">
                CBBA高级健身教练
              </li>
              <li className="border-b border-border pb-2 last:border-0 text-muted-foreground text-sm">
                极限健身实践者
              </li>
              <li className="text-muted-foreground text-sm">
                擅长心肺体能训练
              </li>
            </ul>
          </div>

          <div className="bg-secondary/30 p-5 rounded-xl border">
            <h3 className="text-foreground text-lg font-medium mb-3">
              理财投资
            </h3>
            <ul className="space-y-2">
              <li className="border-b border-border pb-2 last:border-0 text-muted-foreground text-sm">
                长线主义
              </li>
              <li className="border-b border-border pb-2 last:border-0 text-muted-foreground text-sm">
                逆向投资者
              </li>
              <li className="text-muted-foreground text-sm">
                聚焦中国优质资产
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
