/**
 * KategoriMain.jsx — SARPRAS Manajemen Kategori
 *
 * Features:
 *  - Search/filter client-side (debounced)
 *  - Pagination (page, limit, total dari API)
 *  - Light/white theme konsisten dengan Ruangan
 *  - Menggunakan Tailwind CSS
 *  - Animated header & table entrance
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdSearch, MdCategory } from "react-icons/md";
import {
  getKategoriList,
  createKategori,
  updateKategori,
  deleteKategori,
} from "../services/kategoriService";
import { showToast } from "../utils/toast";
import KategoriTable from "../components/feature/kategori/KategoriTable";
import KategoriModal from "../components/feature/kategori/KategoriModal";
import DeleteConfirmModal from "../components/shared/DeleteConfirmModal";

const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function KategoriMain() {
  const [rawData, setRawData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: null });
  const [isDeleting, setIsDeleting] = useState(false);

  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Search (client-side filter pada data halaman saat ini)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

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
    fetchData();
  }, [page, limit]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getKategoriList(page, limit);
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
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  /* Filter client-side berdasarkan debounced search */
  const filteredData = rawData.filter((item) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      item.kode_kategori?.toLowerCase().includes(q) ||
      item.name_kategori?.toLowerCase().includes(q) ||
      item.deskripsi?.toLowerCase().includes(q)
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

  const handleDelete = (id) => {
  const item = rawData.find((d) => d.id === id);
  setDeleteModal({ open: true, id, name: item?.name_kategori ?? null });
};

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (isEdit && selectedData) {
        await updateKategori(selectedData.id, formData);
        showToast.success("Kategori berhasil diperbarui");
      } else {
        await createKategori(formData);
        showToast.success("Kategori berhasil ditambahkan");
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCloseDelete = () => {
    setDeleteModal({ open: false, id: null, name: null });
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteKategori(deleteModal.id);
      showToast.success("Kategori berhasil dihapus");
      handleCloseDelete();
      fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full p-6 bg-white font-['Sora']">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <MdCategory className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Manajemen Kategori
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Kelola kategori barang di sistem</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150"
          >
            <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-150"
          >
            <MdAdd className="w-4 h-4" />
            Tambah Kategori
          </button>
        </div>
      </div>

      {/* ── Card Container ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {/* Toolbar: search + limit */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
          <div className="relative flex items-center flex-1 max-w-[360px]">
            <MdSearch className={`absolute left-3 w-4 h-4 transition-colors ${search ? "text-blue-600" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Cari kode, nama, atau deskripsi kategori…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-9 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
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

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="py-1.5 px-3 text-xs text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer"
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
          <div className="flex items-center gap-2.5 px-5 py-2.5 border-b border-gray-200 bg-gray-50/50">
            <span className="text-[11px] text-gray-400 flex-1">
              {debouncedSearch
                ? `${filteredData.length} hasil untuk "${debouncedSearch}"`
                : `Total ${meta.total} kategori`}
            </span>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="text-[11px] font-semibold text-blue-600 bg-none border-none cursor-pointer"
              >
                Hapus filter
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <KategoriTable
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
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal */}
      <KategoriModal
        isOpen={modalOpen}
        isEdit={isEdit}
        data={selectedData}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.name}
        isLoading={isDeleting}
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
          className={`min-w-[32px] h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
            page === 1 ? "opacity-35 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          ‹
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="min-w-[32px] h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
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
            className={`min-w-[32px] h-8 px-2 rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
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
              className="min-w-[32px] h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center hover:bg-gray-50 transition-all duration-150"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`min-w-[32px] h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
            page === totalPages ? "opacity-35 cursor-not-allowed" : "hover:bg-gray-50"
          }`}
        >
          ›
        </button>
      </div>
    </div>
  );
}