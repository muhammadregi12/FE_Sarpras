import api from "./api";

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

export const clearBarangMaintenanceExportCache = () => {
  exportCache.pdf   = null;
  exportCache.excel = null;
  // Tidak membatalkan inflight promise — biarkan selesai natural
};

// ─── API: Barang Maintenance ──────────────────────────────────────────────────

/**
 * @param {number} page
 * @param {number} limit
 * @param {string} search - Dikirim ke API (server-side search)
 */
export const getBarangMaintenanceList = async (page = 1, limit = 10, search = "") => {
  const params = { page, limit };
  if (search.trim()) params.search = search.trim();
  const res = await api.get("/barangmaintenance", { params });
  return res.data;
};

export const getBarangMaintenanceById = async (id) => {
  const res = await api.get(`/barangmaintenance/${id}`);
  return res.data;
};

export const createBarangMaintenance = async (formData) => {
  const res = await api.post("/barangmaintenance", formData);
  return res.data;
};

export const updateBarangMaintenance = async (id, formData) => {
  const res = await api.put(`/barangmaintenance/${id}`, formData);
  return res.data;
};

export const updateStatusBarangMaintenance = async (id, formData) => {
  const res = await api.put(`/barangmaintenance/selesai/${id}`, formData);
  return res.data;
};

export const deleteBarangMaintenance = async (id) => {
  const res = await api.delete(`/barangmaintenance/${id}`);
  return res.data;
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportBarangMaintenancePDF = () => {
  const cached = readCache("pdf");
  if (cached) return Promise.resolve(cached);
  return fetchExportBlob("pdf", "/barangmaintenance/export/pdf");
};

export const exportBarangMaintenanceExcel = () => {
  const cached = readCache("excel");
  if (cached) return Promise.resolve(cached);
  return fetchExportBlob("excel", "/barangmaintenance/export/excel");
};