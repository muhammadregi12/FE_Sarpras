import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew,
  MdStore, MdLocationOn, MdInfo,
} from "react-icons/md";

/* ── Design tokens ── */
const C = {
  overlay:     "rgba(0,0,0,0.6)",
  modalBg:     "#ffffff",
  cardBorder:  "#e5e7eb",
  inputBg:     "#f9fafb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted:   "#9ca3af",
  blue:  "#3b82f6",
  red:   "#ef4444",
  green: "#10b981",
};

/* ── Input Field ── */
function Field({ label, icon: Icon, register: reg, name, rules, error, type = "text", placeholder }) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  const borderColor = hasError ? C.red : focused ? C.blue : C.cardBorder;
  const boxShadow = focused && !hasError ? "0 0 0 3px rgba(59,130,246,0.1)" : "none";

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 7, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          width: 15, height: 15,
          color: focused ? C.blue : hasError ? C.red : C.textMuted,
          transition: "color 0.2s",
        }} />
        <input
          type={type}
          placeholder={placeholder}
          {...reg(name, rules)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "10px 14px 10px 36px",
            background: C.inputBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 9, color: C.textPrimary,
            fontSize: 13, outline: "none",
            fontFamily: "'Sora', sans-serif",
            boxSizing: "border-box",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow,
          }}
        />
      </div>
      {hasError && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
          <MdErrorOutline style={{ width: 12, height: 12, color: C.red, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.red }}>{error.message}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main Export ── */
export default function CabangModal({ isOpen, isEdit, data, onClose, onSubmit, isLoading }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name_cabang: "", daerah_cabang: "" },
  });

  useEffect(() => {
    if (isEdit && data) {
      reset({ name_cabang: data.name_cabang || "", daerah_cabang: data.daerah_cabang || "" });
    } else {
      reset({ name_cabang: "", daerah_cabang: "" });
    }
  }, [isOpen, isEdit, data, reset]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      document.body.style.overflow = "";
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
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: C.overlay,
          backdropFilter: "blur(24px) brightness(0.7) saturate(0.8)",
          WebkitBackdropFilter: "blur(24px) brightness(0.7) saturate(0.8)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.3s ease",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.modalBg,
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 20,
            width: "100%",
            maxWidth: 460,
            overflow: "hidden",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(20px)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.25s ease",
            boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "20px 24px",
            borderBottom: `1px solid ${C.cardBorder}`,
            background: "#ffffff",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MdStore style={{ width: 18, height: 18, color: C.blue }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.01em" }}>
                {isEdit ? "Edit Cabang" : "Tambah Cabang"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>
                {isEdit ? "Perbarui informasi cabang" : "Isi detail cabang baru"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${C.cardBorder}`,
                background: "none",
                cursor: "pointer",
                color: C.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = C.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.textMuted; }}
            >
              <MdClose style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: "24px", background: "#ffffff" }}>
            <Field
              label="Nama Cabang"
              icon={MdStore}
              register={register}
              name="name_cabang"
              rules={{ required: "Nama cabang wajib diisi" }}
              error={errors.name_cabang}
              placeholder="Contoh: Cabang Jakarta Pusat"
            />

            <Field
              label="Daerah Cabang"
              icon={MdLocationOn}
              register={register}
              name="daerah_cabang"
              rules={{ required: "Daerah cabang wajib diisi" }}
              error={errors.daerah_cabang}
              placeholder="Contoh: DKI Jakarta"
            />

            {/* Info hint */}
            <div style={{
              padding: "12px 14px",
              borderRadius: 10,
              marginBottom: 24,
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              fontSize: 11,
              color: C.textSecondary,
              lineHeight: 1.6,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}>
              <MdInfo style={{ width: 15, height: 15, color: C.blue, flexShrink: 0, marginTop: 2 }} />
              <div>
                Gunakan kode cabang yang unik dan mudah diidentifikasi, misalnya <strong style={{ color: C.blue }}>CBG001</strong> atau <strong style={{ color: C.blue }}>CBG-JKT</strong>.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 10,
                  border: `1px solid ${C.cardBorder}`, background: "#ffffff",
                  color: C.textSecondary, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = C.cardBorder; }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 10,
                  border: "none", background: C.blue, color: "#fff",
                  fontSize: 13, fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: isLoading ? 0.75 : 1,
                  boxShadow: "0 2px 10px rgba(59,130,246,0.3)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(59,130,246,0.4)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(59,130,246,0.3)"; }}
              >
                {isLoading ? (
                  <>
                    <MdAutorenew style={{ width: 15, height: 15, animation: "modalSpin 0.8s linear infinite" }} />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <MdCheck style={{ width: 15, height: 15 }} />
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