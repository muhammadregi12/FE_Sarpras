import api from "./api";

// ─── Cache Store ────────────────────────────────────────────────────────────
const exportCache    = new Map();
const exportPromises = new Map();
const CACHE_TTL      = 5 * 60 * 1000; // 5 menit

const isCacheFresh = (entry) =>
  entry !== undefined && Date.now() - entry.timestamp < CACHE_TTL;

const readCache = (key) => {
  const entry = exportCache.get(key);
  return isCacheFresh(entry) ? entry.blob : null;
};

const writeCache = (key, blob) => {
  exportCache.set(key, { blob, timestamp: Date.now() });
  return blob;
};

const PARAM_KEYS = ["tipe", "tanggal", "bulan", "tahun", "start_date", "end_date", "cabang_id", "ruangan_id"];
const makeCacheKey = (namespace, type, params) => {
  const parts = PARAM_KEYS.reduce((acc, k) => {
    if (params[k] != null && params[k] !== "") acc.push(`${k}=${params[k]}`);
    return acc;
  }, []);
  return `${namespace}:${type}__${parts.length ? parts.join("_") : "all"}`;
};

/** Request blob dengan deduplication + caching */
const fetchExportBlob = (namespace, type, url, params) => {
  const key = makeCacheKey(namespace, type, params);

  const cached = readCache(key);
  if (cached) return Promise.resolve(cached);

  const inflight = exportPromises.get(key);
  if (inflight) return inflight;

  const promise = api
    .get(url, { params, responseType: "blob" })
    .then((res) => writeCache(key, res.data))
    .finally(() => exportPromises.delete(key));

  exportPromises.set(key, promise);
  return promise;
};

/**
 * Hapus semua cache yang prefix-nya cocok.
 * Menggunakan Map sehingga iterasi lebih cepat dari plain-object.
 */
const clearByPrefix = (prefix) => {
  for (const store of [exportCache, exportPromises]) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  }
};

// ─── Barang ─────────────────────────────────────────────────────────────────
export const clearLaporanBarangCache      = () => clearByPrefix("barang:");
export const clearLaporanBarangMasukCache = () => clearByPrefix("barangmasuk:");
export const clearLaporanBarangRusakCache = () => clearByPrefix("barangrusak:");
export const clearLaporanBarangKeluarCache= () => clearByPrefix("barangkeluar:");

/** Hapus semua cache laporan sekaligus */
export const clearAllLaporanCache = () => {
  clearLaporanBarangCache();
  clearLaporanBarangMasukCache();
  clearLaporanBarangRusakCache();
  clearLaporanBarangKeluarCache();
};

export const getLaporanBarang = (params = {}) =>
  api.get("/laporan/barang", { params }).then((r) => r.data);

export const exportLaporanBarangPDF = (params = {}) =>
  fetchExportBlob("barang", "pdf", "/laporan/barang/export-pdf", params);

export const exportLaporanBarangExcel = (params = {}) =>
  fetchExportBlob("barang", "excel", "/laporan/barang/export-excel", params);

// ─── Barang Masuk ────────────────────────────────────────────────────────────
export const getLaporanBarangMasuk = (params = {}) =>
  api.get("/laporan/barangmasuk", { params }).then((r) => r.data);

export const exportLaporanBarangMasukPDF = (params = {}) =>
  fetchExportBlob("barangmasuk", "pdf", "/laporan/barangmasuk/export-pdf", params);

export const exportLaporanBarangMasukExcel = (params = {}) =>
  fetchExportBlob("barangmasuk", "excel", "/laporan/barangmasuk/export-excel", params);

// ─── Barang Rusak ────────────────────────────────────────────────────────────
export const getLaporanBarangRusak = (params = {}) =>
  api.get("/laporan/barangrusak", { params }).then((r) => r.data);

export const exportLaporanBarangRusakPDF = (params = {}) =>
  fetchExportBlob("barangrusak", "pdf", "/laporan/barangrusak/export-pdf", params);

export const exportLaporanBarangRusakExcel = (params = {}) =>
  fetchExportBlob("barangrusak", "excel", "/laporan/barangrusak/export-excel", params);

// ─── Barang Keluar ───────────────────────────────────────────────────────────
export const getLaporanBarangKeluar = (params = {}) =>
  api.get("/laporan/barangkeluar", { params }).then((r) => r.data);

export const exportLaporanBarangKeluarPDF = (params = {}) =>
  fetchExportBlob("barangkeluar", "pdf", "/laporan/barangkeluar/export-pdf", params);

export const exportLaporanBarangKeluarExcel = (params = {}) =>
  fetchExportBlob("barangkeluar", "excel", "/laporan/barangkeluar/export-excel", params);