import { useState, useCallback, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  MdAssessment,
  MdFileDownload,
  MdRefresh,
  MdStore,
  MdMeetingRoom,
  MdInventory,
  MdNumbers,
} from "react-icons/md";
import {
  getLaporanBarangKeluar,
  exportLaporanBarangKeluarPDF,
  exportLaporanBarangKeluarExcel,
  clearLaporanBarangKeluarCache,
} from "../../services/laporanService";
import { showToast } from "../../utils/toast";
import BarangKeluarFilter from "../../components/feature/laporanbarangkeluar/BarangKeluarFilter";
import LaporanBarangKeluarTable from "../../components/feature/laporanbarangkeluar/LaporanBarangKeluarTable";

// ─── Helper download blob (tidak perlu ada di dalam komponen) ────────────────
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.parentNode.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── SummaryCard (di-extract agar tidak di-define ulang tiap render parent) ──
function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, isText = false, valueCls = "" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        {isText
          ? <p className={`text-sm font-bold truncate ${valueCls}`}>{value}</p>
          : <p className={`text-xl font-extrabold leading-tight ${valueCls}`}>{value}</p>
        }
      </div>
    </div>
  );
}

// ─── Konstanta cards agar tidak dibuat ulang tiap render ─────────────────────
const SUMMARY_CARDS_STATIC = [
  {
    key: "totalData",
    icon: MdInventory,
    iconBg: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-600",
    label: "Total Jenis Barang",
    valueCls: "text-orange-700",
    isText: false,
  },
  {
    key: "totalJumlah",
    icon: MdNumbers,
    iconBg: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-600",
    label: "Total Jumlah Keluar",
    valueCls: "text-amber-700",
    isText: false,
  },
  {
    key: "cabang",
    icon: MdStore,
    iconBg: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600",
    label: "Cabang",
    valueCls: "text-yellow-700",
    isText: true,
  },
  {
    key: "ruangan",
    icon: MdMeetingRoom,
    iconBg: "bg-rose-50 border-rose-200",
    iconColor: "text-rose-600",
    label: "Ruangan",
    valueCls: "text-rose-700",
    isText: true,
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LaporanBarangKeluarMain() {
  const [reportData,   setReportData]   = useState(null);
  const [filterInfo,   setFilterInfo]   = useState(null);
  const [totalData,    setTotalData]    = useState(0);
  const [totalJumlah,  setTotalJumlah]  = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [isExporting,  setIsExporting]  = useState({ pdf: false, excel: false });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLaporan = useCallback(async (params) => {
    try {
      setLoading(true);
      const result = await getLaporanBarangKeluar(params);
      setReportData(result.data ?? []);
      setTotalData(result.total_data ?? result.data?.length ?? 0);
      setTotalJumlah(result.total_jumlah_keluar ?? 0);
      setFilterInfo(result.filter ?? null);
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat laporan barang keluar");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, []); // tidak ada dependency → stable reference selamanya

  // ── Handlers (semua stable dengan useCallback) ────────────────────────────
  const handleFilter = useCallback((params) => {
    if (!params) {
      setReportData(null);
      setFilterInfo(null);
      setActiveFilter(null);
      setTotalData(0);
      setTotalJumlah(0);
      clearLaporanBarangKeluarCache();
      return;
    }
    setActiveFilter(params);
    fetchLaporan(params);
  }, [fetchLaporan]);

  const handleRefresh = useCallback(() => {
    if (!activeFilter) return;
    clearLaporanBarangKeluarCache();
    fetchLaporan(activeFilter);
  }, [activeFilter, fetchLaporan]);

  const handleExportPDF = useCallback(async () => {
    if (!activeFilter) {
      showToast.warning("Pilih filter terlebih dahulu sebelum export");
      return;
    }
    try {
      setIsExporting((p) => ({ ...p, pdf: true }));
      const blob = await exportLaporanBarangKeluarPDF(activeFilter);
      triggerDownload(blob, `laporan-barang-keluar-${Date.now()}.pdf`);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh PDF");
    } finally {
      setTimeout(() => setIsExporting((p) => ({ ...p, pdf: false })), 500);
    }
  }, [activeFilter]);

  const handleExportExcel = useCallback(async () => {
    if (!activeFilter) {
      showToast.warning("Pilih filter terlebih dahulu sebelum export");
      return;
    }
    try {
      setIsExporting((p) => ({ ...p, excel: true }));
      const blob = await exportLaporanBarangKeluarExcel(activeFilter);
      triggerDownload(blob, `laporan-barang-keluar-${Date.now()}.xlsx`);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh Excel");
    } finally {
      setTimeout(() => setIsExporting((p) => ({ ...p, excel: false })), 500);
    }
  }, [activeFilter]);

  // ── Derived values (memo agar tidak re-compute tiap render) ───────────────
  const hasData = reportData !== null;

  const summaryValues = useMemo(() => ({
    totalData,
    totalJumlah,
    cabang:  filterInfo?.cabang?.name   ?? "Semua",
    ruangan: filterInfo?.ruangan?.name  ?? "Semua",
  }), [totalData, totalJumlah, filterInfo]);

  const exportDisabled = !activeFilter || loading;

  return (
    <div className="min-h-full bg-white p-3 sm:p-4 lg:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      {/* ── Header ── */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
            <MdAssessment className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Laporan Barang Keluar
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Laporan inventori barang keluar berdasarkan cabang dan ruangan
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting.pdf || exportDisabled}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isExporting.pdf
                  ? "bg-orange-100 text-orange-400 cursor-wait"
                  : "bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-105 active:scale-95"
              }`}
            >
              {isExporting.pdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">Mengunduh...</span>
                </>
              ) : (
                <><MdFileDownload className="w-3.5 h-3.5" /> PDF</>
              )}
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting.excel || exportDisabled}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isExporting.excel
                  ? "bg-emerald-100 text-emerald-400 cursor-wait"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 active:scale-95"
              }`}
            >
              {isExporting.excel ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">Mengunduh...</span>
                </>
              ) : (
                <><MdFileDownload className="w-3.5 h-3.5" /> Excel</>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={exportDisabled}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
            >
              <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── Filter ── */}
      <div className="mb-4">
        <BarangKeluarFilter onFilter={handleFilter} isLoading={loading} />
      </div>

      {/* ── Summary Cards ── */}
      {hasData && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 animate-[fadeUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
          {SUMMARY_CARDS_STATIC.map((card) => (
            <SummaryCard
              key={card.key}
              icon={card.icon}
              iconBg={card.iconBg}
              iconColor={card.iconColor}
              label={card.label}
              value={summaryValues[card.key]}
              isText={card.isText}
              valueCls={card.valueCls}
            />
          ))}
        </div>
      )}

      {/* ── Tabel ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {hasData && !loading && reportData.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-orange-50/50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Menampilkan <strong className="text-gray-700">{reportData.length}</strong> jenis barang
            </span>
            <span className="text-[11px] text-gray-400">
              Total jumlah keluar: <strong className="text-orange-600">{totalJumlah}</strong> unit
            </span>
          </div>
        )}

        <LaporanBarangKeluarTable data={reportData} isLoading={loading} />
      </div>
    </div>
  );
}