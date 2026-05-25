import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdAdd, MdRefresh, MdSearch, MdMeetingRoom } from "react-icons/md";
import { getRuanganList, createRuangan, updateRuangan, deleteRuangan, downloadQRCodeRuangan, getAllQRCodes, getQRCodeUrl, exportPDFDetailRuangan } from "../services/ruanganService";
import { showToast } from "../utils/toast";
import RuanganTable from "../components/feature/ruangan/RuanganTable";
import RuanganModal from "../components/feature/ruangan/RuanganModal";
import DeleteConfirmModal from "../components/feature/DeleteConfirmModal";


const LIMIT_OPTIONS = [10, 25, 50, 100];

export default function RuanganMain() {
  const [rawData, setRawData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // delete confirmation
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getRuanganList(page, limit);
      const rows = Array.isArray(result) ? result : result?.data ?? [];
      const resultMeta = Array.isArray(result) ? result.meta ?? null : result?.meta ?? null;

      setRawData(rows);
      setMeta({
        total: resultMeta?.total ?? rows.length,
        page: resultMeta?.page ?? page,
        totalPages: resultMeta?.totalPages ?? 1,
      });
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  /* Fetch data ketika page / limit berubah */
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(t);
  }, [fetchData]);

  /* Filter client-side berdasarkan debounced search */
  const filteredData = useMemo(() => {
    if (!debouncedSearch) return rawData;
    const q = debouncedSearch.toLowerCase();
    return rawData.filter((item) => {
      return (
        item.kode_ruangan?.toLowerCase().includes(q) ||
        item.name_ruangan?.toLowerCase().includes(q)
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
        await updateRuangan(selectedData.id, formData);
        showToast.success("Ruangan berhasil diperbarui");
      } else {
        await createRuangan(formData);
        showToast.success("Ruangan berhasil ditambahkan");
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
    setDeleteModal({ open: true, id, name: item?.name_ruangan ?? null });
  }, [rawData]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      await deleteRuangan(deleteModal.id);
      showToast.success("Ruangan berhasil dihapus");
      setDeleteModal({ open: false, id: null, name: null });
      await fetchData();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteModal.id, fetchData]);

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
            <MdMeetingRoom className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Manajemen Ruangan
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola data ruangan dan lokasi penyimpanan barang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150"
          >
            <MdRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={async () => {
              try {
                setDownloadingAll(true);
                const res = await getAllQRCodes();
                const arr = res?.data ?? [];
                for (const r of arr) {
                  const base64 = r.qr_base64;
                  if (!base64) continue;
                  const blob = await (await fetch(base64)).blob();
                  const filename = `qr-ruangan-${r.kode_ruangan || r.id}.png`;
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  await new Promise((res) => setTimeout(res, 150));
                }
              } catch (err) {
                showToast.error(err?.message || "Gagal mengunduh semua QR");
              } finally {
                setDownloadingAll(false);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all duration-150"
          >
            <MdMeetingRoom className="w-4 h-4" />
            {downloadingAll ? "Mengunduh..." : "Download Semua QR"}
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-150"
          >
            <MdAdd className="w-4 h-4" />
            Tambah Ruangan
          </button>
        </div>
      </div>

      {/* ── Card Container ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">
        {/* Toolbar: search + limit */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
          <div className="relative flex items-center flex-1 max-w-90">
            <MdSearch
              className={`absolute left-3 w-4 h-4 transition-colors ${
                search ? "text-blue-600" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Cari kode atau nama ruangan…"
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

          <div className="flex items-center gap-2 shrink-0">
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
          <div className="flex items-center gap-2.5 px-5 py-2.5 border-b border-gray-200 bg-gray-50/50">
            <span className="text-[11px] text-gray-400 flex-1">
              {debouncedSearch
                ? `${filteredData.length} hasil untuk "${debouncedSearch}"`
                : `Total ${meta.total} ruangan`}
            </span>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="text-[11px] font-semibold text-blue-600 bg-none border-none cursor-pointer hover:text-blue-700"
              >
                Hapus filter
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <RuanganTable
          data={filteredData}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onPreviewQR={(item) => {
            const src = getQRCodeUrl(item.id);
            setQrPreview({ src, kode: item.kode_ruangan, id: item.id });
          }}
          onDownloadQR={async (item) => {
            try {
              showToast.success("Menyiapkan unduhan...");
              const blob = await downloadQRCodeRuangan(item.id);
              const filename = `qr-ruangan-${item.kode_ruangan || item.id}.png`;
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              showToast.success("QR berhasil diunduh");
            } catch (err) {
              showToast.error(err?.message || "Gagal mengunduh QR");
            }
          }}
          onExportPDF={async (item) => {
            try {
              const blob = await exportPDFDetailRuangan(item.id);
              const filename = `inventaris-${item.kode_ruangan || item.id}.pdf`;
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (err) {
              showToast.error(err?.message || "Gagal mengekspor PDF");
            }
          }}
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
      <RuanganModal
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
        {/* Prev */}
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={`min-w-8 h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
            page === 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          ‹
        </button>

        {/* First + ellipsis */}
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

        {/* Page Numbers */}
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

        {/* Last + ellipsis */}
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

        {/* Next */}
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`min-w-8 h-8 px-2 rounded-md border border-gray-200 bg-white text-gray-500 text-xs font-semibold flex items-center justify-center transition-all duration-150 ${
            page === totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          ›
        </button>
      </div>
    </div>
  );
}