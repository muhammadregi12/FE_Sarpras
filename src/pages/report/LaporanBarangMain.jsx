import { useState, useCallback, useRef } from "react";
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
  getLaporanBarang,
  exportLaporanBarangPDF,
  exportLaporanBarangExcel,
  clearLaporanBarangCache,
} from "../../services/laporanService";
import { showToast } from "../../utils/toast";
import LaporanBarangFilter from "../../components/feature/laporanbarang/LaporanBarangFilter";
import LaporanBarangTable  from "../../components/feature/laporanbarang/LaporanBarangTable";

// ─── helpers di luar komponen agar tidak re-create tiap render ───────────────
const downloadBlob = (blob, filename) => {
  const url  = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ─── Initial State ───────────────────────────────────────────────────────────
const INIT = {
  reportData:   null,
  filterInfo:   null,
  totalData:    0,
  totalJumlah:  0,
};

export default function LaporanBarangMain() {
  const [state,       setState]      = useState(INIT);
  const [activeFilter,setActiveFilter]= useState(null);
  const [loading,     setLoading]    = useState(false);
  const [isExporting, setIsExporting]= useState({ pdf: false, excel: false });

  // Ref untuk batalkan fetch lama jika filter cepat berganti
  const abortRef = useRef(null);

  /* ── Fetch laporan ── */
  const fetchLaporan = useCallback(async (params) => {
    // Batalkan request sebelumnya jika masih berjalan
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const result = await getLaporanBarang(params, controller.signal);

      // Abaikan jika sudah dibatalkan
      if (controller.signal.aborted) return;

      setState({
        reportData:  result.data          ?? [],
        filterInfo:  result.filter        ?? null,
        totalData:   result.total_data    ?? result.data?.length ?? 0,
        totalJumlah: result.total_jumlah  ?? 0,
      });
    } catch (error) {
      if (error?.name === "CanceledError" || error?.name === "AbortError") return;
      showToast.error(error?.response?.data?.message || "Gagal memuat laporan");
      setState((prev) => ({ ...prev, reportData: [] }));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  /* ── Handler filter ── */
  const handleFilter = useCallback((params) => {
    if (!params) {
      abortRef.current?.abort();
      setState(INIT);
      setActiveFilter(null);
      clearLaporanBarangCache();
      return;
    }
    setActiveFilter(params);
    fetchLaporan(params);
  }, [fetchLaporan]);

  /* ── Refresh ── */
  const handleRefresh = useCallback(() => {
    if (!activeFilter) return;
    clearLaporanBarangCache();
    fetchLaporan(activeFilter);
  }, [activeFilter, fetchLaporan]);

  /* ── Export generik ── */
  const handleExport = useCallback(async (type) => {
    if (!activeFilter) {
      showToast.warning("Pilih filter terlebih dahulu sebelum export");
      return;
    }
    setIsExporting((p) => ({ ...p, [type]: true }));
    try {
      const exportFn  = type === "pdf" ? exportLaporanBarangPDF : exportLaporanBarangExcel;
      const extension = type === "pdf" ? "pdf" : "xlsx";
      const blob      = await exportFn(activeFilter);
      downloadBlob(blob, `laporan-barang-${Date.now()}.${extension}`);
      showToast.success(`${type.toUpperCase()} berhasil diunduh`);
    } catch (error) {
      showToast.error(error?.response?.data?.message || `Gagal mengunduh ${type.toUpperCase()}`);
    } finally {
      // Tunda reset agar spinner tidak kedip terlalu cepat
      setTimeout(() => setIsExporting((p) => ({ ...p, [type]: false })), 500);
    }
  }, [activeFilter]);

  const { reportData, filterInfo, totalData, totalJumlah } = state;
  const hasData = reportData !== null;

  return (
    <div className="min-h-full bg-white p-3 sm:p-4 lg:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      {/* ── Page Header ── */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <MdAssessment className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Laporan Barang
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Laporan inventori berdasarkan cabang dan ruangan
            </p>
          </div>
        </div>

        {/* Action buttons — hanya tampil jika ada data */}
        {hasData && (
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <ExportButton
              type="pdf"
              isExporting={isExporting.pdf}
              disabled={loading || !activeFilter}
              onExport={handleExport}
              colorCls="bg-red-50 text-red-600 hover:bg-red-100"
              loadingCls="bg-red-100 text-red-400"
              spinnerCls="border-red-400"
            />
            <ExportButton
              type="excel"
              isExporting={isExporting.excel}
              disabled={loading || !activeFilter}
              onExport={handleExport}
              colorCls="bg-green-50 text-green-600 hover:bg-green-100"
              loadingCls="bg-green-100 text-green-400"
              spinnerCls="border-green-400"
            />

            <button
              onClick={handleRefresh}
              disabled={loading || !activeFilter}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
            >
              <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Panel ── */}
      <div className="mb-4">
        <LaporanBarangFilter onFilter={handleFilter} isLoading={loading} />
      </div>

      {/* ── Summary Cards ── */}
      {hasData && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 animate-[fadeUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
          <SummaryCard icon={MdInventory}   iconBg="bg-blue-50 border-blue-200"   iconColor="text-blue-600"   label="Total Jenis Barang" value={totalData}                         valueCls="text-blue-700"   />
          <SummaryCard icon={MdNumbers}     iconBg="bg-green-50 border-green-200" iconColor="text-green-600"  label="Total Jumlah Stok"  value={totalJumlah}                       valueCls="text-green-700"  />
          <SummaryCard icon={MdStore}       iconBg="bg-purple-50 border-purple-200" iconColor="text-purple-600" label="Cabang"           value={filterInfo?.cabang?.name ?? "Semua"} valueCls="text-purple-700" isText />
          <SummaryCard icon={MdMeetingRoom} iconBg="bg-orange-50 border-orange-200" iconColor="text-orange-600" label="Ruangan"         value={filterInfo?.ruangan?.name ?? "Semua"} valueCls="text-orange-700" isText />
        </div>
      )}

      {/* ── Table Container ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {hasData && !loading && reportData.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Menampilkan <strong className="text-gray-700">{reportData.length}</strong> jenis barang
            </span>
            <span className="text-[11px] text-gray-400">
              Total stok: <strong className="text-blue-600">{totalJumlah}</strong> unit
            </span>
          </div>
        )}
        <LaporanBarangTable data={reportData} isLoading={loading} totalJumlah={totalJumlah} />
      </div>
    </div>
  );
}

/* ── Export Button ── */
function ExportButton({ type, isExporting, disabled, onExport, colorCls, loadingCls, spinnerCls }) {
  return (
    <button
      onClick={() => onExport(type)}
      disabled={isExporting || disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
        isExporting
          ? `${loadingCls} cursor-wait`
          : `${colorCls} hover:scale-105 active:scale-95`
      }`}
    >
      {isExporting ? (
        <>
          <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${spinnerCls}`} />
          <span className="animate-pulse">Mengunduh...</span>
        </>
      ) : (
        <><MdFileDownload className="w-3.5 h-3.5" /> {type.toUpperCase()}</>
      )}
    </button>
  );
}

/* ── Summary Card ── */
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