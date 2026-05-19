"use client";

import { useState } from "react";

export interface PacingCurvePoint {
  paragraph: number;
  tension: number;
  type: "action" | "dialogue" | "description";
}

const TYPE_COLORS: Record<string, string> = {
  action: "#DC2626",
  dialogue: "#3B82F6",
  description: "#059669",
};

const TYPE_LABELS: Record<string, string> = {
  action: "动作",
  dialogue: "对话",
  description: "描写",
};

const PAD_LEFT = 50;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 40;
const WIDTH = 800;
const HEIGHT = 300;

function toX(paragraph: number, minP: number, maxP: number): number {
  const ratio = maxP === minP ? 0.5 : (paragraph - minP) / (maxP - minP);
  return PAD_LEFT + ratio * (WIDTH - PAD_LEFT - PAD_RIGHT);
}

function toY(tension: number): number {
  return PAD_TOP + (1 - tension / 10) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
}

export function PacingCurve({ data }: { data: PacingCurvePoint[] }) {
  const [hovered, setHovered] = useState<PacingCurvePoint | null>(null);

  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-sm text-text-muted">
        暂无节奏数据
      </div>
    );
  }

  const paragraphs = data.map((d) => d.paragraph);
  const minP = Math.min(...paragraphs);
  const maxP = Math.max(...paragraphs);

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${toX(d.paragraph, minP, maxP)},${toY(d.tension)}`)
    .join(" ");

  const areaPath = `${linePath} L${toX(maxP, minP, maxP)},${toY(0)} L${toX(minP, minP, maxP)},${toY(0)} Z`;

  const yTicks = [0, 2, 4, 6, 8, 10];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        aria-label="节奏曲线"
        role="img"
      >
        {/* Y-axis grid lines and labels */}
        {yTicks.map((t) => {
          const y = toY(t);
          return (
            <g key={`y-${t}`}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={WIDTH - PAD_RIGHT}
                y2={y}
                stroke="#E5E5E0"
                strokeWidth="1"
              />
              <text
                x={PAD_LEFT - 8}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-text-muted font-mono"
                fontSize="10"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* X-axis label */}
        <text
          x={WIDTH / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          className="fill-text-muted"
          fontSize="10"
        >
          段落
        </text>

        {/* Y-axis label */}
        <text
          x={12}
          y={HEIGHT / 2}
          textAnchor="middle"
          className="fill-text-muted"
          fontSize="10"
          transform={`rotate(-90, 12, ${HEIGHT / 2})`}
        >
          张力
        </text>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#pacingGradient)"
          opacity="0.15"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="pacingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Tension line */}
        <path
          d={linePath}
          fill="none"
          stroke="#1E40AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pacing-line"
        />

        {/* Data points — color by type */}
        {data.map((d) => (
          <circle
            key={d.paragraph}
            cx={toX(d.paragraph, minP, maxP)}
            cy={toY(d.tension)}
            r="5"
            fill={TYPE_COLORS[d.type]}
            stroke="white"
            strokeWidth="2"
            data-paragraph={d.paragraph}
            className="cursor-pointer transition-transform duration-150 hover:scale-150"
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-10 px-3 py-2 bg-surface border border-border rounded-md shadow-sm text-xs pointer-events-none"
          style={{
            left: toX(hovered.paragraph, minP, maxP),
            top: toY(hovered.tension) - 40,
            transform: "translate(-50%, 0)",
          }}
        >
          <p className="font-medium text-text">
            第{hovered.paragraph}段 · {TYPE_LABELS[hovered.type]}
          </p>
          <p className="text-text-muted mt-0.5">
            张力: {hovered.tension}/10
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {(["action", "dialogue", "description"] as const).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[type] }}
            />
            <span className="text-xs text-text-muted">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      {/* Line animation style */}
      <style>{`
        .pacing-line {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: pacing-draw 1s ease-out forwards;
        }
        @keyframes pacing-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
