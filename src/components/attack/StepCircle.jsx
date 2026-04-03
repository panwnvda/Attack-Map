import React from "react";
import { motion } from "framer-motion";

export default function StepCircle({ number, completed, color, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer"
      style={{
        background: completed ? color : "transparent",
        border: `2px solid ${completed ? color : color + "40"}`,
        boxShadow: completed ? `0 0 12px ${color}30` : "none",
      }}
    >
      <span
        className="mono text-xs font-bold"
        style={{ color: completed ? "#0a0e1a" : color + "80" }}
      >
        {number}
      </span>
    </motion.button>
  );
}