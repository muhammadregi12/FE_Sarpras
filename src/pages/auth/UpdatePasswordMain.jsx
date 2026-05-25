import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdLock, MdArrowBack, MdPerson, MdShield, MdVerified } from "react-icons/md";
import { getProfile, updatePassword } from "../../services/authService";
import { getServerBaseUrl } from "../../services/serverUrl";
import { showToast } from "../../utils/toast";
import FormPassword from "./FormPassword";

export default function UpdatePasswordMain() {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch {
        // silently fail — sidebar info is non-critical
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      const result = await updatePassword(payload);
      showToast.success(result.message || "Password berhasil diubah");
      setSuccessBanner(true);
      setTimeout(() => setSuccessBanner(false), 5000);
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal mengubah password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarSrc = user?.image
    ? user.image.startsWith("http")
      ? user.image
      : `${getServerBaseUrl()}/${user.image}`
    : null;

  return (
    <div className="min-h-full bg-white p-3 sm:p-4 lg:p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !border !border-gray-200"
      />

      {/* ── Page Header ── */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-[fadeDown_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <MdLock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Ganti Password
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Perbarui password untuk menjaga keamanan akun
            </p>
          </div>
        </div>

        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 self-start px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-150 lg:self-auto"
        >
          <MdArrowBack className="w-3.5 h-3.5" />
          Kembali
        </button>
      </div>

      {/* ── Success Banner ── */}
      {successBanner && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl animate-[fadeDown_0.3s_ease_both]">
          <MdVerified className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="text-xs font-bold text-green-700">Password berhasil diubah!</p>
            <p className="text-[11px] text-green-600">Gunakan password baru saat login berikutnya.</p>
          </div>
          <button
            onClick={() => setSuccessBanner(false)}
            className="ml-auto text-green-400 hover:text-green-600 text-base"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">

        {/* Left: Security Info Card */}
        <div className="lg:col-span-1 space-y-4">

          {/* User info mini card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="h-14 bg-gradient-to-r from-blue-500 to-blue-600" />
            <div className="px-4 pb-4">
              <div className="-mt-6 mb-3 relative w-fit">
                {loadingProfile ? (
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse border-4 border-white" />
                ) : avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name}
                    className="w-12 h-12 rounded-xl object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-md flex items-center justify-center">
                    <MdPerson className="w-6 h-6 text-blue-400" />
                  </div>
                )}
              </div>

              {loadingProfile ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Security tips card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <MdShield className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold text-gray-800">Tips Keamanan</h3>
            </div>
            <div className="px-4 py-4 space-y-3">
              {SECURITY_TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Password rules quick ref */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4">
            <p className="text-[11px] font-bold text-blue-700 mb-2.5">Syarat Password</p>
            <div className="space-y-1.5">
              {PASSWORD_RULES.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                  <p className="text-[11px] text-blue-600">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-bold text-gray-800">Form Ganti Password</h3>
            </div>

            <div className="p-5">
              <FormPassword onSubmit={handleSubmit} isLoading={isSubmitting} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const SECURITY_TIPS = [
  "Jangan gunakan password yang sama di beberapa akun berbeda.",
  "Hindari informasi pribadi seperti tanggal lahir atau nama.",
  "Ganti password secara berkala, minimal setiap 3 bulan.",
  "Jangan bagikan password ke siapa pun.",
];

const PASSWORD_RULES = [
  "Minimal 8 karakter",
  "Mengandung huruf besar (A–Z)",
  "Mengandung angka (0–9)",
  "Karakter khusus dianjurkan (!@#$)",
];