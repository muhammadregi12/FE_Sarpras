import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MdShowChart,
  MdCategory,
  MdApartment,
  MdTableRows,
  MdErrorOutline,
  MdMoreHoriz,
  MdFilterList,
  MdArrowForward,
  MdRefresh,
  MdDownload,
  MdAutorenew,
  MdAnalytics,
  MdChevronRight,
  MdNorth,
  MdSouth,
  MdBuild,
  MdBarChart,
  MdQrCodeScanner,
  MdInbox,
} from "react-icons/md";
import { PALETTE, PIE_COLORS, ACT_COLORS, formatDate, getLastUpdatedText } from "../../../utils/DashboardHelpers";
import { MemoEmptyState, MemoEnhancedTooltip } from "./DashboardCard";
import { useInView } from "../../../hooks/useDashboard";

// ─── Welcome Banner ───────────────────────────────────────────
export function WelcomeBanner({ onRefresh, lastUpdated }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl mx-6 mt-6"
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)",
        boxShadow: "0 25px 40px -12px rgba(0,0,0,0.2)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-linear-to-br from-blue-500/20 to-transparent animate-spin-slow"
          style={{ animationDuration: "20s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-linear-to-tr from-emerald-500/10 to-transparent animate-spin-slow"
          style={{ animationDuration: "25s", animationDirection: "reverse" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-linear-to-r from-purple-500/5 to-pink-500/5 blur-3xl" />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">
              MANAJEMEN ASET PREMIUM
            </p>
          </div>
          <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">
            Ringkasan Inventaris
          </h1>
          <p className="text-gray-400 text-sm">
            Dashboard terakhir diperbarui: {getLastUpdatedText(lastUpdated)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:bg-white/15 bg-white/10 backdrop-blur-sm"
          >
            <MdRefresh className="text-base group-hover:rotate-180 transition-transform duration-500" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
            <MdDownload className="text-base" />
            <span>Ekspor Laporan</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-emerald-400 to-transparent" />
    </div>
  );
}

// ─── Monthly Area Chart ───────────────────────────────────────
export function MonthlyAreaChart({ data }) {
  const [sectionRef, isInView] = useInView(0.15);
  const rows = useMemo(
    () =>
      (data ?? []).map((item) => ({
        bulan: item?.bulan ?? "",
        masuk: Number(item?.masuk ?? 0),
        keluar: Number(item?.keluar ?? 0),
      })),
    [data]
  );

  return (
    <div ref={sectionRef} className="bg-white rounded-2xl p-6 card-shine min-h-85" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      {!isInView ? (
        <div className="dash-skeleton h-70 rounded-2xl" />
      ) : (
        <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <MdShowChart className="text-blue-500" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Trend Masuk vs Keluar</h3>
            <p className="text-xs text-gray-400">Perbandingan per bulan</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-emerald-700">Masuk</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-medium text-amber-700">Keluar</span>
          </div>
        </div>
      </div>

      {rows.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE.masuk} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PALETTE.masuk} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PALETTE.keluar} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PALETTE.keluar} stopOpacity={0.02} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<MemoEnhancedTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="masuk"
              name="Masuk"
              stroke={PALETTE.masuk}
              strokeWidth={3}
              fill="url(#gradMasuk)"
              dot={{ r: 4, fill: PALETTE.masuk, strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 6, stroke: "white", strokeWidth: 2, filter: "url(#glow)" }}
            />
            <Area
              type="monotone"
              dataKey="keluar"
              name="Keluar"
              stroke={PALETTE.keluar}
              strokeWidth={3}
              fill="url(#gradKeluar)"
              dot={{ r: 4, fill: PALETTE.keluar, strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 6, stroke: "white", strokeWidth: 2, filter: "url(#glow)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <MemoEmptyState text="Data chart bulanan belum tersedia" />
      )}
        </>
      )}
    </div>
  );
}

// ─── Category Pie Chart ────────────────────────────────────────
export function CategoryPieChart({ data }) {
  const [sectionRef, isInView] = useInView(0.15);
  const rows = useMemo(
    () =>
      (data ?? [])
        .slice(0, 8)
        .map((item, i) => ({
          name: item?.kategori || "Lainnya",
          value: Number(item?.total ?? 0),
          color: PIE_COLORS[i % PIE_COLORS.length],
        }))
        .filter((r) => r.value > 0),
    [data]
  );

  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div ref={sectionRef} className="bg-white rounded-2xl p-6 h-full card-shine min-h-85" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      {!isInView ? (
        <div className="dash-skeleton h-70 rounded-2xl" />
      ) : (
        <>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
          <MdCategory className="text-cyan-500" size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Distribusi Kategori</h3>
          <p className="text-xs text-gray-400">Berdasarkan jumlah barang</p>
        </div>
      </div>

      {rows.length ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={rows}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                strokeWidth={0}
                animationBegin={200}
                animationDuration={800}
              >
                {rows.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.5}
                    style={{
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => v}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e8ecf0",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 max-h-45 overflow-y-auto">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="truncate max-w-25">{r.name}</span>
                </span>
                <span className="font-semibold text-gray-700">{r.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <MemoEmptyState text="Data kategori belum tersedia" />
      )}
        </>
      )}
    </div>
  );
}

// ─── Branch Bar Chart ─────────────────────────────────────────
export function BranchBarChart({ data }) {
  const [sectionRef, isInView] = useInView(0.15);
  const rows = useMemo(
    () =>
      (data ?? []).slice(0, 8).map((item) => ({
        cabang: item?.cabang || "Tanpa Cabang",
        total_stok: Number(item?.total_stok ?? 0),
      })),
    [data]
  );

  return (
    <div ref={sectionRef} className="bg-white rounded-2xl p-6 card-shine min-h-95" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      {!isInView ? (
        <div className="dash-skeleton h-70 rounded-2xl" />
      ) : (
        <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <MdApartment className="text-indigo-500" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Distribusi Stok per Cabang</h3>
            <p className="text-xs text-gray-400">Perbandingan jumlah barang</p>
          </div>
        </div>
        <button className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
          Lihat detail <MdArrowForward size={12} />
        </button>
      </div>

      {rows.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={40}>
            <defs>
              <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE.cabang} stopOpacity={0.9} />
                <stop offset="100%" stopColor={PALETTE.cabang} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="cabang" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<MemoEnhancedTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)", radius: 8 }} />
            <Bar
              dataKey="total_stok"
              name="Total Stok"
              fill="url(#gradBar)"
              radius={[8, 8, 0, 0]}
              animationBegin={300}
              animationDuration={800}
              label={{ position: "top", fontSize: 11, fill: "#64748b" }}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <MemoEmptyState text="Data cabang belum tersedia" />
      )}
        </>
      )}
    </div>
  );
}

// ─── Simple Table ──────────────────────────────────────────────
export function SimpleTable({ title, rows, type }) {
  const dataRows = rows ?? [];
  const accent = type === "masuk" ? PALETTE.masuk : PALETTE.rusak;
  const accentBg = type === "masuk" ? "#ecfdf5" : "#fef2f2";

  return (
    <div className="bg-white rounded-2xl p-6 card-shine" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg" style={{ background: accentBg }}>
            <MdTableRows size={18} style={{ color: accent, margin: 7 }} />
          </div>
          <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <MdMoreHoriz size={14} />
        </button>
      </div>

      {dataRows.length ? (
        <div className="space-y-3">
          {dataRows.slice(0, 5).map((item, idx) => {
            const date = type === "masuk" ? item?.tanggal_masuk : item?.tanggal_rusak;
            const qty = type === "masuk" ? item?.jumlah : item?.jumlah_rusak;
            return (
              <div
                key={`${type}-${item?.id || idx}`}
                className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-sm"
                style={{ background: "#fafcff", border: "1px solid rgba(0,0,0,0.02)" }}
              >
                <div className="min-w-0 pr-3">
                  <div className="text-sm font-semibold text-gray-700 truncate">
                    {item?.barang?.name || item?.barang?.kode_barang || "Barang"}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{formatDate(date)}</span>
                    {item?.ruangan?.name_ruangan && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{item.ruangan.name_ruangan}</span>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                  style={{ background: accentBg, color: accent }}
                >
                  {qty ?? 0} unit
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <MemoEmptyState text="Belum ada data" />
      )}
    </div>
  );
}

// ─── Low Stock Alert ───────────────────────────────────────────
export function LowStockAlert({ rows, total }) {
  const dataRows = rows ?? [];

  return (
    <div className="bg-white rounded-2xl p-6 card-shine" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center animate-pulse-ring">
            <MdErrorOutline className="text-red-500" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Alert Stok Kritis</h3>
            <p className="text-xs text-gray-400">Barang dengan stok di bawah batas minimal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600">{total ?? dataRows.length} perlu tindakan</span>
          </div>
          <button className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1">
            <MdFilterList size={12} /> Filter
          </button>
        </div>
      </div>

      {dataRows.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataRows.slice(0, 9).map((item, idx) => (
            <div
              key={item?.id || idx}
              className="group relative rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
              style={{
                border: "1px solid #fee2e2",
                background: "linear-gradient(135deg, #fff9f9, #ffffff)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">
                      {item?.name || item?.kode_barang || "Barang"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 space-x-2">
                      <span>{item?.cabang?.name_cabang || "-"}</span>
                      <span>•</span>
                      <span>{item?.ruangan?.name_ruangan || "-"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-600">{item?.jumlah ?? 0}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-red-50 flex items-center justify-between">
                  <span className="text-[11px] text-red-400 font-medium">STOK KRITIS</span>
                  <button className="text-[11px] font-medium text-red-500 hover:text-red-600 flex items-center gap-0.5">
                    Atasi <MdArrowForward size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MemoEmptyState text="Semua stok dalam kondisi aman ✓" />
      )}
    </div>
  );
}

// ─── Activity Feed ─────────────────────────────────────────────
export function ActivityFeed({ activities }) {
  return (
    <div className="bg-white rounded-2xl p-6 h-full card-shine" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <MdAutorenew className="text-purple-500" size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Aktivitas Terbaru</h3>
            <p className="text-xs text-gray-400">Update real-time sistem</p>
          </div>
        </div>
        <button className="text-xs text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1">
          Arsip <MdChevronRight size={12} />
        </button>
      </div>

      {activities?.length ? (
        <div className="space-y-4 max-h-100 overflow-y-auto pr-2">
          {activities.slice(0, 8).map((act, i) => {
            const bgColor = ACT_COLORS[i % ACT_COLORS.length];
            return (
              <div
                key={i}
                className="group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-gray-50"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${bgColor}15` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: bgColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-700">
                    {act.keterangan || act.nama || "Aktivitas"}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>{act.tanggal || "—"}</span>
                    {act.user && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{act.user}</span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                  style={{ background: `${bgColor}10`, color: bgColor }}
                >
                  {act.status || "Selesai"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <MdInbox size={48} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">Belum ada aktivitas terbaru</p>
          <p className="text-xs mt-1">Aktivitas akan muncul di sini</p>
        </div>
      )}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────
export function QuickActions() {
  const actions = [
    { label: "Tambah Barang Masuk", color: "#10b981", bg: "#ecfdf5", icon: MdNorth, href: "/barang-masuk", desc: "Catat penerimaan barang" },
    { label: "Catat Barang Keluar", color: "#f59e0b", bg: "#fffbeb", icon: MdSouth, href: "/barang-keluar", desc: "Pengeluaran aset" },
    { label: "Input Maintenance", color: "#8b5cf6", bg: "#f5f3ff", icon: MdBuild, href: "/maintenance", desc: "Perawatan berkala" },
    { label: "Laporan Bulanan", color: "#3b82f6", bg: "#eff6ff", icon: MdBarChart, href: "/laporan", desc: "Analisis & statistik" },
    { label: "Scan QR Barang", color: "#06b6d4", bg: "#ecfeff", icon: MdQrCodeScanner, href: "/scan", desc: "Verifikasi cepat" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 h-full card-shine" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
          <MdAnalytics className="text-orange-500" size={18} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Akses Cepat</h3>
          <p className="text-xs text-gray-400">Fitur utama terintegrasi</p>
        </div>
      </div>
      <div className="space-y-3">
        {actions.map((q) => {
          const Icon = q.icon;
          return (
            <a
              key={q.label}
              href={q.href}
              className="group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden"
              style={{ background: q.bg }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-white/0 via-white/30 to-white/0" style={{ animation: "shine 1.5s infinite" }} />
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105"
                style={{ background: `${q.color}22` }}
              >
                <Icon size={16} color={q.color} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: q.color }}>
                  {q.label}
                </div>
                <div className="text-xs text-gray-500">{q.desc}</div>
              </div>
              <MdChevronRight size={16} style={{ color: q.color, opacity: 0.5 }} className="group-hover:opacity-100 transition-all" />
            </a>
          );
        })}
      </div>
    </div>
  );
}