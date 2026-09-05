import { useState, useRef, useMemo, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export function RunwayChart({ runwayData }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const liquidReserve = runwayData?.liquidReserve ?? 65000;
  const committedBills = runwayData?.committedBills ?? 0;
  const safeDailySpend = runwayData?.safeDailySpend ?? 2600;
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

      // Model projected cash trajectory based on safe daily spend
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

  // Chart dimensions & viewBox coordinates
  const width = 800;
  const height = 300;
  const padding = useMemo(() => ({ top: 30, right: 30, bottom: 40, left: 70 }), []);
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Find min and max for scaling
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

  // Construct smooth SVG path coordinates
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${getX(0)} ${getY(points[0].projectedBalance)}`;
    for (let i = 1; i < points.length; i++) {
      const prevX = getX(i - 1);
      const prevY = getY(points[i - 1].projectedBalance);
      const currX = getX(i);
      const currY = getY(points[i].projectedBalance);
      // Smooth cubic bezier control points
      const cp1x = prevX + (currX - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (currX - prevX) / 2;
      const cp2y = currY;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currX} ${currY}`;
    }
    return d;
  }, [points, getX, getY]);

  // Area path closing at the bottom baseline
  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return '';
    const lastX = getX(points.length - 1);
    const firstX = getX(0);
    const bottomY = padding.top + graphHeight;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, points.length, getX, padding.top, graphHeight]);

  if (!runwayData) return null;

  // Handle mouse move for interactive inspection
  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const normalizedX = (mouseX / rect.width) * width;

    if (normalizedX < padding.left || normalizedX > width - padding.right) {
      setHoverIndex(null);
      return;
    }

    const relativeX = normalizedX - padding.left;
    const pointWidth = graphWidth / (totalDays - 1);
    const index = Math.min(
      totalDays - 1,
      Math.max(0, Math.round(relativeX / pointWidth))
    );
    setHoverIndex(index);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[currentDay - 1] || points[0];
  const activeX = hoverIndex !== null ? getX(hoverIndex) : getX(currentDay - 1);
  const activeY = hoverIndex !== null ? getY(activePoint.projectedBalance) : getY(activePoint.projectedBalance);

  // Horizontal Grid Lines
  const yTicks = [
    { value: maxBalance, label: formatCurrency(maxBalance, { showFraction: false }) },
    { value: maxBalance * 0.66, label: formatCurrency(maxBalance * 0.66, { showFraction: false }) },
    { value: maxBalance * 0.33, label: formatCurrency(maxBalance * 0.33, { showFraction: false }) },
    { value: 0, label: '₹0' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-framer-xs hover:shadow-framer-md transition-all duration-200 p-6 mb-8">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-stone-900">
              Runway Burn &amp; Cashflow Trajectory
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Pay Cycle Model
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Projected reserve safety through {formatDate(cycleEnd)} at current ₹{Number(safeDailySpend).toFixed(0)}/day safe spending pace.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-indigo-600 rounded-full" />
            <span className="font-medium text-stone-600">Safe Runway Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span className="font-medium text-stone-600">Today (Day {currentDay})</span>
          </div>
          {committedBills > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-500" />
              <span className="font-medium text-stone-600">Obligation Floor</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Floating Detail Strip */}
      <div className="bg-stone-50/80 border border-stone-200/70 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Inspecting:</span>
          <span className="font-mono font-medium text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200">
            Day {activePoint.day} ({formatDate(activePoint.date)})
          </span>
          {activePoint.isToday && (
            <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 text-[11px]">
              Today
            </span>
          )}
        </div>

        <div className="flex items-center gap-5">
          <div>
            <span className="text-stone-500 mr-1.5">Projected Balance:</span>
            <span className="font-display-num font-bold text-stone-900">
              {formatCurrency(activePoint.projectedBalance)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 mr-1.5">Daily Safe Spend:</span>
            <span className="font-display-num font-bold text-indigo-700">
              {formatCurrency(activePoint.safeDailySpend)}/day
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          role="img"
          aria-label="Runway Cashflow Trajectory Chart"
        >
          <defs>
            {/* Smooth Indigo Area Gradient */}
            <linearGradient id="runwayGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
              <stop offset="70%" stopColor="#818cf8" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Glowing filter for active day dot */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const y = getY(tick.value);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={i === yTicks.length - 1 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-stone-400"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Committed Floor Line (if any) */}
          {committedBills > 0 && (
            <line
              x1={padding.left}
              y1={getY(committedBills)}
              x2={width - padding.right}
              y2={getY(committedBills)}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* Area Fill */}
          <path d={areaD} fill="url(#runwayGradient)" />

          {/* Trajectory Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Hover Crosshair Line */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={activeX}
                y1={padding.top}
                x2={activeX}
                y2={padding.top + graphHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r="6"
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="url(#glowEffect)"
              />
            </g>
          )}

          {/* Current Day Pulse Marker */}
          {hoverIndex === null && (
            <g>
              <circle
                cx={getX(currentDay - 1)}
                cy={getY(points[currentDay - 1]?.projectedBalance || liquidReserve)}
                r="10"
                fill="#10b981"
                fillOpacity="0.2"
                className="animate-ping"
              />
              <circle
                cx={getX(currentDay - 1)}
                cy={getY(points[currentDay - 1]?.projectedBalance || liquidReserve)}
                r="6"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* X-Axis Milestone Labels */}
          <g className="text-[11px] font-mono fill-stone-500">
            {/* Day 1 */}
            <text x={getX(0)} y={height - 12} textAnchor="start">
              Day 1 ({formatDate(cycleStart)})
            </text>

            {/* Today */}
            <text
              x={getX(currentDay - 1)}
              y={height - 12}
              textAnchor="middle"
              className="font-semibold fill-emerald-700"
            >
              Today (Day {currentDay})
            </text>

            {/* Mid-cycle */}
            <text x={getX(14)} y={height - 12} textAnchor="middle">
              Day 15
            </text>

            {/* End of cycle */}
            <text x={getX(totalDays - 1)} y={height - 12} textAnchor="end">
              Day 30 ({formatDate(cycleEnd)})
            </text>
          </g>
        </svg>
      </div>

      {/* Accessible Description */}
      <p className="sr-only">
        Interactive cashflow chart illustrating financial runway across {totalDays} days of current pay cycle.
        Today is day {currentDay} with {daysRemaining} days remaining, a liquid reserve of {formatCurrency(liquidReserve)},
        and a calculated safe daily spend capacity of {formatCurrency(safeDailySpend)}.
      </p>
    </div>
  );
}
