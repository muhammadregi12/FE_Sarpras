import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdPerson, MdArrowBack, MdVerified, MdBadge } from "react-icons/md";
import { getProfile, updateProfile } from "../../services/authService";
import { getServerBaseUrl } from "../../services/serverUrl";
import { showToast } from "../../utils/toast";
import FormProfil from "./FormProfil";

export default function UpdateProfilMain() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setUser(data);
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      const result = await updateProfile(formData);
      showToast.success(result.message || "Profil berhasil diperbarui");
      fetchProfile();
    } catch (error) {
      showToast.error(error?.response?.data?.message || "Gagal memperbarui profil");
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
            <MdPerson className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 m-0 tracking-tight">
              Update Profil
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola informasi akun dan foto profil
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

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-[fadeUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.05s_both]">

        {/* Left: Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header strip */}
            <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 relative">
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                    radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                  backgroundSize: "30px 30px"
                }}
              />
            </div>

            {/* Avatar & Info */}
            <div className="px-5 pb-5">
              <div className="-mt-8 mb-3 relative w-fit">
                {loading ? (
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse border-4 border-white" />
                ) : avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name}
                    className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-md flex items-center justify-center">
                    <MdPerson className="w-8 h-8 text-blue-400" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
              </div>

              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h2 className="text-sm font-extrabold text-gray-900 truncate">
                      {user?.name}
                    </h2>
                    <MdVerified className="w-4 h-4 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-400 truncate mb-3">{user?.email}</p>

                  {/* Role Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg w-fit">
                    <MdBadge className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] font-semibold text-blue-700 capitalize">
                      {user?.role || "user"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Info Rows */}
            {!loading && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                <InfoRow label="Nama" value={user?.name} />
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Role" value={user?.role} capitalize />
              </div>
            )}
          </div>
        </div>

        {/* Right: Form Card */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h3 className="text-sm font-bold text-gray-800">Edit Informasi Profil</h3>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="space-y-5">
                  {/* Avatar skeleton */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-2xl bg-gray-200 animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  {/* Field skeletons */}
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                  ))}
                  <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ) : (
                <FormProfil
                  user={user}
                  onSubmit={handleSubmit}
                  isLoading={isSubmitting}
                />
              )}
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

function InfoRow({ label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <span className={`text-[11px] font-semibold text-gray-700 truncate max-w-[60%] text-right ${capitalize ? "capitalize" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
}