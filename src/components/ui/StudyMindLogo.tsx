import React, { useState } from 'react';

interface StudyMindLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const StudyMindLogo: React.FC<StudyMindLogoProps> = ({ 
  className = "w-9 h-9", 
  size,
  alt = "StudyMind Logo"
}) => {
  const [imgError, setImgError] = useState(false);
  const dimensionProps = size ? { width: size, height: size } : {};

  // Generate 40 radiating sunburst rays matching the uploaded logo
  const rays = Array.from({ length: 40 }).map((_, i) => {
    const angle = (i * 2 * Math.PI) / 40;
    const isLong = i % 2 === 0;
    const r1 = 158;
    const r2 = isLong ? 198 : 180;
    const x1 = (250 + r1 * Math.cos(angle)).toFixed(1);
    const y1 = (250 + r1 * Math.sin(angle)).toFixed(1);
    const x2 = (250 + r2 * Math.cos(angle)).toFixed(1);
    const y2 = (250 + r2 * Math.sin(angle)).toFixed(1);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00AEEF" strokeWidth="4" strokeLinecap="round" />;
  });

  if (!imgError) {
    return (
      <img
        src="/studymind-logo.png"
        alt={alt}
        className={`object-contain inline-block shrink-0 select-none ${className}`}
        {...dimensionProps}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 500" 
      className={`inline-block shrink-0 select-none ${className}`}
      {...dimensionProps}
      fill="none"
      aria-label={alt}
    >
      {/* Radiating Sunburst Rays */}
      <g id="sunburst-rays">
        {rays}
      </g>

      {/* LEFT BRAIN HEMISPHERE (Cyan-Blue #00AEEF) */}
      <g stroke="#00AEEF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="243" y1="118" x2="243" y2="382" />
        <path d="M 243 118 C 218 116, 202 130, 202 152 C 178 148, 160 166, 166 190 C 142 194, 132 220, 142 244 C 132 262, 140 290, 162 302 C 150 324, 170 350, 198 350 C 204 368, 224 382, 243 382" />
        <path d="M 202 152 C 214 172, 230 178, 243 178" />
        <path d="M 166 190 C 186 200, 210 192, 220 220" />
        <path d="M 142 244 C 164 244, 184 232, 200 250 C 216 268, 234 260, 243 260" />
        <path d="M 162 302 C 182 292, 206 306, 224 296" />
        <path d="M 198 350 C 210 338, 226 346, 243 336" />
      </g>

      {/* RIGHT BRAIN HEMISPHERE (Vivid Magenta #C2187A) */}
      <g stroke="#C2187A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="257" y1="118" x2="257" y2="382" />
        <path d="M 257 118 C 282 116, 298 130, 298 152 C 322 148, 340 166, 334 190 C 358 194, 368 220, 358 244 C 368 262, 360 290, 338 302 C 350 324, 330 350, 302 350 C 296 368, 276 382, 257 382" />
        <path d="M 298 152 C 286 172, 270 178, 257 178" />
        <path d="M 334 190 C 314 200, 290 192, 280 220" />
        <path d="M 358 244 C 336 244, 316 232, 300 250 C 284 268, 266 260, 257 260" />
        <path d="M 338 302 C 318 292, 294 306, 276 296" />
        <path d="M 302 350 C 290 338, 274 346, 257 336" />
      </g>
    </svg>
  );
};
