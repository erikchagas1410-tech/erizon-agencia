"use client";

import type { ReactNode } from "react";

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "divider" };

function renderInline(text: string) {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      nodes.push(
        <strong key={`${match.index}-strong`} className="font-semibold text-[var(--color-text-1)]">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          className="rounded-md border border-[var(--color-border)] bg-[#f7f5ff] px-1.5 py-0.5 text-[0.95em] text-[var(--color-primary)]"
        >
          {match[3]}
        </code>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function parseMarkdown(text: string) {
  const lines = text.split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) { index += 1; continue; }

    if (/^---+$/.test(line)) {
      blocks.push({ type: "divider" });
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2].trim() });
      index += 1;
      continue;
    }

    const listMatch = line.match(/^([-*]|\d+[.)]) (.*)$/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const candidateMatch = candidate.match(/^([-*]|\d+[.)]) (.*)$/);
        if (!candidateMatch) break;
        items.push(candidateMatch[2].trim());
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (
        !candidate ||
        /^---+$/.test(candidate) ||
        /^(#{1,6})\s+/.test(candidate) ||
        /^([-*]|\d+[.)]) /.test(candidate)
      ) break;
      paragraphLines.push(candidate);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export function AgentMarkdown({
  content,
  className
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseMarkdown(content);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "divider") {
          return (
            <div
              key={`divider-${blockIndex}`}
              className="my-6 border-t border-[var(--color-border)]"
            />
          );
        }

        if (block.type === "heading") {
          // H1/H2 — section title style
          if (block.level <= 2) {
            return (
              <div
                key={`heading-${blockIndex}`}
                className="mb-3 mt-7 first:mt-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-light)] px-4 py-2.5"
              >
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                  {renderInline(block.text)}
                </h4>
              </div>
            );
          }

          // H3/H4 — subsection
          return (
            <h5
              key={`heading-${blockIndex}`}
              className="mb-2 mt-5 first:mt-0 text-sm font-semibold text-[var(--color-text-1)]"
            >
              {renderInline(block.text)}
            </h5>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={`list-${blockIndex}`}
              className={
                block.ordered
                  ? "mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-[var(--color-text-2)]"
                  : "mt-3 space-y-2 pl-4 text-sm leading-7 text-[var(--color-text-2)]"
              }
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={`item-${blockIndex}-${itemIndex}`}
                  className={
                    block.ordered
                      ? ""
                      : "flex items-start gap-2 before:mt-2 before:h-1.5 before:w-1.5 before:flex-shrink-0 before:rounded-full before:bg-[var(--color-primary)] before:opacity-60"
                  }
                >
                  <span>{renderInline(item)}</span>
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p
            key={`paragraph-${blockIndex}`}
            className="mt-3 first:mt-0 text-sm leading-7 text-[var(--color-text-2)]"
          >
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
