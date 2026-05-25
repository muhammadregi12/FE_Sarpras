import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew,
  MdMeetingRoom, MdBadge, MdInfo,
} from "react-icons/md";

/* ── Input Field Component ── */
function Field({ label, icon: Icon, register: reg, name, rules, error, type = "text", placeholder }) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <div className="mb-5">
      <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
          focused ? "text-blue-600" : hasError ? "text-red-500" : "text-gray-400"
        }`} />
        <input
          type={type}
          placeholder={placeholder}
          {...reg(name, rules)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full py-2.5 pl-9 pr-3 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 ${
            hasError
              ? "border-2 border-red-500 focus:border-red-500"
              : focused
              ? "border border-blue-500"
              : "border border-gray-200"
          }`}
          style={{
            boxShadow: focused && !hasError ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
          }}
        />
      </div>
      {hasError && (
        <div className="flex items-center gap-1.5 mt-2">
          <MdErrorOutline className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-[11px] text-red-500">{error.message}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main Export ── */
export default function RuanganModal({ isOpen, isEdit, data, onClose, onSubmit, isLoading }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { kode_ruangan: "", name_ruangan: "" },
  });

  /* Populate form saat edit */
  useEffect(() => {
    if (isEdit && data) {
      reset({ kode_ruangan: data.kode_ruangan || "", name_ruangan: data.name_ruangan || "" });
    } else {
      reset({ kode_ruangan: "", name_ruangan: "" });
    }
  }, [isOpen, isEdit, data, reset]);

  /* Mount/unmount animation */
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

  const handleFormSubmit = async (formData) => {
    await onSubmit(formData);
    reset();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop + Modal Wrapper — satu layer, menutupi semua termasuk sidebar/header/footer */}
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
          className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
          style={{
            border: "1px solid #e5e7eb",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(20px)",
            transition: "transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease",
            opacity: visible ? 1 : 0,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <MdMeetingRoom className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-extrabold text-gray-900 m-0 tracking-tight">
                {isEdit ? "Edit Ruangan" : "Tambah Ruangan"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isEdit ? "Perbarui informasi ruangan" : "Isi detail ruangan baru"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-none cursor-pointer text-gray-400 flex items-center justify-center transition-all duration-150 hover:bg-gray-100 hover:text-gray-700"
            >
              <MdClose className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 bg-white">
            <Field
              label="Kode Ruangan"
              icon={MdBadge}
              register={register}
              name="kode_ruangan"
              rules={{ required: "Kode ruangan wajib diisi" }}
              error={errors.kode_ruangan}
              placeholder="Contoh: R001, GUDANG-A"
            />

            <Field
              label="Nama Ruangan"
              icon={MdMeetingRoom}
              register={register}
              name="name_ruangan"
              rules={{ required: "Nama ruangan wajib diisi" }}
              error={errors.name_ruangan}
              placeholder="Contoh: Ruang Kepala, Ruang Meeting"
            />

            {/* Info hint */}
            <div className="px-3 py-2.5 mb-6 rounded-lg bg-blue-50 border border-blue-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                Gunakan kode yang unik dan mudah diidentifikasi, misalnya <strong className="text-blue-600">R001</strong> atau <strong className="text-blue-600">GDG-A</strong>.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold text-gray-500 bg-white border border-gray-200 cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:text-gray-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  boxShadow: isLoading ? "none" : "0 2px 10px rgba(59,130,246,0.3)",
                }}
              >
                {isLoading ? (
                  <>
                    <MdAutorenew className="w-4 h-4 animate-spin" />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <MdCheck className="w-4 h-4" />
                    {isEdit ? "Perbarui" : "Simpan"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

    </>
  , document.body);
}