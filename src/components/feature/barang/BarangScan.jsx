import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdAccessTime,
  MdArrowBack,
  MdAttachMoney,
  MdBuild,
  MdCalendarToday,
  MdCategory,
  MdDownload,
  MdError,
  MdImage,
  MdInventory2,
  MdLocationOn,
  MdMeetingRoom,
  MdNotes,
  MdQrCode2,
  MdReportProblem,
  MdScale,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";
import {
  downloadQRCodeBarang,
  getDetailBarang,
} from "../../../services/barangService";
import { getServerBaseUrl } from "../../../services/serverUrl";
import { showToast } from "../../../utils/toast";

/* ─────────────── helpers ─────────────── */
const resolve = (path) =>
  path
    ? path.startsWith("http")
      ? path
      : `${getServerBaseUrl()}/${path.replace(/^\//, "")}`
    : null;

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatCurrency = (value) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return value ?? "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(number);
};

const displayValue = (value) => {
  if (value === 0) return "0";
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object")
    return value.name_kategori ?? value.name_cabang ?? value.name_ruangan ?? value.name_supplier ?? value.name ?? value.kode_ruangan ?? value.id ?? "—";
  return value;
};

const getLatestHargaSatuan = (barangMasuk) => {
  if (!barangMasuk) return null;
  const entry = Array.isArray(barangMasuk) ? barangMasuk[0] : barangMasuk;
  const harga = entry?.harga_satuan;
  return harga === null || harga === undefined || harga === "" ? null : harga;
};

/* ─────────────── Field ─────────────── */
function Field({ icon: Icon, label, value, accent = "#3b82f6" }) {
  return (
    <div
      className="flex flex-col gap-1.5 p-3.5 rounded-2xl transition-all duration-200 group"
      style={{
        background: "rgba(255,255,255,0.6)",
        border: "1.5px solid rgba(148,163,184,0.15)",
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}33`;
        e.currentTarget.style.background = `${accent}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)";
        e.currentTarget.style.background = "rgba(255,255,255,0.6)";
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color: accent }} />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>
          {label}
        </span>
      </div>
      <span className="text-sm font-bold leading-snug" style={{ color: "#0f172a" }}>
        {displayValue(value)}
      </span>
    </div>
  );
}

/* ─────────────── SummaryCard ─────────────── */
const TONES = {
  blue:  { grad: "linear-gradient(135deg, #2563eb, #06b6d4)", bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.18)",  text: "#1d4ed8" },
  green: { grad: "linear-gradient(135deg, #059669, #34d399)", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.18)",  text: "#047857" },
  amber: { grad: "linear-gradient(135deg, #d97706, #fbbf24)", bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.18)",  text: "#b45309" },
  rose:  { grad: "linear-gradient(135deg, #e11d48, #fb7185)", bg: "rgba(225,29,72,0.08)",  border: "rgba(225,29,72,0.18)",  text: "#be123c" },
  slate: { grad: "linear-gradient(135deg, #475569, #94a3b8)", bg: "rgba(71,85,105,0.08)",  border: "rgba(71,85,105,0.18)",  text: "#334155" },
};

function SummaryCard({ icon: Icon, label, value, hint, tone = "blue", index = 0 }) {
  const t = TONES[tone] || TONES.blue;
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5"
      style={{
        background: "rgba(255,255,255,0.75)",
        border: `1.5px solid ${t.border}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms both`,
      }}
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: t.grad }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: "#0f172a" }}>{displayValue(value)}</p>
          {hint && <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: "#94a3b8" }}>{hint}</p>}
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: t.grad }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── HistoryItem ─────────────── */
const HTONES = {
  green: { bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.2)",  icon: "#059669",  badge: "rgba(5,150,105,0.12)",  badgeText: "#047857" },
  amber: { bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.2)",  icon: "#d97706",  badge: "rgba(217,119,6,0.12)",  badgeText: "#b45309" },
  rose:  { bg: "rgba(225,29,72,0.08)",  border: "rgba(225,29,72,0.2)",  icon: "#e11d48",  badge: "rgba(225,29,72,0.12)",  badgeText: "#be123c" },
  slate: { bg: "rgba(71,85,105,0.06)",  border: "rgba(71,85,105,0.15)", icon: "#64748b",  badge: "rgba(71,85,105,0.1)",   badgeText: "#334155" },
};

function HistoryItem({ title, meta, body, badge, icon: Icon, iconTone = "blue" }) {
  const t = HTONES[iconTone] || HTONES.slate;
  return (
    <article
      className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: t.bg,
        border: `1.5px solid ${t.border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${t.icon}18`, border: `1.5px solid ${t.icon}30` }}
          >
            <Icon className="h-4 w-4" style={{ color: t.icon }} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold leading-5" style={{ color: "#0f172a" }}>{title}</h4>
            <p className="mt-0.5 text-[10px]" style={{ color: "#94a3b8" }}>{meta}</p>
          </div>
        </div>
        {badge && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider"
            style={{ background: t.badge, color: t.badgeText }}
          >
            {badge}
          </span>
        )}
      </div>
      {body && (
        <p className="mt-2.5 text-xs leading-relaxed pl-12" style={{ color: "#64748b" }}>{body}</p>
      )}
    </article>
  );
}

/* ─────────────── HistoryCard ─────────────── */
const HCARD_TONES = {
  green: { grad: "linear-gradient(135deg, #059669, #34d399)", border: "rgba(5,150,105,0.15)" },
  amber: { grad: "linear-gradient(135deg, #d97706, #fbbf24)", border: "rgba(217,119,6,0.15)" },
  rose:  { grad: "linear-gradient(135deg, #e11d48, #fb7185)", border: "rgba(225,29,72,0.15)" },
  slate: { grad: "linear-gradient(135deg, #475569, #94a3b8)", border: "rgba(71,85,105,0.15)" },
};

function HistoryCard({ icon: Icon, title, subtitle, items, emptyText, renderItem, accent = "slate", index = 0 }) {
  const t = HCARD_TONES[accent] || HCARD_TONES.slate;
  return (
    <section
      className="rounded-3xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.75)",
        border: `1.5px solid ${t.border}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 80 + 200}ms both`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ background: "rgba(248,250,252,0.8)", borderBottom: "1.5px solid rgba(148,163,184,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-md"
            style={{ background: t.grad }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black" style={{ color: "#0f172a" }}>{title}</h3>
            <p className="text-[10px]" style={{ color: "#94a3b8" }}>{subtitle}</p>
          </div>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[10px] font-black"
          style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid rgba(148,163,184,0.2)", color: "#64748b" }}
        >
          {items?.length || 0} entri
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {items?.length ? (
          <div className="space-y-2.5">
            {items.map((item) => renderItem(item))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-2.5 py-8 rounded-2xl text-center"
            style={{ background: "rgba(248,250,252,0.6)", border: "1.5px dashed rgba(148,163,184,0.25)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(148,163,184,0.1)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#cbd5e1" }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── Skeleton ─────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-28 rounded-3xl" style={{ background: "linear-gradient(135deg, #e2e8f0, #f1f5f9)" }} />
        ))}
      </div>
      <div className="flex gap-8">
        <div className="flex flex-col items-center gap-4 w-64 shrink-0">
          <div className="w-56 h-56 rounded-3xl" style={{ background: "#e2e8f0" }} />
          <div className="w-40 h-10 rounded-2xl" style={{ background: "#e2e8f0" }} />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-8 w-3/4 rounded-xl" style={{ background: "#e2e8f0" }} />
          <div className="h-4 w-1/3 rounded-lg" style={{ background: "#e2e8f0" }} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-16 rounded-2xl" style={{ background: "#f1f5f9" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Main ─────────────── */
export default function BarangScan() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get("id");

  const [loading, setLoading] = useState(false);
  const [qrSrc, setQrSrc] = useState(null);
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    let objectUrl = null;
    queueMicrotask(() => {
      setLoading(true);
      getDetailBarang(id)
        .then((res) => { if (mounted) setData(res?.data ?? res); })
        .catch((err) => showToast.error(err?.response?.data?.message || "Gagal memuat data"))
        .finally(() => { if (mounted) setLoading(false); });
    });
    const loadQr = async () => {
      try {
        const blob = await downloadQRCodeBarang(id);
        if (!mounted) return;
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
      } catch { if (mounted) setQrSrc(null); }
    };
    void loadQr();
    return () => { mounted = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadQRCodeBarang(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-barang-${data?.kode_barang || id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast.success("QR berhasil diunduh");
    } catch (err) {
      showToast.error(err?.message || "Gagal mengunduh QR");
    } finally {
      setDownloading(false);
    }
  };

  /* ── No ID ── */
  if (!id) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe, #f8fafc)" }}>
          <div className="text-center max-w-xs">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", border: "1.5px solid #fca5a5" }}>
              <MdError className="w-10 h-10" style={{ color: "#ef4444" }} />
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: "#0f172a" }}>ID tidak ditemukan</h3>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
              Pastikan link QR mengandung parameter{" "}
              <code className="px-1.5 py-0.5 rounded-lg font-mono text-xs font-bold" style={{ background: "#eff6ff", color: "#2563eb" }}>id</code>.
            </p>
            <Link to="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}
            >
              <MdArrowBack className="w-4 h-4" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </>
    );
  }

  const summary = data?.summary ?? {};
  const histories = data?.histories ?? {};
  const imgSrc = data?.image ? resolve(data.image) : null;
  const barangName = data?.name || data?.nama || "—";
  const hargaSatuan = getLatestHargaSatuan(data?.barang_masuk);

  return (
    <>
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #eff6ff 0%, #dbeafe 20%, #f8fafc 50%, #f0fdf4 100%)" }}>
        {/* Decorative blobs */}
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
        <div className="fixed bottom-0 left-0 w-80 h-80 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)", transform: "translate(-30%,30%)" }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Top nav ── */}
          <div className="flex items-center justify-between" style={{ animation: "fadeDown 0.5s cubic-bezier(0.16,1,0.3,1) both" }}>
            <Link to="/barang"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(37,99,235,0.2)", color: "#1d4ed8", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
            >
              <MdArrowBack className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              Kembali
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
                <MdQrCode2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black tracking-widest uppercase" style={{ color: "#1d4ed8" }}>Detail Barang</p>
                <p className="text-[10px]" style={{ color: "#94a3b8" }}>Hasil scan QR Code</p>
              </div>
            </div>
          </div>

          {/* ── Summary cards ── */}
          {!loading && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <SummaryCard icon={MdInventory2} label="Stok Tersedia" value={summary.stok_tersedia ?? 0} hint="Sisa setelah masuk, keluar & rusak" tone="blue" index={0} />
              <SummaryCard icon={MdTrendingUp} label="Total Masuk" value={summary.total_masuk ?? 0} hint="Akumulasi barang masuk" tone="green" index={1} />
              <SummaryCard icon={MdTrendingDown} label="Total Keluar" value={summary.total_keluar ?? 0} hint="Akumulasi barang keluar" tone="amber" index={2} />
              <SummaryCard icon={MdReportProblem} label="Total Rusak" value={summary.total_rusak ?? 0} hint="Akumulasi barang rusak" tone="rose" index={3} />
            </div>
          )}

          {/* ── Main card ── */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1.5px solid rgba(37,99,235,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.9) inset",
              animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both",
            }}
          >
            {/* Gradient strip */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563eb, #3b82f6, #06b6d4, #22d3ee)" }} />

            <div className="p-6 sm:p-8 lg:p-10">
              {loading ? <Skeleton /> : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                  {/* ── Left: QR ── */}
                  <div className="lg:col-span-2 flex flex-col items-center gap-6" style={{ animation: "scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
                    {/* QR frame */}
                    <div className="relative">
                      {/* Glow */}
                      <div className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.1))", transform: "scale(1.06)", filter: "blur(12px)" }} />

                      {/* Corner decorators */}
                      {[
                        "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
                        "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
                        "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
                        "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
                      ].map((cls, i) => (
                        <span key={i} className={`absolute w-7 h-7 ${cls} z-10 pointer-events-none`} style={{ borderColor: "#3b82f6" }} />
                      ))}

                      <div className="relative w-56 h-56 rounded-2xl overflow-hidden flex items-center justify-center p-4"
                        style={{ background: "linear-gradient(135deg, #f8fafc, #ffffff)", border: "1.5px solid rgba(37,99,235,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
                        {qrSrc ? (
                          <img src={qrSrc} alt={`QR Barang ${id}`} className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(37,99,235,0.08)" }}>
                              <MdQrCode2 className="w-7 h-7" style={{ color: "#3b82f6" }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Memuat QR...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Code pill */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(6,182,212,0.08))", border: "1.5px solid rgba(37,99,235,0.2)" }}>
                      <MdInventory2 className="w-4 h-4" style={{ color: "#3b82f6" }} />
                      <span className="text-sm font-black font-mono" style={{ color: "#1d4ed8" }}>{data?.kode_barang || id}</span>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="group relative w-full overflow-hidden flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-black text-white transition-all duration-300"
                      style={downloading
                        ? { background: "#e2e8f0", color: "#94a3b8", cursor: "wait" }
                        : { background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }
                      }
                      onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.transform = "scale(1.02)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                      {downloading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#94a3b8", borderTopColor: "transparent" }} />
                          <span>Mengunduh...</span>
                        </>
                      ) : (
                        <>
                          <MdDownload className="w-4 h-4 relative z-10 group-hover:-translate-y-0.5 transition-transform duration-200" />
                          <span className="relative z-10">Unduh QR Code</span>
                        </>
                      )}
                    </button>

                    {/* Item image */}
                    {imgSrc && !imgError && (
                      <div className="w-full space-y-2.5" style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}>
                        <div className="flex items-center gap-1.5">
                          <MdImage className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>Foto Barang</span>
                        </div>
                        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(37,99,235,0.15)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                          <img
                            src={imgSrc}
                            alt={data?.name || "barang"}
                            className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
                            onError={() => setImgError(true)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Right: detail ── */}
                  <div className="lg:col-span-3 space-y-6" style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}>
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { icon: MdInventory2, label: "Detail Aset", color: "#1d4ed8", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)" },
                        { icon: MdAccessTime, label: "QR Scan", color: "#0369a1", bg: "rgba(3,105,161,0.06)", border: "rgba(3,105,161,0.15)" },
                      ].map(({ icon: Ic, label, color, bg, border }) => (
                        <span key={label}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black"
                          style={{ background: bg, border: `1.5px solid ${border}`, color }}>
                          <Ic className="h-3 w-3" /> {label}
                        </span>
                      ))}
                    </div>

                    {/* Name */}
                    <div>
                      <div className="flex items-start gap-3 mb-1">
                        <div className="mt-1 w-1 h-8 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, #3b82f6, #06b6d4)" }} />
                        <h2 className="text-2xl font-black leading-tight" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>{barangName}</h2>
                      </div>
                      <p className="ml-4 text-xs font-medium" style={{ color: "#94a3b8" }}>
                        Kode:{" "}
                        <span className="font-black font-mono px-1.5 py-0.5 rounded-lg" style={{ color: "#1d4ed8", background: "rgba(37,99,235,0.08)" }}>
                          {data?.kode_barang || "—"}
                        </span>
                      </p>
                    </div>

                    {/* Fields grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Field icon={MdCategory}      label="Kategori"         value={data?.kategori}          accent="#3b82f6" />
                      <Field icon={MdLocationOn}     label="Cabang"           value={data?.cabang}            accent="#06b6d4" />
                      <Field icon={MdMeetingRoom}    label="Ruangan"          value={data?.ruangan}           accent="#8b5cf6" />
                      <Field icon={MdScale}          label="Jumlah"           value={data?.jumlah}            accent="#10b981" />
                      <Field icon={MdScale}          label="Satuan"           value={data?.satuan}            accent="#14b8a6" />
                      <Field icon={MdCalendarToday}  label="Tahun Pengadaan"  value={data?.tahun_pengadaan}   accent="#f59e0b" />
                      <Field icon={MdAttachMoney}    label="Harga Satuan"     value={hargaSatuan != null ? formatCurrency(hargaSatuan) : null} accent="#059669" />
                      <Field icon={MdNotes}          label="Keterangan"       value={data?.keterangan}        accent="#94a3b8" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── History section ── */}
            {!loading && (
              <div
                className="px-6 sm:px-8 lg:px-10 py-8 space-y-6"
                style={{ background: "rgba(248,250,252,0.6)", borderTop: "1.5px solid rgba(148,163,184,0.1)" }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-1 h-6 rounded-full shrink-0" style={{ background: "linear-gradient(180deg, #3b82f6, #06b6d4)" }} />
                    <div>
                      <h3 className="text-sm font-black" style={{ color: "#0f172a" }}>Ringkasan & Riwayat</h3>
                      <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>Informasi langsung dari endpoint detail barang</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-black"
                    style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid rgba(148,163,184,0.2)", color: data?.summary ? "#059669" : "#94a3b8" }}
                  >
                    {data?.summary ? "✓ Data lengkap" : "Data terbatas"}
                  </span>
                </div>

                {/* History grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <HistoryCard
                    icon={MdTrendingUp} title="Riwayat Barang Masuk" subtitle="Daftar pemasukan terakhir"
                    items={histories.masuk} emptyText="Belum ada riwayat barang masuk." accent="green" index={0}
                    renderItem={(item) => (
                      <HistoryItem key={item.id} icon={MdTrendingUp} iconTone="green"
                        title={`${displayValue(item.jumlah)} unit masuk`}
                        meta={`${formatDateTime(item.tanggal_masuk) || "Tanggal tidak tersedia"}${item.user?.name ? ` · oleh ${item.user.name}` : ""}`}
                        body={[item.supplier?.name_supplier ? `Supplier: ${item.supplier.name_supplier}` : null, item.cabang?.name_cabang ? `Cabang: ${item.cabang.name_cabang}` : null, item.ruangan?.name_ruangan ? `Ruangan: ${item.ruangan.name_ruangan}` : null, item.harga_satuan != null ? `Harga: ${formatCurrency(item.harga_satuan)}` : null, item.keterangan ? `Ket: ${item.keterangan}` : null].filter(Boolean).join(" · ")}
                        badge="Masuk"
                      />
                    )}
                  />
                  <HistoryCard
                    icon={MdTrendingDown} title="Riwayat Barang Keluar" subtitle="Daftar pengeluaran terakhir"
                    items={histories.keluar} emptyText="Belum ada riwayat barang keluar." accent="amber" index={1}
                    renderItem={(item) => (
                      <HistoryItem key={item.id} icon={MdTrendingDown} iconTone="amber"
                        title={`${displayValue(item.jumlah_keluar)} unit keluar`}
                        meta={`${formatDateTime(item.tanggal_keluar) || "Tanggal tidak tersedia"}${item.user?.name ? ` · oleh ${item.user.name}` : ""}`}
                        body={[item.cabang?.name_cabang ? `Cabang: ${item.cabang.name_cabang}` : null, item.ruangan?.name_ruangan ? `Ruangan: ${item.ruangan.name_ruangan}` : null, item.keterangan ? `Ket: ${item.keterangan}` : null].filter(Boolean).join(" · ")}
                        badge="Keluar"
                      />
                    )}
                  />
                  <HistoryCard
                    icon={MdReportProblem} title="Riwayat Barang Rusak" subtitle="Daftar pencatatan kerusakan"
                    items={histories.rusak} emptyText="Belum ada riwayat barang rusak." accent="rose" index={2}
                    renderItem={(item) => (
                      <HistoryItem key={item.id} icon={MdReportProblem} iconTone="rose"
                        title={`${displayValue(item.jumlah_rusak)} unit rusak`}
                        meta={`${formatDateTime(item.tanggal_rusak) || "Tanggal tidak tersedia"}${item.user?.name ? ` · oleh ${item.user.name}` : ""}`}
                        body={[item.tingkat_kerusakan ? `Tingkat: ${item.tingkat_kerusakan}` : null, item.cabang?.name_cabang ? `Cabang: ${item.cabang.name_cabang}` : null, item.ruangan?.name_ruangan ? `Ruangan: ${item.ruangan.name_ruangan}` : null, item.keterangan ? `Ket: ${item.keterangan}` : null].filter(Boolean).join(" · ")}
                        badge="Rusak"
                      />
                    )}
                  />
                  <HistoryCard
                    icon={MdBuild} title="Riwayat Maintenance" subtitle="Daftar perawatan terakhir"
                    items={histories.maintenance} emptyText="Belum ada riwayat maintenance." accent="slate" index={3}
                    renderItem={(item) => (
                      <HistoryItem key={item.id} icon={MdBuild} iconTone="slate"
                        title={`${displayValue(item.jumlah_maintenance)} unit maintenance`}
                        meta={`${formatDateTime(item.tanggal_maintenance) || "Tanggal tidak tersedia"}${item.user?.name ? ` · oleh ${item.user.name}` : ""}`}
                        body={[item.status ? `Status: ${item.status}` : null, item.tanggal_selesai ? `Selesai: ${formatDateTime(item.tanggal_selesai)}` : null, item.biaya != null ? `Biaya: ${formatCurrency(item.biaya)}` : null, item.keterangan ? `Ket: ${item.keterangan}` : null].filter(Boolean).join(" · ")}
                        badge={item.status || "Maintenance"}
                      />
                    )}
                  />
                </div>

                {/* Footnote */}
                <div
                  className="flex items-start gap-2.5 rounded-2xl p-4"
                  style={{ background: "rgba(37,99,235,0.05)", border: "1.5px solid rgba(37,99,235,0.12)" }}
                >
                  <MdInventory2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#3b82f6" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>
                    <span className="font-black" style={{ color: "#1d4ed8" }}>Catatan:</span>{" "}
                    Stok tersedia dihitung dari total masuk dikurangi total keluar dan rusak, sesuai data.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] font-semibold pb-4" style={{ color: "rgba(148,163,184,0.6)", animation: "fadeUp 0.6s ease 0.5s both" }}>
            Sistem Manajemen Inventaris · Scan QR
          </p>

        </div>
      </div>
    </>
  );
}
