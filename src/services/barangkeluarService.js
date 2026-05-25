import api from "./api";

// ─── Export Cache ─────────────────────────────────────────────────────────────

const EXPORT_CACHE_TTL = 5 * 60 * 1000; // 5 menit

/** @type {{ pdf: { blob: Blob, timestamp: number } | null, excel: { blob: Blob, timestamp: number } | null }} */
const exportCache = { pdf: null, excel: null };

/** In-flight deduplication */
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

const fetchExportBlob = (type, url) => {
  if (exportPromises[type]) return exportPromises[type];

  const promise = api
    .get(url, { responseType: "blob" })
    .then((res) => {
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

export const clearBarangKeluarExportCache = () => {
  exportCache.pdf   = null;
  exportCache.excel = null;
  // Tidak membatalkan inflight promise — biarkan selesai natural
};

// ─── API: Barang Keluar ───────────────────────────────────────────────────────

/**
 * @param {number} page
 * @param {number} limit
 * @param {string} search - Dikirim ke API (server-side search)
 */
export const getBarangKeluarList = async (page = 1, limit = 10, search = "") => {
  const params = { page, limit };
  if (search.trim()) params.search = search.trim();
  const res = await api.get("/barangkeluar", { params });
  return res.data;
};

export const getBarangKeluarById = async (id) => {
  const res = await api.get(`/barangkeluar/${id}`);
  return res.data;
};

export const createBarangKeluar = async (formData) => {
  const res = await api.post("/barangkeluar", formData);
  return res.data;
};

export const updateBarangKeluar = async (id, formData) => {
  const res = await api.put(`/barangkeluar/${id}`, formData);
  return res.data;
};

export const deleteBarangKeluar = async (id) => {
  const res = await api.delete(`/barangkeluar/${id}`);
  return res.data;
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportBarangKeluarPDF = () => {
  const cached = readCache("pdf");
  if (cached) return Promise.resolve(cached);
  return fetchExportBlob("pdf", "/barangkeluar/export/pdf");
};

export const exportBarangKeluarExcel = () => {
  const cached = readCache("excel");
  if (cached) return Promise.resolve(cached);
  return fetchExportBlob("excel", "/barangkeluar/export/excel");
};