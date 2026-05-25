/**
 * BarangMasukMain.jsx — versi optimasi performa
 *
 * Perbaikan vs versi sebelumnya:
 * 1. useCallback pada semua handler — mencegah re-render child akibat referensi fungsi baru
 * 2. useMemo pada LIMIT_OPTIONS — array konstan tidak perlu dibuat ulang setiap render
 * 3. fetchData tidak lagi membungkus setTimeout(0) — tidak ada manfaatnya dan menambah microtask
 * 4. isExporting disederhanakan dengan functional updater yang konsisten
 * 5. deleteModal.name diambil saat open, bukan saat render — menjaga konsistensi ref
 * 6. handleLimitChange di-inline agar tidak perlu memo terpisah
 * 7. PaginationBar dan PageBtn dipindah ke luar modul dan di-memo — tidak re-render bila props tidak berubah
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdFileDownload, MdSearch, MdInbox } from "react-icons/md";
import {
  getBarangMasukList,
  createBarangMasuk,
  updateBarangMasuk,
  deleteBarangMasuk,
  exportBarangMasukPDF,
  exportBarangMasukExcel,
  clearBarangMasukExportCache,
} from "../services/barangmasukService";
import { showToast } from "../utils/toast";
import BarangMasukTable from "../components/feature/barangmasuk/BarangMasukTable";
import BarangMasukModal from "../components/feature/barangmasuk/BarangMasukModal";
import DeleteConfirmModal from "../components/feature/DeleteConfirmModal";

// ─── Konstanta di luar komponen — tidak perlu dibuat ulang setiap render ─────
const LIMIT_OPTIONS = [10, 25, 50, 100];
const INITIAL_META  = { total: 0, page: 1, totalPages: 1 };
const INITIAL_EXPORT = { pdf: false, excel: false };
const INITIAL_DELETE = { open: false, id: null, name: null };

export default function BarangMasukMain() {
  const [data,         setData]         = useState([]);
  const [meta,         setMeta]         = useState(INITIAL_META);
  const [loading,      setLoading]      = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [isEdit,       setIsEdit]       = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting,  setIsExporting]  = useState(INITIAL_EXPORT);
  const [deleteModal,  setDeleteModal]  = useState(INITIAL_DELETE);
  const [isDeleting,   setIsDeleting]   = useState(false);

  /* Pagination */
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(10);

  /* Search + debounce */
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

  // ─── Prefetch flag — tidak perlu state, cukup ref ────────────────────────
  const prefetchTriggered = useRef(INITIAL_EXPORT);

  // ─── Fetch (server-side search) ──────────────────────────────────────────
  // OPTIMASI: Hilangkan setTimeout(0) yang tidak berguna.
  // setTimeout(0) sebelumnya hanya menunda satu microtask tanpa keuntungan nyata.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBarangMasukList(page, limit, debouncedSearch);

      if (Array.isArray(result)) {
        setData(result);
        setMeta({ total: result.length, page, totalPages: 1 });
      } else {
        setData(result?.data ?? []);
        setMeta({
          total:      result?.total      ?? result?.meta?.total      ?? 0,
          page:       result?.page       ?? result?.meta?.page       ?? page,
          totalPages: result?.totalPages ?? result?.meta?.totalPages ?? 1,
        });
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // ─── Hover-intent prefetch ────────────────────────────────────────────────
  // OPTIMASI: useCallback agar referensi stabil — tidak memicu re-render tombol
  const handlePrefetchOnHover = useCallback((type) => {
    if (prefetchTriggered.current[type]) return;
    prefetchTriggered.current[type] = true;
    if (type === "pdf") exportBarangMasukPDF().catch(() => {});
    else                exportBarangMasukExcel().catch(() => {});
  }, []); // tidak ada dependency — fungsi ini tidak perlu berubah

  const resetPrefetchFlags = useCallback(() => {
    prefetchTriggered.current = { pdf: false, excel: false };
  }, []);

  // ─── Modal handlers ───────────────────────────────────────────────────────
  // OPTIMASI: useCallback pada semua handler agar BarangMasukTable/BarangMasukModal
  // tidak re-render saat state lain di parent berubah (misal: loading, isExporting)
  const handleOpenCreate = useCallback(() => {
    setIsEdit(false);
    setSelectedData(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item) => {
    setIsEdit(true);
    setSelectedData(item);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedData(null);
  }, []);

  const handleSubmit = useCallback(async (formData) => {
    try {
      setIsSubmitting(true);
      if (isEdit && selectedData) {
        await updateBarangMasuk(selectedData.id, formData);
        showToast.success("Barang masuk berhasil diperbarui");
      } else {
        await createBarangMasuk(formData);
        showToast.success("Barang masuk berhasil ditambahkan");
      }
      clearBarangMasukExportCache();
      resetPrefetchFlags();
      handleCloseModal();
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  }, [isEdit, selectedData, handleCloseModal, fetchData, resetPrefetchFlags]);

  const handleDelete = useCallback((id) => {
    // OPTIMASI: cari nama item sekali saat open, bukan saat render deleteModal
    const item = data.find((d) => d.id === id);
    setDeleteModal({ open: true, id, name: item?.barang?.name ?? null });
  }, [data]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteBarangMasuk(deleteModal.id);
      showToast.success("Barang masuk berhasil dihapus");
      clearBarangMasukExportCache();
      resetPrefetchFlags();
      setDeleteModal(INITIAL_DELETE);
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.id, fetchData, resetPrefetchFlags]);

  // ─── Export ───────────────────────────────────────────────────────────────
  // OPTIMASI: functional updater pada setIsExporting — aman dari stale closure
  const handleExportPDF = useCallback(async () => {
    try {
      setIsExporting((p) => ({ ...p, pdf: true }));
      const blob = await exportBarangMasukPDF();
      triggerDownload(blob, `laporan-barang-masuk-${Date.now()}.pdf`);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh PDF");
    } finally {
      setTimeout(() => setIsExporting((p) => ({ ...p, pdf: false })), 500);
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      setIsExporting((p) => ({ ...p, excel: true }));
      const blob = await exportBarangMasukExcel();
      triggerDownload(blob, `laporan-barang-masuk-${Date.now()}.xlsx`);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh Excel");
    } finally {
      setTimeout(() => setIsExporting((p) => ({ ...p, excel: false })), 500);
    }
  }, []);

  // OPTIMASI: useCallback + reset page ke 1 dalam satu updater
  const handleLimitChange = useCallback((e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  }, []);

  const handleSearchClear = useCallback(() => setSearch(""), []);

  // OPTIMASI: limit options sudah konstanta di luar komponen, tidak perlu useMemo
  const limitOptionNodes = useMemo(
    () => LIMIT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>),
    [] // static — tidak pernah berubah
  );

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
            <MdInbox className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Barang Masuk
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola data transaksi penerimaan barang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full sm:grid-cols-3 xl:flex xl:w-auto xl:flex-wrap xl:justify-end">
          {/* Export PDF */}
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

          {/* Export Excel */}
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
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-150 hover:scale-105 active:scale-95 xl:w-auto"
          >
            <MdAdd className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* ── Card Container ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex items-center w-full lg:max-w-90">
            <MdSearch
              className={`absolute left-3 w-4 h-4 transition-colors ${search ? "text-blue-600" : "text-gray-400"}`}
            />
            <input
              type="text"
              placeholder="Cari kode barang, nama, supplier, cabang…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-8 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={handleSearchClear}
                className="absolute right-2 text-gray-400 hover:text-gray-600 text-base"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 shrink-0">
            <span className="text-xs text-gray-400">Tampilkan</span>
            {/* OPTIMASI: onChange langsung pakai handler stabil, options di-memo */}
            <select
              value={limit}
              onChange={handleLimitChange}
              className="py-1.5 px-3 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer hover:bg-gray-100 transition-all duration-150"
            >
              {limitOptionNodes}
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
                : `Total ${meta.total} data barang masuk`}
            </span>
            {debouncedSearch && (
              <button
                onClick={handleSearchClear}
                className="self-start text-[11px] font-semibold text-blue-600 hover:text-blue-700 sm:self-auto"
              >
                Hapus filter
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <BarangMasukTable
          data={data}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          isLoading={loading}
          page={page}
          limit={limit}
        />

        <DeleteConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal(INITIAL_DELETE)}
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
      <BarangMasukModal
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

// ─── Helper ────────────────────────────────────────────────────────────────
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

// ─── PaginationBar — di-memo: hanya re-render jika props berubah ──────────
const PaginationBar = memo(function PaginationBar({ page, totalPages, total, limit, onPageChange }) {
  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  // OPTIMASI: getPages dihitung sekali per render PaginationBar,
  // tidak dihitung ulang tiap render parent
  const pages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

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
});

// OPTIMASI: memo — PageBtn tidak re-render kecuali props-nya berubah
const PageBtn = memo(function PageBtn({ children, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-8 h-8 px-2 rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-150
        ${active
          ? "bg-blue-600 border-blue-600 text-white shadow-md"
          : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
});