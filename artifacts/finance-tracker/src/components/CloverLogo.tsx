import React from "react";

interface CloverLogoProps {
  size?: number;
  className?: string;
}

export default function CloverLogo({ size = 26, className = "" }: CloverLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: "drop-shadow(0 2px 5px rgba(52, 211, 153, 0.45))", flexShrink: 0 }}
    >
      <defs>
        {/* Emerald gloss gradient for leaves */}
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="35%" stopColor="#22c55e" />
          <stop offset="70%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>

        {/* Radial highlight for 2010 glass orb sheen */}
        <radialGradient id="glossHighlight" cx="35%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Stem gradient */}
        <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>

      {/* Stem */}
      <path
        d="M16 16 C16 22, 13 28, 9 29 C12 28.5, 17.5 24, 17 16 Z"
        fill="url(#stemGrad)"
        stroke="#166534"
        strokeWidth="0.5"
      />

      {/* Top Leaf */}
      <path
        d="M16 16 C12 11, 11 4, 16 4 C21 4, 20 11, 16 16 Z"
        fill="url(#leafGrad)"
        stroke="#166534"
        strokeWidth="0.75"
      />
      <ellipse cx="15" cy="8" rx="2.5" ry="3.5" fill="url(#glossHighlight)" />

      {/* Right Leaf */}
      <path
        d="M16 16 C21 12, 28 11, 28 16 C28 21, 21 20, 16 16 Z"
        fill="url(#leafGrad)"
        stroke="#166534"
        strokeWidth="0.75"
      />
      <ellipse cx="23" cy="15" rx="3.5" ry="2.5" fill="url(#glossHighlight)" />

      {/* Bottom Leaf */}
      <path
        d="M16 16 C20 21, 19 28, 16 28 C13 28, 12 21, 16 16 Z"
        fill="url(#leafGrad)"
        stroke="#166534"
        strokeWidth="0.75"
      />
      <ellipse cx="16.5" cy="22.5" rx="2.5" ry="3.2" fill="url(#glossHighlight)" />

      {/* Left Leaf */}
      <path
        d="M16 16 C11 20, 4 19, 4 16 C4 13, 11 12, 16 16 Z"
        fill="url(#leafGrad)"
        stroke="#166534"
        strokeWidth="0.75"
      />
      <ellipse cx="9" cy="15" rx="3.5" ry="2.5" fill="url(#glossHighlight)" />

      {/* Center Core Glass Node */}
      <circle cx="16" cy="16" r="2.2" fill="#dcfce7" stroke="#15803d" strokeWidth="0.5" />
      <circle cx="15.4" cy="15.4" r="0.8" fill="#ffffff" />
    </svg>
  );
}
