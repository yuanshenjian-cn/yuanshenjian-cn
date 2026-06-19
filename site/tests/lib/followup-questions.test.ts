import { describe, expect, it } from "vitest";

import {
  sanitizeAdvisorAnswer,
  stripFollowupQuestionsBlock,
} from "@/lib/ai/followup-questions";

describe("followup questions helpers", () => {
  describe("stripFollowupQuestionsBlock", () => {
    it("removes complete followup block", () => {
      const content =
        "回答正文。\n\n<followup-questions>\n<question>问题 1</question>\n</followup-questions>";

      expect(stripFollowupQuestionsBlock(content)).toBe("回答正文。");
    });

    it("returns content unchanged when no followup block", () => {
      expect(stripFollowupQuestionsBlock("回答正文。")).toBe("回答正文。");
    });
  });

  describe("sanitizeAdvisorAnswer", () => {
    it("removes complete followup block", () => {
      const content =
        "回答正文。\n\n<followup-questions>\n<question>问题 1</question>\n</followup-questions>";

      expect(sanitizeAdvisorAnswer(content)).toBe("回答正文。");
    });

    it("truncates before incomplete followup block", () => {
      const content = "回答正文。\n\n<followup-questions>\n<question>问题 1";

      expect(sanitizeAdvisorAnswer(content)).toBe("回答正文。");
    });

    it("returns content unchanged when no followup block", () => {
      expect(sanitizeAdvisorAnswer("回答正文。")).toBe("回答正文。");
    });
  });
});
