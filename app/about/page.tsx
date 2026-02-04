import { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/blog";

export const metadata: Metadata = {
  title: "关于 | 个人博客",
  description: "关于博客作者的信息",
};

export default function AboutPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

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
              <p><span className="text-foreground">邮箱：</span>sjyuan@thoughtworks.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">工作经历</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>2015.03 ~ 2025.04，Thoughtworks咨询师</li>
              <li>2014.09 ~ 2015.03，自主创业程序员</li>
              <li>2013.04 ~ 2014.08，美林数据程序员</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">学习经历</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>2021.11.30，获得 <em>贝尔宾团队领导力</em> 课程证书</li>
              <li>2021.02.04，获得 <em>CAC认证敏捷教练</em></li>
              <li>2020.12.11，获得 <em>ATD Master Trainer</em></li>
              <li>2020.09.25，获得 <em>MBC</em> 课程证书</li>
              <li>2020.09.13，获得 <em>培训组织设计</em> 工作坊证书</li>
              <li>2020.04.05，获得 Scrum联盟 <em>CSM认证</em></li>
              <li>2019.12.18，获得 <em>ATD课程设计</em> 课程证书</li>
              <li>2019.05.15，获得 <em>ATD培训师技巧</em> 课程证书</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">作品</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><a href="https://www.yuque.com/yuanshenjian/clean-coder" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">程序员基本功修炼</a></li>
              <li><a href="https://www.yuque.com/yuanshenjian/agile" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">敏捷大杂烩</a></li>
              <li>中文翻译: <a href="https://item.jd.com/12123997.html" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">《JavaScript学习指南 第3版》</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">博客统计</h2>
            <div className="flex gap-8 text-sm">
              <div>
                <span className="text-muted-foreground">文章</span>
                <span className="ml-2 font-medium">{posts.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">标签</span>
                <span className="ml-2 font-medium">{tags.length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
