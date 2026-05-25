import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdDeleteForever, MdClose } from "react-icons/md";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName = null,
  isLoading = false,
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !isLoading) onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        onClick={handleBackdrop}
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(20px) brightness(0.75) saturate(0.8)",
          WebkitBackdropFilter: "blur(20px) brightness(0.75) saturate(0.8)",
          opacity: visible ? 1 : 0,
        }}
      />

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          pointerEvents: visible ? "auto" : "none",
          opacity: visible ? 1 : 0,
          fontFamily: "'Sora', sans-serif",
          transition: "opacity 0.25s ease",
        }}
      >
        <div
          className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
          style={{
            border: "1px solid #e5e7eb",
            transform: visible ? "scale(1) translateY(0)" : "scale(0.93) translateY(20px)",
            transition: "transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)",
          }}
        >
          {/* Close button */}
          <div className="flex justify-end px-4 pt-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
            >
              <MdClose size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-5 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
              <MdDeleteForever className="w-7 h-7 text-red-500" />
            </div>

            <h3 className="text-base font-extrabold text-gray-900 mb-1.5 tracking-tight">
              Anda yakin ingin menghapus ?
            </h3>

            {itemName && (
              <span className="inline-block mb-3 px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {itemName}
              </span>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">
              Data yang dihapus <strong className="text-gray-500">tidak dapat dikembalikan</strong>.
              Pastikan Anda sudah yakin sebelum melanjutkan.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 px-6 pb-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ boxShadow: isLoading ? "none" : "0 2px 10px rgba(239,68,68,0.3)" }}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Menghapus…
                </>
              ) : (
                <>
                  <MdDeleteForever className="w-4 h-4" />
                  Ya, Hapus
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  , document.body);
}