import React from "react";

export default function TechniqueMap({ phase }) {
  return (
    <div className="max-w-sm mx-auto lg:mx-0">
      <div className="pb-3 mb-4 border-b" style={{ borderColor: phase.color + "30" }}>
        <span
          className="mono text-[10px] font-bold tracking-[0.15em] uppercase"
          style={{ color: phase.color }}
        >
          {phase.name}
        </span>
      </div>
      <div className="space-y-2">
        {phase.techniques.map(tech => (
          <a
            key={tech.name}
            href={`#${tech.name.replace(/\s+/g, "-").toLowerCase()}`}
            className="block p-3 rounded-lg border transition-all duration-200 hover:translate-x-1 group"
            style={{
              background: "hsl(222, 47%, 9%)",
              borderColor: phase.color + "15",
            }}
          >
            <p
              className="mono text-xs font-semibold mb-0.5"
              style={{ color: phase.color }}
            >
              {tech.name}
            </p>
            <p className="text-[10px] text-slate-500">{tech.summary}</p>
          </a>
        ))}
      </div>
    </div>
  );
}