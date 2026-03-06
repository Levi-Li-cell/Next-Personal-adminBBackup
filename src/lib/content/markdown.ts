import TurndownService from "turndown";
import { marked } from "marked";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  bulletListMarker: "-",
});

export function htmlToMarkdown(html: string) {
  if (!html) {
    return "";
  }

  return turndownService.turndown(html);
}

export function markdownToHtml(markdown: string) {
  if (!markdown) {
    return "";
  }

  return marked.parse(markdown, { async: false }) as string;
}

export function extractImageUrlsFromHtml(html: string) {
  if (!html) {
    return [] as string[];
  }

  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  return matches.map((match) => match[1]).filter(Boolean);
}
