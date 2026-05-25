/**
 * LaporanBarangMasukFilter.jsx — versi optimasi performa
 *
 * Perbaikan vs versi sebelumnya:
 * 1. useMemo untuk cabangOptions, ruanganOptions, tahunOptions
 *    — tidak dihitung ulang setiap render, hanya saat datanya berubah
 * 2. useCallback pada semua handler state (setTipe, setBulan, dll.)
 *    — referensi fungsi stabil, SelectField yang di-memo tidak re-render sia-sia
 * 3. SelectField.onChange kini menerima value langsung dari setter
 *    — tidak ada overhead lambda baru tiap render
 * 4. buildParams dipindah ke useCallback agar handleFilter tidak rebuild tiap render
 * 5. periodeValid dihitung dengan useMemo — tidak dievaluasi ulang bila state lain berubah
 * 6. isDirty dihitung dengan useMemo — sama alasannya
 * 7. getCachedList hanya dipanggil sekali (sudah benar di versi lama),
 *    tapi sekarang cleanup setLoadingDD lebih aman dengan isMounted flag
 */

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  MdFilterList,
  MdStore,
  MdMeetingRoom,
  MdCalendarToday,
  MdSearch,
  MdClose,
} from "react-icons/md";
import { getCabangList }  from "../../../services/cabangService";
import { getRuanganList } from "../../../services/ruanganService";
import {
  REPORT_BULAN_OPTIONS,
  REPORT_CURRENT_MONTH,
  REPORT_CURRENT_YEAR,
  REPORT_TAHUN_OPTIONS,
  REPORT_TIPE_OPTIONS,
} from "../../../utils/reportHelpers";
import { getCachedList } from "../../../utils/cachedList";

// ─── Konstanta di luar komponen ───────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];

/* ── Reusable select — di-memo agar tidak re-render saat parent render ──────── */
const SelectField = memo(function SelectField({
  label, icon: Icon, value, onChange, options, placeholder, disabled,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className={`w-full py-2.5 pl-3 pr-8 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 appearance-none cursor-pointer ${
            focused ? "border border-blue-500" : "border border-gray-200"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          style={{ boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.1)" : "none" }}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
});

/* ── Main Export ── */
export default function LaporanBarangMasukFilter({ onFilter, isLoading }) {
  const [tipe,      setTipe]      = useState("bulanan");
  const [tanggal,   setTanggal]   = useState("");
  const [bulan,     setBulan]     = useState(REPORT_CURRENT_MONTH);
  const [tahun,     setTahun]     = useState(String(REPORT_CURRENT_YEAR));
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [cabangId,  setCabangId]  = useState("");
  const [ruanganId, setRuanganId] = useState("");

  const [cabangList,  setCabangList]  = useState([]);
  const [ruanganList, setRuanganList] = useState([]);
  const [loadingDD,   setLoadingDD]   = useState(false);

  // OPTIMASI: isMounted flag mencegah setState setelah komponen unmount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoadingDD(true);
        const [cabang, ruangan] = await Promise.all([
          getCachedList("laporan-barang-masuk:cabang",  () => getCabangList(1, 100)),
          getCachedList("laporan-barang-masuk:ruangan", () => getRuanganList(1, 100)),
        ]);
        if (!isMounted) return;
        setCabangList(cabang);
        setRuanganList(ruangan);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingDD(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []); // ← tidak ada dependency: load cukup sekali

  // OPTIMASI: useMemo — options tidak dihitung ulang kecuali list berubah
  const cabangOptions = useMemo(
    () => cabangList.map((c) => ({ value: String(c.id), label: c.name_cabang })),
    [cabangList]
  );
  const ruanganOptions = useMemo(
    () => ruanganList.map((r) => ({ value: String(r.id), label: r.name_ruangan })),
    [ruanganList]
  );
  // OPTIMASI: tahunOptions tidak berubah sama sekali selama sesi — computed once
  const tahunOptions = useMemo(
    () => REPORT_TAHUN_OPTIONS.map((y) => ({ value: y, label: y })),
    [] // REPORT_TAHUN_OPTIONS konstan
  );

  // OPTIMASI: useMemo — tidak dievaluasi ulang bila state yang tidak relevan berubah
  const periodeValid = useMemo(() =>
    (tipe === "harian"  && !!tanggal) ||
    (tipe === "bulanan" && !!bulan && !!tahun) ||
    (tipe === "tahunan" && !!tahun) ||
    (tipe === "custom"  && (!!startDate || !!endDate)),
  [tipe, tanggal, bulan, tahun, startDate, endDate]);

  const isDirty = useMemo(() =>
    tipe !== "bulanan" ||
    !!tanggal ||
    bulan !== REPORT_CURRENT_MONTH ||
    tahun !== String(REPORT_CURRENT_YEAR) ||
    !!startDate ||
    !!endDate ||
    !!cabangId ||
    !!ruanganId,
  [tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId]);

  // OPTIMASI: useCallback — buildParams tidak dibuat ulang tiap render
  const buildParams = useCallback(() => {
    const params = { tipe };
    if (tipe === "harian")  params.tanggal = tanggal;
    if (tipe === "bulanan") { params.bulan = bulan; params.tahun = tahun; }
    if (tipe === "tahunan") params.tahun = tahun;
    if (tipe === "custom") {
      if (startDate) params.start_date = startDate;
      if (endDate)   params.end_date   = endDate;
    }
    if (cabangId)  params.cabang_id  = cabangId;
    if (ruanganId) params.ruangan_id = ruanganId;
    return params;
  }, [tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId]);

  const handleFilter = useCallback(() => {
    if (!periodeValid) return;
    onFilter(buildParams());
  }, [periodeValid, onFilter, buildParams]);

  const handleReset = useCallback(() => {
    setTipe("bulanan");
    setTanggal("");
    setBulan(REPORT_CURRENT_MONTH);
    setTahun(String(REPORT_CURRENT_YEAR));
    setStartDate("");
    setEndDate("");
    setCabangId("");
    setRuanganId("");
    onFilter(null);
  }, [onFilter]);

  // OPTIMASI: handler tipe dibuat terpisah dengan useCallback agar tombol periode
  // yang tidak dipilih tidak re-render (bila TipeButton di-memo)
  const handleTipeChange = useCallback((val) => {
    setTipe(val);
    setTanggal("");
    setStartDate("");
    setEndDate("");
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 animate-[fadeDown_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          <MdFilterList className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Filter Laporan</p>
          <p className="text-[11px] text-gray-400">Tentukan periode dan lokasi untuk menampilkan laporan</p>
        </div>
      </div>

      {/* Row 1: Tipe periode */}
      <div className="mb-3">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <MdCalendarToday className="w-3 h-3" /> Periode
        </p>
        <div className="flex gap-2">
          {REPORT_TIPE_OPTIONS.map((opt) => (
            <TipeButton
              key={opt.value}
              opt={opt}
              active={tipe === opt.value}
              disabled={isLoading}
              onSelect={handleTipeChange}
            />
          ))}
        </div>
      </div>

      {/* Row 2: Input periode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {tipe === "harian" && (
          <div className="sm:col-span-3 flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <MdCalendarToday className="w-3 h-3" /> Tanggal
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              disabled={isLoading}
              max={TODAY}
              className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
            />
          </div>
        )}

        {tipe === "bulanan" && (
          <>
            <div className="sm:col-span-2">
              <SelectField
                label={<>Bulan <span className="text-red-500">*</span></>}
                value={bulan}
                onChange={setBulan}
                options={REPORT_BULAN_OPTIONS}
                placeholder="— Pilih Bulan —"
                disabled={isLoading}
              />
            </div>
            <SelectField
              label={<>Tahun <span className="text-red-500">*</span></>}
              value={tahun}
              onChange={setTahun}
              options={tahunOptions}
              placeholder="— Pilih Tahun —"
              disabled={isLoading}
            />
          </>
        )}

        {tipe === "tahunan" && (
          <div className="sm:col-span-3">
            <SelectField
              label={<>Tahun <span className="text-red-500">*</span></>}
              value={tahun}
              onChange={setTahun}
              options={tahunOptions}
              placeholder="— Pilih Tahun —"
              disabled={isLoading}
            />
          </div>
        )}

        {tipe === "custom" && (
          <>
            <div className="sm:col-span-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <MdCalendarToday className="w-3 h-3" /> Tanggal Awal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <MdCalendarToday className="w-3 h-3" /> Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
              />
            </div>
          </>
        )}
      </div>

      {/* Row 3: Lokasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <SelectField
          label="Cabang (opsional)"
          icon={MdStore}
          value={cabangId}
          onChange={setCabangId}
          options={cabangOptions}
          placeholder="— Semua Cabang —"
          disabled={loadingDD || isLoading}
        />
        <SelectField
          label="Ruangan (opsional)"
          icon={MdMeetingRoom}
          value={ruanganId}
          onChange={setRuanganId}
          options={ruanganOptions}
          placeholder="— Semua Ruangan —"
          disabled={loadingDD || isLoading}
        />
      </div>

      {/* Validation hint */}
      {!periodeValid && (
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
          <MdCalendarToday className="w-3.5 h-3.5 shrink-0" />
          {tipe === "harian"  && "Pilih tanggal untuk laporan harian"}
          {tipe === "bulanan" && "Pilih bulan dan tahun untuk laporan bulanan"}
          {tipe === "tahunan" && "Pilih tahun untuk laporan tahunan"}
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFilter}
          disabled={!periodeValid || isLoading || loadingDD}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm"
        >
          <MdSearch className="w-3.5 h-3.5" />
          Tampilkan Laporan
        </button>

        {isDirty && (
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150"
          >
            <MdClose className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}


const TipeButton = memo(function TipeButton({ opt, active, disabled, onSelect }) {
  return (
    <button
      onClick={() => onSelect(opt.value)}
      disabled={disabled}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
        active
          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
      }`}
    >
      {opt.label}
    </button>
  );
});