import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew, MdInfo,
  MdInventory, MdMeetingRoom, MdStore, MdCalendarToday,
  MdDescription, MdNumbers,
} from "react-icons/md";
import { getRuanganList } from "../../../services/ruanganService";
import { getCabangList } from "../../../services/cabangService";
import { getBarangList } from "../../../services/barangService";
import { getCachedList } from "../../../utils/cachedList";

const preventInvalidNumberInput = (event) => {
  // disallow negative, signs, exponential, comma and dot for integer inputs
  if (["-", "+", "e", "E", ",", "."].includes(event.key)) {
    event.preventDefault();
  }
};

/* ── Field Component ── */
const Field = memo(function Field({
  label, icon: Icon, register: reg, name, rules, error,
  type = "text", placeholder, disabled, options = null, min, max,
}) {
  const [focused, setFocused] = useState(false);
  const hasError  = !!error;
  const isSelect  = options !== null;
  const isTextarea = type === "textarea";

  const baseClass = `w-full py-2.5 pl-9 pr-3 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200
    ${hasError ? "border-2 border-red-500" : focused ? "border border-blue-500" : "border border-gray-200"}
    ${disabled ? "opacity-60 cursor-not-allowed" : ""}`;

  const focusStyle = {
    boxShadow: focused && !hasError ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
  };

  return (
    <div className="mb-5">
      <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
            ${focused ? "text-blue-600" : hasError ? "text-red-500" : "text-gray-400"}`}
        />
        {isSelect ? (
          <select
            {...reg(name, rules)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            className={`${baseClass} appearance-none`}
            style={focusStyle}
          >
            <option value="">-- Pilih {label} --</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : isTextarea ? (
          <textarea
            {...reg(name, rules)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            rows={3}
            placeholder={placeholder}
            className={`${baseClass} resize-none`}
            style={focusStyle}
          />
        ) : (
          <input
            type={type}
            {...reg(name, rules)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            className={`${baseClass} ${type === "number" ? "font-mono" : ""}`}
            min={type === "number" ? min : undefined}
            max={type === "number" ? max : undefined}
            onKeyDown={type === "number" ? preventInvalidNumberInput : undefined}
            style={focusStyle}
          />
        )}
      </div>
      {hasError && (
        <div className="flex items-center gap-1.5 mt-2 animate-[errorShake_0.3s_ease]">
          <MdErrorOutline className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-[11px] text-red-500">{error.message}</span>
        </div>
      )}
    </div>
  );
});

/* ── Main Export ── */
export default function BarangKeluarModal({ isOpen, isEdit, data, onClose, onSubmit, isLoading }) {
  const [visible,  setVisible]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues,
  } = useForm({
    defaultValues: {
      barang_id:      "",
      cabang_id:      "",
      ruangan_id:     "",
      jumlah_keluar:  "",
      tanggal_keluar: "",
      keterangan:     "",
    },
  });

  const [ruanganList,    setRuanganList]    = useState([]);
  const [cabangList,     setCabangList]     = useState([]);
  const [barangList,     setBarangList]     = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  /* Load dropdowns + prefill saat edit */
  useEffect(() => {
    if (!isOpen) return;

    const loadAndFill = async () => {
      try {
        setLoadingSelects(true);
        const [ruangan, cabang, barang] = await Promise.all([
          getCachedList("barang-keluar:ruangan", () => getRuanganList(1, 100)),
          getCachedList("barang-keluar:cabang",  () => getCabangList(1, 100)),
          getCachedList("barang-keluar:barang",  () => getBarangList(1, 100)),
        ]);
        setRuanganList(ruangan);
        setCabangList(cabang);
        setBarangList(barang);

        if (isEdit && data) {
          // For edit mode we only prefill tanggal_keluar and keterangan
          setValue("keterangan",     data.keterangan     || "");
          if (data.tanggal_keluar) {
            setValue("tanggal_keluar", data.tanggal_keluar.split("T")[0]);
          }
        }
      } catch (err) {
        console.error("Error loading dropdown:", err);
      } finally {
        setLoadingSelects(false);
      }
    };

    loadAndFill();
  }, [isOpen, isEdit, data, setValue]);

  /* Animasi */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setMounted(true));
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      document.body.style.overflow = "";
      requestAnimationFrame(() => setVisible(false));
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const selectedBarangId = watch("barang_id");
  const selectedBarang = useMemo(() => barangList.find((b) => String(b.id) === String(selectedBarangId)), [barangList, selectedBarangId]);
  const maxStock = selectedBarang?.jumlah ?? 0;

  // cap jumlah_keluar automatically if user types more than stock
  useEffect(() => {
    const sub = watch((value, { name }) => {
      if (name === "jumlah_keluar") {
        const v = parseInt(value.jumlah_keluar || 0, 10) || 0;
        if (maxStock > 0 && v > maxStock) {
          setValue("jumlah_keluar", String(maxStock));
        }
      }
    });
    return () => sub.unsubscribe && sub.unsubscribe();
  }, [watch, setValue, maxStock]);

  // When selected barang changes, ensure jumlah_keluar does not exceed new stock
  useEffect(() => {
    const cur = parseInt(getValues("jumlah_keluar") || 0, 10) || 0;
    if (maxStock > 0 && cur > maxStock) {
      setValue("jumlah_keluar", String(maxStock));
    }
  }, [selectedBarangId, maxStock, getValues, setValue]);

  const handleFormSubmit  = (formData) => {
    if (isEdit) {
      // For update only send tanggal_keluar and keterangan
      return onSubmit({ tanggal_keluar: formData.tanggal_keluar, keterangan: formData.keterangan });
    }
    return onSubmit(formData);
  };
  const handleModalClose  = () => { reset(); onClose(); };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) handleModalClose();
  };

  /* Memoize options */
  const barangOptions  = useMemo(() => barangList.map( (i) => ({ value: String(i.id), label: `${i.kode_barang} - ${i.name} (Jumlah: ${i.jumlah ?? 0})` })), [barangList]);
  const cabangOptions  = useMemo(() => cabangList.map( (i) => ({ value: String(i.id), label: i.name_cabang  })), [cabangList]);
  const ruanganOptions = useMemo(() => ruanganList.map((i) => ({ value: String(i.id), label: i.name_ruangan })), [ruanganList]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed flex items-center justify-center p-4 font-['Sora']"
        style={{
          inset: 0,
          zIndex: 999999,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(24px) brightness(0.7) saturate(0.8)",
          WebkitBackdropFilter: "blur(24px) brightness(0.7) saturate(0.8)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
          style={{
            border: "1px solid #e5e7eb",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(20px)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease",
          }}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center gap-3 px-6 py-5 border-b border-gray-200 bg-white z-10">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <MdInventory className="w-4.5 h-4.5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-gray-900 m-0 tracking-tight">
                {isEdit ? "Edit Barang Keluar" : "Tambah Barang Keluar"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isEdit ? "Perbarui data barang keluar" : "Isi detail transaksi barang keluar"}
              </p>
            </div>
            <button
              onClick={handleModalClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer text-gray-400 flex items-center justify-center transition-all duration-150 hover:bg-gray-100 hover:text-gray-700"
            >
              <MdClose className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="p-6 bg-white max-h-[calc(90vh-80px)] overflow-y-auto"
          >
            {isEdit ? (
              <>
                <Field
                  label="Tanggal Keluar" icon={MdCalendarToday}
                  register={register} name="tanggal_keluar" type="date"
                  rules={{ required: "Tanggal keluar wajib diisi" }}
                  error={errors.tanggal_keluar}
                  disabled={isLoading}
                />

                <Field
                  label="Keterangan" icon={MdDescription}
                  register={register} name="keterangan"
                  type="textarea"
                  placeholder="Keterangan tambahan (opsional)"
                  disabled={isLoading}
                />
              </>
            ) : (
              <>
                <Field
                  label="Barang" icon={MdInventory}
                  register={register} name="barang_id"
                  rules={{ required: "Barang wajib dipilih" }} error={errors.barang_id}
                  disabled={isLoading || loadingSelects} options={barangOptions}
                />

                <Field
                  label="Cabang" icon={MdStore}
                  register={register} name="cabang_id"
                  rules={{ required: "Cabang wajib dipilih" }} error={errors.cabang_id}
                  disabled={isLoading || loadingSelects} options={cabangOptions}
                />

                <Field
                  label="Ruangan" icon={MdMeetingRoom}
                  register={register} name="ruangan_id"
                  rules={{ required: "Ruangan wajib dipilih" }} error={errors.ruangan_id}
                  disabled={isLoading || loadingSelects} options={ruanganOptions}
                />

                <Field
                  label="Jumlah Keluar" icon={MdNumbers}
                  register={register} name="jumlah_keluar" type="number"
                  rules={{
                    required: "Jumlah keluar wajib diisi",
                    min: { value: 1, message: "Minimal 1" },
                    max: { value: maxStock || Infinity, message: `Maksimal ${maxStock}` },
                  }}
                  error={errors.jumlah_keluar} placeholder="0"
                  disabled={isLoading}
                  min={1}
                  max={maxStock}
                />

                <Field
                  label="Tanggal Keluar" icon={MdCalendarToday}
                  register={register} name="tanggal_keluar" type="date"
                  rules={{ required: "Tanggal keluar wajib diisi" }}
                  error={errors.tanggal_keluar}
                  disabled={isLoading}
                />

                <Field
                  label="Keterangan" icon={MdDescription}
                  register={register} name="keterangan"
                  type="textarea"
                  placeholder="Keterangan tambahan (opsional)"
                  disabled={isLoading}
                />
              </>
            )}

            {/* Info hint */}
            <div className="px-3 py-2.5 mb-6 rounded-lg bg-red-50 border border-red-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                Pastikan jumlah keluar tidak melebihi stok yang tersedia. Stok barang akan otomatis berkurang setelah disimpan.
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-gray-500 bg-white border border-gray-200 cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:text-gray-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || loadingSelects}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-red-600 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-red-700 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ boxShadow: isLoading ? "none" : "0 2px 10px rgba(239,68,68,0.3)" }}
              >
                {isLoading ? (
                  <><MdAutorenew className="w-4 h-4 animate-spin" /> Menyimpan…</>
                ) : (
                  <><MdCheck className="w-4 h-4" /> {isEdit ? "Perbarui" : "Simpan"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styles moved to src/index.css */}
    </>
  , document.body);
}