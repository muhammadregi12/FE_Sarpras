import { useState } from "react";
import { useForm } from "react-hook-form";
import { MdLock, MdVisibility, MdVisibilityOff, MdSave, MdCheckCircle } from "react-icons/md";

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: "Min. 8 karakter", ok: password.length >= 8 },
    { label: "Huruf besar", ok: /[A-Z]/.test(password) },
    { label: "Angka", ok: /[0-9]/.test(password) },
    { label: "Karakter khusus", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-blue-500", "bg-green-500"];
  const labels = ["", "Lemah", "Sedang", "Cukup", "Kuat"];

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${
          score <= 1 ? "text-red-500" : score === 2 ? "text-orange-500" : score === 3 ? "text-blue-500" : "text-green-500"
        }`}>
          {labels[score]}
        </span>
        <div className="flex gap-2 flex-wrap justify-end">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-[10px] flex items-center gap-0.5 transition-colors ${
                c.ok ? "text-green-600" : "text-gray-400"
              }`}
            >
              <MdCheckCircle className={`w-3 h-3 ${c.ok ? "text-green-500" : "text-gray-300"}`} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PasswordInput({ label, name, placeholder, register, rules, error, icon: Icon }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-blue-500" />
        {label}
      </label>
      <div className="relative">
        <input
          {...register(name, rules)}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full px-3.5 py-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border rounded-xl outline-none transition-all duration-200 placeholder:text-gray-300 ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {show ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 flex items-center gap-1">
          <span>⚠</span> {error.message}
        </p>
      )}
    </div>
  );
}

export default function FormPassword({ onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const newPassword = watch("new_password", "");

  const handleFormSubmit = async (values) => {
    await onSubmit(values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
        <MdLock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Password baru minimal <strong>8 karakter</strong>. Gunakan kombinasi huruf besar, angka,
          dan karakter khusus untuk keamanan maksimal.
        </p>
      </div>

      {/* Old Password */}
      <PasswordInput
        label="Password Lama"
        name="old_password"
        placeholder="Masukkan password saat ini"
        register={register}
        rules={{ required: "Password lama harus diisi" }}
        error={errors.old_password}
        icon={MdLock}
      />

      {/* Divider */}
      <div className="border-t border-dashed border-gray-200" />

      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <MdLock className="w-3.5 h-3.5 text-blue-500" />
          Password Baru
        </label>
        <div className="relative">
          <NewPasswordField register={register} errors={errors} />
        </div>
        <PasswordStrength password={newPassword} />
      </div>

      {/* Confirm Password */}
      <PasswordInput
        label="Konfirmasi Password Baru"
        name="confirm_password"
        placeholder="Ulangi password baru"
        register={register}
        rules={{
          required: "Konfirmasi password harus diisi",
          validate: (val) => val === newPassword || "Password tidak cocok",
        }}
        error={errors.confirm_password}
        icon={MdLock}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
          isLoading
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
            Ubah Password
          </>
        )}
      </button>
    </form>
  );
}

// Helper: new password field with show/hide
function NewPasswordField({ register, errors }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input
        {...register("new_password", {
          required: "Password baru harus diisi",
          minLength: { value: 8, message: "Minimal 8 karakter" },
        })}
        type={show ? "text" : "password"}
        placeholder="Masukkan password baru"
        autoComplete="new-password"
        className={`w-full px-3.5 py-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border rounded-xl outline-none transition-all duration-200 placeholder:text-gray-300 ${
          errors.new_password
            ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <MdVisibilityOff className="w-4 h-4" /> : <MdVisibility className="w-4 h-4" />}
      </button>
      {errors.new_password && (
        <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1.5">
          <span>⚠</span> {errors.new_password.message}
        </p>
      )}
    </>
  );
}