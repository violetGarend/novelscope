interface RadarChartProps {
  hook: number;
  climax: number;
  cliffhanger: number;
  pacing: number;
  labels?: { hook: string; climax: string; cliffhanger: string; pacing: string };
  /** Primary model name (shown in legend when dual mode) */
  modelName?: string;
  /** Second model data for dual-model comparison mode */
  secondModel?: {
    name: string;
    scores: { hook: number; climax: number; cliffhanger: number; pacing: number };
    color: string;
    strokeDasharray?: string;
  };
  /** Dimension keys with divergence (>2 delta) */
  divergenceDims?: string[];
  /** Visual size variant */
  size?: "default" | "hero";
}

interface AxisDef {
  key: string;
  label: string;
  score: number;
  angle: number;
  x: number;
  y: number;
}

function scoreColor(score: number): string {
  if (score >= 7) return "#059669";
  if (score >= 5) return "#D97706";
  return "#DC2626";
}

export function RadarChart({
  hook,
  climax,
  cliffhanger,
  pacing,
  labels,
  modelName = "DeepSeek",
  secondModel,
  divergenceDims,
  size = "default",
}: RadarChartProps) {
  const isHero = size === "hero";
  const cx = isHero ? 220 : 170;
  const cy = isHero ? 220 : 170;
  const maxR = isHero ? 150 : 110;
  const viewBox = isHero ? "0 0 440 440" : "0 0 340 340";
  const wrapperClass = isHero ? "w-full max-w-[540px] mx-auto" : "w-full max-w-[420px] mx-auto";
  const fontSize = isHero ? 13 : 11;
  const scoreFontSize = isHero ? 11 : 10;
  const gridFontSize = isHero ? 10 : 9;
  const pointR = isHero ? 5 : 4;
  const legendClass = isHero ? "text-sm" : "text-xs";
  const dimLabels = labels ?? {
    hook: "Hook",
    climax: "爽点密度",
    cliffhanger: "章末悬念",
    pacing: "节奏",
  };

  const isDual = secondModel !== undefined;
  const labelOffset = isHero ? 32 : 24;

  const point = (angle: number, score: number) => {
    const r = (score / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const axes: AxisDef[] = [
    { key: "hook", label: dimLabels.hook, score: hook, angle: -Math.PI / 2, ...point(-Math.PI / 2, hook) },
    { key: "climax", label: dimLabels.climax, score: climax, angle: 0, ...point(0, climax) },
    { key: "cliffhanger", label: dimLabels.cliffhanger, score: cliffhanger, angle: Math.PI / 2, ...point(Math.PI / 2, cliffhanger) },
    { key: "pacing", label: dimLabels.pacing, score: pacing, angle: Math.PI, ...point(Math.PI, pacing) },
  ];

  const secondAxes: AxisDef[] | undefined = isDual
    ? [
        { key: "hook", label: dimLabels.hook, score: secondModel.scores.hook, angle: -Math.PI / 2, ...point(-Math.PI / 2, secondModel.scores.hook) },
        { key: "climax", label: dimLabels.climax, score: secondModel.scores.climax, angle: 0, ...point(0, secondModel.scores.climax) },
        { key: "cliffhanger", label: dimLabels.cliffhanger, score: secondModel.scores.cliffhanger, angle: Math.PI / 2, ...point(Math.PI / 2, secondModel.scores.cliffhanger) },
        { key: "pacing", label: dimLabels.pacing, score: secondModel.scores.pacing, angle: Math.PI, ...point(Math.PI, secondModel.scores.pacing) },
      ]
    : undefined;

  const gridLevels = [2.5, 5, 7.5, 10];
  const polygonPoints = axes.map((a) => `${a.x},${a.y}`).join(" ");
  const secondPolygonPoints = secondAxes?.map((a) => `${a.x},${a.y}`).join(" ");

  const labelOffsetFn = (angle: number) => {
    let dx = 0, dy = 0;
    if (angle === -Math.PI / 2) dy = -labelOffset;
    else if (angle === 0) dx = labelOffset;
    else if (angle === Math.PI / 2) dy = labelOffset;
    else dx = -labelOffset;
    return { dx, dy };
  };

  const ariaLabel = isDual
    ? `四维雷达图，${modelName} 评分和 ${secondModel.name} 评分叠加显示`
    : "四维雷达图";

  const dims = divergenceDims ?? [];

  return (
    <div>
      <svg
        viewBox={viewBox}
        className={wrapperClass}
        role="img"
        aria-label={ariaLabel}
      >
        {/* Grid circles */}
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={cx}
            cy={cy}
            r={(level / 10) * maxR}
            fill="none"
            stroke="#E5E5E0"
            strokeWidth={1}
            strokeDasharray={level === 10 ? "none" : "4 3"}
          />
        ))}

        {/* Grid level labels (on the Hook axis) */}
        {gridLevels.map((level) => {
          const r = (level / 10) * maxR;
          return (
            <text
              key={`label-${level}`}
              x={cx}
              y={cy - r - 4}
              className="fill-text-muted"
              fontSize={gridFontSize}
              textAnchor="middle"
            >
              {level}
            </text>
          );
        })}

        {/* Axis lines */}
        {axes.map((axis) => {
          const endX = cx + maxR * Math.cos(axis.angle);
          const endY = cy + maxR * Math.sin(axis.angle);
          return (
            <line
              key={`axis-${axis.key}`}
              x1={cx}
              y1={cy}
              x2={endX}
              y2={endY}
              stroke="#E5E5E0"
              strokeWidth={1}
            />
          );
        })}

        {/* Primary model polygon */}
        <polygon
          points={polygonPoints}
          fill="#1E40AF"
          fillOpacity={0.12}
          stroke="#1E40AF"
          strokeWidth={2}
          strokeLinejoin="round"
          className="radar-polygon"
        />

        {/* Second model polygon (dual mode) */}
        {isDual && secondPolygonPoints && (
          <polygon
            points={secondPolygonPoints}
            fill={secondModel.color}
            fillOpacity={0.1}
            stroke={secondModel.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray={secondModel.strokeDasharray ?? "6,4"}
            className="radar-polygon"
          />
        )}

        {/* Primary model data points */}
        {axes.map((axis) => (
          <circle
            key={`point-${axis.key}`}
            cx={axis.x}
            cy={axis.y}
            r={pointR}
            fill={scoreColor(axis.score)}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        ))}

        {/* Second model data points (dual mode) */}
        {isDual && secondAxes?.map((axis) => (
          <circle
            key={`point-b-${axis.key}`}
            cx={axis.x}
            cy={axis.y}
            r={pointR}
            fill={secondModel.color}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        ))}

        {/* Axis endpoint labels (dimension name + score + optional ⚠) */}
        {axes.map((axis) => {
          const endX = cx + (maxR + 10) * Math.cos(axis.angle);
          const endY = cy + (maxR + 10) * Math.sin(axis.angle);
          const { dx, dy } = labelOffsetFn(axis.angle);

          let textAnchor: "start" | "middle" | "end" = "middle";
          if (axis.angle === 0) textAnchor = "start";
          else if (axis.angle === Math.PI) textAnchor = "end";

          const hasDivergence = dims.includes(axis.key);

          return (
            <g key={`label-${axis.key}`}>
              <text
                x={endX + dx}
                y={endY + dy - 3}
                className="fill-text"
                fontSize={fontSize}
                fontWeight={500}
                textAnchor={textAnchor}
              >
                {axis.label}
                {hasDivergence && (
                  <tspan fill="#D97706" fontSize={scoreFontSize}> ⚠</tspan>
                )}
              </text>
              <text
                x={endX + dx}
                y={endY + dy + 11}
                className="fill-text-muted"
                fontSize={scoreFontSize}
                textAnchor={textAnchor}
              >
                {Number.isInteger(axis.score)
                  ? axis.score.toString()
                  : axis.score.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend (dual mode only) */}
      {isDual && (
        <div className={`flex items-center justify-center gap-6 mt-3 font-mono ${legendClass} text-text-muted`}>
          <div className="flex items-center gap-2">
            <svg width="20" height="4" className="shrink-0">
              <line x1={0} y1={2} x2={20} y2={2} stroke="#1E40AF" strokeWidth={2} />
            </svg>
            <span>{modelName}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="20" height="4" className="shrink-0">
              <line
                x1={0} y1={2} x2={20} y2={2}
                stroke={secondModel.color}
                strokeWidth={2}
                strokeDasharray={secondModel.strokeDasharray ?? "6,4"}
              />
            </svg>
            <span>{secondModel.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
