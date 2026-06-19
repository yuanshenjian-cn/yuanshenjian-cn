const FOLLOWUP_OPEN_TAG = "<followup-questions>";
const FOLLOWUP_CLOSE_TAG = "</followup-questions>";
const FOLLOWUP_BLOCK_PATTERN = /<followup-questions>\s*[\s\S]*?\s*<\/followup-questions>/g;

export function stripFollowupQuestionsBlock(content: string): string {
  return content.replace(FOLLOWUP_BLOCK_PATTERN, "").trim();
}

export function sanitizeAdvisorAnswer(content: string): string {
  const openIndex = content.indexOf(FOLLOWUP_OPEN_TAG);
  if (openIndex === -1) {
    return content;
  }
  const closeIndex = content.indexOf(FOLLOWUP_CLOSE_TAG, openIndex);
  if (closeIndex === -1) {
    return content.slice(0, openIndex).trim();
  }
  return (
    content.slice(0, openIndex) + content.slice(closeIndex + FOLLOWUP_CLOSE_TAG.length)
  ).trim();
}
