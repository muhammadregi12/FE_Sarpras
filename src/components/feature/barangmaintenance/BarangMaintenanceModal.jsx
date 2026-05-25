import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew, MdInfo,
  MdInventory, MdCalendarToday, MdDescription, MdNumbers,
  MdAttachMoney, MdBuild, MdCheckCircle,
} from "react-icons/md";
import { getBarangList } from "../../../services/barangService"; // sesuaikan path

/* ── Dropdown cache ── */
const dropdownCache    = { barang: null };
const dropdownPromises = { barang: null };

const getCachedDropdownList = async (key, loader) => {
  if (dropdownCache[key]) return dropdownCache[key];
  if (!dropdownPromises[key]) {
    dropdownPromises[key] = loader()
      .then((result) => {
        dropdownCache[key] = Array.isArray(result) ? result : (result?.data ?? []);
        return dropdownCache[key];
      })
      .finally(() => { dropdownPromises[key] = null; });
  }
  return dropdownPromises[key];
};

const preventNegativeNumberInput = (event) => {
  if (["-", "+", "e", "E"].includes(event.key)) {
    event.preventDefault();
  }
};

const preventNonDigitInput = (event) => {
  const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
  if (allowedKeys.includes(event.key)) return;
  if (!/^[0-9]$/.test(event.key)) {
    event.preventDefault();
  }
};

const formatThousandSeparator = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/* ── Field Component ── */
const Field = memo(function Field({
  label, icon: Icon, register: reg, name, rules, error,
  type = "text", placeholder, disabled, options = null, minDate = null, maxNumber = null,
  formatThousands = false,
}) {
  const [focused, setFocused] = useState(false);
  const hasError   = !!error;
  const isSelect   = options !== null;
  const isTextarea = type === "textarea";
  const fieldProps  = reg(name, rules);

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
            {...fieldProps}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              fieldProps.onBlur(event);
              setFocused(false);
            }}
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
            {...fieldProps}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              fieldProps.onBlur(event);
              setFocused(false);
            }}
            disabled={disabled}
            rows={3}
            placeholder={placeholder}
            className={`${baseClass} resize-none`}
            style={focusStyle}
          />
        ) : (
          <input
            type={formatThousands ? "text" : type}
            {...fieldProps}
            onFocus={() => setFocused(true)}
            onChange={(event) => {
              if (formatThousands) {
                event.target.value = formatThousandSeparator(event.target.value);
              }
              fieldProps.onChange(event);
            }}
            onBlur={(event) => {
              fieldProps.onBlur(event);
              setFocused(false);
            }}
            onKeyDown={
              formatThousands
                ? preventNonDigitInput
                : type === "number"
                  ? preventNegativeNumberInput
                  : undefined
            }
            disabled={disabled}
            placeholder={placeholder}
            className={`${baseClass} ${type === "number" ? "font-mono" : ""}`}
            min={type === "number" ? 0 : minDate}
            max={type === "number" && maxNumber !== null ? maxNumber : undefined}
            step={type === "number" ? "1" : undefined}
            inputMode={type === "number" || formatThousands ? "numeric" : undefined}
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

/* ══════════════════════════════════════════
   MODAL FORM (Create / Edit)
══════════════════════════════════════════ */
export function BarangMaintenanceModal({ isOpen, isEdit, data, onClose, onSubmit, isLoading }) {
  const [visible,        setVisible]        = useState(false);
  const [mounted,        setMounted]        = useState(false);
  const [barangList,     setBarangList]     = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue, watch,
  } = useForm({
    defaultValues: {
      barang_id:           "",
      tanggal_maintenance: "",
      jumlah_maintenance:  "",
      biaya:               "",
      keterangan:          "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setLoadingSelects(true);
        const barang = await getCachedDropdownList("barang", () => getBarangList(1, 100));
        setBarangList(barang);

        if (isEdit && data) {
          setValue("barang_id",           String(data.barang?.id || data.barang_id || ""));
          setValue("jumlah_maintenance",  data.jumlah_maintenance  || "");
          setValue("biaya",               data.biaya               || "");
          setValue("keterangan",          data.keterangan          || "");
          if (data.tanggal_maintenance) {
            setValue("tanggal_maintenance", data.tanggal_maintenance.split("T")[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSelects(false);
      }
    };
    load();
  }, [isOpen, isEdit, data, setValue]);

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

  const handleModalClose    = () => { reset(); onClose(); };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) handleModalClose();
  };

  const barangOptions = useMemo(
    () => barangList.map((i) => ({
      value: String(i.id),
      label: `${i.kode_barang} - ${i.name} (Jumlah: ${i.jumlah ?? 0})`,
    })),
    [barangList]
  );

  const selectedBarangId = watch("barang_id");
  const jumlahMaintenanceValue = watch("jumlah_maintenance");

  const selectedBarang = useMemo(
    () => barangList.find((i) => String(i.id) === String(selectedBarangId)),
    [barangList, selectedBarangId]
  );

  const maxJumlahMaintenance = useMemo(() => {
    if (!selectedBarang) return null;
    const stok = Number(selectedBarang.jumlah ?? 0);
    return Number.isFinite(stok) && stok >= 0 ? stok : 0;
  }, [selectedBarang]);

  useEffect(() => {
    if (maxJumlahMaintenance === null) return;
    const currentValue = parseInt(jumlahMaintenanceValue || 0, 10);
    if (currentValue > maxJumlahMaintenance) {
      setValue("jumlah_maintenance", String(maxJumlahMaintenance), { shouldValidate: true });
    }
  }, [jumlahMaintenanceValue, maxJumlahMaintenance, setValue]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed flex items-center justify-center p-4 font-['Sora']"
        style={{
          inset: 0, zIndex: 999999,
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
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
              <MdBuild className="w-4.5 h-4.5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-gray-900 m-0 tracking-tight">
                {isEdit ? "Edit Maintenance" : "Tambah Maintenance"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isEdit ? "Perbarui data maintenance barang" : "Isi detail maintenance barang"}
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
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 bg-white max-h-[calc(90vh-80px)] overflow-y-auto"
          >
            <Field
              label="Barang" icon={MdInventory}
              register={register} name="barang_id"
              rules={{ required: "Barang wajib dipilih" }} error={errors.barang_id}
              disabled={isLoading || loadingSelects} options={barangOptions}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Jumlah Maintenance" icon={MdNumbers}
                register={register} name="jumlah_maintenance" type="number"
                rules={{
                  required: "Jumlah wajib diisi",
                  min: { value: 1, message: "Minimal 1" },
                  validate: (value) => {
                    const valueNum = parseInt(value || 0, 10);
                    if (maxJumlahMaintenance === null) return true;
                    if (valueNum > maxJumlahMaintenance) {
                      return `Maksimal ${maxJumlahMaintenance}`;
                    }
                    return true;
                  },
                }}
                error={errors.jumlah_maintenance} placeholder="0"
                disabled={isLoading}
                maxNumber={maxJumlahMaintenance}
              />
              <Field
                label="Biaya" icon={MdAttachMoney}
                register={register} name="biaya" type="text" formatThousands
                rules={{
                  min: { value: 0, message: "Tidak boleh negatif" },
                  setValueAs: (value) => {
                    const numericValue = String(value ?? "").replace(/\D/g, "");
                    return numericValue ? Number(numericValue) : null;
                  },
                }}
                error={errors.biaya} placeholder="0 (opsional)"
                disabled={isLoading}
              />
            </div>

            <Field
              label="Tanggal Maintenance" icon={MdCalendarToday}
              register={register} name="tanggal_maintenance" type="date"
              rules={{ required: "Tanggal maintenance wajib diisi" }}
              error={errors.tanggal_maintenance}
              disabled={isLoading}
            />

            <Field
              label="Keterangan" icon={MdDescription}
              register={register} name="keterangan"
              type="textarea"
              placeholder="Keterangan maintenance (opsional)"
              disabled={isLoading}
            />

            <div className="px-3 py-2.5 mb-6 rounded-lg bg-orange-50 border border-orange-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <div>
                Jumlah maintenance tidak boleh melebihi stok barang. Stok akan berkurang otomatis saat data disimpan.
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-gray-500 bg-white border border-gray-200 cursor-pointer transition-all duration-150 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || loadingSelects}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-orange-500 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-orange-600 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ boxShadow: isLoading ? "none" : "0 2px 10px rgba(249,115,22,0.3)" }}
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

/* ══════════════════════════════════════════
   MODAL SELESAI (Update Status)
══════════════════════════════════════════ */
export function BarangMaintenanceSelesaiModal({ isOpen, data, onClose, onSubmit, isLoading }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register, handleSubmit, formState: { errors }, reset, watch, setValue,
  } = useForm({
    defaultValues: {
      tanggal_selesai:    "",
      jumlah_selesai:     "",
      tingkat_kerusakan:  "",
    },
  });

  const jumlahSelesaiValue = watch("jumlah_selesai");
  const jumlahMaintenance = data?.jumlah_maintenance ?? 0;
  const jumlahSelesaiNum = parseInt(jumlahSelesaiValue || 0);
  const jumlahRusakHasil = Math.max(0, jumlahMaintenance - jumlahSelesaiNum);

  // Auto-cap jumlah_selesai jika melebihi jumlah_maintenance
  useEffect(() => {
    if (jumlahSelesaiNum > jumlahMaintenance) {
      setValue("jumlah_selesai", String(jumlahMaintenance));
    }
  }, [jumlahSelesaiNum, jumlahMaintenance, setValue]);

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

  const handleModalClose    = () => { reset(); onClose(); };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) handleModalClose();
  };

  const tingkatKerusakanOptions = [
    { value: "ringan", label: "Ringan" },
    { value: "sedang", label: "Sedang" },
    { value: "berat", label: "Berat" },
  ];

  // Validasi tanggal selesai >= tanggal maintenance
  const validateTanggalSelesai = useCallback((value) => {
    if (!value) return true;
    const tglMaintenance = new Date(data?.tanggal_maintenance);
    const tglSelesai = new Date(value);
    if (tglSelesai < tglMaintenance) {
      return "Tanggal selesai tidak boleh lebih awal dari tanggal maintenance";
    }
    return true;
  }, [data?.tanggal_maintenance]);

  // Format tanggal maintenance ke YYYY-MM-DD untuk min attribute
  const minDateValue = useMemo(() => {
    if (!data?.tanggal_maintenance) return null;
    const tgl = new Date(data.tanggal_maintenance);
    const year = tgl.getFullYear();
    const month = String(tgl.getMonth() + 1).padStart(2, "0");
    const day = String(tgl.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [data?.tanggal_maintenance]);

  // Validasi tingkat kerusakan - wajib jika ada rusak
  const validateTingkatKerusakan = useCallback((value) => {
    if (jumlahRusakHasil > 0 && !value) {
      return "Tingkat kerusakan wajib diisi jika ada barang yang rusak";
    }
    return true;
  }, [jumlahRusakHasil]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed flex items-center justify-center p-4 font-['Sora']"
        style={{
          inset: 0, zIndex: 999999,
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
          className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl"
          style={{
            border: "1px solid #e5e7eb",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(20px)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease",
          }}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center gap-3 px-6 py-5 border-b border-gray-200 bg-white z-10">
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
              <MdCheckCircle className="w-4.5 h-4.5 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-gray-900 m-0 tracking-tight">
                Selesaikan Maintenance
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {data?.barang?.name || "Barang"} — {data?.barang?.kode_barang || ""}
              </p>
            </div>
            <button
              onClick={handleModalClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer text-gray-400 flex items-center justify-center transition-all duration-150 hover:bg-gray-100"
            >
              <MdClose className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit((data) => {
              // Inject jumlah_rusak_hasil ke formData sebelum submit
              const submittedData = {
                ...data,
                jumlah_rusak_hasil: jumlahRusakHasil,
              };
              onSubmit(submittedData);
            })}
            className="p-6 bg-white max-h-[calc(90vh-80px)] overflow-y-auto"
          >
            {/* Info jumlah maintenance */}
            <div className="mb-5 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-gray-600">
              <span className="font-semibold text-blue-700">Jumlah maintenance:</span>{" "}
              <span className="font-mono font-bold">{jumlahMaintenance}</span> unit
            </div>

            <Field
              label="Tanggal Selesai" icon={MdCalendarToday}
              register={register} name="tanggal_selesai" type="date"
              rules={{
                required: "Tanggal selesai wajib diisi",
                validate: validateTanggalSelesai,
              }}
              error={errors.tanggal_selesai}
              disabled={isLoading}
              minDate={minDateValue}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Jumlah Selesai (OK)" icon={MdNumbers}
                register={register} name="jumlah_selesai" type="number"
                rules={{
                  required: "Wajib diisi",
                  min: { value: 0, message: "Minimal 0" },
                  max: { value: jumlahMaintenance, message: `Maksimal ${jumlahMaintenance}` },
                }}
                error={errors.jumlah_selesai} placeholder="0"
                disabled={isLoading}
              />
              {/* Display-only field untuk jumlah rusak */}
              <div className="mb-5">
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  Jumlah Rusak (Otomatis)
                </label>
                <div className="w-full py-2.5 pl-9 pr-3 text-sm bg-gray-100 rounded-lg border border-gray-300 flex items-center relative">
                  <MdNumbers className="absolute left-3 w-4 h-4 text-gray-400" />
                  <span className="font-mono font-bold text-gray-700">{jumlahRusakHasil}</span>
                </div>
              </div>
            </div>

            <Field
              label="Tingkat Kerusakan" icon={MdBuild}
              register={register} name="tingkat_kerusakan"
              rules={{ validate: validateTingkatKerusakan }}
              error={errors.tingkat_kerusakan}
              disabled={isLoading || jumlahRusakHasil === 0}
              options={tingkatKerusakanOptions}
            />

            {jumlahRusakHasil > 0 && (
              <div className="px-3 py-2.5 mb-6 rounded-lg bg-red-50 border border-red-200 text-xs text-gray-600 leading-relaxed flex items-start gap-3">
                <MdErrorOutline className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-red-700">{jumlahRusakHasil} unit akan menjadi barang rusak</span> dan akan dicatat di sistem barang rusak dengan tingkat kerusakan yang Anda pilih.
                </div>
              </div>
            )}

            <div className="px-3 py-2.5 mb-6 rounded-lg bg-green-50 border border-green-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                Barang yang selesai (OK) akan dikembalikan ke stok. Barang rusak akan dicatat sebagai barang rusak.
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-gray-500 bg-white border border-gray-200 cursor-pointer transition-all duration-150 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-green-600 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-green-700 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
                style={{ boxShadow: isLoading ? "none" : "0 2px 10px rgba(22,163,74,0.3)" }}
              >
                {isLoading ? (
                  <><MdAutorenew className="w-4 h-4 animate-spin" /> Menyimpan…</>
                ) : (
                  <><MdCheckCircle className="w-4 h-4" /> Selesaikan</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  , document.body);
}

/* default export untuk kemudahan import */
export default BarangMaintenanceModal;

