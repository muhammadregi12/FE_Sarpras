// LaporanBarangRusakMain.jsx
import { useReducer, useCallback, useMemo, useRef } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    MdAssessment, MdFileDownload, MdRefresh,
    MdStore, MdMeetingRoom, MdWarning, MdNumbers,
} from "react-icons/md";
import {
    getLaporanBarangRusak,
    exportLaporanBarangRusakPDF,
    exportLaporanBarangRusakExcel,
    clearLaporanBarangRusakCache,
} from "../../services/laporanService";
import { showToast } from "../../utils/toast";
import LaporanBarangRusakFilter from "../../components/feature/laporanbarangrusak/BarangRusakFilter";
import LaporanBarangRusakTable from "../../components/feature/laporanbarangrusak/LaporanBarangRusakTable";

const severityMeta = {
    ringan:  { label: "Ringan",          className: "bg-amber-50 border-amber-200 text-amber-700" },
    sedang:  { label: "Sedang",          className: "bg-orange-50 border-orange-200 text-orange-700" },
    berat:   { label: "Berat",           className: "bg-red-50 border-red-200 text-red-700" },
    unknown: { label: "Tidak Diketahui", className: "bg-gray-50 border-gray-200 text-gray-600" },
};

const initialState = {
    reportData:       null,
    filterInfo:       null,
    rekapTingkat:     {},
    totalData:        0,
    totalJumlahRusak: 0,
    loading:          false,
    exporting:        { pdf: false, excel: false },
};

function reducer(state, action) {
    switch (action.type) {
        case "FETCH_START":
            return { ...state, loading: true };
        case "FETCH_SUCCESS":
            return {
                ...state,
                loading:          false,
                reportData:       action.payload.data        ?? [],
                totalData:        action.payload.total_data  ?? action.payload.data?.length ?? 0,
                totalJumlahRusak: action.payload.total_jumlah_rusak ?? 0,
                filterInfo:       action.payload.filter      ?? null,
                rekapTingkat:     action.payload.rekap_tingkat ?? {},
            };
        case "FETCH_ERROR":
            return { ...state, loading: false, reportData: [], rekapTingkat: {} };
        case "RESET":
            return { ...initialState };
        case "EXPORT_START":
            return { ...state, exporting: { ...state.exporting, [action.kind]: true } };
        case "EXPORT_END":
            return { ...state, exporting: { ...state.exporting, [action.kind]: false } };
        default:
            return state;
    }
}

export default function LaporanBarangRusakMain() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        reportData, filterInfo, rekapTingkat,
        totalData, totalJumlahRusak, loading, exporting,
    } = state;

    // ref agar callback tidak perlu activeFilter sebagai dependency
    const activeFilterRef = useRef(null);

    const fetchLaporan = useCallback(async (params) => {
        try {
            dispatch({ type: "FETCH_START" });
            const result = await getLaporanBarangRusak(params);
            dispatch({ type: "FETCH_SUCCESS", payload: result });
        } catch (error) {
            showToast.error(error?.response?.data?.message || "Gagal memuat laporan barang rusak");
            dispatch({ type: "FETCH_ERROR" });
        }
    }, []);

    const handleFilter = useCallback((params) => {
        if (!params) {
            activeFilterRef.current = null;
            clearLaporanBarangRusakCache();
            dispatch({ type: "RESET" });
            return;
        }
        activeFilterRef.current = params;
        fetchLaporan(params);
    }, [fetchLaporan]);

    const handleRefresh = useCallback(() => {
        const f = activeFilterRef.current;
        if (!f) return;
        clearLaporanBarangRusakCache();
        fetchLaporan(f);
    }, [fetchLaporan]);

    const downloadBlob = useCallback((blob, filename) => {
        const url  = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement("a"), { href: url });
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const handleExport = useCallback(async (kind) => {
        const f = activeFilterRef.current;
        if (!f) { showToast.warning("Pilih filter terlebih dahulu sebelum export"); return; }

        const exportFn  = kind === "pdf" ? exportLaporanBarangRusakPDF : exportLaporanBarangRusakExcel;
        const extension = kind === "pdf" ? "pdf" : "xlsx";

        try {
            dispatch({ type: "EXPORT_START", kind });
            const blob = await exportFn(f);
            downloadBlob(blob, `laporan-barang-rusak-${Date.now()}.${extension}`);
            showToast.success(`${kind.toUpperCase()} berhasil diunduh`);
        } catch (error) {
            showToast.error(error?.response?.data?.message || `Gagal mengunduh ${kind.toUpperCase()}`);
        } finally {
            setTimeout(() => dispatch({ type: "EXPORT_END", kind }), 500);
        }
    }, [downloadBlob]);

    const severityCards = useMemo(() =>
        Object.entries(rekapTingkat)
            .map(([key, value]) => ({ key, value: Number(value) || 0 }))
            .filter((item) => item.value > 0)
            .sort((a, b) => {
                const order = { ringan: 1, sedang: 2, berat: 3 };
                return (order[a.key] ?? 99) - (order[b.key] ?? 99);
            }),
    [rekapTingkat]);

    const hasData    = reportData !== null;
    const hasFilter  = activeFilterRef.current !== null;

    return (
        <div className="min-h-full bg-white p-3 sm:p-4 lg:p-6">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
            />

            {/* Header */}
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
                <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                        <MdAssessment className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
                            Laporan Barang Rusak
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Laporan kerusakan barang berdasarkan periode, cabang, dan ruangan
                        </p>
                    </div>
                </div>

                {hasData && (
                    <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                        {/* PDF */}
                        <ExportButton
                            kind="pdf"
                            loading={exporting.pdf}
                            disabled={loading || !hasFilter}
                            onClick={() => handleExport("pdf")}
                            label="PDF"
                            colorCls="bg-red-50 text-red-600 hover:bg-red-100"
                            loadingCls="bg-red-100 text-red-400"
                            spinCls="border-red-400"
                        />
                        {/* Excel */}
                        <ExportButton
                            kind="excel"
                            loading={exporting.excel}
                            disabled={loading || !hasFilter}
                            onClick={() => handleExport("excel")}
                            label="Excel"
                            colorCls="bg-green-50 text-green-600 hover:bg-green-100"
                            loadingCls="bg-green-100 text-green-400"
                            spinCls="border-green-400"
                        />
                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={loading || !hasFilter}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 disabled:opacity-50"
                        >
                            <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Filter */}
            <div className="mb-4">
                <LaporanBarangRusakFilter onFilter={handleFilter} isLoading={loading} />
            </div>

            {/* Summary Cards */}
            {hasData && !loading && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 animate-[fadeUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
                        <SummaryCard icon={MdWarning}      iconBg="bg-red-50 border-red-200"    iconColor="text-red-600"    label="Total Data Rusak"    value={totalData}        valueCls="text-red-700" />
                        <SummaryCard icon={MdNumbers}      iconBg="bg-rose-50 border-rose-200"  iconColor="text-rose-600"   label="Total Jumlah Rusak"  value={totalJumlahRusak} valueCls="text-rose-700" />
                        <SummaryCard icon={MdStore}        iconBg="bg-orange-50 border-orange-200" iconColor="text-orange-600" label="Cabang"  value={filterInfo?.cabang?.name  ?? "Semua"} isText valueCls="text-orange-700" />
                        <SummaryCard icon={MdMeetingRoom}  iconBg="bg-amber-50 border-amber-200"   iconColor="text-amber-600"  label="Ruangan" value={filterInfo?.ruangan?.name ?? "Semua"} isText valueCls="text-amber-700" />
                    </div>

                    {severityCards.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {severityCards.map((item) => {
                                const meta = severityMeta[item.key] ?? severityMeta.unknown;
                                return (
                                    <div key={item.key} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${meta.className}`}>
                                        <span>{meta.label}</span>
                                        <span className="text-sm font-extrabold">{item.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
                {hasData && !loading && reportData.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-red-50/50 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                            Menampilkan <strong className="text-gray-700">{reportData.length}</strong> baris data
                        </span>
                        <span className="text-[11px] text-gray-400">
                            Total jumlah rusak: <strong className="text-red-600">{totalJumlahRusak}</strong> unit
                        </span>
                    </div>
                )}
                <LaporanBarangRusakTable data={reportData} isLoading={loading} totalJumlahRusak={totalJumlahRusak} />
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ExportButton({ loading, disabled, onClick, label, colorCls, loadingCls, spinCls }) {
    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                loading ? `${loadingCls} cursor-wait` : `${colorCls} hover:scale-105 active:scale-95`
            }`}
        >
            {loading ? (
                <>
                    <div className={`w-3.5 h-3.5 border-2 ${spinCls} border-t-transparent rounded-full animate-spin`} />
                    <span className="animate-pulse">Mengunduh...</span>
                </>
            ) : (
                <><MdFileDownload className="w-3.5 h-3.5" /> {label}</>
            )}
        </button>
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
                {isText
                    ? <p className={`text-sm font-bold truncate ${valueCls}`}>{value}</p>
                    : <p className={`text-xl font-extrabold leading-tight ${valueCls}`}>{value}</p>
                }
            </div>
        </div>
    );
}