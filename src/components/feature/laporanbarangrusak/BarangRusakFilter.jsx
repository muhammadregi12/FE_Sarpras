// BarangRusakFilter.jsx
import { useReducer, useCallback, useMemo, useEffect, memo } from "react";
import {
    MdFilterList, MdStore, MdMeetingRoom,
    MdCalendarToday, MdSearch, MdClose,
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

// ── Selector stabil di luar komponen ─────────────────────────────────────────
const DEFAULT = {
    tipe:      "bulanan",
    tanggal:   "",
    bulan:     REPORT_CURRENT_MONTH,
    tahun:     String(REPORT_CURRENT_YEAR),
    startDate: "",
    endDate:   "",
    cabangId:  "",
    ruanganId: "",
};

function filterReducer(state, action) {
    switch (action.type) {
        case "SET":    return { ...state, [action.key]: action.value };
        case "RESET":  return { ...DEFAULT };
        case "SET_TIPE":
            return { ...state, tipe: action.value, tanggal: "", startDate: "", endDate: "" };
        default:       return state;
    }
}

// ── SelectField (unchanged, already memo'd) ───────────────────────────────────
const SelectField = memo(function SelectField({ label, icon: Icon, value, onChange, options, placeholder, disabled }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full py-2.5 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 transition-all duration-200 appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <option value="">{placeholder}</option>
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
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

export default function LaporanBarangRusakFilter({ onFilter, isLoading }) {
    const [form, dispatch] = useReducer(filterReducer, DEFAULT);
    const { tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId } = form;

    const [dropdowns, setDropdowns] = useReducer(
        (s, a) => ({ ...s, ...a }),
        { cabangList: [], ruanganList: [], loading: false }
    );

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setDropdowns({ loading: true });
            try {
                const [cabang, ruangan] = await Promise.all([
                    getCachedList("laporan-barang-rusak:cabang", () => getCabangList(1, 100)),
                    getCachedList("laporan-barang-rusak:ruangan", () => getRuanganList(1, 100)),
                ]);
                if (!cancelled) setDropdowns({ cabangList: cabang, ruanganList: ruangan, loading: false });
            } catch {
                if (!cancelled) setDropdowns({ loading: false });
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // Memoised option arrays — hanya berubah jika data dropdown berubah
    const cabangOptions  = useMemo(() => dropdowns.cabangList.map( (i) => ({ value: String(i.id), label: i.name_cabang  })), [dropdowns.cabangList]);
    const ruanganOptions = useMemo(() => dropdowns.ruanganList.map((i) => ({ value: String(i.id), label: i.name_ruangan })), [dropdowns.ruanganList]);
    const tahunOptions   = useMemo(() => REPORT_TAHUN_OPTIONS.map((y) => ({ value: y, label: y })), []);

    const periodeValid = useMemo(() => (
        (tipe === "harian"  && !!tanggal) ||
        (tipe === "bulanan" && !!bulan && !!tahun) ||
        (tipe === "tahunan" && !!tahun) ||
        (tipe === "custom"  && (!!startDate || !!endDate))
    ), [tipe, tanggal, bulan, tahun, startDate, endDate]);

    const buildParams = useCallback(() => {
        const p = { tipe };
        if (tipe === "harian")  p.tanggal = tanggal;
        if (tipe === "bulanan") { p.bulan = bulan; p.tahun = tahun; }
        if (tipe === "tahunan") p.tahun = tahun;
        if (tipe === "custom")  { if (startDate) p.start_date = startDate; if (endDate) p.end_date = endDate; }
        if (cabangId)  p.cabang_id  = cabangId;
        if (ruanganId) p.ruangan_id = ruanganId;
        return p;
    }, [tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId]);

    const isDirty = useMemo(() =>
        tipe !== "bulanan" || tanggal || bulan !== REPORT_CURRENT_MONTH ||
        tahun !== String(REPORT_CURRENT_YEAR) || startDate || endDate || cabangId || ruanganId,
    [tipe, tanggal, bulan, tahun, startDate, endDate, cabangId, ruanganId]);

    const set = useCallback((key) => (value) => dispatch({ type: "SET", key, value }), []);

    const handleTipe = useCallback((value) => dispatch({ type: "SET_TIPE", value }), []);
    const handleFilter = useCallback(() => { if (periodeValid) onFilter(buildParams()); }, [periodeValid, onFilter, buildParams]);
    const handleReset  = useCallback(() => { dispatch({ type: "RESET" }); onFilter(null); }, [onFilter]);

    const disabled = isLoading || dropdowns.loading;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 animate-[fadeDown_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <MdFilterList className="w-4 h-4 text-red-600" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-800">Filter Laporan</p>
                    <p className="text-[11px] text-gray-400">Tentukan periode dan lokasi untuk menampilkan laporan</p>
                </div>
            </div>

            {/* Tipe Periode */}
            <div className="mb-3">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MdCalendarToday className="w-3 h-3" /> Periode
                </p>
                <div className="flex gap-2">
                    {REPORT_TIPE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleTipe(option.value)}
                            disabled={isLoading}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                                tipe === option.value
                                    ? "bg-red-600 border-red-600 text-white shadow-sm"
                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Periode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {tipe === "harian" && (
                    <div className="sm:col-span-3 flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <MdCalendarToday className="w-3 h-3" /> Tanggal <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => dispatch({ type: "SET", key: "tanggal", value: e.target.value })}
                            disabled={isLoading}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 transition-colors disabled:opacity-60"
                        />
                    </div>
                )}

                {tipe === "bulanan" && (
                    <>
                        <div className="sm:col-span-2">
                            <SelectField label={<>Bulan <span className="text-red-500">*</span></>} value={bulan}  onChange={set("bulan")}  options={REPORT_BULAN_OPTIONS} placeholder="— Pilih Bulan —"  disabled={disabled} />
                        </div>
                        <SelectField label={<>Tahun <span className="text-red-500">*</span></>} value={tahun}  onChange={set("tahun")}  options={tahunOptions}         placeholder="— Pilih Tahun —"  disabled={disabled} />
                    </>
                )}

                {tipe === "tahunan" && (
                    <div className="sm:col-span-3">
                        <SelectField label={<>Tahun <span className="text-red-500">*</span></>} value={tahun} onChange={set("tahun")} options={tahunOptions} placeholder="— Pilih Tahun —" disabled={disabled} />
                    </div>
                )}

                {tipe === "custom" && (
                    <>
                        <div className="sm:col-span-1 flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <MdCalendarToday className="w-3 h-3" /> Tanggal Awal
                            </label>
                            <input type="date" value={startDate} onChange={(e) => dispatch({ type: "SET", key: "startDate", value: e.target.value })} disabled={isLoading} className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 transition-colors disabled:opacity-60" />
                        </div>
                        <div className="sm:col-span-2 flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                <MdCalendarToday className="w-3 h-3" /> Tanggal Akhir
                            </label>
                            <input type="date" value={endDate} onChange={(e) => dispatch({ type: "SET", key: "endDate", value: e.target.value })} disabled={isLoading} className="w-full py-2.5 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 transition-colors disabled:opacity-60" />
                        </div>
                    </>
                )}
            </div>

            {/* Cabang & Ruangan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <SelectField label="Cabang (opsional)"  icon={MdStore}       value={cabangId}  onChange={set("cabangId")}  options={cabangOptions}  placeholder="— Semua Cabang —"   disabled={disabled} />
                <SelectField label="Ruangan (opsional)" icon={MdMeetingRoom} value={ruanganId} onChange={set("ruanganId")} options={ruanganOptions} placeholder="— Semua Ruangan —" disabled={disabled} />
            </div>

            {/* Validasi hint */}
            {!periodeValid && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                    <MdCalendarToday className="w-3.5 h-3.5 shrink-0" />
                    {tipe === "harian"  && "Pilih tanggal untuk laporan harian"}
                    {tipe === "bulanan" && "Pilih bulan dan tahun untuk laporan bulanan"}
                    {tipe === "tahunan" && "Pilih tahun untuk laporan tahunan"}
                    {tipe === "custom"  && "Pilih tanggal awal dan/atau tanggal akhir untuk laporan custom"}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleFilter}
                    disabled={!periodeValid || disabled}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-105 active:scale-95 shadow-sm"
                >
                    <MdSearch className="w-3.5 h-3.5" /> Tampilkan Laporan
                </button>

                {isDirty && (
                    <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150"
                    >
                        <MdClose className="w-3.5 h-3.5" /> Reset
                    </button>
                )}
            </div>
        </div>
    );
}