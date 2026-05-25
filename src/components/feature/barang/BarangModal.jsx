import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo, memo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MdClose, MdCheck, MdErrorOutline, MdAutorenew, MdInfo,
  MdInventory, MdCategory, MdMeetingRoom, MdStore,
  MdLabel, MdCalendarToday, MdDescription, MdImage,
  MdStraighten,
} from "react-icons/md";
import { getRuanganList } from "../../../services/ruanganService";
import { getKategoriList } from "../../../services/kategoriService";
import { getCabangList } from "../../../services/cabangService";
import { getServerBaseUrl } from "../../../services/serverUrl";

// FIX 1: Cache dropdown di module level dengan TTL — persisten antar buka/tutup modal
const DROPDOWN_TTL = 10 * 60 * 1000; // 10 menit
const dropdownCache = {
  ruangan: null,
  kategori: null,
  cabang: null,
};
const dropdownPromises = {
  ruangan: null,
  kategori: null,
  cabang: null,
};

const getCachedDropdownList = async (key, loader) => {
  const cached = dropdownCache[key];
  // FIX 2: Cek TTL cache agar tidak pakai data basi selamanya
  if (cached && Date.now() - cached.timestamp < DROPDOWN_TTL) {
    return cached.data;
  }
  if (!dropdownPromises[key]) {
    dropdownPromises[key] = loader()
      .then((result) => {
        dropdownCache[key] = {
          data: Array.isArray(result) ? result : [],
          timestamp: Date.now(),
        };
        return dropdownCache[key].data;
      })
      .finally(() => {
        dropdownPromises[key] = null;
      });
  }
  return dropdownPromises[key];
};

const SATUAN_OPTIONS = [
  "Pcs", "Unit", "Buah", "Set", "Pasang",
  "Kg", "Gram", "Ton", "Meter", "Cm", "Mm",
  "Liter", "Ml", "Lembar", "Rim", "Rol",
  "Dus", "Karton", "Pak", "Lusin",
];

// FIX 4: Pisah komponen Field focus state ke dalam Field sendiri (sudah ada),
// tapi perbaiki: Icon tidak perlu re-render class string jika belum berubah
const Field = memo(function Field({
  label, icon: Icon, register: reg, name, rules, error,
  type = "text", placeholder, disabled, options = null,
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const isSelect = options !== null;
  const isTextarea = type === "textarea";

  const inputClass = `w-full py-2.5 pl-9 pr-3 text-sm bg-gray-50 rounded-lg outline-none transition-all duration-200 ${
    hasError
      ? "border-2 border-red-500 focus:border-red-500"
      : focused
      ? "border border-blue-500"
      : "border border-gray-200"
  } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`;

  const focusStyle = focused && !hasError
    ? { boxShadow: "0 0 0 3px rgba(59,130,246,0.1)" }
    : undefined;

  const handlers = {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    disabled,
    style: focusStyle,
  };

  return (
    <div className="mb-5">
      <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            focused ? "text-blue-600" : hasError ? "text-red-500" : "text-gray-400"
          }`}
        />
        {isSelect ? (
          <select
            {...reg(name, rules)}
            {...handlers}
            className={`${inputClass} appearance-none`}
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
            {...handlers}
            rows={3}
            placeholder={placeholder}
            className={`${inputClass} resize-none`}
          />
        ) : (
          <input
            type={type}
            {...reg(name, rules)}
            {...handlers}
            placeholder={placeholder}
            className={`${inputClass} ${type === "number" ? "font-mono" : ""}`}
          />
        )}
      </div>
      {hasError && (
        <div className="flex items-center gap-1.5 mt-2 animate-error-shake">
          <MdErrorOutline className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-[11px] text-red-500">{error.message}</span>
        </div>
      )}
    </div>
  );
});

export default function BarangModal({ isOpen, isEdit, data, onClose, onSubmit, isLoading }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      name: "",
      kode_barang: "",
      ruangan_id: "",
      cabang_id: "",
      kategori_id: "",
      satuan: "",
      keterangan: "",
      tahun_pengadaan: new Date().getFullYear(),
      image: null,
    },
  });

  const [ruanganList, setRuanganList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [cabangList, setCabangList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [loadingSelects, setLoadingSelects] = useState(false);

  // FIX 5: Track apakah dropdown sudah pernah dimuat dalam lifecycle modal ini
  // Dropdown hanya di-load ulang kalau cache kosong (sudah dihandle getCachedDropdownList)
  const dropdownLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadDropdowns = async () => {
      // FIX 6: Jika dropdown sudah di-load dan cache masih ada, skip loading indicator
      const needsFetch =
        !dropdownCache.ruangan || Date.now() - dropdownCache.ruangan.timestamp >= DROPDOWN_TTL;

      if (needsFetch) setLoadingSelects(true);

      try {
        const [ruangan, kategori, cabang] = await Promise.all([
          getCachedDropdownList("ruangan", () => getRuanganList(1, 100)),
          getCachedDropdownList("kategori", () => getKategoriList(1, 100)),
          getCachedDropdownList("cabang", () => getCabangList(1, 100)),
        ]);
        setRuanganList(ruangan);
        setKategoriList(kategori);
        setCabangList(cabang);
        dropdownLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading dropdown data:", error);
      } finally {
        setLoadingSelects(false);
      }
    };

    loadDropdowns();
  }, [isOpen]); // FIX 7: Hapus isEdit, data, reset, setValue dari dependency — tidak perlu

  // FIX 8: Pisah effect untuk isi form agar tidak tergabung dengan loading dropdown
  useEffect(() => {
    if (!isOpen || !isEdit || !data) return;

    queueMicrotask(() => {
      setValue("name", data.name || "");
      setValue("kode_barang", data.kode_barang || "");
      setValue("ruangan_id", String(data.ruangan?.id || data.ruangan_id || ""));
      setValue("cabang_id", String(data.cabang?.id || data.cabang_id || ""));
      setValue("kategori_id", String(data.kategori?.id || data.kategori_id || ""));
      setValue("satuan", data.satuan || "");
      setValue("keterangan", data.keterangan || "");
      setValue("tahun_pengadaan", data.tahun_pengadaan || new Date().getFullYear());

      if (data.image) {
        const imgUrl = data.image.startsWith("http")
          ? data.image
          : `${getServerBaseUrl()}/${data.image}`;
        setImagePreview(imgUrl);
      } else {
        setImagePreview(null);
      }
    });
  }, [isOpen, isEdit, data, setValue]);

  // Animation lifecycle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setMounted(true));
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      document.body.style.overflow = "";
      requestAnimationFrame(() => setVisible(false));
      const t = setTimeout(() => {
        setMounted(false);
        // FIX 9: Reset form dan preview saat modal benar-benar unmount (bukan saat close trigger)
        reset();
        setImagePreview(null);
        dropdownLoadedRef.current = false;
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (formData) => {
    onSubmit({ ...formData, image: formData.image?.[0] || null });
  };

  const handleModalClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleModalClose();
  };

  // Memoize dropdown options
  const kategoriOptions = useMemo(
    () => kategoriList.map((item) => ({ value: String(item.id), label: item.name_kategori })),
    [kategoriList]
  );
  const ruanganOptions = useMemo(
    () => ruanganList.map((item) => ({ value: String(item.id), label: item.name_ruangan })),
    [ruanganList]
  );
  const cabangOptions = useMemo(
    () => cabangList.map((item) => ({ value: String(item.id), label: item.name_cabang })),
    [cabangList]
  );
  // FIX 10: satuanOptions tidak perlu useMemo karena SATUAN_OPTIONS adalah konstanta statis
  // useMemo justru menambah overhead. Tapi karena perlu options format, pakai constanta modul.
  const satuanOptions = SATUAN_OPTIONS_FORMATTED;

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
                {isEdit ? "Edit Barang" : "Tambah Barang"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isEdit ? "Perbarui informasi barang" : "Isi detail barang baru"}
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
          <form onSubmit={handleSubmit(handleFormSubmit)} className="modal-inner-scroll">
            {/* Image Upload */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wide">
                Gambar Barang
              </label>
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <MdImage className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    {...register("image")}
                    onChange={(e) => {
                      register("image").onChange(e);
                      handleImageChange(e);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>
                {imagePreview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
              </div>
            </div>

            <Field label="Nama Barang" icon={MdInventory} register={register} name="name"
              rules={{ required: "Nama barang wajib diisi", minLength: { value: 3, message: "Minimal 3 karakter" } }}
              error={errors.name} placeholder="Masukkan nama barang" disabled={isLoading} />

            <Field label="Kode Barang" icon={MdLabel} register={register} name="kode_barang"
              rules={{ required: "Kode barang wajib diisi", minLength: { value: 2, message: "Minimal 2 karakter" } }}
              error={errors.kode_barang} placeholder="Contoh: BRG001" disabled={isLoading} />

            <Field label="Kategori" icon={MdCategory} register={register} name="kategori_id"
              rules={{ required: "Kategori wajib dipilih" }} error={errors.kategori_id}
              disabled={isLoading || loadingSelects} options={kategoriOptions} />

            <Field label="Ruangan" icon={MdMeetingRoom} register={register} name="ruangan_id"
              rules={{ required: "Ruangan wajib dipilih" }} error={errors.ruangan_id}
              disabled={isLoading || loadingSelects} options={ruanganOptions} />

            <Field label="Cabang" icon={MdStore} register={register} name="cabang_id"
              rules={{ required: "Cabang wajib dipilih" }} error={errors.cabang_id}
              disabled={isLoading || loadingSelects} options={cabangOptions} />

            <Field label="Satuan" icon={MdStraighten} register={register} name="satuan"
              rules={{ required: "Satuan wajib dipilih" }} error={errors.satuan}
              disabled={isLoading} options={satuanOptions} />

            <Field label="Tahun Pengadaan" icon={MdCalendarToday} register={register} name="tahun_pengadaan"
              rules={{
                required: "Tahun pengadaan wajib diisi",
                min: { value: 1900, message: "Tahun tidak valid" },
                max: { value: new Date().getFullYear(), message: "Tahun tidak boleh melebihi tahun saat ini" },
              }}
              error={errors.tahun_pengadaan} placeholder={new Date().getFullYear().toString()}
              type="number" disabled={isLoading} />

            <Field label="Keterangan" icon={MdDescription} register={register} name="keterangan"
              rules={{}} error={errors.keterangan}
              placeholder="Masukkan keterangan barang (opsional)" type="textarea" disabled={isLoading} />

            <div className="px-3 py-2.5 mb-6 rounded-lg bg-blue-50 border border-blue-200 text-xs text-gray-500 leading-relaxed flex items-start gap-3">
              <MdInfo className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                Pastikan semua data barang terisi dengan lengkap dan benar. Kode barang harus unik untuk memudahkan pencarian dan inventarisasi.
              </div>
            </div>

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

    </>
  , document.body);
}

// FIX 11: Konstanta statis di module level — tidak dibuat ulang tiap render
const SATUAN_OPTIONS_FORMATTED = SATUAN_OPTIONS.map((s) => ({ value: s, label: s }));