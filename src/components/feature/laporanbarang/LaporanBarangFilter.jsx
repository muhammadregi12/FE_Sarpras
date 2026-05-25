import { useState, useEffect, useCallback, memo } from "react";
import {
  MdStore,
  MdMeetingRoom,
  MdFilterList,
  MdSearch,
  MdClose,
} from "react-icons/md";
import { getCabangList }  from "../../../services/cabangService";
import { getRuanganList } from "../../../services/ruanganService";
import { getCachedList }  from "../../../utils/cachedList";

/* ── Select Field ── */
const SelectField = memo(function SelectField({
  label, icon: Icon, value, onChange, options, placeholder, disabled,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className={`w-full py-2.5 pl-3 pr-8 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 appearance-none cursor-pointer border ${
            focused ? "border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]" : "border-gray-200"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
});

/* ── Main Export ── */
export default function LaporanBarangFilter({ onFilter, isLoading }) {
  const [cabangId,    setCabangId]    = useState("");
  const [ruanganId,   setRuanganId]   = useState("");
  const [cabangList,  setCabangList]  = useState([]);

  /**
   * ruanganList difilter berdasarkan cabang yang dipilih.
   * fullRuanganList menyimpan semua ruangan sekali fetch.
   */
  const [fullRuanganList, setFullRuanganList] = useState([]);
  const [ruanganList,     setRuanganList]     = useState([]);
  const [loadingDD,       setLoadingDD]       = useState(false);

  /* ── Fetch dropdown satu kali saat mount ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingDD(true);
        const [cabang, ruangan] = await Promise.all([
          getCachedList("laporan-barang:cabang",  () => getCabangList(1, 100)),
          getCachedList("laporan-barang:ruangan", () => getRuanganList(1, 100)),
        ]);
        if (cancelled) return;
        setCabangList(cabang);
        setFullRuanganList(ruangan);
        setRuanganList(ruangan); // awalnya tampilkan semua
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingDD(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Filter ruangan setiap cabang berubah ── */
  useEffect(() => {
    if (!cabangId) {
      setRuanganList(fullRuanganList);
    } else {
      // Asumsikan setiap ruangan punya field cabang_id
      const filtered = fullRuanganList.filter(
        (r) => String(r.cabang_id) === cabangId
      );
      setRuanganList(filtered);
    }
    // Reset pilihan ruangan saat cabang berganti
    setRuanganId("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cabangId, fullRuanganList]);

  const cabangOptions  = cabangList.map((c)  => ({ value: String(c.id), label: c.name_cabang  }));
  const ruanganOptions = ruanganList.map((r) => ({ value: String(r.id), label: r.name_ruangan }));

  const isValid = !!(cabangId || ruanganId);

  const handleFilter = useCallback(() => {
    if (!isValid) return;
    onFilter({
      cabang_id:  cabangId  || undefined,
      ruangan_id: ruanganId || undefined,
    });
  }, [isValid, cabangId, ruanganId, onFilter]);

  const handleReset = useCallback(() => {
    setCabangId("");
    setRuanganId("");
    onFilter(null);
  }, [onFilter]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && isValid && !isLoading && !loadingDD) handleFilter();
  }, [e => e, isValid, isLoading, loadingDD, handleFilter]); // eslint-disable-line

  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 animate-[fadeDown_0.35s_cubic-bezier(0.16,1,0.3,1)_both]"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
          <MdFilterList className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Filter Laporan</p>
          <p className="text-[11px] text-gray-400">Pilih minimal satu filter untuk menampilkan data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <SelectField
          label="Cabang"
          icon={MdStore}
          value={cabangId}
          onChange={setCabangId}
          options={cabangOptions}
          placeholder="— Semua Cabang —"
          disabled={loadingDD || isLoading}
        />
        <SelectField
          label="Ruangan"
          icon={MdMeetingRoom}
          value={ruanganId}
          onChange={setRuanganId}
          options={ruanganOptions}
          placeholder={cabangId ? "— Pilih Ruangan —" : "— Semua Ruangan —"}
          disabled={loadingDD || isLoading}
        />
      </div>

      {!isValid && (
        <p className="text-[11px] text-amber-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
          <MdFilterList className="w-3.5 h-3.5 shrink-0" />
          Pilih minimal Cabang atau Ruangan untuk menampilkan laporan
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleFilter}
          disabled={!isValid || isLoading || loadingDD}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm"
        >
          <MdSearch className="w-3.5 h-3.5" />
          Tampilkan Laporan
        </button>

        {(cabangId || ruanganId) && (
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