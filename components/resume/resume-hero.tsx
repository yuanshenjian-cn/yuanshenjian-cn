import Image from "next/image";
import { Phone, Mail } from "lucide-react";
import { authorProfile } from "@/lib/author-profile";

export function ResumeHero() {
  const { hero } = authorProfile;

  return (
    <section id={hero.id} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/resume/hero-bg.webp')`,
        }}
      />
      {/* Overlay Gradient - 更柔和的渐变 */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="w-36 h-36 mx-auto mb-8 bg-background rounded-full flex items-center justify-center shadow-xl border-2 border-background/50 overflow-hidden">
          <Image
            src="/images/resume/ysj-avator.webp"
            alt="袁慎建"
            width={150}
            height={150}
            className="object-cover w-full h-full"
            priority
          />
        </div>


        {/* 主标题 - 更有质感的排版 */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4 text-foreground">
          {hero.name}
        </h1>

        {/* 三个角色 - 小屏幕三行显示 */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-base md:text-lg text-foreground/90 mb-8 font">
          {hero.roles.map((role, index) => (
            <span key={role} className="contents">
              {index > 0 ? <span className="hidden sm:inline text-foreground/40">·</span> : null}
              <span>{role}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-1 sm:gap-6 mb-8 text-foreground/70">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Phone className="w-4 h-4" />
            <span>{hero.phone}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Mail className="w-4 h-4" />
            <span>{hero.email}</span>
          </div>
        </div>

        {/* 个人简介 - 分成两段 */}
        <div className="space-y-4 text-base text-foreground/75 leading-relaxed max-w-2xl mx-auto">
          {hero.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* 底部渐变过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
