/**
 * BarangRusakMain.jsx
 *
 * Optimasi dibanding versi sebelumnya:
 * 1. Server-side search — debouncedSearch dikirim ke API; rawData.filter() dihapus
 * 2. prefetchBarangRusakExports dihapus dari fetchData — diganti hover-intent
 * 3. triggerDownload diekstrak jadi helper (tidak duplikasi 2x)
 * 4. PageBtn diekstrak jadi komponen kecil untuk PaginationBar yang lebih bersih
 * 5. resetPrefetchFlags dipanggil setelah mutasi data agar hover-prefetch bisa jalan lagi
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdFileDownload, MdSearch, MdWarning } from "react-icons/md";
import {
  getBarangRusakList,
  createBarangRusak,
  updateBarangRusak,
  deleteBarangRusak,
  exportBarangRusakPDF,
  exportBarangRusakExcel,
  clearBarangRusakExportCache,
} from "../services/barangrusakService";
import { showToast } from "../utils/toast";
import BarangRusakTable from "../components/feature/barangrusak/BarangRusakTable";
import BarangRusakModal from "../components/feature/barangrusak/BarangRusakModal";
import DeleteConfirmModal from "../components/feature/DeleteConfirmModal";

const LIMIT_OPTIONS = [10, 25, 50, 100];

// ─── Helper: trigger download dari Blob ──────────────────────────────────────
function triggerDownload(blob, filename) {
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarangRusakMain() {
  const [data,         setData]         = useState([]);
  const [meta,         setMeta]         = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,      setLoading]      = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [isEdit,       setIsEdit]       = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting,  setIsExporting]  = useState({ pdf: false, excel: false });
  const [deleteModal,  setDeleteModal]  = useState({ open: false, id: null, name: null });
  const [isDeleting,   setIsDeleting]   = useState(false);

  /* Pagination */
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(10);

  /* Search */
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // ─── Fetch (server-side search) ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBarangRusakList(page, limit, debouncedSearch);

      if (Array.isArray(result)) {
        setData(result);
        setMeta({ total: result.length, page, totalPages: 1 });
      } else {
        setData(result?.data ?? []);
        setMeta({
          total:      result?.total      ?? result?.meta?.total      ?? (result?.data?.length ?? 0),
          page:       result?.page       ?? result?.meta?.page       ?? page,
          totalPages: result?.totalPages ?? result?.meta?.totalPages ?? 1,
        });
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]); // ← debouncedSearch masuk dependency

  useEffect(() => {
    const t = setTimeout(() => void fetchData(), 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  // ─── Hover-intent prefetch ──────────────────────────────────────────────────
  // Prefetch hanya saat user hover tombol, bukan saat load halaman.
  const prefetchTriggered = useRef({ pdf: false, excel: false });

  const handlePrefetchOnHover = (type) => {
    if (prefetchTriggered.current[type]) return;
    prefetchTriggered.current[type] = true;
    if (type === "pdf") exportBarangRusakPDF().catch(() => {});
    else                exportBarangRusakExcel().catch(() => {});
  };

  // Reset flag setelah data berubah (cache di-clear) agar bisa prefetch lagi
  const resetPrefetchFlags = () => {
    prefetchTriggered.current = { pdf: false, excel: false };
  };

  // ─── Modal handlers ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => { setIsEdit(false); setSelectedData(null); setModalOpen(true); };
  const handleOpenEdit   = (item) => { setIsEdit(true); setSelectedData(item); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setSelectedData(null); };

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (isEdit && selectedData) {
        await updateBarangRusak(selectedData.id, formData);
        showToast.success("Barang rusak berhasil diperbarui");
      } else {
        await createBarangRusak(formData);
        showToast.success("Barang rusak berhasil ditambahkan");
      }
      clearBarangRusakExportCache();
      resetPrefetchFlags();
      handleCloseModal();
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    const item  = data.find((d) => d.id === id);
    const label = item?.barang?.name ?? item?.barang?.kode_barang ?? null;
    setDeleteModal({ open: true, id, name: label });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteBarangRusak(deleteModal.id);
      showToast.success("Barang rusak berhasil dihapus");
      clearBarangRusakExportCache();
      resetPrefetchFlags();
      setDeleteModal({ open: false, id: null, name: null });
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Export ─────────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      setIsExporting((prev) => ({ ...prev, pdf: true }));
      const blob = await exportBarangRusakPDF();
      triggerDownload(blob, `laporan-barang-rusak-${Date.now()}.pdf`);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh PDF");
    } finally {
      setTimeout(() => setIsExporting((prev) => ({ ...prev, pdf: false })), 500);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting((prev) => ({ ...prev, excel: true }));
      const blob = await exportBarangRusakExcel();
      triggerDownload(blob, `laporan-barang-rusak-${Date.now()}.xlsx`);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh Excel");
    } finally {
      setTimeout(() => setIsExporting((prev) => ({ ...prev, excel: false })), 500);
    }
  };

  const handleLimitChange = (newLimit) => { setLimit(Number(newLimit)); setPage(1); };

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
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <MdWarning className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Manajemen Barang Rusak
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola laporan dan data kerusakan barang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full sm:grid-cols-3 xl:flex xl:w-auto xl:flex-wrap xl:justify-end">
          {/* Export PDF — hover memicu prefetch */}
          <button
            onMouseEnter={() => handlePrefetchOnHover("pdf")}
            onClick={handleExportPDF}
            disabled={isExporting.pdf || loading}
            className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 xl:w-auto ${
              isExporting.pdf
                ? "bg-red-100 text-red-400 cursor-wait"
                : "bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 active:scale-95"
            }`}
            title="Export PDF"
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

          {/* Export Excel — hover memicu prefetch */}
          <button
            onMouseEnter={() => handlePrefetchOnHover("excel")}
            onClick={handleExportExcel}
            disabled={isExporting.excel || loading}
            className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 xl:w-auto ${
              isExporting.excel
                ? "bg-green-100 text-green-400 cursor-wait"
                : "bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 active:scale-95"
            }`}
            title="Export Excel"
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

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 xl:w-auto"
          >
            <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Tambah */}
          <button
            onClick={handleOpenCreate}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all duration-150 hover:scale-105 active:scale-95 xl:w-auto"
          >
            <MdAdd className="w-4 h-4" />
            Tambah Barang Rusak
          </button>
        </div>
      </div>

      {/* ── Card Container ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex items-center w-full lg:max-w-90">
            <MdSearch
              className={`absolute left-3 w-4 h-4 transition-colors ${search ? "text-red-500" : "text-gray-400"}`}
            />
            <input
              type="text"
              placeholder="Cari kode, nama, cabang, atau tingkat kerusakan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-8 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 text-gray-400 hover:text-gray-600 text-base"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs text-gray-400">Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="py-1.5 px-3 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer hover:bg-gray-100 transition-all duration-150"
            >
              {LIMIT_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">data</span>
          </div>
        </div>

        {/* Summary bar */}
        {!loading && (
          <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-gray-400 flex-1">
              {debouncedSearch
                ? `${meta.total} hasil untuk "${debouncedSearch}"`
                : `Total ${meta.total} data barang rusak`}
            </span>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="self-start text-[11px] font-semibold text-red-500 hover:text-red-600 sm:self-auto"
              >
                Hapus filter
              </button>
            )}
          </div>
        )}

        {/* Table — data sudah difilter dari server */}
        <BarangRusakTable
          data={data}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          isLoading={loading}
          page={page}
          limit={limit}
        />

        <DeleteConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, id: null, name: null })}
          onConfirm={handleConfirmDelete}
          itemName={deleteModal.name}
          isLoading={isDeleting}
        />

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <PaginationBar
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={limit}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal */}
      <BarangRusakModal
        isOpen={modalOpen}
        isEdit={isEdit}
        data={selectedData}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

// ─── Pagination Bar ────────────────────────────────────────────────────────────
function PaginationBar({ page, totalPages, total, limit, onPageChange }) {
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-200 bg-gray-50">
      <span className="text-[11px] text-gray-400">
        Menampilkan <strong className="text-gray-900">{from}–{to}</strong> dari{" "}
        <strong className="text-gray-900">{total}</strong> data
      </span>

      <div className="flex items-center gap-1">
        <PageBtn disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</PageBtn>

        {pages[0] > 1 && (
          <>
            <PageBtn onClick={() => onPageChange(1)}>1</PageBtn>
            {pages[0] > 2 && <span className="text-xs text-gray-400 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <PageBtn key={p} active={p === page} onClick={() => onPageChange(p)}>{p}</PageBtn>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="text-xs text-gray-400 px-1">…</span>
            )}
            <PageBtn onClick={() => onPageChange(totalPages)}>{totalPages}</PageBtn>
          </>
        )}

        <PageBtn disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>›</PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-8 h-8 px-2 rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-150
        ${active
          ? "bg-red-500 border-red-500 text-white shadow-md"
          : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
}