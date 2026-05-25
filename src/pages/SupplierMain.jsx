import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdSearch, MdFileDownload, MdLocalShipping, MdUpload } from "react-icons/md";
import { getSupplierList, createSupplier, updateSupplier, deleteSupplier, exportSupplierPDF, exportSupplierExcel, importSupplier, downloadTemplateSupplier } from "../services/supplierService";
import { showToast } from "../utils/toast";
import SupplierTable from "../components/feature/supplier/SupplierTable";
import SupplierModal from "../components/feature/supplier/SupplierModal";
import DeleteConfirmModal from "../components/feature/DeleteConfirmModal";
import ImportModal from "../components/feature/ImportModal";

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function SupplierMain() {
  const [rawData, setRawData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState({ pdf: false, excel: false });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // delete
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Search (client-side filter pada data halaman saat ini)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getSupplierList(page, limit);
      const rows = Array.isArray(result) ? result : result?.data ?? [];
      const resultMeta = Array.isArray(result) ? result.meta ?? null : result?.meta ?? null;

      setRawData(rows);
      setMeta({
        total: resultMeta?.total ?? rows.length,
        page: resultMeta?.page ?? page,
        totalPages: resultMeta?.totalPages ?? 1,
      });
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  /* Debounce search input */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  /* Fetch data ketika page / limit berubah */
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchData]);

  /* Filter client-side berdasarkan debounced search */
  const filteredData = useMemo(() => {
    if (!debouncedSearch) return rawData;
    const q = debouncedSearch.toLowerCase();
    return rawData.filter((item) => {
      return (
        item.nama_supplier?.toLowerCase().includes(q) ||
        item.kontak?.toLowerCase().includes(q) ||
        item.alamat?.toLowerCase().includes(q)
      );
    });
  }, [rawData, debouncedSearch]);

  /* Modal handlers */
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

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (isEdit && selectedData) {
        await updateSupplier(selectedData.id, formData);
        showToast.success("Supplier berhasil diperbarui");
      } else {
        await createSupplier(formData);
        showToast.success("Supplier berhasil ditambahkan");
      }
      handleCloseModal();
      await fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback((id) => {
    const item = rawData.find((d) => d.id === id);
    setDeleteModal({ open: true, id, name: item?.name_supplier ?? null });
  }, [rawData]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteSupplier(deleteModal.id);
      showToast.success("Supplier berhasil dihapus");
      setDeleteModal({ open: false, id: null, name: null });
      await fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.id, fetchData]);

  const handleExportPDF = async () => {
    try {
      setIsExporting((prev) => ({ ...prev, pdf: true }));
      const blob = await exportSupplierPDF();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `supplier-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast.success("PDF berhasil diunduh");
    } catch (error) {
      showToast.error(error?.message || "Gagal mengekspor PDF");
    } finally {
      setIsExporting((prev) => ({ ...prev, pdf: false }));
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting((prev) => ({ ...prev, excel: true }));
      const blob = await exportSupplierExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `supplier-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast.success("Excel berhasil diunduh");
    } catch (error) {
      showToast.error(error?.message || "Gagal mengekspor Excel");
    } finally {
      setIsExporting((prev) => ({ ...prev, excel: false }));
    }
  };

  const handleLimitChange = useCallback((newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
  }, []);

  const handleImportSupplier = async (file) => {
    const response = await importSupplier(file);
    showToast.success(`${response.berhasil} supplier berhasil diimport`);
    await fetchData();
    return response;
  };

  const handleDownloadTemplate = async () => {
    return downloadTemplateSupplier();
  };

  return (
    <div className="min-h-full p-3 bg-white font-['Sora'] sm:p-4 lg:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      {/* ── Page Header ── */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <MdLocalShipping className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Manajemen Supplier
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola data supplier dan vendor penyuplai barang
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
            onClick={handleRefresh}
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

          {/* Tombol Tambah Supplier */}
          <button
            onClick={handleOpenCreate}
            className="flex w-full items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-150 hover:scale-105 active:scale-95 xl:w-auto"
          >
            <MdAdd className="w-4 h-4" />
            Tambah Supplier
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
              placeholder="Cari nama supplier, kontak, atau alamat…"
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
                : `Total ${meta.total} supplier`}
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
        <SupplierTable
          data={filteredData}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          isLoading={loading}
          page={page}
          limit={limit}
        />

        {/* Pagination */}
        {!loading && filteredData.length > 0 && !debouncedSearch && (
          <PaginationBar
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modal */}
      <SupplierModal
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
        onImport={handleImportSupplier}
        onDownloadTemplate={handleDownloadTemplate}
        title="Import Data Supplier"
      />

      {/* delete modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.name}
        isLoading={isDeleting}
      />


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