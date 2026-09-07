import { useState, useRef, useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export function BurnTrajectoryChart({ burnData, loading = false }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const points = useMemo(() => burnData?.points || [], [burnData?.points]);
  const cycleStart = burnData?.cycleStart;
  const cycleEnd = burnData?.cycleEnd;
  const asOfDate = burnData?.asOfDate;

  // Check if any expenses are recorded across the trajectory
  const hasExpenses = useMemo(() => {
    return points.some((p) => Number(p.cumulativeExpenses) > 0 || Number(p.dailyExpenses) > 0);
  }, [points]);

  const totalCumulativeSpend = useMemo(() => {
    if (points.length === 0) return 0;
    return Number(points[points.length - 1].cumulativeExpenses) || 0;
  }, [points]);

  // Chart dimensions
  const width = 800;
  const height = 280;
  const padding = useMemo(() => ({ top: 30, right: 30, bottom: 40, left: 70 }), []);
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Compute Y-axis bounds
  const { maxY, yTicks } = useMemo(() => {
    if (!hasExpenses || points.length === 0) {
      return { maxY: 1000, yTicks: [0, 500, 1000] };
    }
    const maxVal = Math.max(...points.map((p) => Number(p.cumulativeExpenses) || 0), 100);
    // Round up to clean multiple
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const roundedMax = Math.ceil((maxVal * 1.15) / (magnitude / 2)) * (magnitude / 2);
    const ticks = [0, roundedMax * 0.33, roundedMax * 0.66, roundedMax];
    return { maxY: roundedMax, yTicks: ticks };
  }, [points, hasExpenses]);

  // Calculate coordinates for each point
  const coords = useMemo(() => {
    if (points.length === 0) return [];
    const n = points.length;
    return points.map((p, i) => {
      const x = n === 1 ? padding.left + graphWidth / 2 : padding.left + (i / (n - 1)) * graphWidth;
      const spend = Number(p.cumulativeExpenses) || 0;
      const y = padding.top + graphHeight - (spend / (maxY || 1)) * graphHeight;
      return { x, y, point: p, index: i };
    });
  }, [points, graphWidth, graphHeight, padding, maxY]);

  // SVG path for line and area fill
  const { linePath, areaPath } = useMemo(() => {
    if (coords.length === 0) return { linePath: '', areaPath: '' };
    if (coords.length === 1) {
      return {
        linePath: `M ${coords[0].x} ${coords[0].y}`,
        areaPath: `M ${coords[0].x} ${padding.top + graphHeight} L ${coords[0].x} ${coords[0].y} L ${coords[0].x} ${padding.top + graphHeight} Z`,
      };
    }

    let lp = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx = (prev.x + curr.x) / 2;
      lp += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const firstX = coords[0].x;
    const lastX = coords[coords.length - 1].x;
    const bottomY = padding.top + graphHeight;
    const ap = `${lp} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { linePath: lp, areaPath: ap };
  }, [coords, padding, graphHeight]);

  const handleMouseMove = (e) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = width / rect.width;
    const svgX = clientX * scaleX;

    let closestIdx = 0;
    let minDiff = Infinity;
    coords.forEach((c, idx) => {
      const diff = Math.abs(c.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  if (loading) {
    return (
      <div className="saas-card p-5 sm:p-6 shadow-framer-md animate-pulse">
        <div className="h-5 w-48 bg-[var(--bg-card-subtle)] rounded mb-2" />
        <div className="h-3.5 w-72 bg-[var(--bg-card-subtle)] rounded mb-6" />
        <div className="h-52 w-full bg-[var(--bg-card-subtle)] rounded-xl" />
      </div>
    );
  }

  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="saas-card-rose p-5 sm:p-6 shadow-framer-md flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Spending Trajectory
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              How your recorded spending is progressing through this pay cycle
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-[var(--text-muted)]">
                Total Spend to Date
              </span>
              <span className="text-sm font-bold font-display-num text-rose-600 dark:text-rose-400">
                {formatCurrency(totalCumulativeSpend)}
              </span>
            </div>
          </div>
        </div>

        {/* Date Window Badge */}
        {cycleStart && asOfDate && (
          <div className="flex items-center justify-between mt-3 text-[11px] text-[var(--text-muted)]">
            <span>
              Recorded window:{' '}
              <strong className="text-[var(--text-secondary)]">
                {formatDate(cycleStart)} → {formatDate(asOfDate)}
              </strong>
            </span>
            {cycleEnd && (
              <span>
                Cycle ends: <span className="text-[var(--text-secondary)]">{formatDate(cycleEnd)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart Canvas or Empty State */}
      <div className="mt-4 relative min-h-[220px]">
        {!hasExpenses ? (
          <div className="flex flex-col items-center justify-center h-52 text-center p-6 bg-[var(--bg-card-subtle)] rounded-xl border border-[var(--border-subtle)]">
            <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 mb-2">
              <TrendingDown className="w-5 h-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              No spending recorded in this pay cycle
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 max-w-sm">
              When you record expense transactions, your cumulative daily spending trajectory will be plotted here in real time.
            </p>
          </div>
        ) : (
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((val, i) => {
                const yPos = padding.top + graphHeight - (val / (maxY || 1)) * graphHeight;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={width - padding.right}
                      y2={yPos}
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      className="text-[var(--border-subtle)] opacity-60"
                    />
                    <text
                      x={padding.left - 10}
                      y={yPos + 3}
                      textAnchor="end"
                      className="text-[10px] font-display-num fill-[var(--text-muted)]"
                    >
                      {formatCurrency(val, { showFraction: false })}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#spendGradient)" />
              )}

              {/* Cumulative Line Path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Daily markers on days with spending */}
              {coords.map((c, i) => {
                const hasSpend = Number(c.point.dailyExpenses) > 0;
                if (!hasSpend) return null;
                return (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r="4"
                    fill="#f43f5e"
                    stroke="var(--bg-card)"
                    strokeWidth="2"
                    className="transition-transform duration-150 hover:scale-125"
                  />
                );
              })}

              {/* Date ticks on X axis */}
              {coords.length > 0 && (
                <>
                  {/* First Date */}
                  <text
                    x={coords[0].x}
                    y={padding.top + graphHeight + 20}
                    textAnchor="start"
                    className="text-[10px] font-medium fill-[var(--text-muted)]"
                  >
                    {formatDate(coords[0].point.date)}
                  </text>
                  {/* Middle Date if enough points */}
                  {coords.length >= 6 && (
                    <text
                      x={coords[Math.floor(coords.length / 2)].x}
                      y={padding.top + graphHeight + 20}
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-[var(--text-muted)]"
                    >
                      {formatDate(coords[Math.floor(coords.length / 2)].point.date)}
                    </text>
                  )}
                  {/* Last Date */}
                  {coords.length > 1 && (
                    <text
                      x={coords[coords.length - 1].x}
                      y={padding.top + graphHeight + 20}
                      textAnchor="end"
                      className="text-[10px] font-medium fill-[var(--text-muted)]"
                    >
                      {formatDate(coords[coords.length - 1].point.date)}
                    </text>
                  )}
                </>
              )}

              {/* Interactive Crosshair & Marker */}
              {activeCoord && (
                <g>
                  {/* Vertical Crosshair line */}
                  <line
                    x1={activeCoord.x}
                    y1={padding.top}
                    x2={activeCoord.x}
                    y2={padding.top + graphHeight}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                  {/* Active marker circle */}
                  <circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r="6"
                    fill="#f43f5e"
                    stroke="var(--bg-card)"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                </g>
              )}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activeCoord && (
              <div
                className="pointer-events-none absolute z-20 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-framer-lg text-xs animate-fade-in"
                style={{
                  left: `${(activeCoord.x / width) * 100}%`,
                  top: '10px',
                  transform:
                    activeCoord.x > width * 0.7
                      ? 'translateX(-105%)'
                      : activeCoord.x < width * 0.3
                      ? 'translateX(5%)'
                      : 'translateX(-50%)',
                }}
              >
                <div className="font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-1 mb-1.5 flex items-center justify-between gap-4">
                  <span>{formatDate(activeCoord.point.date)}</span>
                  {Number(activeCoord.point.dailyExpenses) > 0 && (
                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                      Spend Day
                    </span>
                  )}
                </div>

                <div className="space-y-1 font-display-num text-[11px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--text-muted)]">Daily Spend:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(activeCoord.point.dailyExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--text-muted)]">Cumulative:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {formatCurrency(activeCoord.point.cumulativeExpenses)}
                    </span>
                  </div>
                  {Number(activeCoord.point.dailyIncome) > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--text-muted)]">Daily Income:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(activeCoord.point.dailyIncome)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
