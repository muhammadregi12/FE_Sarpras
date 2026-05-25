/**
 * barangmasukService.js
 *
 * Optimasi yang diterapkan:
 * 1. TTL 5 menit pada export cache (blob tidak basi selamanya)
 * 2. In-flight deduplication — double-klik ekspor tidak double-fetch
 * 3. Server-side search — query dikirim ke API, bukan filter di client
 * 4. Prefetch dihapus dari service (dipindah ke hover-intent di komponen)
 */

import api from "./api";

// ─── Export Cache ────────────────────────────────────────────────────────────

const EXPORT_CACHE_TTL = 5 * 60 * 1000; // 5 menit

/**
 * Struktur cache:
 * {
 *   pdf?:       Blob,
 *   excel?:     Blob,
 *   timestamp?: number   ← waktu terakhir cache diperbarui
 * }
 */
let exportCache = null;

/** Cek apakah cache masih valid (belum melewati TTL) */
const isCacheValid = () =>
  exportCache?.timestamp != null &&
  Date.now() - exportCache.timestamp < EXPORT_CACHE_TTL;

// ─── In-flight Deduplication ─────────────────────────────────────────────────

/**
 * Map berisi Promise yang sedang berjalan per key.
 * Jika request yang sama dipanggil lagi sebelum selesai,
 * kembalikan Promise yang sudah ada — bukan kirim request baru.
 */
const inflight = new Map();

/**
 * Jalankan `fetcher` sekali saja selama request berlangsung.
 * Pemanggil berikutnya mendapat Promise yang sama.
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 */
const fetchWithDedup = (key, fetcher) => {
  if (inflight.has(key)) return inflight.get(key);
  const promise = fetcher().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
};

// ─── API Calls ───────────────────────────────────────────────────────────────

/**
 * Ambil daftar barang masuk dengan paginasi + search server-side.
 * Search dikirim ke backend sehingga payload jaringan minimal.
 *
 * @param {number} page
 * @param {number} limit
 * @param {string} search  - Kata kunci pencarian (dikirim ke API)
 */
export const getBarangMasukList = async (page = 1, limit = 10, search = "") => {
  const params = new URLSearchParams({ page, limit });
  if (search.trim()) params.set("search", search.trim());
  const res = await api.get(`/barangmasuk?${params.toString()}`);
  return res.data;
};

/** Ambil satu record barang masuk berdasarkan ID */
export const getBarangMasukById = async (id) => {
  const res = await api.get(`/barangmasuk/${id}`);
  return res.data;
};

/** Buat data barang masuk baru */
export const createBarangMasuk = async (formData) => {
  const res = await api.post("/barangmasuk", formData);
  return res.data;
};

/** Perbarui data barang masuk */
export const updateBarangMasuk = async (id, formData) => {
  const res = await api.put(`/barangmasuk/${id}`, formData);
  return res.data;
};

/** Hapus data barang masuk */
export const deleteBarangMasuk = async (id) => {
  const res = await api.delete(`/barangmasuk/${id}`);
  return res.data;
};

// ─── Export PDF ───────────────────────────────────────────────────────────────

/**
 * Unduh laporan PDF.
 * - Cek cache TTL terlebih dahulu
 * - Deduplication: double-klik tidak double-fetch
 */
export const exportBarangMasukPDF = () =>
  fetchWithDedup("export:pdf", async () => {
    if (isCacheValid() && exportCache?.pdf) return exportCache.pdf;

    const res = await api.get("/barangmasuk/export/pdf", { responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/pdf" });

    exportCache = {
      ...(exportCache ?? {}),
      pdf: blob,
      timestamp: Date.now(),
    };

    return blob;
  });

// ─── Export Excel ─────────────────────────────────────────────────────────────

/**
 * Unduh laporan Excel.
 * - Cek cache TTL terlebih dahulu
 * - Deduplication: double-klik tidak double-fetch
 */
export const exportBarangMasukExcel = () =>
  fetchWithDedup("export:excel", async () => {
    if (isCacheValid() && exportCache?.excel) return exportCache.excel;

    const res = await api.get("/barangmasuk/export/excel", { responseType: "blob" });
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    exportCache = {
      ...(exportCache ?? {}),
      excel: blob,
      timestamp: Date.now(),
    };

    return blob;
  });


export const clearBarangMasukExportCache = () => {
  exportCache = null;
};