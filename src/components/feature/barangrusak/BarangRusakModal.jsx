import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import {
  MdClose,
  MdCheck,
  MdErrorOutline,
  MdAutorenew,
  MdInfo,
  MdWarning,
  MdMeetingRoom,
  MdStore,
  MdCalendarToday,
  MdDescription,
  MdNumbers,
  MdInventory,
} from "react-icons/md";
import { getBarangList } from "../../../services/barangService";
import { getRuanganList } from "../../../services/ruanganService";
import { getCabangList } from "../../../services/cabangService";
import { getCachedList } from "../../../utils/cachedList";

const preventNegativeNumberInput = (event) => {
  if (["-", "+", "e", "E"].includes(event.key)) {
    event.preventDefault();
  }
};

const TINGKAT_OPTIONS = ["ringan", "sedang", "berat"];

/* ── Reusable Field ── */
const Field = memo(function Field({
  label,
  icon: Icon,
  register: reg,
  name,
  rules,
  error,
  type = "text",
  placeholder,
  disabled,
  options = null,
  minNumber = null,
  maxNumber = null,
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const isSelect = options !== null;
  const isTextarea = type === "textarea";

  return (
    <div className="mb-5">
      <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            focused ? "text-red-500" : hasError ? "text-red-500" : "text-gray-400"
          }`}
        />

        {isSelect ? (
          <select
            {...reg(name, rules)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            className={`w-full py-2.5 pl-9 pr-3 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 appearance-none ${
              hasError
                ? "border-2 border-red-500 focus:border-red-500"
                : focused
                ? "border border-red-400"
                : "border border-gray-200"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            style={{
              boxShadow:
                focused && !hasError ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
            }}
          >
            <option value="">-- Pilih {label} --</option>
            {options.map((opt) => (
              <option key={opt.value ?? opt} value={opt.value ?? opt}>
                {opt.label ?? opt}
              </option>
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
            className={`w-full py-2.5 pl-9 pr-3 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 resize-none ${
              hasError
                ? "border-2 border-red-500"
                : focused
                ? "border border-red-400"
                : "border border-gray-200"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            style={{
              boxShadow:
                focused && !hasError ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
            }}
          />
        ) : (
          <input
            type={type}
            {...reg(name, rules)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={type === "number" ? preventNegativeNumberInput : undefined}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full py-2.5 pl-9 pr-3 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 ${
              hasError
                ? "border-2 border-red-500"
                : focused
                ? "border border-red-400"
                : "border border-gray-200"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${
              type === "number" ? "font-mono" : ""
            }`}
            style={{
              boxShadow:
                focused && !hasError ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
            }}
            min={type === "number" && minNumber !== null ? minNumber : undefined}
            max={type === "number" && maxNumber !== null ? maxNumber : undefined}
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
export default function BarangRusakModal({
  isOpen,
  isEdit,
  data,
  onClose,
  onSubmit,
  isLoading,
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      barang_id: "",
      cabang_id: "",
      ruangan_id: "",
      jumlah_rusak: "",
      tingkat_kerusakan: "",
      tanggal_rusak: "",
      keterangan: "",
    },
  });

  const [barangList,  setBarangList]  = useState([]);
  const [ruanganList, setRuanganList] = useState([]);
  const [cabangList,  setCabangList]  = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(false);

  /* Load dropdowns & pre-fill on open */
  useEffect(() => {
    if (!isOpen) return;

    const loadAndFill = async () => {
      try {
        setLoadingSelects(true);
        const [barang, ruangan, cabang] = await Promise.all([
          getCachedList("barang-rusak:barang",  () => getBarangList(1, 200)),
          getCachedList("barang-rusak:ruangan", () => getRuanganList(1, 100)),
          getCachedList("barang-rusak:cabang",  () => getCabangList(1, 100)),
        ]);
        setBarangList(barang);
        setRuanganList(ruangan);
        setCabangList(cabang);

        if (isEdit && data) {
          setValue("barang_id",         String(data.barang?.id   ?? data.barang_id   ?? ""));
          setValue("cabang_id",         String(data.cabang?.id   ?? data.cabang_id   ?? ""));
          setValue("ruangan_id",        String(data.ruangan?.id  ?? data.ruangan_id  ?? ""));
          setValue("jumlah_rusak",      data.jumlah_rusak      ?? "");
          setValue("tingkat_kerusakan", data.tingkat_kerusakan ?? "");
          setValue(
            "tanggal_rusak",
            data.tanggal_rusak
              ? new Date(data.tanggal_rusak).toISOString().split("T")[0]
              : ""
          );
          setValue("keterangan", data.keterangan ?? "");
        }
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      } finally {
        setLoadingSelects(false);
      }
    };

    loadAndFill();
  }, [isOpen, isEdit, data, setValue]);

  /* Animation lifecycle */
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

  /* Memoised options */
  const barangOptions = useMemo(
    () =>
      barangList.map((item) => ({
        value: String(item.id),
        label: `${item.kode_barang} – ${item.name} (Jumlah: ${item.jumlah ?? 0})`,
      })),
    [barangList]
  );
  const ruanganOptions = useMemo(
    () =>
      ruanganList.map((item) => ({
        value: String(item.id),
        label: item.name_ruangan,
      })),
    [ruanganList]
  );
  const cabangOptions = useMemo(
    () =>
      cabangList.map((item) => ({
        value: String(item.id),
        label: item.name_cabang,
      })),
    [cabangList]
  );
  const tingkatOptions = useMemo(
    () =>
      TINGKAT_OPTIONS.map((t) => ({
        value: t,
        label: t.charAt(0).toUpperCase() + t.slice(1),
      })),
    []
  );

  const selectedBarangId = watch("barang_id");
  const jumlahRusakValue = watch("jumlah_rusak");

  const selectedBarang = useMemo(
    () => barangList.find((i) => String(i.id) === String(selectedBarangId)),
    [barangList, selectedBarangId]
  );

  const maxJumlahRusak = useMemo(() => {
    if (!selectedBarang) return null;
    const stok = Number(selectedBarang.jumlah ?? 0);
    return Number.isFinite(stok) && stok >= 0 ? stok : 0;
  }, [selectedBarang]);

  useEffect(() => {
    if (maxJumlahRusak === null) return;
    const currentValue = parseInt(jumlahRusakValue || 0, 10);
    if (currentValue > maxJumlahRusak) {
      setValue("jumlah_rusak", String(maxJumlahRusak), { shouldValidate: true });
    }
  }, [jumlahRusakValue, maxJumlahRusak, setValue]);

  const handleFormSubmit = (formData) => {
    if (isEdit) {
      // For updates, only send tingkat_kerusakan and keterangan per backend requirement
      const payload = {
        tingkat_kerusakan: formData.tingkat_kerusakan,
        keterangan: formData.keterangan,
      };
      onSubmit(payload);
    } else {
      onSubmit(formData);
    }
  };

  const handleModalClose = () => {
    if (isLoading) return;
    reset();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleModalClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={handleBackdropClick}
        className="fixed flex items-center justify-center p-4 font-['Sora']"
        style={{
          inset: 0,
          zIndex: 999999,
          background: "rgba(0, 0, 0, 0.6)",
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
            transform: visible
              ? "scale(1) translateY(0)"
              : "scale(0.93) translateY(20px)",
            opacity: visible ? 1 : 0,
            transition:
              "transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease",
          }}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center gap-3 px-6 py-5 border-b border-gray-200 bg-white z-10">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <MdWarning className="w-4.5 h-4.5 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-gray-900 m-0 tracking-tight">
                {isEdit ? "Edit Barang Rusak" : "Tambah Barang Rusak"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isEdit
                  ? "Perbarui informasi kerusakan barang"
                  : "Catat laporan kerusakan barang baru"}
              </p>
            </div>
            <button
              onClick={handleModalClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-none cursor-pointer text-gray-400 flex items-center justify-center transition-all duration-150 hover:bg-gray-100 hover:text-gray-700"
            >
              <MdClose className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="p-6 bg-white max-h-[calc(90vh-80px)] overflow-y-auto"
          >
            {!isEdit && (
              <>
                <Field
                  label="Barang"
                  icon={MdInventory}
                  register={register}
                  name="barang_id"
                  rules={{ required: "Barang wajib dipilih" }}
                  error={errors.barang_id}
                  disabled={isLoading || loadingSelects}
                  options={barangOptions}
                />

                <Field
                  label="Cabang"
                  icon={MdStore}
                  register={register}
                  name="cabang_id"
                  rules={{ required: "Cabang wajib dipilih" }}
                  error={errors.cabang_id}
                  disabled={isLoading || loadingSelects}
                  options={cabangOptions}
                />

                <Field
                  label="Ruangan"
                  icon={MdMeetingRoom}
                  register={register}
                  name="ruangan_id"
                  rules={{ required: "Ruangan wajib dipilih" }}
                  error={errors.ruangan_id}
                  disabled={isLoading || loadingSelects}
                  options={ruanganOptions}
                />

                <Field
                  label="Jumlah Rusak"
                  icon={MdNumbers}
                  register={register}
                  name="jumlah_rusak"
                  rules={{
                    required: "Jumlah rusak wajib diisi",
                    min: { value: 1, message: "Minimal 1" },
                    validate: (value) => {
                      const valueNum = parseInt(value || 0, 10);
                      if (maxJumlahRusak === null) return true;
                      if (valueNum > maxJumlahRusak) return `Maksimal ${maxJumlahRusak}`;
                      return true;
                    },
                  }}
                  error={errors.jumlah_rusak}
                  type="number"
                  placeholder="Masukkan jumlah barang rusak"
                  disabled={isLoading}
                  maxNumber={maxJumlahRusak}
                />
              </>
            )}

            <Field
              label="Tingkat Kerusakan"
              icon={MdWarning}
              register={register}
              name="tingkat_kerusakan"
              rules={{ required: "Tingkat kerusakan wajib dipilih" }}
              error={errors.tingkat_kerusakan}
              disabled={isLoading}
              options={tingkatOptions}
            />

            {!isEdit && (
              <Field
                label="Tanggal Rusak"
                icon={MdCalendarToday}
                register={register}
                name="tanggal_rusak"
                rules={{ required: "Tanggal rusak wajib diisi" }}
                error={errors.tanggal_rusak}
                type="date"
                disabled={isLoading}
              />
            )}

            <Field
              label="Keterangan"
              icon={MdDescription}
              register={register}
              name="keterangan"
              rules={{}}
              error={errors.keterangan}
              placeholder="Keterangan tambahan (opsional)"
              type="textarea"
              disabled={isLoading}
            />

            {/* Info hint */}
            <div className="px-3 py-2.5 mb-6 rounded-lg bg-red-50 border border-red-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                Jumlah rusak tidak boleh melebihi stok barang yang tersedia.
                Pengurangan stok barang akan dilakukan secara otomatis setelah
                data disimpan.
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
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-red-500 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-red-600 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  boxShadow: isLoading ? "none" : "0 2px 10px rgba(239,68,68,0.3)",
                }}
              >
                {isLoading ? (
                  <>
                    <MdAutorenew className="w-4 h-4 animate-spin" /> Menyimpan…
                  </>
                ) : (
                  <>
                    <MdCheck className="w-4 h-4" />{" "}
                    {isEdit ? "Perbarui" : "Simpan"}
                  </>
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