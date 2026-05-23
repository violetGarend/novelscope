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
const PAD_TOP = 30;
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

interface TypeSegment {
  type: "action" | "dialogue" | "description";
  path: string;
}

function buildSegments(
  data: PacingCurvePoint[],
  minP: number,
  maxP: number
): TypeSegment[] {
  const segments: TypeSegment[] = [];
  let i = 0;
  while (i < data.length) {
    const type = data[i].type;
    const parts: string[] = [];
    let j = i;
    while (j < data.length && data[j].type === type) {
      const d = data[j];
      parts.push(
        `${j === i ? "M" : "L"}${toX(d.paragraph, minP, maxP)},${toY(d.tension)}`
      );
      j++;
    }
    segments.push({ type, path: parts.join(" ") });
    i = j;
  }
  return segments;
}

function computeTrend(
  data: PacingCurvePoint[],
  minP: number,
  maxP: number
): string {
  const byParagraph = new Map<number, number[]>();
  for (const d of data) {
    const arr = byParagraph.get(d.paragraph) || [];
    arr.push(d.tension);
    byParagraph.set(d.paragraph, arr);
  }
  const points = Array.from(byParagraph.entries())
    .map(([p, tensions]) => ({
      paragraph: p,
      tension: tensions.reduce((a, b) => a + b, 0) / tensions.length,
    }))
    .sort((a, b) => a.paragraph - b.paragraph);

  return points
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${toX(d.paragraph, minP, maxP)},${toY(d.tension)}`
    )
    .join(" ");
}

export function PacingCurve({ data }: { data: PacingCurvePoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const prevNearestRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState<PacingCurvePoint | null>(null);
  const [tooltipPixel, setTooltipPixel] = useState<{ x: number; y: number } | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());

  const paragraphs = useMemo(() => data.map((d) => d.paragraph), [data]);
  const minP = useMemo(() => (paragraphs.length > 0 ? Math.min(...paragraphs) : 1), [paragraphs]);
  const maxP = useMemo(() => (paragraphs.length > 0 ? Math.max(...paragraphs) : 1), [paragraphs]);
  const radius = circleRadius(data.length);
  const tickInterval = xTickInterval(data.length);

  const visibleData = useMemo(
    () => data.filter((d) => !hiddenTypes.has(d.type)),
    [data, hiddenTypes]
  );

  const segments = useMemo(
    () => buildSegments(data, minP, maxP),
    [data, minP, maxP]
  );

  const trendPath = useMemo(
    () => computeTrend(data, minP, maxP),
    [data, minP, maxP]
  );

  const areaPath = useMemo(() => {
    const pts = data.map(
      (d) => `L${toX(d.paragraph, minP, maxP)},${toY(d.tension)}`
    );
    return `M${toX(minP, minP, maxP)},${toY(0)} ${pts.join(" ")} L${toX(maxP, minP, maxP)},${toY(0)} Z`;
  }, [data, minP, maxP]);

  // Dynamic stroke-dasharray for animation on all line paths
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>(
      ".pacing-line, .trend-line"
    );
    for (const el of paths) {
      const len =
        typeof el.getTotalLength === "function" ? el.getTotalLength() : 2000;
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
    }
  }, [segments, trendPath]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || visibleData.length === 0) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const svgY = ((e.clientY - rect.top) / rect.height) * HEIGHT;

      let nearest: PacingCurvePoint | null = null;
      let minDist = Infinity;
      for (const d of visibleData) {
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

        const parent = svg.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const pointPx =
            (toX(nearest.paragraph, minP, maxP) / WIDTH) * rect.width;
          const pointPy = (toY(nearest.tension) / HEIGHT) * rect.height;
          setTooltipPixel({
            x: rect.left - parentRect.left + pointPx,
            y: rect.top - parentRect.top + pointPy - 44,
          });
        }
      }
    },
    [visibleData, minP, maxP]
  );

  const handleMouseLeave = useCallback(() => {
    prevNearestRef.current = null;
    setHovered(null);
    setTooltipPixel(null);
  }, []);

  function toggleType(type: string) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-sm text-text-muted">
        暂无节奏数据
      </div>
    );
  }

  const yTicks = [0, 2, 4, 6, 8, 10];
  const allTypes = ["action", "dialogue", "description"] as const;

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
        {/* Title */}
        <text
          x={WIDTH / 2}
          y={16}
          textAnchor="middle"
          className="fill-text font-semibold"
          fontSize="13"
        >
          段落张力走势
        </text>

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
          .filter(
            (d) =>
              d.paragraph % tickInterval === 0 ||
              d.paragraph === minP ||
              d.paragraph === maxP
          )
          .filter((d, i, arr) => {
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

        {/* Type-specific tension lines */}
        {allTypes.map((type) => {
          const typeSegments = segments.filter((s) => s.type === type);
          if (typeSegments.length === 0 || hiddenTypes.has(type)) return null;
          return typeSegments.map((seg, i) => (
            <path
              key={`${type}-${i}`}
              d={seg.path}
              fill="none"
              stroke={TYPE_COLORS[type]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-type={type}
              className="pacing-line"
            />
          ));
        })}

        {/* Trend dashed line */}
        <path
          d={trendPath}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeDasharray="6,4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="trend-line"
        />

        {/* Data points — color by type */}
        {data.map((d) => {
          if (hiddenTypes.has(d.type)) return null;
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
              data-type={d.type}
              className="cursor-pointer pacing-dot"
              style={{ transition: "r 0.15s ease, stroke-width 0.15s ease" }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
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

      {/* Legend — line segments, clickable */}
      <div className="flex items-center justify-center gap-4 mt-4">
        {allTypes.map((type) => {
          const hidden = hiddenTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1.5 transition-opacity ${hidden ? "opacity-30" : "opacity-100"}`}
              aria-pressed={!hidden}
              aria-label={`${hidden ? "显示" : "隐藏"}${TYPE_LABELS[type]}线`}
            >
              <span
                className="inline-block w-5 h-0.5 rounded"
                style={{ backgroundColor: TYPE_COLORS[type] }}
              />
              <span className="text-xs text-text-muted">
                {TYPE_LABELS[type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Line animation style */}
      <style>{`
        .pacing-line {
          animation: pacing-draw 1s ease-out forwards;
        }
        .trend-line {
          animation: trend-draw 1s ease-out forwards;
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
        @keyframes trend-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
