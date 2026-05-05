// ─── Color Palette & Constants ────────────────────────────────
export const PALETTE = {
  masuk: "#10b981",
  keluar: "#f59e0b",
  maint: "#8b5cf6",
  rusak: "#ef4444",
  kategori: "#06b6d4",
  cabang: "#6366f1",
  gradient: {
    primary: ["#667eea", "#764ba2"],
    success: ["#11998e", "#38ef7d"],
    warning: ["#f6d365", "#fda085"],
    danger: ["#f43b47", "#453a94"],
  },
};

export const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#a855f7",
];

export const ACT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
];

// ─── Styles (Dashboard Animations & Components) ───────────────
export const DASHBOARD_STYLES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
    70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(99,102,241,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes shine {
    0% { left: -100%; }
    100% { left: 200%; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .dash-card {
    animation: fadeUp 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1) both;
    transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  }
  .dash-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 35px -12px rgba(0,0,0,0.1);
  }
  .dash-skeleton {
    background: linear-gradient(90deg, #f0f4f8 25%, #e8edf2 50%, #f0f4f8 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 20px;
  }
  .stat-value {
    animation: count-up 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) both;
  }
  .recharts-tooltip-wrapper {
    filter: drop-shadow(0 8px 20px rgba(0,0,0,0.12));
    animation: fadeInScale 0.2s ease;
  }
  .card-shine {
    position: relative;
    overflow: hidden;
  }
  .card-shine::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shine 3s infinite;
    pointer-events: none;
  }
  .animate-fadeInScale {
    animation: fadeInScale 0.2s ease;
  }
  .animate-pulse-ring {
    animation: pulse-ring 1.5s infinite;
  }
  .animate-spin-slow {
    animation: spin-slow 20s linear infinite;
  }
`;

// ─── Helper Functions ─────────────────────────────────────────
export function injectStyles(stylesContent) {
  if (typeof document !== "undefined" && !document.getElementById("dash-styles-enhanced")) {
    const s = document.createElement("style");
    s.id = "dash-styles-enhanced";
    s.textContent = stylesContent;
    document.head.appendChild(s);
  }
}

export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
}

export function getLastUpdatedText(date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}