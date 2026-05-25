import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { getCabangList } from "../../../services/cabangService";
import { getRuanganList } from "../../../services/ruanganService";
import {
  MdFilterList,
  MdCalendarToday,
  MdStore,
  MdMeetingRoom,
  MdSearch,
  MdClose,
} from "react-icons/md";
import {
  REPORT_BULAN_OPTIONS,
  REPORT_CURRENT_MONTH,
  REPORT_CURRENT_YEAR,
  REPORT_TAHUN_OPTIONS,
  REPORT_TIPE_OPTIONS,
} from "../../../utils/reportHelpers";
import { getCachedList } from "../../../utils/cachedList";

// ─── Nilai default (referensi stabil agar tidak trigger useEffect/useMemo) ──
const DEFAULT_TIPE  = "bulanan";
const DEFAULT_BULAN = REPORT_CURRENT_MONTH;
const DEFAULT_TAHUN = String(REPORT_CURRENT_YEAR);

// ─── SelectField ─────────────────────────────────────────────────────────────
const SelectField = memo(function SelectField({
  label, icon: Icon, value, onChange, options, placeholder, disabled,
}) {
  const [focused, setFocused] = useState(false);

  // Handler stable — tidak perlu useCallback karena onChange dari parent sudah stable
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
            focused ? "border border-orange-500" : "border border-gray-200"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          style={focused ? FOCUSED_SHADOW : undefined}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
});

// Objek style di luar komponen → referensi stabil, tidak re-create tiap render
const FOCUSED_SHADOW = { boxShadow: "0 0 0 3px rgba(251,146,60,0.1)" };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BarangKeluarFilter({ onFilter, isLoading }) {
  const [tipe,      setTipe]      = useState(DEFAULT_TIPE);
  const [tanggal,   setTanggal]   = useState("");
  const [bulan,     setBulan]     = useState(DEFAULT_BULAN);
  const [tahun,     setTahun]     = useState(DEFAULT_TAHUN);
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [cabangId,  setCabangId]  = useState("");
  const [ruanganId, setRuanganId] = useState("");

  const [cabangList,  setCabangList]  = useState([]);
  const [ruanganList, setRuanganList] = useState([]);
  const [loadingDD,   setLoadingDD]   = useState(false);

  // ── Load dropdown sekali saja ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingDD(true);
        const [cabang, ruangan] = await Promise.all([
          getCachedList("laporan-barang-keluar:cabang",  () => getCabangList(1, 100)),
          getCachedList("laporan-barang-keluar:ruangan", () => getRuanganList(1, 100)),
        ]);
        if (!cancelled) {
          setCabangList(cabang);
          setRuanganList(ruangan);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingDD(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // hanya run sekali

  // ── Options (memo → tidak re-create array tiap render) ───────────────────
  const cabangOptions = useMemo(
    () => cabangList.map((c) => ({ value: String(c.id), label: c.name_cabang })),
    [cabangList],
  );
  const ruanganOptions = useMemo(
    () => ruanganList.map((r) => ({ value: String(r.id), label: r.name_ruangan })),
    [ruanganList],
  );
  // tahunOptions tidak bergantung state → bisa di luar komponen
  // (sudah di-define di bawah sebagai modul-level constant)

  // ── Validasi periode (memo) ───────────────────────────────────────────────
  const periodeValid = useMemo(() => {
    if (tipe === "harian")  return !!tanggal;
    if (tipe === "bulanan") return !!bulan && !!tahun;
    if (tipe === "tahunan") return !!tahun;
    if (tipe === "custom")  return !!startDate || !!endDate;
    return false;
  }, [tipe, tanggal, bulan, tahun, startDate, endDate]);

  // ── Build params (memo) ───────────────────────────────────────────────────
  const builtParams = useMemo(() => {
    if (!periodeValid) return null;
    const params = { tipe };
    if (tipe === "harian")  params.tanggal = tanggal;
    if (tipe === "bulanan") { params.bulan = bulan; params.tahun = tahun; }
    if (tipe === "tahunan") params.tahun = tahun;
    if (tipe === "custom")  {
      if (startDate) params.start_date = startDate;
      if (endDate)   params.end_date   = endDate;
    }
    if (cabangId)  params.cabang_id  = cabangId;
    if (ruanganId) params.ruangan_id = ruanganId;
    return params;
  }, [periodeValid, tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId]);

  // ── isDirty (memo) ────────────────────────────────────────────────────────
  const isDirty = useMemo(
    () =>
      tipe !== DEFAULT_TIPE ||
      !!tanggal ||
      bulan !== DEFAULT_BULAN ||
      tahun !== DEFAULT_TAHUN ||
      !!startDate ||
      !!endDate ||
      !!cabangId ||
      !!ruanganId,
    [tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId],
  );

  // ── Handlers (stable) ─────────────────────────────────────────────────────
  const handleTipeChange = useCallback((val) => {
    setTipe(val);
    setTanggal("");
    setStartDate("");
    setEndDate("");
  }, []);

  const handleFilter = useCallback(() => {
    if (!builtParams) return;
    onFilter(builtParams);
  }, [builtParams, onFilter]);

  const handleReset = useCallback(() => {
    setTipe(DEFAULT_TIPE);
    setTanggal("");
    setBulan(DEFAULT_BULAN);
    setTahun(DEFAULT_TAHUN);
    setStartDate("");
    setEndDate("");
    setCabangId("");
    setRuanganId("");
    onFilter(null);
  }, [onFilter]);

  const ddDisabled = loadingDD || isLoading;
  const today = TODAY_STR; // referensi stabil (di bawah)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 animate-[fadeDown_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
          <MdFilterList className="w-4 h-4 text-orange-600" />
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
              onChange={handleTipeChange}
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
              max={today}
              className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors disabled:opacity-60"
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
              options={TAHUN_OPTIONS}
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
              options={TAHUN_OPTIONS}
              placeholder="— Pilih Tahun —"
              disabled={isLoading}
            />
          </div>
        )}

        {tipe === "custom" && (
          <>
            <div className="sm:col-span-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <MdCalendarToday className="w-3 h-3" /> Dari Tanggal (opsional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                max={today}
                className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors disabled:opacity-60"
              />
            </div>
            <div className="sm:col-span-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <MdCalendarToday className="w-3 h-3" /> Sampai Tanggal (opsional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                max={today}
                className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500 transition-colors disabled:opacity-60"
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
          disabled={ddDisabled}
        />
        <SelectField
          label="Ruangan (opsional)"
          icon={MdMeetingRoom}
          value={ruanganId}
          onChange={setRuanganId}
          options={ruanganOptions}
          placeholder="— Semua Ruangan —"
          disabled={ddDisabled}
        />
      </div>

      {/* Validation hint */}
      {!periodeValid && <ValidationHint tipe={tipe} />}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFilter}
          disabled={!periodeValid || isLoading || loadingDD}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm"
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

// ─── Sub-components kecil (di luar agar tidak re-define tiap render) ─────────

const TipeButton = memo(function TipeButton({ opt, active, disabled, onChange }) {
  return (
    <button
      onClick={() => onChange(opt.value)}
      disabled={disabled}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
        active
          ? "bg-orange-600 border-orange-600 text-white shadow-sm"
          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
      }`}
    >
      {opt.label}
    </button>
  );
});

const ValidationHint = memo(function ValidationHint({ tipe }) {
  const msg =
    tipe === "harian"  ? "Pilih tanggal untuk laporan harian" :
    tipe === "bulanan" ? "Pilih bulan dan tahun untuk laporan bulanan" :
    tipe === "tahunan" ? "Pilih tahun untuk laporan tahunan" :
                        "Isi minimal salah satu tanggal awal atau akhir untuk laporan custom";
  return (
    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
      <MdCalendarToday className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  );
});

// ─── Modul-level constants (dibuat sekali, tidak pernah re-create) ───────────
const TODAY_STR    = new Date().toISOString().split("T")[0];
const TAHUN_OPTIONS = REPORT_TAHUN_OPTIONS.map((y) => ({ value: y, label: y }));