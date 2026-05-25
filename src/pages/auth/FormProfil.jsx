import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { MdPerson, MdEmail, MdCameraAlt, MdSave, MdClose } from "react-icons/md";
import { getServerBaseUrl } from "../../services/serverUrl";

export default function FormProfil({ user, onSubmit, isLoading }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  useEffect(() => {
    reset({ name: user?.name || "", email: user?.email || "" });
    setPreview(null);
  }, [user, reset]);

  const currentAvatar = user?.image
    ? user.image.startsWith("http")
      ? user.image
      : `${getServerBaseUrl()}/${user.image}`
    : null;

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
    // Assign to input
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileRef.current) fileRef.current.files = dt.files;
  };

  const handleFormSubmit = (values) => {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("email", values.email);
    if (fileRef.current?.files?.[0]) {
      fd.append("image", fileRef.current.files[0]);
    }
    onSubmit(fd);
  };

  const removePreview = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={`relative group cursor-pointer transition-all duration-300 ${
            isDragging ? "scale-105" : ""
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          {/* Avatar Circle */}
          <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
            isDragging
              ? "border-blue-500 ring-4 ring-blue-100"
              : "border-gray-200 group-hover:border-blue-400 group-hover:ring-4 group-hover:ring-blue-50"
          }`}>
            {preview || currentAvatar ? (
              <img
                src={preview || currentAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <MdPerson className="w-10 h-10 text-blue-300" />
              </div>
            )}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 rounded-2xl bg-blue-600/0 group-hover:bg-blue-600/20 transition-all duration-300 flex items-center justify-center">
            <MdCameraAlt className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow" />
          </div>

          {/* Remove preview button */}
          {preview && (
            <button
              type="button"
              onClick={removePreview}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <MdClose className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">Foto Profil</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Klik atau drag & drop · JPG, PNG, WEBP
          </p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
            <MdPerson className="w-3.5 h-3.5 text-blue-500" />
            Nama Lengkap
          </label>
          <div className="relative">
            <input
              {...register("name", {
                required: "Nama harus diisi",
                minLength: { value: 2, message: "Minimal 2 karakter" },
              })}
              type="text"
              placeholder="Masukkan nama lengkap"
              className={`w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border rounded-xl outline-none transition-all duration-200 placeholder:text-gray-300 ${
                errors.name
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
            <MdEmail className="w-3.5 h-3.5 text-blue-500" />
            Alamat Email
          </label>
          <div className="relative">
            <input
              {...register("email", {
                required: "Email harus diisi",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Format email tidak valid",
                },
              })}
              type="email"
              placeholder="contoh@email.com"
              className={`w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border rounded-xl outline-none transition-all duration-200 placeholder:text-gray-300 ${
                errors.email
                  ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || (!isDirty && !preview)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
          isLoading || (!isDirty && !preview)
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-200"
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>Menyimpan...</span>
          </>
        ) : (
          <>
            <MdSave className="w-4 h-4" />
            Simpan Perubahan
          </>
        )}
      </button>
    </form>
  );
}