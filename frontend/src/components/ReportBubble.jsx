import React, { useState, useRef } from "react";
import { createReport } from "../api/reportApi";
import { toast, Toaster } from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle,
  File,
  Info,
  RefreshCw,
  Send,
  Upload,
  X,
} from "lucide-react";

const ReportBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "placeholder.jpg", // Default placeholder jika tidak ada gambar yang diupload
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP",
      );
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB");
      return;
    }

    // Buat URL untuk preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Simpan base64 string ke formData
      setFormData((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      image: "placeholder.jpg", // Kembali ke placeholder default
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form
    if (!formData.title) {
      toast.error("Judul wajib diisi");
      return;
    }

    if (!formData.description) {
      toast.error("Deskripsi wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      await createReport(formData);
      toast.success("Laporan berhasil dikirim");
      setIsOpen(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        image: "placeholder.jpg",
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(error.response.data.message || "Gagal mengirim laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Toaster />
      <dialog
        id="report_modal"
        className={`modal ${isOpen ? "modal-open" : ""}`}
      >
        <div className="modal-box max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
          {/* Header dengan gradient blue */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Buat Laporan Error
                  </h3>
                  <p className="text-sm text-blue-100">
                    Laporkan masalah yang Anda temui
                  </p>
                </div>
              </div>
              <button
                className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Title Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700 flex items-center gap-1">
                    Judul Laporan
                    <span className="text-red-500 text-lg">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input input-bordered w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Contoh: Error saat mencetak invoice"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-400">
                    Gunakan judul yang singkat dan jelas
                  </span>
                </label>
              </div>

              {/* Description Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700 flex items-center gap-1">
                    Deskripsi Lengkap
                    <span className="text-red-500 text-lg">*</span>
                  </span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 backdrop-blur-sm min-h-[120px]"
                  placeholder="Jelaskan secara detail masalah yang Anda alami... 
• saat melakukan apa?
• URL nya?
• Kapan terjadi?"
                  rows={4}
                />
              </div>

              {/* Image Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700 flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-500" />
                    Lampiran Gambar
                  </span>
                </label>

                <input
                  type="file"
                  id="image"
                  name="image"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  hidden
                />

                <div
                  className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
                            ${
                              imagePreview
                                ? "border-blue-300 bg-blue-50/30"
                                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                            }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {!imagePreview ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <div className="p-3 bg-blue-100 rounded-full mb-3">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Klik untuk mengunggah gambar
                      </p>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Format: JPG, PNG, GIF, WEBP • Maks. 5MB
                      </p>
                      <p className="text-xs text-blue-500 mt-2">
                        💡 Screenshot akan membantu kami lebih cepat memahami
                        masalah
                      </p>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-56 object-contain bg-gray-100 p-2"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="bg-white text-gray-700 rounded-full p-2 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                        Klik untuk mengganti
                      </div>
                    </div>
                  )}
                </div>

                {imagePreview && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Gambar siap diunggah
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Informasi Penting
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
                      <li>Tim support akan merespon dalam 1x24 jam</li>
                      <li>Jelaskan Error </li>
                      <li>Pastikan gambar yang diunggah jelas terbaca</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-action mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 gap-2"
                onClick={closeModal}
              >
                <X className="w-4 h-4" />
                Batal
              </button>
              <button
                type="submit"
                className="btn bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 hover:from-blue-700 hover:to-blue-800 gap-2 shadow-lg shadow-blue-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Mengirim Laporan...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Laporan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="modal-backdrop" onClick={closeModal}></div>
      </dialog>
    </>
  );
};

export default ReportBubble;
