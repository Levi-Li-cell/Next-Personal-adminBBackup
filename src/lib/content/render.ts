import { marked } from "marked";

export function markdownToHtml(markdown: string) {
  if (!markdown) {
    return "";
  }

  return marked.parse(markdown, { async: false }) as string;
}
