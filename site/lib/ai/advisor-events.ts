type AskAdvisorListener = (question: string) => void;

const EVENT_NAME = "ysj:ask-advisor";

export function emitAskAdvisor(question: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: question }));
}

export function onAskAdvisor(listener: AskAdvisorListener): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const handler = (event: Event) => {
    listener((event as CustomEvent).detail as string);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
