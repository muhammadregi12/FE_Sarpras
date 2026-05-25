import { useState, useCallback } from "react";
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
  getLaporanBarangMasuk,
  exportLaporanBarangMasukPDF,
  exportLaporanBarangMasukExcel,
  clearLaporanBarangMasukCache,
} from "../../services/laporanService";
import { showToast } from "../../utils/toast";
import LaporanBarangMasukFilter from "../../components/feature/laporanbarangmasuk/BarangMasukFilter";
import LaporanBarangMasukTable from "../../components/feature/laporanbarangmasuk/LaporanBarangMasukTable";

export default function LaporanBarangMasukMain() {
  const [reportData, setReportData] = useState(null);
  const [filterInfo, setFilterInfo] = useState(null);
  const [totalData, setTotalData] = useState(0);
  const [totalJumlah, setTotalJumlah] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState({ pdf: false, excel: false });

  const fetchLaporan = useCallback(async (params) => {
    try {
      setLoading(true);
      const result = await getLaporanBarangMasuk(params);
      setReportData(result.data ?? []);
      setTotalData(result.total_data ?? result.data?.length ?? 0);
      setTotalJumlah(result.total_jumlah ?? 0);
      setFilterInfo(result.filter ?? null);
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat laporan barang masuk");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilter = (params) => {
    if (!params) {
      setReportData(null);
      setFilterInfo(null);
      setActiveFilter(null);
      setTotalData(0);
      setTotalJumlah(0);
      clearLaporanBarangMasukCache();
      return;
    }

    setActiveFilter(params);
    fetchLaporan(params);
  };

  const handleRefresh = () => {
    if (!activeFilter) return;
    clearLaporanBarangMasukCache();
    fetchLaporan(activeFilter);
  };

  const handleExportPDF = async () => {
    if (!activeFilter) {
      showToast.warning("Pilih filter terlebih dahulu sebelum export");
      return;
    }

    try {
      setIsExporting((p) => ({ ...p, pdf: true }));
      const blob = await exportLaporanBarangMasukPDF(activeFilter);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-barang-masuk-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh PDF");
    } finally {
      setTimeout(() => setIsExporting((p) => ({ ...p, pdf: false })), 500);
    }
  };

  const handleExportExcel = async () => {
    if (!activeFilter) {
      showToast.warning("Pilih filter terlebih dahulu sebelum export");
      return;
    }

    try {
      setIsExporting((p) => ({ ...p, excel: true }));
      const blob = await exportLaporanBarangMasukExcel(activeFilter);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-barang-masuk-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh Excel");
    } finally {
      setTimeout(() => setIsExporting((p) => ({ ...p, excel: false })), 500);
    }
  };

  const hasData = reportData !== null;

  return (
    <div className="min-h-full bg-white p-3 sm:p-4 lg:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
            <MdAssessment className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Laporan Barang Masuk
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Laporan inventori barang masuk berdasarkan cabang dan ruangan
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExportPDF}
              disabled={isExporting.pdf || loading || !activeFilter}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isExporting.pdf
                  ? "bg-red-100 text-red-400 cursor-wait"
                  : "bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 active:scale-95"
              }`}
            >
              {isExporting.pdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">Mengunduh...</span>
                </>
              ) : (
                <><MdFileDownload className="w-3.5 h-3.5" /> PDF</>
              )}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting.excel || loading || !activeFilter}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                isExporting.excel
                  ? "bg-green-100 text-green-400 cursor-wait"
                  : "bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 active:scale-95"
              }`}
            >
              {isExporting.excel ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">Mengunduh...</span>
                </>
              ) : (
                <><MdFileDownload className="w-3.5 h-3.5" /> Excel</>
              )}
            </button>

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

      <div className="mb-4">
        <LaporanBarangMasukFilter onFilter={handleFilter} isLoading={loading} />
      </div>

      {hasData && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 animate-[fadeUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
          <SummaryCard
            icon={MdInventory}
            iconBg="bg-green-50 border-green-200"
            iconColor="text-green-600"
            label="Total Jenis Barang"
            value={totalData}
            valueCls="text-green-700"
          />

          <SummaryCard
            icon={MdNumbers}
            iconBg="bg-emerald-50 border-emerald-200"
            iconColor="text-emerald-600"
            label="Total Jumlah Masuk"
            value={totalJumlah}
            valueCls="text-emerald-700"
          />

          <SummaryCard
            icon={MdStore}
            iconBg="bg-lime-50 border-lime-200"
            iconColor="text-lime-600"
            label="Cabang"
            value={filterInfo?.cabang?.name ?? "Semua"}
            isText
            valueCls="text-lime-700"
          />

          <SummaryCard
            icon={MdMeetingRoom}
            iconBg="bg-teal-50 border-teal-200"
            iconColor="text-teal-600"
            label="Ruangan"
            value={filterInfo?.ruangan?.name ?? "Semua"}
            isText
            valueCls="text-teal-700"
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {hasData && !loading && reportData.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50/50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Menampilkan <strong className="text-gray-700">{reportData.length}</strong> jenis barang
            </span>
            <span className="text-[11px] text-gray-400">
              Total jumlah masuk: <strong className="text-green-600">{totalJumlah}</strong> unit
            </span>
          </div>
        )}

        <LaporanBarangMasukTable
          data={reportData}
          isLoading={loading}
          totalHarga={0}
        />
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, isText = false, valueCls = "" }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
        {isText ? (
          <p className={`text-sm font-bold truncate ${valueCls}`}>{value}</p>
        ) : (
          <p className={`text-xl font-extrabold leading-tight ${valueCls}`}>{value}</p>
        )}
      </div>
    </div>
  );
}