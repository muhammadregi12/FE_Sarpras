import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew, MdInfo,
  MdInventory, MdMeetingRoom, MdStore, MdCalendarToday,
  MdDescription, MdLocalShipping, MdAttachMoney, MdNumbers,
  MdReceiptLong,
} from "react-icons/md";
  
import { getRuanganList } from "../../../services/ruanganService";
import { getCabangList } from "../../../services/cabangService";
import { getBarangList } from "../../../services/barangService";
import { getSupplierList } from "../../../services/supplierService"; // sesuaikan path
import { getCachedList } from "../../../utils/cachedList";

const preventNonDigitInput = (event) => {
  const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
  if (allowed.includes(event.key)) return;
  if (!/^[0-9]$/.test(event.key)) event.preventDefault();
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
  type = "text", placeholder, disabled, options = null, formatThousands = false,
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const isSelect = options !== null;
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
          (() => {
            const isNumber = type === "number";
            const isIntegerField = isNumber && /jumlah|qty|quantity/i.test(name);
            const regProps = reg(name, isNumber && !formatThousands ? { ...rules, valueAsNumber: true } : rules);

            // If formatting thousands, render text input with formatted display
            if (formatThousands) {
              return (
                <input
                  type="text"
                  {...regProps}
                  onFocus={(e) => { setFocused(true); regProps.onFocus && regProps.onFocus(e); }}
                  onBlur={(e) => { regProps.onBlur && regProps.onBlur(e); setFocused(false); }}
                  onChange={(e) => {
                    e.target.value = formatThousandSeparator(e.target.value);
                    regProps.onChange && regProps.onChange(e);
                  }}
                  onKeyDown={preventNonDigitInput}
                  inputMode="numeric"
                  disabled={disabled}
                  placeholder={placeholder}
                  className={`${baseClass} ${isNumber ? "font-mono" : ""}`}
                  style={focusStyle}
                />
              );
            }

            const handleKeyDown = (e) => {
              if (["e", "E", "+", "-"].includes(e.key)) {
                e.preventDefault();
              }
              if (isIntegerField && e.key === ".") {
                e.preventDefault();
              }
            };

            const handleWheel = (e) => {
              e.currentTarget.blur();
            };

            const handleBlurClamp = (e) => {
              regProps.onBlur && regProps.onBlur(e);
              if (!isNumber) return;
              const raw = e.target.value;
              if (raw === "") return;
              const parsed = isIntegerField ? parseInt(raw, 10) : parseFloat(raw);
              if (isNaN(parsed)) {
                e.target.value = "";
                return;
              }
              const minVal = (rules && rules.min && rules.min.value != null) ? rules.min.value : (isIntegerField ? 1 : 0);
              let clamped = parsed;
              if (parsed < minVal) clamped = minVal;
              if (isIntegerField) e.target.value = String(Math.trunc(clamped));
              else e.target.value = String(clamped);
            };

            return (
              <input
                type={type}
                {...regProps}
                onFocus={(e) => { setFocused(true); regProps.onFocus && regProps.onFocus(e); }}
                onBlur={handleBlurClamp}
                onKeyDown={handleKeyDown}
                onWheel={handleWheel}
                inputMode={isNumber ? "numeric" : undefined}
                min={isNumber && rules && rules.min ? rules.min.value : undefined}
                step={isNumber ? (isIntegerField ? "1" : "0.01") : undefined}
                disabled={disabled}
                placeholder={placeholder}
                className={`${baseClass} ${isNumber ? "font-mono" : ""}`}
                style={focusStyle}
              />
            );
          })()
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
export default function BarangMasukModal({ isOpen, isEdit, data, onClose, onSubmit, isLoading }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue,
  } = useForm({
    defaultValues: {
      barang_id: "",
      supplier_id: "",
      cabang_id: "",
      ruangan_id: "",
      jumlah: "",
      no_dokumen: "",
      harga_satuan: "",
      tanggal_masuk: "",
      keterangan: "",
    },
  });

  const [ruanganList,  setRuanganList]  = useState([]);
  const [cabangList,   setCabangList]   = useState([]);
  const [barangList,   setBarangList]   = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  /* Load dropdowns + prefill saat edit */
  useEffect(() => {
    if (!isOpen) return;

    const loadAndFill = async () => {
      try {
        setLoadingSelects(true);
        const [ruangan, cabang, barang, supplier] = await Promise.all([
          getCachedList("barang-masuk:ruangan",  () => getRuanganList(1, 100)),
          getCachedList("barang-masuk:cabang",   () => getCabangList(1, 100)),
          getCachedList("barang-masuk:barang",   () => getBarangList(1, 100)),
          getCachedList("barang-masuk:supplier", () => getSupplierList(1, 100)),
        ]);
        setRuanganList(ruangan);
        setCabangList(cabang);
        setBarangList(barang);
        setSupplierList(supplier);

        if (isEdit && data) {
          setValue("barang_id",    String(data.barang?.id    || data.barang_id    || ""));
          setValue("supplier_id",  String(data.supplier?.id  || data.supplier_id  || ""));
          setValue("cabang_id",    String(data.cabang?.id    || data.cabang_id    || ""));
          setValue("ruangan_id",   String(data.ruangan?.id   || data.ruangan_id   || ""));
          setValue("jumlah",       data.jumlah       || "");
          setValue("no_dokumen",   data.no_dokumen   || "");
          setValue("harga_satuan", data.harga_satuan || "");
          setValue("keterangan",   data.keterangan   || "");
          // format tanggal ke yyyy-MM-dd untuk input date
          if (data.tanggal_masuk) {
            setValue("tanggal_masuk", data.tanggal_masuk.split("T")[0]);
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

  /* Animasi buka/tutup */
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

  const handleFormSubmit = (formData) => {
    onSubmit(formData);
  };

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) handleModalClose();
  };

  /* Memoize options */
  const barangOptions   = useMemo(() => barangList.map(   (i) => ({ value: String(i.id), label: `${i.kode_barang} - ${i.name}` })), [barangList]);
  const supplierOptions = useMemo(() => supplierList.map( (i) => ({ value: String(i.id), label: i.name_supplier })), [supplierList]);
  const cabangOptions   = useMemo(() => cabangList.map(   (i) => ({ value: String(i.id), label: i.name_cabang  })), [cabangList]);
  const ruanganOptions  = useMemo(() => ruanganList.map(  (i) => ({ value: String(i.id), label: i.name_ruangan })), [ruanganList]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div onClick={handleBackdropClick} className={`modal-backdrop ${visible ? 'visible' : ''}`}>
        <div onClick={(e) => e.stopPropagation()} className={`modal-container ${visible ? 'visible' : ''}`}>
          {/* Header */}
          <div className="modal-header sticky top-0 flex items-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <MdInventory className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-gray-900 m-0 tracking-tight">
                {isEdit ? "Edit Barang Masuk" : "Tambah Barang Masuk"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isEdit ? "Perbarui data barang masuk" : "Isi detail transaksi barang masuk"}
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
          <form onSubmit={handleSubmit(handleFormSubmit)} className="modal-inner-scroll">
            <Field
              label="Barang" icon={MdInventory}
              register={register} name="barang_id"
              rules={{ required: "Barang wajib dipilih" }} error={errors.barang_id}
              disabled={isLoading || loadingSelects} options={barangOptions}
            />

            <Field
              label="Supplier" icon={MdLocalShipping}
              register={register} name="supplier_id"
              rules={{ required: "Supplier wajib dipilih" }} error={errors.supplier_id}
              disabled={isLoading || loadingSelects} options={supplierOptions}
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

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Jumlah" icon={MdNumbers}
                register={register} name="jumlah" type="number"
                rules={{
                  required: "Jumlah wajib diisi",
                  min: { value: 1, message: "Minimal 1" },
                }}
                error={errors.jumlah} placeholder="0"
                disabled={isLoading}
              />
              <Field
                label="Harga Satuan" icon={MdAttachMoney}
                register={register} name="harga_satuan" type="text" formatThousands
                rules={{
                  required: "Harga satuan wajib diisi",
                  min: { value: 0, message: "Tidak boleh negatif" },
                  setValueAs: (value) => {
                    const numericValue = String(value ?? "").replace(/\D/g, "");
                    return numericValue ? Number(numericValue) : null;
                  },
                }}
                error={errors.harga_satuan} placeholder="0"
                disabled={isLoading}
              />
            </div>

            <Field
              label="Tanggal Masuk" icon={MdCalendarToday}
              register={register} name="tanggal_masuk" type="date"
              rules={{ required: "Tanggal masuk wajib diisi" }}
              error={errors.tanggal_masuk}
              disabled={isLoading}
            />

            <Field
              label="No Dokumen" icon={MdReceiptLong}
              register={register} name="no_dokumen"
              rules={{}}
              error={errors.no_dokumen}
              placeholder="Masukkan no dokumen (opsional)"
              disabled={isLoading}
            />

            <Field
              label="Keterangan" icon={MdDescription}
              register={register} name="keterangan"
              type="textarea"
              placeholder="Keterangan tambahan (opsional)"
              disabled={isLoading}
            />

            {/* Info hint */}
            <div className="px-3 py-2.5 mb-6 rounded-lg bg-blue-50 border border-blue-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                Pastikan data barang masuk terisi dengan lengkap dan benar. Jumlah barang akan otomatis diperbarui setelah disimpan.
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
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ boxShadow: isLoading ? "none" : "0 2px 10px rgba(59,130,246,0.3)" }}
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

      {/* moved styles into src/index.css */}
    </>
  , document.body);
}