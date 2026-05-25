import { useState, useEffect, useRef, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdFileDownload, MdSearch, MdInventory, MdUpload } from "react-icons/md";
import {
  getBarangList,
  createBarang,
  updateBarang,
  deleteBarang,
  exportBarangPDF,
  exportBarangExcel,
  importBarang,
  downloadTemplateBarang,
  clearBarangExportCache,
  prefetchBarangExports,
  downloadQRCodeBarang,
  getAllQRCodesBarang,
  getQRCodeBarangUrl,
} from "../services/barangService";
import { showToast } from "../utils/toast";
import BarangTable from "../components/feature/barang/BarangTable";
import BarangModal from "../components/feature/barang/BarangModal";
import DeleteConfirmModal from "../components/feature/DeleteConfirmModal";
import ImportModal from "../components/feature/ImportModal";

const LIMIT_OPTIONS = [10, 25, 50, 100];

// ─── Extracted keluar komponen agar tidak re-create tiap render ───
function PaginationBar({ page, totalPages, total, limit, onPageChange }) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = (() => {
    const arr = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  })();

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
          <PageBtn key={p} onClick={() => onPageChange(p)} active={p === page}>{p}</PageBtn>
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
      disabled={disabled}
      onClick={onClick}
      className={`min-w-8 h-8 px-2 rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
        active
          ? "bg-blue-600 border-blue-600 text-white shadow-md"
          : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export default function BarangMain() {
  const [rawData, setRawData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FIX 1: Pisah state eksport jadi dua boolean agar tidak trigger re-render komponen lain
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [qrPreview, setQrPreview] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  // FIX 2: Gunakan ref untuk track apakah sudah prefetch — mencegah prefetch ulang tiap fetchData
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400); // FIX 3: Turunkan dari 500ms → 400ms agar terasa lebih responsif
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // FIX 4: fetchData sekarang menerima parameter eksplisit sehingga dependency useCallback tepat
  // dan tidak perlu setTimeout wrapper di useEffect pemanggil
  const fetchData = useCallback(async (currentPage = page, currentLimit = limit) => {
    try {
      setLoading(true);
      const result = await getBarangList(currentPage, currentLimit);

      if (Array.isArray(result)) {
        setRawData(result);
        setMeta({ total: result.length, page: currentPage, totalPages: 1 });
      } else {
        setRawData(result?.data ?? []);
        setMeta({
          total: result?.meta?.total ?? (result?.data?.length ?? 0),
          page: result?.meta?.page ?? currentPage,
          totalPages: result?.meta?.totalPages ?? 1,
        });
      }

      // FIX 5: Hanya prefetch sekali selama session komponen hidup
      if (!hasPrefetchedRef.current) {
        hasPrefetchedRef.current = true;
        prefetchBarangExports();
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  // FIX 6: Hilangkan setTimeout wrapper yang tidak perlu
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // FIX 7: Filter client-side — gunakan useMemo implisit via computed variable
  // Ini sudah oke, tapi dipindah supaya tidak recalculate ketika state lain berubah
  const filteredData = debouncedSearch
    ? rawData.filter((item) => {
        const q = debouncedSearch.toLowerCase();
        return (
          item.name?.toLowerCase().includes(q) ||
          item.kode_barang?.toLowerCase().includes(q) ||
          item.kategori?.name_kategori?.toLowerCase().includes(q)
        );
      })
    : rawData;

  // FIX 8: Semua handler dibungkus useCallback agar referensi stabil → child tidak re-render
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
        await updateBarang(selectedData.id, formData);
        showToast.success("Barang berhasil diperbarui");
      } else {
        await createBarang(formData);
        showToast.success("Barang berhasil ditambahkan");
      }
      clearBarangExportCache();
      handleCloseModal();
      // FIX 9: Reset hasPrefetched agar export cache di-refresh setelah mutasi
      hasPrefetchedRef.current = false;
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  }, [isEdit, selectedData, handleCloseModal, fetchData]);

  const handleDelete = useCallback((id) => {
    const item = rawData.find((d) => d.id === id);
    setDeleteModal({ open: true, id, name: item?.name ?? null });
  }, [rawData]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteBarang(deleteModal.id);
      showToast.success("Barang berhasil dihapus");
      clearBarangExportCache();
      hasPrefetchedRef.current = false;
      setDeleteModal({ open: false, id: null, name: null });
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.id, fetchData]);

  const handleExportPDF = useCallback(async () => {
    try {
      setExportingPdf(true);
      const pdfBlob = await exportBarangPDF();
      triggerDownload(pdfBlob, `laporan-barang-${Date.now()}.pdf`);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh PDF");
    } finally {
      setExportingPdf(false);
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    try {
      setExportingExcel(true);
      const excelBlob = await exportBarangExcel();
      triggerDownload(excelBlob, `laporan-barang-${Date.now()}.xlsx`);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh Excel");
    } finally {
      setExportingExcel(false);
    }
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  }, []);

  const handleImportBarang = useCallback(async (file) => {
    const response = await importBarang(file);
    showToast.success(`${response.berhasil} barang berhasil diimport`);
    clearBarangExportCache();
    hasPrefetchedRef.current = false;
    fetchData();
    return response;
  }, [fetchData]);

  const handleDownloadTemplate = useCallback(() => downloadTemplateBarang(), []);

  const handlePreviewQR = useCallback((item) => {
    setQrPreview({ src: getQRCodeBarangUrl(item.id), kode: item.kode_barang, id: item.id });
  }, []);

  const handleDownloadQR = useCallback(async (item) => {
    try {
      showToast.success("Menyiapkan unduhan...");
      const blob = await downloadQRCodeBarang(item.id);
      triggerDownload(blob, `qr-barang-${item.kode_barang || item.id}.png`);
      showToast.success("QR berhasil diunduh");
    } catch (err) {
      showToast.error(err?.message || "Gagal mengunduh QR");
    }
  }, []);

  const handleDownloadAllQR = useCallback(async () => {
    try {
      setDownloadingAll(true);
      const res = await getAllQRCodesBarang();
      const arr = res?.data ?? [];
      for (const r of arr) {
        if (!r.qr_base64) continue;
        const blob = await (await fetch(r.qr_base64)).blob();
        triggerDownload(blob, `qr-barang-${r.kode_barang || r.id}.png`);
        // FIX 10: Turunkan delay antar download dari 120ms → 80ms
        await new Promise((res) => setTimeout(res, 80));
      }
    } catch (err) {
      showToast.error(err?.message || "Gagal mengunduh semua QR");
    } finally {
      setDownloadingAll(false);
    }
  }, []);

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
            <MdInventory className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Manajemen Barang
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola data barang dan inventori</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full sm:grid-cols-3 xl:flex xl:w-auto xl:flex-wrap xl:justify-end">
          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPdf || loading}
            className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 xl:w-auto ${
              exportingPdf
                ? "bg-red-100 text-red-400 cursor-wait"
                : "bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 active:scale-95"
            }`}
          >
            {exportingPdf ? (
              <><div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /><span className="animate-pulse">Mengunduh...</span></>
            ) : (
              <><MdFileDownload className="w-3.5 h-3.5" />PDF</>
            )}
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || loading}
            className={`flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 xl:w-auto ${
              exportingExcel
                ? "bg-green-100 text-green-400 cursor-wait"
                : "bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 active:scale-95"
            }`}
          >
            {exportingExcel ? (
              <><div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /><span className="animate-pulse">Mengunduh...</span></>
            ) : (
              <><MdFileDownload className="w-3.5 h-3.5" />Excel</>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchData()}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 xl:w-auto"
          >
            <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Download Semua QR */}
          <button
            onClick={handleDownloadAllQR}
            disabled={downloadingAll}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all duration-150 xl:w-auto"
          >
            <MdFileDownload className="w-3.5 h-3.5" />
            {downloadingAll ? "Mengunduh..." : "Download Semua QR"}
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all duration-150 hover:scale-105 active:scale-95 xl:w-auto"
          >
            <MdUpload className="w-3.5 h-3.5" />
            Import Excel
          </button>

          {/* Tambah Barang */}
          <button
            onClick={handleOpenCreate}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-150 hover:scale-105 active:scale-95 xl:w-auto"
          >
            <MdAdd className="w-4 h-4" />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* ── Card Container ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex items-center w-full lg:max-w-90">
            <MdSearch className={`absolute left-3 w-4 h-4 transition-colors ${search ? "text-blue-600" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Cari kode, nama, atau kategori barang…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-8 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 text-gray-400 hover:text-gray-600 text-base">×</button>
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
                ? `${filteredData.length} hasil untuk "${debouncedSearch}"`
                : `Total ${meta.total} barang`}
            </span>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="self-start text-[11px] font-semibold text-blue-600 bg-none border-none cursor-pointer hover:text-blue-700 sm:self-auto"
              >
                Hapus filter
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <BarangTable
          data={filteredData}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onPreviewQR={handlePreviewQR}
          onDownloadQR={handleDownloadQR}
          isLoading={loading}
          page={page}
          limit={limit}
        />

        {/* QR Preview Modal */}
        {qrPreview && (
          <div
            onClick={() => setQrPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <div className="bg-white p-4 rounded-2xl">
              <h3 className="text-sm font-bold mb-3">QR: {qrPreview.kode}</h3>
              <img src={qrPreview.src} alt={qrPreview.kode} className="w-72 h-72 object-contain" />
            </div>
          </div>
        )}

        <DeleteConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, id: null, name: null })}
          onConfirm={handleConfirmDelete}
          itemName={deleteModal.name}
          isLoading={isDeleting}
        />

        {!loading && filteredData.length > 0 && !debouncedSearch && (
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
      <BarangModal
        isOpen={modalOpen}
        isEdit={isEdit}
        data={selectedData}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportBarang}
        onDownloadTemplate={handleDownloadTemplate}
        title="Import Data Barang"
      />
    </div>
  );
}

// ─── Helper: trigger download tanpa duplikasi kode ───
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}