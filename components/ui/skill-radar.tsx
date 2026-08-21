"use client";

import { useId } from "react";

type RadarPoint = { label: string; current: number; target: number };

export function SkillRadar({ points, className = "" }: { points: RadarPoint[]; className?: string }) {
  const titleId = useId();
  const size = 280; const center = size / 2; const radius = 94;
  const polar = (value: number, index: number) => {
    const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2;
    const distance = radius * value / 100;
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  };
  const polygon = (key: "current" | "target") => points.map((point, index) => polar(point[key], index)).join(" ");
  return <div className={className}>
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[300px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Current skill profile compared with target role benchmark</title>
      {[25, 50, 75, 100].map(level => <polygon key={level} points={points.map((_, index) => polar(level, index)).join(" ")} fill="none" stroke="currentColor" strokeOpacity=".12" />)}
      {points.map((point, index) => <g key={point.label}><line x1={center} y1={center} x2={polar(100, index).split(",")[0]} y2={polar(100, index).split(",")[1]} stroke="currentColor" strokeOpacity=".12" /><text x={polar(121, index).split(",")[0]} y={Number(polar(121, index).split(",")[1]) + 4} textAnchor="middle" className="fill-muted-foreground text-[9px] font-medium">{point.label}</text></g>)}
      <polygon points={polygon("target")} fill="rgb(124 58 237 / .09)" stroke="rgb(124 58 237)" strokeWidth="2" strokeDasharray="4 4" />
      <polygon points={polygon("current")} fill="rgb(79 70 229 / .18)" stroke="rgb(79 70 229)" strokeWidth="2.5" />
      {points.map((point, index) => <circle key={point.label} cx={polar(point.current, index).split(",")[0]} cy={polar(point.current, index).split(",")[1]} r="3.5" fill="rgb(79 70 229)" />)}
    </svg>
    <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-indigo-600" />Current profile</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full border-2 border-violet-600" />Role benchmark</span></div>
  </div>;
}
