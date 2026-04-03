import React from "react";

// Step format:
// Lines starting with "$ " → command (green mono) — inside code block
// Lines starting with "# " → comment (grey mono italic) — inside code block
// Lines starting with "> " → code (white mono, prefix hidden) — inside code block
// No prefix → description text (slate-300), outside code block

export default function StepRenderer({ step }) {
  const lines = String(step).split("\n").filter(l => l.trim() !== "");

  // Group consecutive code-type lines ($, >, #) into code blocks
  // Plain text lines are their own group
  const groups = [];
  let codeBlock = [];

  const flushCodeBlock = () => {
    if (codeBlock.length > 0) {
      groups.push({ type: "codeblock", lines: [...codeBlock] });
      codeBlock = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("$ ") || line.startsWith("> ") || line.startsWith("# ")) {
      let entry;
      if (line.startsWith("$ ")) {
        entry = { kind: "cmd", content: line };
      } else if (line.startsWith("> ")) {
        entry = { kind: "code", content: line.slice(2) };
      } else {
        entry = { kind: "comment", content: line };
      }
      codeBlock.push(entry);
    } else {
      flushCodeBlock();
      groups.push({ type: "text", content: line });
    }
  }
  flushCodeBlock();

  return (
    <div className="space-y-2">
      {groups.map((g, i) => {
        if (g.type === "text") {
          return (
            <p key={i} className="text-xs text-slate-300 leading-relaxed">
              {g.content}
            </p>
          );
        }

        // code block containing mixed cmd / code / comment lines
        return (
          <div
            key={i}
            className="rounded-md bg-black/50 border border-white/8 px-3 py-2.5 space-y-0.5 overflow-x-auto"
          >
            {g.lines.map((entry, ci) => {
              if (entry.kind === "cmd") {
                const raw = entry.content.replace(/^\$ /, "");
                // If the command itself is just a comment ($ # ...)
                if (raw.startsWith("#")) {
                  return (
                    <p key={ci} className="text-xs text-slate-400 break-all whitespace-pre-wrap" style={{ fontFamily: "Consolas, 'Courier New', monospace" }}>
                      {raw}
                    </p>
                  );
                }
                const hashIdx = raw.indexOf("  #");
                const cmdPart = hashIdx !== -1 ? raw.slice(0, hashIdx) : raw;
                const commentPart = hashIdx !== -1 ? raw.slice(hashIdx) : null;
                return (
                  <p key={ci} className="text-xs font-medium break-all whitespace-pre-wrap" style={{ fontFamily: "Consolas, 'Courier New', monospace" }}>
                    <span className="text-green-400">{cmdPart}</span>
                    {commentPart && <span className="text-slate-400">{commentPart}</span>}
                  </p>
                );
              }
              if (entry.kind === "comment") {
                return (
                  <p key={ci} className="text-xs text-slate-400 break-all whitespace-pre-wrap" style={{ fontFamily: "Consolas, 'Courier New', monospace" }}>
                    {entry.content}
                  </p>
                );
              }
              // code ("> " prefix stripped)
              return (
                <p key={ci} className="text-xs text-white break-all whitespace-pre-wrap" style={{ fontFamily: "Consolas, 'Courier New', monospace" }}>
                  {entry.content}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}