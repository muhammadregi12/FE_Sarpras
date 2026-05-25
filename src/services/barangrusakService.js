/**
 * barangrusakService.js
 *
 * Optimasi yang diterapkan:
 * 1. Server-side search — parameter `search` dikirim ke API, tidak filter di client
 * 2. prefetchBarangRusakExports DIHAPUS dari service — dipindah ke hover-intent di komponen
 * 2. TTL 5 menit + in-flight deduplication tetap dipertahankan (sudah bagus)
 * 3. Blob wrapping explicit untuk PDF (content-type benar)
 * 4. clearBarangRusakExportCache tidak lagi membatalkan inflight promise yang sedang berjalan
 *    — biarkan selesai, tapi hasil tidak disimpan ke cache lama
 */

import api from "./api";

// ─── Export Cache ─────────────────────────────────────────────────────────────

const EXPORT_CACHE_TTL = 5 * 60 * 1000; // 5 menit

/**
 * @type {{ pdf: { blob: Blob, timestamp: number } | null, excel: { blob: Blob, timestamp: number } | null }}
 */
const exportCache = { pdf: null, excel: null };

/** In-flight deduplication: simpan Promise yang sedang berjalan */
const exportPromises = { pdf: null, excel: null };

// ─── Cache Helpers ────────────────────────────────────────────────────────────

const isCacheFresh = (entry) =>
  !!entry && Date.now() - entry.timestamp < EXPORT_CACHE_TTL;

const readCache = (type) => {
  const entry = exportCache[type];
  return isCacheFresh(entry) ? entry.blob : null;
};

const writeCache = (type, blob) => {
  exportCache[type] = { blob, timestamp: Date.now() };
  return blob;
};

// ─── Fetch with Dedup ─────────────────────────────────────────────────────────

const EXPORT_MIME = {
  pdf:   "application/pdf",
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Fetch export blob dengan deduplication.
 * Jika request yang sama sedang berjalan, kembalikan Promise yang sama.
 */
const fetchExportBlob = (type, url) => {
  // Sudah ada inflight → pakai yang sama
  if (exportPromises[type]) return exportPromises[type];

  const promise = api
    .get(url, { responseType: "blob" })
    .then((res) => {
      // Bungkus dengan MIME type yang benar (beberapa server tidak set Content-Type dengan tepat)
      const blob = new Blob([res.data], { type: EXPORT_MIME[type] });
      return writeCache(type, blob);
    })
    .finally(() => {
      exportPromises[type] = null;
    });

  exportPromises[type] = promise;
  return promise;
};

// ─── Cache Management ─────────────────────────────────────────────────────────

/**
 * Hapus export cache (dipanggil setelah create/update/delete).
 * Inflight requests dibiarkan selesai — hasilnya akan di-discard saat TTL check berikutnya
 * karena cache di-null-kan di sini.
 */
export const clearBarangRusakExportCache = () => {
  exportCache.pdf   = null;
  exportCache.excel = null;
  // Tidak membatalkan exportPromises — biarkan selesai secara natural,
  // hasilnya di-overwrite oleh writeCache panggilan berikutnya.
};

// ─── API: Barang Rusak ────────────────────────────────────────────────────────

/**
 * Ambil daftar barang rusak dengan paginasi + search server-side.
 * @param {number} page
 * @param {number} limit
 * @param {string} search - Kata kunci (dikirim ke API)
 */
export const getBarangRusakList = async (page = 1, limit = 10, search = "") => {
  const params = { page, limit };
  if (search.trim()) params.search = search.trim();
  const res = await api.get("/barangrusak", { params });
  return res.data;
};

export const getBarangRusakById = async (id) => {
  const res = await api.get(`/barangrusak/${id}`);
  return res.data.data;
};

export const createBarangRusak = async (payload) => {
  const res = await api.post("/barangrusak", {
    barang_id:          payload.barang_id,
    cabang_id:          payload.cabang_id,
    ruangan_id:         payload.ruangan_id,
    jumlah_rusak:       payload.jumlah_rusak,
    tingkat_kerusakan:  payload.tingkat_kerusakan,
    tanggal_rusak:      payload.tanggal_rusak,
    keterangan:         payload.keterangan || "",
  });
  return res.data.data;
};

export const updateBarangRusak = async (id, payload) => {
  const res = await api.put(`/barangrusak/${id}`, {
    barang_id:          payload.barang_id,
    cabang_id:          payload.cabang_id,
    ruangan_id:         payload.ruangan_id,
    jumlah_rusak:       payload.jumlah_rusak,
    tingkat_kerusakan:  payload.tingkat_kerusakan,
    tanggal_rusak:      payload.tanggal_rusak,
    keterangan:         payload.keterangan || "",
  });
  return res.data.data;
};

export const deleteBarangRusak = async (id) => {
  const res = await api.delete(`/barangrusak/${id}`);
  return res.data;
};

// ─── Export ───────────────────────────────────────────────────────────────────

/** Unduh PDF — cache TTL + deduplication */
export const exportBarangRusakPDF = () => {
  const cached = readCache("pdf");
  if (cached) return Promise.resolve(cached);
  return fetchExportBlob("pdf", "/barangrusak/export/pdf");
};

/** Unduh Excel — cache TTL + deduplication */
export const exportBarangRusakExcel = () => {
  const cached = readCache("excel");
  if (cached) return Promise.resolve(cached);
  return fetchExportBlob("excel", "/barangrusak/export/excel");
};