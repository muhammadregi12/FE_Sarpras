import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew,
  MdCategory, MdNotes,
} from "react-icons/md";

export default function KategoriModal({
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
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name_kategori: "",
      deskripsi: "",
    },
  });

  const nameValue = watch("name_kategori") || "";

  useEffect(() => {
    if (isEdit && data) {
      reset({
        name_kategori: data.name_kategori || "",
        deskripsi: data.deskripsi || "",
      });
    } else {
      reset({ name_kategori: "", deskripsi: "" });
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
      const t = setTimeout(() => setMounted(false), 300);
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
        className="fixed flex items-center justify-center p-4"
        style={{
          inset: 0,
          zIndex: 999999,
          background: "rgba(15, 23, 42, 0.60)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.28s ease",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.94) translateY(16px)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.32s cubic-bezier(0.34,1.28,0.64,1), opacity 0.25s ease",
          }}
        >
          {/* ── Header with accent bar ── */}
          <div style={{ position: "relative", padding: "24px 24px 20px" }}>
            {/* Top accent line */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "3px",
              background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 60%, #bfdbfe 100%)",
              borderRadius: "20px 20px 0 0",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              {/* Icon */}
              <div style={{
                width: "44px", height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                border: "1px solid #bfdbfe",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <MdCategory style={{ width: "20px", height: "20px", color: "#2563eb" }} />
              </div>

              {/* Title */}
              <div style={{ flex: 1, paddingTop: "2px" }}>
                <h2 style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.3px",
                  lineHeight: 1.3,
                }}>
                  {isEdit ? "Edit Kategori" : "Tambah Kategori"}
                </h2>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                  {isEdit ? "Perbarui informasi kategori" : "Isi detail kategori baru"}
                </p>
              </div>

              {/* Close btn */}
              <button
                onClick={onClose}
                disabled={isLoading}
                style={{
                  width: "32px", height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "transparent",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#94a3b8",
                  transition: "all 0.15s",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
              >
                <MdClose style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#f1f5f9", margin: "0 24px" }} />

          {/* ── Form Body ── */}
          <form onSubmit={handleSubmit(handleFormSubmit)} style={{ padding: "20px 24px 24px" }}>

            {/* Nama Kategori */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                marginBottom: "8px",
              }}>
                Nama Kategori <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <MdCategory style={{
                  position: "absolute", left: "12px",
                  top: "50%", transform: "translateY(-50%)",
                  width: "16px", height: "16px",
                  color: errors.name_kategori ? "#ef4444" : "#94a3b8",
                  pointerEvents: "none",
                }} />
                <input
                  type="text"
                  placeholder="Contoh: Elektronik, Furnitur, Alat Tulis"
                  {...register("name_kategori", {
                    required: "Nama kategori wajib diisi",
                    minLength: { value: 2, message: "Minimal 2 karakter" },
                  })}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    fontSize: "13px",
                    color: "#0f172a",
                    background: errors.name_kategori ? "#fff5f5" : "#f8fafc",
                    border: `1.5px solid ${errors.name_kategori ? "#fca5a5" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxShadow: errors.name_kategori
                      ? "0 0 0 3px rgba(239,68,68,0.08)"
                      : "none",
                  }}
                  onFocus={e => {
                    if (!errors.name_kategori) {
                      e.target.style.borderColor = "#3b82f6";
                      e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                      e.target.style.background = "#fff";
                    }
                  }}
                  onBlur={e => {
                    if (!errors.name_kategori) {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "#f8fafc";
                    }
                  }}
                />
              </div>
              {errors.name_kategori && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px" }}>
                  <MdErrorOutline style={{ width: "12px", height: "12px", color: "#ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#ef4444" }}>
                    {errors.name_kategori.message}
                  </span>
                </div>
              )}
            </div>

            {/* Deskripsi */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                }}>
                  Deskripsi
                  <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 500, color: "#cbd5e1", textTransform: "none", letterSpacing: 0 }}>
                    (opsional)
                  </span>
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <MdNotes style={{
                  position: "absolute", left: "12px", top: "12px",
                  width: "16px", height: "16px", color: "#94a3b8",
                  pointerEvents: "none",
                }} />
                <textarea
                  placeholder="Deskripsi singkat tentang kategori ini…"
                  {...register("deskripsi")}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    fontSize: "13px",
                    color: "#0f172a",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    fontFamily: "'Sora', sans-serif",
                    lineHeight: 1.6,
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#f8fafc";
                  }}
                />
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#64748b",
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Sora', sans-serif",
                }}
                onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#cbd5e1"; } }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#ffffff",
                  background: isLoading
                    ? "#93c5fd"
                    : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  transition: "all 0.15s",
                  boxShadow: isLoading ? "none" : "0 2px 12px rgba(37,99,235,0.3)",
                  fontFamily: "'Sora', sans-serif",
                }}
                onMouseEnter={e => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,99,235,0.38)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isLoading) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.3)";
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <MdAutorenew style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />
                    Menyimpan…
                  </>
                ) : (
                  <>
                    <MdCheck style={{ width: "15px", height: "15px" }} />
                    {isEdit ? "Perbarui" : "Simpan"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #cbd5e1; }
        input:-webkit-autofill, textarea:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #f8fafc inset !important;
          -webkit-text-fill-color: #0f172a !important;
        }
      `}</style>
    </>
  , document.body);
}