import React from "react";

export default function PhaseHero({ phase }) {
  return (
    <div className="text-center pt-16 pb-12 px-4">
      <h1 className="mono text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
        <span style={{ color: phase.color }}>{phase.name}</span>
      </h1>
      <p className="mt-4 mono text-sm text-slate-500 max-w-xl mx-auto">
        {phase.subtitle}
      </p>
      <div className="mt-6 w-16 h-0.5 mx-auto rounded-full" style={{ background: phase.color + "40" }} />
    </div>
  );
}