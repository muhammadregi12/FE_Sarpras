import { useState, useEffect, useRef, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdFileDownload, MdSearch, MdInventory, MdUpload } from "react-icons/md";
import { getBarangList, createBarang, updateBarang, deleteBarang, exportBarangPDF, exportBarangExcel, importBarang, downloadTemplateBarang, clearBarangExportCache, prefetchBarangExports } from "../services/barangService";
import { showToast } from "../utils/toast";
import BarangTable from "../components/feature/barang/BarangTable";
import BarangModal from "../components/feature/barang/BarangModal";
import DeleteConfirmModal from "../components/shared/DeleteConfirmModal";
import ImportModal from "../components/feature/ImportModal";

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function BarangMain() {
  const [rawData, setRawData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState({ pdf: false, excel: false });

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Search (server-side search)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  /* Debounce search input dan reset pagination */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset ke halaman 1
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBarangList(page, limit);
      if (Array.isArray(result)) {
        setRawData(result);
        setMeta({ total: result.length, page, totalPages: 1 });
      } else {
        setRawData(result?.data ?? []);
        setMeta({
          total: result?.meta?.total ?? (result?.data?.length ?? 0),
          page: result?.meta?.page ?? page,
          totalPages: result?.meta?.totalPages ?? 1,
        });
      }

      if (page === 1) {
        prefetchBarangExports();
      }
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  /* Fetch data ketika page / limit / search berubah */
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  /* Filter client-side berdasarkan debounced search */
  const filteredData = rawData.filter((item) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.kode_barang?.toLowerCase().includes(q) ||
      item.kategori?.name_kategori?.toLowerCase().includes(q)
    );
  });

  /* Modal handlers */
  const handleOpenCreate = () => {
    setIsEdit(false);
    setSelectedData(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setIsEdit(true);
    setSelectedData(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedData(null);
  };

  const handleSubmit = async (formData) => {
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
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
  const item = rawData.find((d) => d.id === id);
  setDeleteModal({ open: true, id, name: item?.name ?? null });
};

const handleConfirmDelete = async () => {
  try {
    setIsDeleting(true);
    await deleteBarang(deleteModal.id);
    showToast.success("Barang berhasil dihapus");
    clearBarangExportCache();
    setDeleteModal({ open: false, id: null, name: null });
    fetchData();
  } catch (error) {
    showToast.error(error?.response?.data?.message || "Gagal menghapus data");
  } finally {
    setIsDeleting(false);
  }
};

  const handleExportPDF = async () => {
    try {
      setIsExporting(prev => ({ ...prev, pdf: true }));
      const pdfBlob = await exportBarangPDF();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-barang-${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh PDF");
    } finally {
      setTimeout(() => setIsExporting(prev => ({ ...prev, pdf: false })), 500);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(prev => ({ ...prev, excel: true }));
      const excelBlob = await exportBarangExcel();
      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-barang-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengunduh Excel");
    } finally {
      setTimeout(() => setIsExporting(prev => ({ ...prev, excel: false })), 500);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  const handleImportBarang = async (file) => {
    const response = await importBarang(file);
    showToast.success(`${response.berhasil} barang berhasil diimport`);
    clearBarangExportCache();
    fetchData();
    return response;
  };

  const handleDownloadTemplate = async () => {
    return downloadTemplateBarang();
  };

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
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola data barang dan inventori
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full sm:grid-cols-3 xl:flex xl:w-auto xl:flex-wrap xl:justify-end">
          {/* Tombol Export PDF dengan Animasi */}
          <button
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
              <>
                <MdFileDownload className="w-3.5 h-3.5" />
                PDF
              </>
            )}
          </button>

          {/* Tombol Export Excel dengan Animasi */}
          <button
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
              <>
                <MdFileDownload className="w-3.5 h-3.5" />
                Excel
              </>
            )}
          </button>

          {/* Tombol Refresh */}
          <button
            onClick={fetchData}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 xl:w-auto"
          >
            <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Tombol Import */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all duration-150 hover:scale-105 active:scale-95 xl:w-auto"
          >
            <MdUpload className="w-3.5 h-3.5" />
            Import Excel
          </button>

          {/* Tombol Tambah Barang */}
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
        {/* Toolbar: search + limit */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex items-center w-full lg:max-w-90">
            <MdSearch
              className={`absolute left-3 w-4 h-4 transition-colors ${
                search ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Cari kode, nama, atau kategori barang…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-8 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
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
                <option key={l} value={l}>
                  {l}
                </option>
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

      <style>{`
      
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGINATION BAR COMPONENT
───────────────────────────────────────────── */
function PaginationBar({ page, totalPages, total, limit, onPageChange }) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
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
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={`min-w-8 h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
            page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          ‹
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="min-w-8 h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
            >
              1
            </button>
            {pages[0] > 2 && <span className="text-xs text-gray-400 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-8 h-8 px-2 rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
              p === page
                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="text-xs text-gray-400 px-1">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="min-w-8 h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`min-w-8 h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
            page === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          ›
        </button>
      </div>
    </div>
  );
}