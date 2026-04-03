import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import StepCircle from "./StepCircle";
import StepRenderer from "./StepRenderer";

export default function TechniqueCard({ technique, color, phaseId, completedSteps, onToggleStep }) {
  const [expanded, setExpanded] = useState(false);

  const totalSteps = technique.steps.length;
  const doneCount = technique.steps.filter((_, i) =>
    completedSteps[`${phaseId}::${technique.name}::${i}`]
  ).length;
  const progress = totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0;

  return (
    <div
      className="rounded-xl border bg-[hsl(222,47%,8%)] overflow-hidden transition-all duration-300"
      style={{ borderColor: color + "20" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="mono text-sm font-semibold" style={{ color }}>
              {technique.name}
            </h3>
            {technique.id && (
              <span className="mono text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: color + "20", color: color + "60" }}>
                {technique.id}
              </span>
            )}
            {doneCount > 0 && (
              <span className="text-[10px] mono px-2 py-0.5 rounded-full font-medium" style={{ background: color + "15", color }}>
                {doneCount}/{totalSteps}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{technique.description}</p>
          {doneCount > 0 && (
            <div className="mt-3 h-0.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-1 shrink-0">
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
      </button>

      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {technique.tags.map(tag => (
          <span key={tag} className="mono text-[10px] px-2 py-0.5 rounded border" style={{ background: color + "08", borderColor: color + "15", color: color + "90" }}>
            {tag}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t" style={{ borderColor: color + "10" }}>
              <div className="space-y-4">
                {technique.steps.map((step, idx) => {
                  const key = `${phaseId}::${technique.name}::${idx}`;
                  const isDone = completedSteps[key] || false;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <StepCircle number={idx + 1} completed={isDone} color={color} onClick={() => onToggleStep(key)} />
                      <div className={`flex-1 min-w-0 pt-1 transition-opacity duration-200 ${isDone ? "opacity-40" : "opacity-100"}`}>
                        <StepRenderer step={step} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}