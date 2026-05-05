import { memo, useState } from "react";
import { MdInbox, MdTrendingUp } from "react-icons/md";
import { useCountUp } from "../../../hooks/useDashboard";

// ─── Stat Card Component ──────────────────────────────────────
function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  delta, 
  trend, 
  delay = 0 
}) {
  const [ref, count] = useCountUp(typeof value === "number" ? value : 0, 800, true);
  const [isHovered, setIsHovered] = useState(false);

  const displayValue = typeof value === "number" ? count : value;

  return (
    <div
      ref={ref}
      className="relative dash-card bg-white rounded-2xl p-5 cursor-pointer card-shine"
      style={{
        border: "1px solid rgba(0,0,0,0.05)",
        animationDelay: `${delay}ms`,
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{
            background: bg,
            transform: isHovered ? "scale(1.05) rotate(3deg)" : "scale(1)",
          }}
        >
          <Icon size={20} color={color} />
        </div>
        {trend && trend !== "-" && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend.startsWith("+") ? "text-emerald-500" : "text-red-500"
            }`}
          >
            <MdTrendingUp
              size={12}
              className={trend.startsWith("-") ? "rotate-180" : ""}
            />
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold mb-1 stat-value" style={{ color }}>
        {displayValue}
      </div>
      <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            trend?.startsWith("+") ? "bg-emerald-400" : "bg-gray-300"
          }`}
        />
        {delta}
      </div>

      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${color}08, transparent)`,
          opacity: isHovered ? 1 : 0,
        }}
      />
    </div>
  );
}

export const MemoStatCard = memo(StatCard);

// ─── Empty State Component ────────────────────────────────────
function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
        <MdInbox size={32} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-400">{text}</p>
    </div>
  );
}

export const MemoEmptyState = memo(EmptyState);

// ─── Skeleton Loading Component ────────────────────────────────
function SkeletonDashboard() {
  return (
    <div className="space-y-8 p-6" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="dash-skeleton h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="dash-skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 dash-skeleton h-80 rounded-2xl" />
        <div className="dash-skeleton h-80 rounded-2xl" />
      </div>
      <div className="dash-skeleton h-72 rounded-2xl" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="dash-skeleton h-64 rounded-2xl" />
        <div className="dash-skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export const MemoSkeletonDashboard = memo(SkeletonDashboard);

// ─── Enhanced Tooltip Component ────────────────────────────────
function EnhancedTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white rounded-xl px-4 py-3 shadow-xl animate-fadeInScale"
      style={{ border: "1px solid #e8ecf0", minWidth: 160 }}
    >
      <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
        {label}
      </p>
      {payload.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 text-xs py-1"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600 capitalize">{p.name}:</span>
          </div>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export const MemoEnhancedTooltip = memo(EnhancedTooltip);

export { StatCard, EmptyState, SkeletonDashboard, EnhancedTooltip };