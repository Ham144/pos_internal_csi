import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getConfigUnlistedSource,
  updateConfigUnlistedSource,
  resetConfigUnlistedSource,
  getUnlistedLibraryByQueries,
} from "../api/unlistedLibraryApi";

import {
  Settings,
  Package,
  Globe,
  Key,
  Database,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Power,
  Star,
  Clock,
  Info,
  Trash2,
  X,
  ChevronRight,
  ExternalLink,
  FileText,
  Tag,
  HelpCircle,
} from "lucide-react";

const SumberThirdParty = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("config");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pilihan interval refresh token
  const cronIntervals = [5, 10, 15, 20, 30, 50, 75, 90];

  // State untuk form fields sesuai dengan model ConfigUnlistedLibrary
  const [formData, setFormData] = useState({
    isDefault: false,
    inUse: true,
    baseEndpoint: "",
    getTokenEndpoint: "",
    getProductsEndpoint: "",
    stringQueries: "",
    latestToken: "",
    cronInterval: 20, // Default 30 hari
    start_date: "", // Default start_date
    end_date: "", // Default end_date
  });

  // State untuk form validation errors
  const [errors, setErrors] = useState({});

  // Query untuk mengambil konfigurasi
  const {
    data: configData,
    isLoading: isLoadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ["unlistedLibraryConfig"],
    queryFn: async () => {
      const response = await getConfigUnlistedSource();
      return response.data;
    },
  });

  // Mutation untuk update konfigurasi
  const updateMutation = useMutation({
    mutationFn: updateConfigUnlistedSource,
    onSuccess: () => {
      setSuccessMessage("Konfigurasi berhasil disimpan");
      setTimeout(() => setSuccessMessage(""), 3000);
      queryClient.invalidateQueries({ queryKey: ["unlistedLibraryConfig"] });
    },
    onError: (error) => {
      console.error("Error updating config:", error);
    },
  });

  // Mutation untuk reset konfigurasi
  const resetMutation = useMutation({
    mutationFn: resetConfigUnlistedSource,
    onSuccess: () => {
      setShowResetConfirm(false);
      setSuccessMessage("Konfigurasi berhasil direset");
      setTimeout(() => setSuccessMessage(""), 3000);
      queryClient.invalidateQueries({ queryKey: ["unlistedLibraryConfig"] });
    },
    onError: (error) => {
      console.error("Error resetting config:", error);
    },
  });

  // Mutation untuk fetch produk
  const fetchProductsMutation = useMutation({
    mutationFn: () => getUnlistedLibraryByQueries(),
    onSuccess: (data) => {
      setSuccessMessage("Data produk berhasil diperbarui");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });

  useEffect(() => {
    // Isi form dengan data konfigurasi yang sudah ada
    if (configData) {
      setFormData({
        isDefault: configData.isDefault || false,
        inUse: configData.inUse !== undefined ? configData.inUse : true,
        baseEndpoint: configData.baseEndpoint || "",
        getTokenEndpoint: configData.getTokenEndpoint || "",
        getProductsEndpoint: configData.getProductsEndpoint || "",
        stringQueries: configData.stringQueries || "",
        latestToken: configData.latestToken || "",
        cronInterval: configData.cronInterval || 30,
        start_date: configData.start_date || "",
        end_date: configData.end_date || "",
      });
    }
  }, [configData]);

  // Handler untuk perubahan form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Jika input type checkbox, gunakan checked property
    const inputValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    // Hapus error jika user mulai mengetik
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Validasi form sebelum submit
  const validateForm = () => {
    const newErrors = {};

    if (!formData.baseEndpoint.trim()) {
      newErrors.baseEndpoint = "Base Endpoint wajib diisi";
    }

    if (!formData.getTokenEndpoint.trim()) {
      newErrors.getTokenEndpoint = "Token Endpoint wajib diisi";
    }

    if (!formData.getProductsEndpoint.trim()) {
      newErrors.getProductsEndpoint = "Products Endpoint wajib diisi";
    }

    // Token akan dikelola oleh cron job, jadi tidak perlu validasi di sini

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler untuk menyimpan perubahan konfigurasi
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      updateMutation.mutate(formData);
    }
  };

  // Handler untuk reset konfigurasi
  const handleReset = () => {
    resetMutation.mutate();
  };

  // Handler untuk mengambil data produk
  const handleFetchProducts = () => {
    fetchProductsMutation.mutate();
  };

  // Status loading
  const isLoading =
    isLoadingConfig ||
    updateMutation.isPending ||
    resetMutation.isPending ||
    fetchProductsMutation.isPending;

  // Error handling
  const error =
    configError ||
    updateMutation.error ||
    resetMutation.error ||
    fetchProductsMutation.error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
            <Settings className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Konfigurasi Sumber Third Party
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1">
              Kelola koneksi dan sinkronisasi data dari sumber eksternal
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </p>
          </div>
        </div>

        {/* Alert untuk pesan sukses */}
        {successMessage && (
          <div className="mb-6 animate-slideIn">
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Alert untuk error */}
        {error && (
          <div className="mb-6 animate-slideIn">
            <div className="flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-red-200">
              <AlertCircle className="w-6 h-6" />
              <span className="font-medium">
                {error?.message || "Terjadi kesalahan"}
              </span>
            </div>
          </div>
        )}

        {/* Tabs untuk navigasi */}
        <div className="bg-white p-1 rounded-2xl shadow-md border border-blue-100 mb-8 inline-flex">
          <button
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === "config"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                : "text-gray-600 hover:bg-blue-50"
            }`}
            onClick={() => setActiveTab("config")}
          >
            <Settings className="w-4 h-4" />
            Konfigurasi
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === "products"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                : "text-gray-600 hover:bg-blue-50"
            }`}
            onClick={() => setActiveTab("products")}
          >
            <Package className="w-4 h-4" />
            Produk
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-gray-500 font-medium">Memuat data...</p>
            </div>
          </div>
        )}

        {/* Form Konfigurasi */}
        {activeTab === "config" && !isLoading && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
            <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pengaturan Konfigurasi API
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Status Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Power className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="block font-semibold text-gray-800">
                          Status Konfigurasi
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formData.inUse
                            ? "Konfigurasi aktif dan siap digunakan"
                            : "Konfigurasi tidak aktif"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, inUse: !prev.inUse }))
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        formData.inUse ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.inUse ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                <div className="bg-amber-50 rounded-xl p-5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Star className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <span className="block font-semibold text-gray-800">
                          Jadikan Default
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formData.isDefault
                            ? "Konfigurasi ini akan digunakan sebagai default"
                            : "Bukan konfigurasi default"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          isDefault: !prev.isDefault,
                        }))
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        formData.isDefault ? "bg-amber-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          formData.isDefault ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Base Endpoint */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Base Endpoint
                    <div
                      className="tooltip tooltip-right"
                      data-tip="Base endpoint untuk mengambil data dari third party"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="baseEndpoint"
                      className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200 ${
                        errors.baseEndpoint
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="https://api.example.com"
                      value={formData.baseEndpoint}
                      onChange={handleChange}
                    />
                    {errors.baseEndpoint && (
                      <span className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.baseEndpoint}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Contoh: https://api.distributor.com
                  </p>
                </div>

                {/* Token Endpoint */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Key className="w-4 h-4 text-blue-600" />
                    Token Endpoint
                    <div
                      className="tooltip tooltip-right"
                      data-tip="Endpoint untuk mendapatkan token jika sudah expired"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="getTokenEndpoint"
                      className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200 ${
                        errors.getTokenEndpoint
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="/oauth/token"
                      value={formData.getTokenEndpoint}
                      onChange={handleChange}
                    />
                    {errors.getTokenEndpoint && (
                      <span className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.getTokenEndpoint}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Contoh: /oauth/token (endpoint untuk mendapatkan token)
                  </p>
                </div>

                {/* Products Endpoint */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Database className="w-4 h-4 text-blue-600" />
                    Products Endpoint
                    <div
                      className="tooltip tooltip-right"
                      data-tip="Endpoint untuk mengambil data produk"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="getProductsEndpoint"
                      className={`w-full pl-4 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200 ${
                        errors.getProductsEndpoint
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="/api/products"
                      value={formData.getProductsEndpoint}
                      onChange={handleChange}
                    />
                    {errors.getProductsEndpoint && (
                      <span className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.getProductsEndpoint}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Contoh: /api/products (endpoint untuk mengambil data produk)
                  </p>
                </div>

                {/* String Queries */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    String Queries
                    <div
                      className="tooltip tooltip-right"
                      data-tip="Parameter query untuk request API"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  </label>
                  <input
                    type="text"
                    name="stringQueries"
                    className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                    placeholder="per_page=100&sort=date"
                    value={formData.stringQueries}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500">
                    Contoh: per_page=100 (parameter tambahan untuk request API)
                  </p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Dimulai dari tanggal
                      <div
                        className="tooltip tooltip-right"
                        data-tip="Default: hari ini - 30 hari"
                      >
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>
                    </label>
                    <input
                      type="text"
                      name="start_date"
                      className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="YYYY-MM-DD"
                      value={formData.start_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Sampai dengan tanggal
                      <div
                        className="tooltip tooltip-right"
                        data-tip="Default: hari ini"
                      >
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>
                    </label>
                    <input
                      type="text"
                      name="end_date"
                      className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="YYYY-MM-DD"
                      value={formData.end_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Interval Pembaruan Token */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    Interval Pembaruan Token
                    <div
                      className="tooltip tooltip-right"
                      data-tip="Waktu interval otomatis menjalankan konfigurasi"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  </label>
                  <select
                    name="cronInterval"
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                    value={formData.cronInterval}
                    onChange={handleChange}
                  >
                    {cronIntervals.map((interval) => (
                      <option key={interval} value={interval}>
                        {interval} Hari
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Token akan diperbarui secara otomatis sesuai interval yang
                      dipilih
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium shadow-lg shadow-red-200 flex items-center gap-2"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Konfigurasi
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Update Konfigurasi
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Produk */}
        {activeTab === "products" && !isLoading && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
            <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Data Produk dari Third Party
                </h2>
                <button
                  onClick={handleFetchProducts}
                  disabled={isLoading || !configData}
                  className="px-5 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium shadow-lg flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Perbarui Data
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Info Konfigurasi */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Informasi Konfigurasi Saat Ini
                </h3>

                {configData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Base Endpoint:</span>
                        <span className="font-mono text-blue-600 bg-white px-2 py-1 rounded-lg text-xs">
                          {configData.baseEndpoint}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">
                          Products Endpoint:
                        </span>
                        <span className="font-mono text-blue-600 bg-white px-2 py-1 rounded-lg text-xs">
                          {configData.getProductsEndpoint}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            configData.inUse
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {configData.inUse ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Default:</span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            configData.isDefault
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {configData.isDefault ? "Ya" : "Tidak"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Interval:</span>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-medium">
                          {configData.cronInterval} Hari
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Konfigurasi belum tersedia
                  </p>
                )}
              </div>

              {/* Info Text */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-950 mt-0.5" />
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      Klik tombol{" "}
                      <span className="font-semibold text-blue-600">
                        "Perbarui Data"
                      </span>{" "}
                      untuk mengambil data terbaru dari API third party dan
                      menyimpannya ke database.
                    </p>
                    <p className="text-gray-500 mt-2 text-sm flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Data akan disimpan sebagai referensi untuk inventory dan
                      brand.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Reset */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-scaleIn">
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Konfirmasi Reset
                </h3>
                <p className="text-gray-600 mb-6">
                  Apakah Anda yakin ingin mereset konfigurasi? Tindakan ini
                  tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Batal
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Meriset...</span>
                      </div>
                    ) : (
                      "Reset"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SumberThirdParty;
