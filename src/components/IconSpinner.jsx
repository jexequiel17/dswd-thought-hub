import { motion } from "motion/react";

export default function IconSpinner({ className = "w-6 h-6" }) {
  return (
    <motion.svg
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="blueToRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* Background Track */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      {/* Gradient Animated Ring */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="url(#blueToRed)"
        strokeWidth="3"
        strokeDasharray="60 30"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}