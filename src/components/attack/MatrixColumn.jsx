import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MatrixColumn({ phase }) {
  return (
    <div className="min-w-[180px] flex-1">
      {/* Column header */}
      <div className="mb-4 pb-3 border-b" style={{ borderColor: phase.color + "30" }}>
        <Link
          to={createPageUrl(phase.id)}
          className="mono text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-80 transition-opacity"
          style={{ color: phase.color }}
        >
          {phase.name}
        </Link>
      </div>

      {/* Technique cards */}
      <div className="space-y-2">
        {phase.techniques.map(tech => (
          <Link
            key={tech.name}
            to={createPageUrl(phase.id)}
            className="block p-3 rounded-lg border transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg group"
            style={{
              background: "hsl(222, 47%, 9%)",
              borderColor: phase.color + "15",
            }}
          >
            <p
              className="mono text-xs font-semibold mb-1 group-hover:opacity-100 opacity-90 transition-opacity"
              style={{ color: phase.color }}
            >
              {tech.name}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
              {tech.summary}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}