import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  getDetailRuangan,
  downloadQRCodeRuangan,
} from "../../../services/ruanganService";
import { getServerBaseUrl } from "../../../services/serverUrl";
import { getBarangByRuangan } from "../../../services/barangService";
import { showToast } from "../../../utils/toast";
import {
  MdQrCode2,
  MdDownload,
  MdArrowBack,
  MdMeetingRoom,
  MdInventory2,
  MdImage,
  MdError,
  MdInbox,
} from "react-icons/md";

/* ─────────────── helpers ─────────────── */
const resolve = (path) =>
  path
    ? path.startsWith("http")
      ? path
      : `${getServerBaseUrl()}/${path.replace(/^\//, "")}`
    : null;

const unwrapDetail = (response) =>
  response?.data?.data ?? response?.data ?? response ?? null;

const getRuanganName = (value) =>
  value?.name_ruangan ??
  value?.name ??
  value?.nama ??
  value?.ruangan?.name_ruangan ??
  "—";

const getRuanganCode = (value) =>
  value?.kode_ruangan ??
  value?.kode ??
  value?.ruangan?.kode_ruangan ??
  "—";

/* ─────────────── item card ─────────────── */
function BarangItem({ item, index }) {
  const [err, setErr] = useState(false);
  const imgSrc = item?.image ? resolve(item.image) : null;

  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(20,184,166,0.1)",
        backdropFilter: "blur(8px)",
        animationDelay: `${index * 60}ms`,
        animation: "slideInItem 0.4s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.05), rgba(16,185,129,0.05))" }}
      />

      <div className="relative flex w-14 shrink-0 flex-col items-center gap-2">
        {/* Number badge */}
        <div
          className="absolute flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm"
          style={{ left: '-16px', top: '-10px', background: 'linear-gradient(135deg, #0f766e, #059669)' }}
        >
          {index + 1}
        </div>

        {/* Image */}
        <div
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
          style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfdf5)", border: "1.5px solid rgba(20,184,166,0.2)" }}
        >
          {imgSrc && !err ? (
            <img
              src={imgSrc}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setErr(true)}
            />
          ) : (
            <MdInventory2 className="w-6 h-6" style={{ color: "#5eead4" }} />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>
          {item.name || item.nama || "—"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {item.kode_barang && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold"
              style={{ background: "#f1f5f9", color: "#64748b" }}
            >
              {item.kode_barang}
            </span>
          )}
          {item.kategori?.name_kategori && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(20,184,166,0.1)", color: "#0f766e" }}
            >
              {item.kategori.name_kategori}
            </span>
          )}
          {item.jumlah && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(16,185,129,0.1)", color: "#047857" }}
            >
              {item.jumlah} {item.satuan || ""}
            </span>
          )}
          {item.tahun_pengadaan && (
            <span className="text-[10px] font-mono" style={{ color: "#94a3b8" }}>
              {item.tahun_pengadaan}
            </span>
          )}
        </div>
        {item.keterangan && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>
            {item.keterangan}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────── skeleton ─────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-4 w-64 shrink-0">
          <div className="w-56 h-56 rounded-3xl" style={{ background: "linear-gradient(135deg, #e2e8f0, #f1f5f9)" }} />
          <div className="w-40 h-10 rounded-2xl" style={{ background: "#e2e8f0" }} />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 rounded-xl" style={{ background: "#e2e8f0" }} />
          <div className="h-4 w-1/3 rounded-lg" style={{ background: "#e2e8f0" }} />
          <div className="h-px w-full" style={{ background: "#e2e8f0" }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl" style={{ background: "#f1f5f9" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── stat chip ─────────────── */
function StatChip({ icon: Icon, label, value, accent }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.7)",
        border: `1.5px solid ${accent}22`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}15` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
          {label}
        </p>
        <p className="text-sm font-black" style={{ color: "#0f172a" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─────────────── main ─────────────── */
export default function RuanganScan() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get("id");

  const [loading, setLoading] = useState(false);
  const [qrSrc, setQrSrc] = useState(null);
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    let objectUrl = null;

    const load = async () => {
      try {
        const res = await getDetailRuangan(id);
        if (mounted) setData(unwrapDetail(res));
        try {
          const barang = await getBarangByRuangan(id);
          if (mounted) setItems(barang || []);
        } catch (error) {
          void error;
        }
      } catch (err) {
        showToast.error(err?.response?.data?.message || "Gagal memuat data ruangan");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const loadQr = async () => {
      try {
        const blob = await downloadQRCodeRuangan(id);
        if (!mounted) return;
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
      } catch {
        if (mounted) setQrSrc(null);
      }
    };

    const timer = setTimeout(() => {
      if (mounted) setLoading(true);
      void load();
      void loadQr();
    }, 0);

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      clearTimeout(timer);
    };
  }, [id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await downloadQRCodeRuangan(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-ruangan-${data?.kode_ruangan || id}.png`;
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
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 50%, #f8fafc 100%)" }}
        >
          <div className="text-center max-w-xs">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ background: "linear-gradient(135deg, #fee2e2, #fecaca)", border: "1.5px solid #fca5a5" }}
            >
              <MdError className="w-10 h-10" style={{ color: "#ef4444" }} />
            </div>
            <h3 className="text-xl font-black mb-2" style={{ color: "#0f172a" }}>
              ID tidak ditemukan
            </h3>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
              Pastikan link QR mengandung parameter{" "}
              <code
                className="px-1.5 py-0.5 rounded-lg font-mono text-xs font-bold"
                style={{ background: "#f1f5f9", color: "#0f766e" }}
              >
                id
              </code>
              .
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: "linear-gradient(135deg, #0f766e, #059669)", boxShadow: "0 8px 24px rgba(15,118,110,0.3)" }}
            >
              <MdArrowBack className="w-4 h-4" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </>
    );
  }

  const imgSrc = data?.image ? resolve(data.image) : null;
  const ruanganName = getRuanganName(data);
  const ruanganCode = getRuanganCode(data);

  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(160deg, #f0fdfa 0%, #ecfdf5 30%, #f8fafc 60%, #eff6ff 100%)" }}
      >
        {/* ── Decorative blobs ── */}
        <div
          className="fixed top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="fixed bottom-0 left-0 w-80 h-80 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* ── Top nav ── */}
          <div
            className="flex items-center justify-between"
            style={{ animation: "fadeDown 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <Link
              to="/ruangan"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1.5px solid rgba(20,184,166,0.2)",
                color: "#0f766e",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <MdArrowBack className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              Kembali
            </Link>

          </div>

          {/* ── Main glass card ── */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1.5px solid rgba(20,184,166,0.15)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset",
              animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both",
            }}
          >
            {/* Gradient header strip */}
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(90deg, #0f766e, #14b8a6, #10b981, #34d399)" }}
            />

            <div className="p-6 sm:p-8 lg:p-10">
              {loading ? (
                <Skeleton />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                  {/* ── Left panel ── */}
                  <div className="lg:col-span-2 flex flex-col items-center gap-6">

                    {/* QR code frame */}
                    <div className="relative" style={{ animation: "scaleIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
                      {/* Outer glow ring */}
                      <div
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{
                          background: "linear-gradient(135deg, rgba(20,184,166,0.2), rgba(16,185,129,0.1))",
                          transform: "scale(1.06)",
                          filter: "blur(12px)",
                        }}
                      />

                      {/* Corner decorators */}
                      {[
                        "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
                        "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
                        "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
                        "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
                      ].map((cls, i) => (
                        <span
                          key={i}
                          className={`absolute w-7 h-7 ${cls} z-10 pointer-events-none`}
                          style={{ borderColor: "#14b8a6" }}
                        />
                      ))}

                      {/* QR Container */}
                      <div
                        className="relative w-56 h-56 rounded-2xl overflow-hidden flex items-center justify-center p-4"
                        style={{
                          background: "linear-gradient(135deg, #f8fafc, #ffffff)",
                          border: "1.5px solid rgba(20,184,166,0.2)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                        }}
                      >
                        {qrSrc ? (
                          <img
                            src={qrSrc}
                            alt={`QR Ruangan ${id}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center"
                              style={{ background: "rgba(20,184,166,0.1)" }}
                            >
                              <MdQrCode2 className="w-7 h-7" style={{ color: "#14b8a6" }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                              Memuat QR...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Code pill */}
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(15,118,110,0.08), rgba(5,150,105,0.08))",
                        border: "1.5px solid rgba(20,184,166,0.25)",
                      }}
                    >
                      <MdMeetingRoom className="w-4 h-4" style={{ color: "#14b8a6" }} />
                      <span className="text-sm font-black font-mono" style={{ color: "#0f766e" }}>
                        {ruanganCode !== "—" ? ruanganCode : id}
                      </span>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="group relative w-full overflow-hidden flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-black text-white transition-all duration-300"
                      style={
                        downloading
                          ? { background: "#e2e8f0", color: "#94a3b8", cursor: "wait" }
                          : {
                              background: "linear-gradient(135deg, #0f766e, #059669)",
                              boxShadow: "0 8px 24px rgba(15,118,110,0.35)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!downloading) e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {!downloading && (
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: "linear-gradient(135deg, #0f766e99, #059669aa)" }}
                        />
                      )}
                      {downloading ? (
                        <>
                          <div
                            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: "#94a3b8", borderTopColor: "transparent" }}
                          />
                          <span>Mengunduh...</span>
                        </>
                      ) : (
                        <>
                          <MdDownload className="w-4 h-4 relative z-10 group-hover:-translate-y-0.5 transition-transform duration-200" />
                          <span className="relative z-10">Unduh QR Code</span>
                        </>
                      )}
                    </button>

                    {/* Room photo */}
                    {imgSrc && !imgError && (
                      <div
                        className="w-full space-y-2.5"
                        style={{ animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <MdImage className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
                          <span
                            className="text-[10px] font-black uppercase tracking-widest"
                            style={{ color: "#94a3b8" }}
                          >
                            Foto Ruangan
                          </span>
                        </div>
                        <div
                          className="w-full rounded-2xl overflow-hidden aspect-video"
                          style={{ border: "1.5px solid rgba(20,184,166,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                        >
                          <img
                            src={imgSrc}
                            alt={ruanganName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            onError={() => setImgError(true)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Right panel ── */}
                  <div
                    className="lg:col-span-3 space-y-7"
                    style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}
                  >
                    {/* Room name */}
                    <div>
                      <div className="flex items-start gap-3 mb-1">
                        <div
                          className="mt-1 w-1 h-8 rounded-full shrink-0"
                          style={{ background: "linear-gradient(180deg, #14b8a6, #10b981)" }}
                        />
                        <h2
                          className="text-2xl font-black leading-tight"
                          style={{ color: "#0f172a", letterSpacing: "-0.03em" }}
                        >
                          {ruanganName}
                        </h2>
                      </div>
                      <p className="ml-4 text-xs font-medium" style={{ color: "#94a3b8" }}>
                        Kode ruangan:{" "}
                        <span
                          className="font-black font-mono px-1.5 py-0.5 rounded-lg"
                          style={{ color: "#0f766e", background: "rgba(20,184,166,0.1)" }}
                        >
                          {ruanganCode}
                        </span>
                      </p>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3">
                      <StatChip
                        icon={MdMeetingRoom}
                        label="Ruangan"
                        value={ruanganCode !== "—" ? ruanganCode : "—"}
                        accent="#14b8a6"
                      />
                      <StatChip
                        icon={MdInventory2}
                        label="Total Barang"
                        value={`${items.length} item`}
                        accent="#10b981"
                      />
                    </div>

                    {/* Divider with label */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(20,184,166,0.3), transparent)" }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                        Inventaris
                      </span>
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.3))" }} />
                    </div>

                    {/* Barang list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MdInventory2 className="w-4 h-4" style={{ color: "#14b8a6" }} />
                          <span className="text-sm font-black" style={{ color: "#0f172a" }}>
                            Daftar Barang
                          </span>
                        </div>
                        {items.length > 0 && (
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black"
                            style={{
                              background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(16,185,129,0.12))",
                              color: "#0f766e",
                              border: "1px solid rgba(20,184,166,0.25)",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#14b8a6" }}
                            />
                            {items.length} item
                          </div>
                        )}
                      </div>

                      {items.length === 0 ? (
                        <div
                          className="flex flex-col items-center gap-3 py-10 rounded-2xl"
                          style={{
                            background: "linear-gradient(135deg, #f8fafc, #f0fdfa)",
                            border: "1.5px dashed rgba(20,184,166,0.25)",
                          }}
                        >
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(20,184,166,0.08)" }}
                          >
                            <MdInbox className="w-7 h-7" style={{ color: "#5eead4" }} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold" style={{ color: "#64748b" }}>
                              Tidak ada barang tercatat
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                              Ruangan ini belum memiliki inventaris
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="space-y-2 max-h-80 overflow-y-auto pr-1"
                          style={{ scrollbarWidth: "thin", scrollbarColor: "#5eead4 transparent" }}
                        >
                          {items.map((item, idx) => (
                            <BarangItem key={item.id} item={item} index={idx} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Footer watermark */}
          <p
            className="text-center text-[11px] font-semibold pb-4"
            style={{ color: "rgba(148,163,184,0.6)", animation: "fadeUp 0.6s ease 0.5s both" }}
          >
            Sistem Manajemen Inventaris · Scan QR
          </p>

        </div>
      </div>
    </>
  );
}
