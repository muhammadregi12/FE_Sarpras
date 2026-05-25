import api from "./api";

const EXPORT_CACHE_TTL = 5 * 60 * 1000;
const DATA_CACHE_TTL   = 2 * 60 * 1000;
const DETAIL_CACHE_TTL = 10 * 60 * 1000;

const caches = {
  export:   { pdf: null, excel: null },
  data:     new Map(),
  detail:   new Map(),
  template: null,
};

// ─── Pending request deduplication ───
const pending = {
  export:   { pdf: null, excel: null },
  data:     new Map(),
  detail:   new Map(),
  template: null,
};

let hasPrefetchedExports = false;

// ─── Helpers ───
const isCacheFresh = (entry, ttl) =>
  !!entry && Date.now() - entry.timestamp < ttl;

// FIX 2: readCache diunifikasi — handle Map maupun plain object
const readCache = (store, key, ttl) => {
  const entry = store instanceof Map ? store.get(key) : store[key];
  return isCacheFresh(entry, ttl) ? entry.data : null;
};

const writeCache = (store, key, data) => {
  const entry = { data, timestamp: Date.now() };
  if (store instanceof Map) {
    store.set(key, entry);
  } else {
    store[key] = entry;
  }
  return data;
};

const createBarangFormData = (payload) => {
  const fd = new FormData();
  fd.append("name",            payload.name             ?? "");
  fd.append("kode_barang",     payload.kode_barang      ?? "");
  fd.append("ruangan_id",      payload.ruangan_id       ?? "");
  fd.append("cabang_id",       payload.cabang_id        ?? "");
  fd.append("kategori_id",     payload.kategori_id      ?? "");
  fd.append("satuan",          payload.satuan           ?? "");
  fd.append("keterangan",      payload.keterangan       || "");
  fd.append("tahun_pengadaan", payload.tahun_pengadaan  ?? "");
  if (payload.image) fd.append("image", payload.image);
  return fd;
};

const invalidateDataCaches = () => {
  caches.data.clear();
  caches.detail.clear();
};

const fetchExportBlob = async (type, url) => {
  const cached = readCache(caches.export, type, EXPORT_CACHE_TTL);
  if (cached) return cached;
  if (pending.export[type]) return pending.export[type];

  pending.export[type] = api
    .get(url, { responseType: "blob" })
    .then((res) => writeCache(caches.export, type, res.data))
    .finally(() => { pending.export[type] = null; });

  return pending.export[type];
};

export const clearBarangExportCache = () => {
  caches.export.pdf   = null;
  caches.export.excel = null;
  pending.export.pdf   = null;
  pending.export.excel = null;
  hasPrefetchedExports = false;
};

export const clearAllBarangCaches = () => {
  clearBarangExportCache();
  invalidateDataCaches();
  caches.template  = null;
  pending.template = null;
};

// FIX 5: prefetchBarangExports — guard hasPrefetchedExports sudah ada,
// tapi sekarang juga cek apakah cache masih fresh sebelum prefetch sia-sia
export const prefetchBarangExports = () => {
  if (hasPrefetchedExports) return;

  const pdfFresh   = isCacheFresh(caches.export.pdf,   EXPORT_CACHE_TTL);
  const excelFresh = isCacheFresh(caches.export.excel, EXPORT_CACHE_TTL);
  if (pdfFresh && excelFresh) {
    hasPrefetchedExports = true;
    return;
  }

  hasPrefetchedExports = true;

  const runPrefetch = () => {
    if (!pdfFresh)   void fetchExportBlob("pdf",   "/barangs/export/pdf");
    if (!excelFresh) void fetchExportBlob("excel", "/barangs/export/excel");
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(runPrefetch, { timeout: 2000 });
  } else {
    setTimeout(runPrefetch, 800);
  }
};

// ─── CRUD ───

export const getBarangList = async (page = 1, limit = 10) => {
  const key = `${page}-${limit}`;

  const cached = readCache(caches.data, key, DATA_CACHE_TTL);
  if (cached) return cached;

  if (pending.data.has(key)) return pending.data.get(key);

  const promise = api
    .get("/barangs", { params: { page, limit } })
    .then((res) => writeCache(caches.data, key, res.data.data))
    .finally(() => pending.data.delete(key));

  pending.data.set(key, promise);
  return promise;
};

export const getBarangById = async (id) => {
  const key = `barang-${id}`;

  const cached = readCache(caches.detail, key, DETAIL_CACHE_TTL);
  if (cached) return cached;

  if (pending.detail.has(key)) return pending.detail.get(key);

  const promise = api
    .get(`/barangs/${id}`)
    .then((res) => writeCache(caches.detail, key, res.data.data))
    .finally(() => pending.detail.delete(key));

  pending.detail.set(key, promise);
  return promise;
};

export const createBarang = async (payload) => {
  const res = await api.post("/barangs", createBarangFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  invalidateDataCaches();
  return res.data.data;
};

export const updateBarang = async (id, payload) => {
  const res = await api.put(`/barangs/${id}`, createBarangFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  invalidateDataCaches();
  caches.detail.delete(`barang-${id}`);
  return res.data.data;
};

export const deleteBarang = async (id) => {
  const res = await api.delete(`/barangs/${id}`);
  invalidateDataCaches();
  caches.detail.delete(`barang-${id}`);
  return res.data;
};

// ─── Export ───

export const exportBarangPDF = () => fetchExportBlob("pdf", "/barangs/export/pdf");

export const exportBarangExcel = () => fetchExportBlob("excel", "/barangs/export/excel");

// ─── Import ───

export const importBarang = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post("/import/barang/excel", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  invalidateDataCaches();
  return res.data;
};

export const downloadTemplateBarang = async () => {
  // FIX 6: Gunakan readCache/writeCache yang konsisten (tidak lagi akses .data manual)
  const cached = readCache(caches, "template", DETAIL_CACHE_TTL);
  // template disimpan di caches.template (plain object), bukan Map
  // pakai cara langsung karena key "template" di plain object
  if (isCacheFresh(caches.template, DETAIL_CACHE_TTL)) return caches.template.data;

  if (pending.template) return pending.template;

  pending.template = api
    .get("/import/barang/template", { responseType: "blob" })
    .then((res) => {
      caches.template = { data: res.data, timestamp: Date.now() };
      return res.data;
    })
    .finally(() => { pending.template = null; });

  return pending.template;
};

// ─── QR & Scan ───

const API_BASE_BARANG = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const getQRCodeBarangUrl = (id) =>
  API_BASE_BARANG
    ? `${API_BASE_BARANG}/scan/barang/qrcode/${id}`
    : `/scan/barang/qrcode/${id}`;

export const getDetailBarang = async (id) => {
  const key = `detail-scan-${id}`;

  const cached = readCache(caches.detail, key, DETAIL_CACHE_TTL);
  if (cached) return cached;

  if (pending.detail.has(key)) return pending.detail.get(key);

  const promise = api
    .get(`/scan/barang/detail/${id}`)
    .then(({ data }) => writeCache(caches.detail, key, data))
    .finally(() => pending.detail.delete(key));

  pending.detail.set(key, promise);
  return promise;
};

export const getQRCodeBarang = async (id) => {
  const res = await api.get(`/scan/barang/qrcode/${id}`, { responseType: "blob" });
  return res.data;
};

export const downloadQRCodeBarang = async (id) => {
  const res = await api.get(`/scan/barang/qrcode/download/${id}`, { responseType: "blob" });
  return res.data;
};

export const getAllQRCodesBarang = async (baseUrl = null) => {
  const params = baseUrl ? { base_url: baseUrl } : {};
  const { data } = await api.get("/scan/barang/qrcode", { params });
  return data;
};

export const getBarangByRuangan = async (ruanganId, page = 1, limit = 1000) => {
  const key = `ruangan-${ruanganId}-${page}-${limit}`;

  const cached = readCache(caches.data, key, DATA_CACHE_TTL);
  if (cached) return cached;

  if (pending.data.has(key)) return pending.data.get(key);

  const promise = api
    .get("/barangs", { params: { ruangan_id: ruanganId, page, limit } })
    .then((res) => writeCache(caches.data, key, res.data.data ?? []))
    .finally(() => pending.data.delete(key));

  pending.data.set(key, promise);
  return promise;
};