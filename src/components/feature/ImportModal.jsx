import { useRef, useState } from 'react';
import {
  MdClose,
  MdDownload,
  MdUpload,
  MdCheckCircle,
  MdError,
  MdDescription,
  MdWarningAmber,
  MdUploadFile,
} from 'react-icons/md';

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  onDownloadTemplate,
  title = 'Import Data',
  isLoading = false,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi file adalah Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      if (!validTypes.includes(file.type)) {
        alert('Hanya file Excel (.xlsx, .xls) yang diperbolehkan');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    setIsImporting(true);
    try {
      const response = await onImport(selectedFile);
      setResult(response);
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        error: true,
        message: error.response?.data?.message || error.message || 'Gagal mengimport data',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await onDownloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download template error:', error);
      alert('Gagal mengunduh template');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!result ? (
            <div className="space-y-5">
              {/* Template Download Section */}
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 bg-blue-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MdDownload className="w-4 h-4 text-blue-600" />
                  <span>Unduh Template Terlebih Dahulu</span>
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Gunakan template yang sudah disediakan untuk memastikan format data sesuai.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdDownload className="w-4 h-4" />
                  Unduh Template Excel
                </button>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MdUploadFile className="w-4 h-4 text-gray-600" />
                  <span>Pilih File untuk Diimport</span>
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Pastikan file adalah Excel (.xlsx) dengan format sesuai template.
                </p>

                {selectedFile ? (
                  <div className="flex items-center justify-between bg-white border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <MdDescription className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MdClose className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-white transition-all"
                  >
                    <div className="mb-2 flex justify-center">
                      <MdUpload className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Klik untuk memilih file
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      atau drag & drop file Excel
                    </p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Info Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800 leading-relaxed flex items-start gap-2">
                  <MdWarningAmber className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Catatan:</strong> Data dimulai dari baris ke-5 sesuai template.
                    Jangan menghapus baris judul dan header (baris 1-4).
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengimport...</span>
                    </>
                  ) : (
                    <>
                      <MdUpload className="w-4 h-4" />
                      <span>Mulai Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result Section */
            <div className="space-y-4">
              {result.error ? (
                <div className="border border-red-200 bg-red-50 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <MdError className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">Import Gagal</h3>
                      <p className="text-sm text-red-700">{result.message}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="border border-green-200 bg-green-50 rounded-lg p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <MdCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900">Import Selesai</h3>
                        <p className="text-sm text-green-700 mt-1">
                          {result.berhasil} data berhasil diimport
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Failed Items */}
                  {result.detail_gagal && result.detail_gagal.length > 0 && (
                    <div className="border border-orange-200 bg-orange-50 rounded-lg p-5">
                      <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                        <MdWarningAmber className="w-4 h-4" />
                        <span>{result.gagal} Data Gagal ({result.detail_gagal.length})</span>
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.detail_gagal.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-orange-200 rounded p-3 text-xs"
                          >
                            <p className="font-medium text-gray-900">
                              Baris {item.row}: {item.kode_barang || item.name_cabang || item.name_supplier}
                            </p>
                            <ul className="mt-1 text-orange-700 space-y-1">
                              {item.errors.map((err, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-orange-400 mt-1">•</span>
                                  <span>{err}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setResult(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Ulangi Import
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
