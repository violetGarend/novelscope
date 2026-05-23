interface RadarChartProps {
  hook: number;
  climax: number;
  cliffhanger: number;
  pacing: number;
  labels?: { hook: string; climax: string; cliffhanger: string; pacing: string };
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
}: RadarChartProps) {
  const cx = 170;
  const cy = 170;
  const maxR = 110;
  const dimLabels = labels ?? {
    hook: "Hook",
    climax: "爽点密度",
    cliffhanger: "章末悬念",
    pacing: "节奏",
  };

  const point = (angle: number, score: number) => {
    const r = (score / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const axes: AxisDef[] = [
    {
      key: "hook",
      label: dimLabels.hook,
      score: hook,
      angle: -Math.PI / 2,
      ...point(-Math.PI / 2, hook),
    },
    {
      key: "climax",
      label: dimLabels.climax,
      score: climax,
      angle: 0,
      ...point(0, climax),
    },
    {
      key: "cliffhanger",
      label: dimLabels.cliffhanger,
      score: cliffhanger,
      angle: Math.PI / 2,
      ...point(Math.PI / 2, cliffhanger),
    },
    {
      key: "pacing",
      label: dimLabels.pacing,
      score: pacing,
      angle: Math.PI,
      ...point(Math.PI, pacing),
    },
  ];

  const gridLevels = [2.5, 5, 7.5, 10];
  const polygonPoints = axes.map((a) => `${a.x},${a.y}`).join(" ");

  // Label offset from axis endpoint
  const labelOffset = (angle: number) => {
    const offset = 24;
    let dx = 0, dy = 0;
    if (angle === -Math.PI / 2) dy = -offset;
    else if (angle === 0) dx = offset;
    else if (angle === Math.PI / 2) dy = offset;
    else dx = -offset;
    return { dx, dy };
  };

  return (
    <svg
      viewBox="0 0 340 340"
      className="w-full max-w-[420px] mx-auto"
      role="img"
      aria-label="四维雷达图"
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
            fontSize={9}
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

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="#1E40AF"
        fillOpacity={0.12}
        stroke="#1E40AF"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {axes.map((axis) => (
        <circle
          key={`point-${axis.key}`}
          cx={axis.x}
          cy={axis.y}
          r={4}
          fill={scoreColor(axis.score)}
          stroke="#FFFFFF"
          strokeWidth={1.5}
        />
      ))}

      {/* Axis endpoint labels (dimension name + score) */}
      {axes.map((axis) => {
        const endX = cx + (maxR + 10) * Math.cos(axis.angle);
        const endY = cy + (maxR + 10) * Math.sin(axis.angle);
        const { dx, dy } = labelOffset(axis.angle);

        let textAnchor = "middle";
        if (axis.angle === 0) textAnchor = "start";
        else if (axis.angle === Math.PI) textAnchor = "end";

        return (
          <g key={`label-${axis.key}`}>
            <text
              x={endX + dx}
              y={endY + dy - 3}
              className="fill-text"
              fontSize={11}
              fontWeight={500}
              textAnchor={textAnchor}
            >
              {axis.label}
            </text>
            <text
              x={endX + dx}
              y={endY + dy + 11}
              className="fill-text-muted"
              fontSize={10}
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
  );
}
