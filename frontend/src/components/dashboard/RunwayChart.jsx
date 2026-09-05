import { useState, useRef, useMemo, useCallback } from 'react';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export function RunwayChart({ runwayData, customSafeDailySpend = null }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const liquidReserve = runwayData?.liquidReserve ?? 65000;
  const committedBills = runwayData?.committedBills ?? 0;
  const safeDailySpend = customSafeDailySpend !== null ? customSafeDailySpend : (runwayData?.safeDailySpend ?? 2600);
  const daysRemaining = runwayData?.daysRemaining ?? 25;
  const cycleStart = runwayData?.cycleStart ?? '2026-09-01';
  const cycleEnd = runwayData?.cycleEnd ?? '2026-09-30';

  // Generate 30 daily projection points for the pay cycle
  const { points, currentDay, totalDays } = useMemo(() => {
    const pts = [];
    const numDays = 30;
    const currDay = Math.max(1, numDays - daysRemaining + 1);
    const startDate = new Date(cycleStart);

    for (let day = 1; day <= numDays; day++) {
      const pointDate = new Date(startDate);
      pointDate.setDate(startDate.getDate() + (day - 1));
      const dateStr = pointDate.toISOString().split('T')[0];

      let projectedBalance;
      if (day <= currDay) {
        projectedBalance = liquidReserve;
      } else {
        const daysPastCurrent = day - currDay;
        projectedBalance = Math.max(
          committedBills,
          liquidReserve - daysPastCurrent * safeDailySpend
        );
      }

      pts.push({
        day,
        date: dateStr,
        isPast: day < currDay,
        isToday: day === currDay,
        isFuture: day > currDay,
        projectedBalance,
        safeDailySpend,
        committedFloor: committedBills,
      });
    }

    return { points: pts, currentDay: currDay, totalDays: numDays };
  }, [liquidReserve, committedBills, safeDailySpend, daysRemaining, cycleStart]);

  const width = 800;
  const height = 300;
  const padding = useMemo(() => ({ top: 30, right: 30, bottom: 40, left: 70 }), []);
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const maxBalance = useMemo(() => {
    return Math.max(...points.map((p) => p.projectedBalance), liquidReserve * 1.15, 1000);
  }, [points, liquidReserve]);
  const minBalance = 0;

  const getX = useCallback(
    (index) => padding.left + (index / (totalDays - 1)) * graphWidth,
    [padding.left, totalDays, graphWidth]
  );

  const getY = useCallback(
    (val) => padding.top + graphHeight - ((val - minBalance) / (maxBalance - minBalance)) * graphHeight,
    [padding.top, graphHeight, minBalance, maxBalance]
  );

  // Cubic bezier SVG path
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${getX(0)} ${getY(points[0].projectedBalance)}`;
    for (let i = 1; i < points.length; i++) {
      const prevX = getX(i - 1);
      const prevY = getY(points[i - 1].projectedBalance);
      const currX = getX(i);
      const currY = getY(points[i].projectedBalance);
      const cp1x = prevX + (currX - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (currX - prevX) / 2;
      const cp2y = currY;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currX} ${currY}`;
    }
    return d;
  }, [points, getX, getY]);

  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return '';
    const startX = getX(0);
    const endX = getX(points.length - 1);
    const baselineY = getY(0);
    return `${pathD} L ${endX} ${baselineY} L ${startX} ${baselineY} Z`;
  }, [pathD, points, getX, getY]);

  // Handle pointer hover across graph
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    const boundedX = Math.max(padding.left, Math.min(width - padding.right, mouseX));
    const ratio = (boundedX - padding.left) / graphWidth;
    const rawIndex = Math.round(ratio * (totalDays - 1));
    const clampedIndex = Math.max(0, Math.min(totalDays - 1, rawIndex));
    setHoverIndex(clampedIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[currentDay - 1];

  const yTicks = [
    maxBalance,
    maxBalance * 0.75,
    maxBalance * 0.5,
    maxBalance * 0.25,
    0,
  ];

  return (
    <div className="saas-glass-card p-5 sm:p-6 shadow-framer-md">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Cashflow &amp; Runway Trajectory
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              30-Day Model
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Dynamic forward burn path maintaining committed reserve until cycle completion.
          </p>
        </div>

        {/* Live Hover Stat Callout */}
        {activePoint && (
          <div className="flex items-center gap-3 bg-[var(--bg-card-subtle)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-xs">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                {activePoint.isToday ? 'Today · Projected' : formatDate(activePoint.date)}
              </span>
              <CurrencyDisplay
                amount={activePoint.projectedBalance}
                size="sm"
                className="text-[var(--text-primary)]"
              />
            </div>
            <div className="w-px h-6 bg-[var(--border-subtle)]" />
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">
                Spend Velocity
              </span>
              <span className="text-xs font-semibold font-display-num text-indigo-600 dark:text-indigo-400">
                {formatCurrency(safeDailySpend)}/d
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-4 w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Smooth ethereal area gradient */}
            <linearGradient id="copilotAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing line filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Grid Hairlines with crisp light/dark visibility */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-zinc-800/80"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 dark:fill-slate-400 font-display-num font-medium"
                >
                  ₹{Math.round(tick).toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#copilotAreaGrad)" />

          {/* Glowing Trajectory Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Today Indicator (Day 6) */}
          {currentDay && (
            <g>
              <line
                x1={getX(currentDay - 1)}
                y1={padding.top}
                x2={getX(currentDay - 1)}
                y2={height - padding.bottom}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.7"
              />
              <circle
                cx={getX(currentDay - 1)}
                cy={getY(points[currentDay - 1]?.projectedBalance || liquidReserve)}
                r="4"
                fill="#6366f1"
              />
              <circle
                cx={getX(currentDay - 1)}
                cy={getY(points[currentDay - 1]?.projectedBalance || liquidReserve)}
                r="8"
                fill="#6366f1"
                opacity="0.3"
                className="animate-ping"
              />
            </g>
          )}

          {/* Hover Crosshair & Dot */}
          {hoverIndex !== null && activePoint && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-400"
                strokeWidth="1"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(activePoint.projectedBalance)}
                r="5"
                className="fill-white dark:fill-zinc-900 stroke-indigo-500"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* X Axis Labels */}
          {points
            .filter((p) => p.day === 1 || p.day === 10 || p.day === 20 || p.day === 30)
            .map((p) => (
              <text
                key={p.day}
                x={getX(p.day - 1)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 dark:fill-slate-400 font-display-num font-medium"
              >
                Day {p.day}
              </text>
            ))}
        </svg>
      </div>

      {/* Chart Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-indigo-500 rounded" />
            Projected Cash Trajectory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Today (Day {currentDay})
          </span>
        </div>

        <span className="text-[var(--text-secondary)] font-medium">
          Cycle: {formatDate(cycleStart)} – {formatDate(cycleEnd)}
        </span>
      </div>
    </div>
  );
}
