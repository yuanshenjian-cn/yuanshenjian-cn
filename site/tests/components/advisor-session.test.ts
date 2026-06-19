import { describe, expect, it } from "vitest";

import { type AdvisorSessionMessage, formatAdvisorConversationHistory } from "@/hooks/ai/use-advisor-session";

describe("advisor session", () => {
  it("formats latest configured conversation rounds from old to new", () => {
    const messages: AdvisorSessionMessage[] = Array.from({ length: 12 }, (_, index) => [
      { id: `user-${index}`, role: "user" as const, content: `问题 ${index}` },
      { id: `assistant-${index}`, role: "assistant" as const, content: `回答 ${index}` },
    ]).flat();

    expect(formatAdvisorConversationHistory(messages, 10)).toEqual([
      "用户：问题 2",
      "袁慎建：回答 2",
      "用户：问题 3",
      "袁慎建：回答 3",
      "用户：问题 4",
      "袁慎建：回答 4",
      "用户：问题 5",
      "袁慎建：回答 5",
      "用户：问题 6",
      "袁慎建：回答 6",
      "用户：问题 7",
      "袁慎建：回答 7",
      "用户：问题 8",
      "袁慎建：回答 8",
      "用户：问题 9",
      "袁慎建：回答 9",
      "用户：问题 10",
      "袁慎建：回答 10",
      "用户：问题 11",
      "袁慎建：回答 11",
    ]);
  });

  it("preserves followUpQuestions field when formatting history", () => {
    const messages: AdvisorSessionMessage[] = [
      { id: "user-0", role: "user", content: "问题" },
      {
        id: "assistant-0",
        role: "assistant",
        content: "回答",
        followUpQuestions: ["问题 1", "问题 2", "问题 3"],
      },
    ];

    expect(formatAdvisorConversationHistory(messages, 10)).toEqual(["用户：问题", "袁慎建：回答"]);
  });
});
