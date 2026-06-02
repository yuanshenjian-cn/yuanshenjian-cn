const AUTHOR_EMAIL = "yuanshenjian@foxmail.com";

const CONTACT_AUTHOR_SUFFIX = `如果一直不行，可发邮件联系作者 ${AUTHOR_EMAIL}。`;

export const HUMANIZED_TURNSTILE_MESSAGES = {
  loadFailed: "请求准备失败了，请刷新页面后再试。",
  notReady: "验证服务暂时不可用，请稍后再试。",
  initFailed: `验证服务暂时不可用，请刷新页面后再试。${CONTACT_AUTHOR_SUFFIX}`,
  validationFailed: "刚刚没有提交成功，请再试一次。",
  expired: "刚刚等待太久了，请重新试一次。",
  timeout: "现在有点忙，请稍后再试。",
  recommendNotConfigured: `这个 AI 推荐功能还没准备好，暂时不能使用。${CONTACT_AUTHOR_SUFFIX}`,
} as const;

export { AUTHOR_EMAIL };
