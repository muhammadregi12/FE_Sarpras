/**
 * ScanManagement.jsx
 * Full Tailwind CSS version
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdQrCodeScanner } from "react-icons/md";
import ScanComponent from "./ScanComponent";
import { showToast } from "../../utils/toast";

/**
 * buildTargetRoute — parse hasil scan QR menjadi route tujuan.
 *
 * Format QR yang didukung:
 *  1. JSON  : {"section":"barang","id":"123"}  |  {"section":"ruangan","id":"456"}
 *             {"type":"barang","id":"123"}      |  {"entity":"ruangan","ruangan_id":"456"}
 *  2. Prefix: barang:123  /  barang_123  /  barang/123  /  barang-123
 *             ruangan:456 /  ruangan_456 /  ruangan/456 /  ruangan-456
 *  3. URL   : http://domain.com/barang/scan?id=123
 *             http://domain.com/ruangan/scan?id=456
 *             http://domain.com/scan/barang/qrcode/123
 *             http://domain.com/scan/ruangan/detail/456
 *  4. Path  : /barang/scan?id=123  |  /ruangan/scan?id=456
 */
const buildTargetRoute = (rawValue) => {
  if (!rawValue) return null;
  const value = String(rawValue).trim();
  if (!value) return null;

  const build = (section, id) =>
    id
      ? { path: `/${section}/scan?id=${encodeURIComponent(id)}`, section, id }
      : null;

  const fromObject = (input) => {
    if (!input || typeof input !== "object") return null;
    const section = String(input.section || input.type || input.entity || "").toLowerCase();
    const id = input.id || input.barang_id || input.ruangan_id;
    if (section === "barang")  return build("barang", id);
    if (section === "ruangan") return build("ruangan", id);
    return null;
  };

  // 1. JSON
  try {
    const parsed = JSON.parse(value);
    const target = fromObject(parsed);
    if (target) return target;
  } catch { /* bukan JSON */ }

  // 2. Prefix
  const prefixMatch = value.match(/^(barang|ruangan)[\s:/_-]+(.+)$/i);
  if (prefixMatch) return build(prefixMatch[1].toLowerCase(), prefixMatch[2].trim());

  // 3. URL / Path
  const resolveRoute = (pathname, searchParams) => {
    const clean = pathname.replace(/\/+$/, "");
    const directId = searchParams.get("id");

    if (clean.includes("/barang/scan"))
      return build("barang", directId || clean.split("/").filter(Boolean).pop());
    if (clean.includes("/ruangan/scan"))
      return build("ruangan", directId || clean.split("/").filter(Boolean).pop());

    const barangMatch =
      clean.match(/(?:^|\/)scan\/barang\/(?:qrcode|detail)\/([^/]+)$/i) ||
      clean.match(/(?:^|\/)barang\/(?:qrcode|detail)\/([^/]+)$/i);
    if (barangMatch) return build("barang", barangMatch[1]);

    const ruanganMatch =
      clean.match(/(?:^|\/)scan\/ruangan\/(?:qrcode|detail)\/([^/]+)$/i) ||
      clean.match(/(?:^|\/)ruangan\/(?:qrcode|detail)\/([^/]+)$/i);
    if (ruanganMatch) return build("ruangan", ruanganMatch[1]);

    return null;
  };

  try {
    const parsed = new URL(value, window.location.origin);
    return resolveRoute(parsed.pathname, parsed.searchParams);
  } catch { return null; }
};

/* ── Main Page ── */
export default function ScanManagement() {
  const navigate = useNavigate();
  const [cameraActive, setCameraActive] = useState(false);

  const handleToggleCamera = () => setCameraActive((prev) => !prev);

  const handleCapture = useCallback(() => {
    showToast?.success("Gambar berhasil diambil");
  }, []);

  const handleScanResult = useCallback((result) => {
    if (result.type === "qr") {
      const target = buildTargetRoute(result.rawValue || result.data);
      if (target?.path) {
        showToast?.success(`QR ${target.section} terdeteksi, membuka detail...`);
        setTimeout(() => navigate(target.path), 600);
        return;
      }
      showToast?.error("QR Code tidak dikenali atau belum mengandung tujuan scan yang valid");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-center">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_16px_rgba(59,130,246,0.28)] flex items-center justify-center">
            <MdQrCodeScanner className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="m-0 text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Scan QR
            </h1>
            <p className="m-0 text-xs text-slate-500">
              Tampilan kamera ringkas untuk pemindaian aset.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full transition-all duration-300 ${cameraActive ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : "bg-gray-300"}`} />
              <span className="text-xs font-semibold text-gray-700">
                {cameraActive ? "Kamera aktif" : "Kamera nonaktif"}
              </span>
            </div>
            <button
              onClick={handleToggleCamera}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${cameraActive ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}
            >
              {cameraActive ? "Stop" : "Mulai"}
            </button>
          </div>

          <div className="p-3 sm:p-4">
            <div className="mx-auto w-full max-w-[460px]">
              <ScanComponent
                isActive={cameraActive}
                onToggle={handleToggleCamera}
                onCapture={handleCapture}
                onScanResult={handleScanResult}
              />
            </div>

            {/* Tips */}
            <div className="mx-5 mb-5 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="m-0 text-[11px] text-slate-500 leading-relaxed">
                💡 <strong>Tips:</strong> Arahkan kamera ke kode QR barang atau ruangan.
                Pastikan pencahayaan cukup dan QR terlihat jelas.
                Sistem akan otomatis mendeteksi dan membuka detail saat QR berhasil dibaca.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}