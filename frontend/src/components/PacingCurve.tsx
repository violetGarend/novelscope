"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

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
const PAD_BOTTOM = 50;
const WIDTH = 800;
const HEIGHT = 300;

function toX(paragraph: number, minP: number, maxP: number): number {
  const ratio = maxP === minP ? 0.5 : (paragraph - minP) / (maxP - minP);
  return PAD_LEFT + ratio * (WIDTH - PAD_LEFT - PAD_RIGHT);
}

function toY(tension: number): number {
  return PAD_TOP + (1 - tension / 10) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
}

/** Number of paragraph ticks to show on X-axis based on data count */
function xTickInterval(dataLength: number): number {
  if (dataLength <= 15) return 1;
  if (dataLength <= 30) return 5;
  return 10;
}

/** Circle radius adapts to data density */
function circleRadius(dataLength: number): number {
  if (dataLength <= 15) return 5;
  if (dataLength <= 25) return 4;
  return 3;
}

export function PacingCurve({ data }: { data: PacingCurvePoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const prevNearestRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState<PacingCurvePoint | null>(null);
  const [tooltipPixel, setTooltipPixel] = useState<{ x: number; y: number } | null>(null);

  const paragraphs = useMemo(() => data.map((d) => d.paragraph), [data]);
  const minP = useMemo(() => (paragraphs.length > 0 ? Math.min(...paragraphs) : 1), [paragraphs]);
  const maxP = useMemo(() => (paragraphs.length > 0 ? Math.max(...paragraphs) : 1), [paragraphs]);
  const radius = circleRadius(data.length);
  const tickInterval = xTickInterval(data.length);

  const linePath = useMemo(
    () =>
      data
        .map((d, i) => `${i === 0 ? "M" : "L"}${toX(d.paragraph, minP, maxP)},${toY(d.tension)}`)
        .join(" "),
    [data, minP, maxP]
  );

  const areaPath = useMemo(
    () =>
      `${linePath} L${toX(maxP, minP, maxP)},${toY(0)} L${toX(minP, minP, maxP)},${toY(0)} Z`,
    [linePath, minP, maxP]
  );

  // Dynamic stroke-dasharray from actual path length
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    // getTotalLength may be unavailable in jsdom test environment
    const len = typeof el.getTotalLength === "function" ? el.getTotalLength() : 2000;
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
  }, [linePath]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || data.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const svgY = ((e.clientY - rect.top) / rect.height) * HEIGHT;

      let nearest: PacingCurvePoint | null = null;
      let minDist = Infinity;
      for (const d of data) {
        const dx = toX(d.paragraph, minP, maxP) - svgX;
        const dy = toY(d.tension) - svgY;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = d;
        }
      }

      if (nearest && nearest.paragraph !== prevNearestRef.current) {
        prevNearestRef.current = nearest.paragraph;
        setHovered(nearest);

        // Compute pixel position for tooltip relative to parent
        const parent = svg.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const pointPx = (toX(nearest.paragraph, minP, maxP) / WIDTH) * rect.width;
          const pointPy = (toY(nearest.tension) / HEIGHT) * rect.height;
          setTooltipPixel({
            x: rect.left - parentRect.left + pointPx,
            y: rect.top - parentRect.top + pointPy - 44,
          });
        }
      }
    },
    [data, minP, maxP]
  );

  const handleMouseLeave = useCallback(() => {
    prevNearestRef.current = null;
    setHovered(null);
    setTooltipPixel(null);
  }, []);

  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-sm text-text-muted">
        暂无节奏数据
      </div>
    );
  }

  const yTicks = [0, 2, 4, 6, 8, 10];

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        aria-label="节奏曲线"
        role="img"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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

        {/* X-axis paragraph ticks */}
        {data
          .filter((d) => d.paragraph % tickInterval === 0 || d.paragraph === minP || d.paragraph === maxP)
          .filter((d, i, arr) => {
            // Deduplicate: if first/last already covered by interval, don't repeat
            const prev = arr[i - 1];
            return !prev || d.paragraph !== prev.paragraph;
          })
          .map((d) => {
            const x = toX(d.paragraph, minP, maxP);
            return (
              <g key={`xtick-${d.paragraph}`}>
                <line
                  x1={x}
                  y1={HEIGHT - PAD_BOTTOM}
                  x2={x}
                  y2={HEIGHT - PAD_BOTTOM + 5}
                  stroke="#C5C5BE"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={HEIGHT - PAD_BOTTOM + 15}
                  textAnchor="middle"
                  className="fill-text-muted font-mono"
                  fontSize="9"
                >
                  {d.paragraph}
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
          ref={lineRef}
          d={linePath}
          fill="none"
          stroke="#1E40AF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pacing-line"
        />

        {/* Data points — color by type */}
        {data.map((d) => {
          const cx = toX(d.paragraph, minP, maxP);
          const cy = toY(d.tension);
          const isHovered = hovered?.paragraph === d.paragraph;
          return (
            <circle
              key={d.paragraph}
              cx={cx}
              cy={cy}
              r={isHovered ? radius * 1.5 : radius}
              fill={TYPE_COLORS[d.type]}
              stroke="white"
              strokeWidth={isHovered ? 2.5 : 2}
              data-paragraph={d.paragraph}
              className="cursor-pointer pacing-dot"
              style={{ transition: "r 0.15s ease, stroke-width 0.15s ease" }}
            />
          );
        })}
      </svg>

      {/* Tooltip — positioned in pixel space relative to parent */}
      {hovered && tooltipPixel && (
        <div
          className="absolute z-10 px-3 py-2 bg-surface border border-border rounded-md shadow-sm text-xs pointer-events-none"
          style={{
            left: tooltipPixel.x,
            top: tooltipPixel.y,
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
          animation: pacing-draw 1s ease-out forwards;
        }
        .pacing-dot:hover {
          r: ${radius * 1.5};
          stroke-width: 2.5;
          transition: r 0.15s ease, stroke-width 0.15s ease;
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
