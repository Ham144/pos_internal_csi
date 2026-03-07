import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPaymentMethod,
  createPaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodStatus,
} from "../api/paymentMethodApi";

import {
  Plus,
  CreditCard,
  Percent,
  Coins,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Banknote,
  QrCode,
  Wallet,
  Landmark,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Info,
  Edit,
} from "lucide-react";

const PaymentMethod = () => {
  const queryClient = useQueryClient();

  // State untuk modal tambah metode pembayaran
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk alert/notifikasi
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // State untuk form
  const [formData, setFormData] = useState({
    method: "",
    discount: "",
    additional_fee: "",
    status: true,
  });

  // State untuk konfirmasi hapus
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  // Menggunakan TanStack Query untuk fetch data
  const {
    data: paymentMethods = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: getAllPaymentMethod,
  });

  // Mutasi untuk menambah metode pembayaran
  const createMutation = useMutation({
    mutationFn: createPaymentMethod,
    onSuccess: () => {
      showAlert("Metode pembayaran berhasil ditambahkan");
      setIsModalOpen(false);
      setFormData({
        method: "",
        discount: "",
        additional_fee: "",
        status: true,
      });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => {
      showAlert("Gagal menambahkan metode pembayaran", "error");
    },
  });

  // Mutasi untuk menghapus metode pembayaran
  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      showAlert("Metode pembayaran berhasil dihapus");
      setDeleteConfirm({ show: false, id: null });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => {
      showAlert("Gagal menghapus metode pembayaran", "error");
    },
  });

  // Mutasi untuk mengubah status metode pembayaran
  const toggleStatusMutation = useMutation({
    mutationFn: togglePaymentMethodStatus,
    onSuccess: () => {
      showAlert("Status metode pembayaran berhasil diubah");
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => {
      showAlert("Gagal mengubah status metode pembayaran", "error");
    },
  });

  // Fungsi untuk menampilkan alert/notifikasi
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fungsi untuk menangani perubahan pada form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Fungsi untuk menambah metode pembayaran baru
  const handleAddPaymentMethod = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Fungsi untuk menghapus metode pembayaran
  const handleDeletePaymentMethod = (id) => {
    deleteMutation.mutate(id);
  };

  // Fungsi untuk mengubah status aktif/nonaktif metode pembayaran
  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  if (error) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert/Notifikasi */}
        {alert.show && (
          <div className="fixed top-4 right-4 z-50 animate-slideIn">
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl ${
                alert.type === "error"
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600"
              } text-white`}
            >
              {alert.type === "error" ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
              <span className="font-medium">{alert.message}</span>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Metode Pembayaran
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  Atur kategori pembayaran yang akan berguna untuk perhitungan
                  dashboard sales report
                  <div
                    className="tooltip tooltip-right"
                    data-tip="Metode pembayaran yang aktif akan tersedia untuk transaksi"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </div>
                </p>
              </div>
            </div>
            <button
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-blue-200"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Tambah Metode Pembayaran
            </button>
          </div>
        </div>

        {/* Tabel Metode Pembayaran */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium">
                  Memuat data metode pembayaran...
                </p>
              </div>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="flex flex-col justify-center items-center p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <CreditCard className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Belum Ada Metode Pembayaran
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Tambahkan metode pembayaran pertama Anda untuk mulai menerima
                pembayaran melalui aplikasi mobile.
              </p>
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-5 h-5" />
                Tambah Metode Pembayaran
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Metode Pembayaran
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Diskon
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Biaya Tambahan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {paymentMethods.map((method) => (
                    <tr
                      key={method._id}
                      className="hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                            {method.method.toLowerCase().includes("qris") ? (
                              <QrCode className="w-5 h-5 text-blue-600" />
                            ) : method.method.toLowerCase().includes("bank") ? (
                              <Landmark className="w-5 h-5 text-blue-600" />
                            ) : method.method.toLowerCase().includes("cash") ? (
                              <Banknote className="w-5 h-5 text-blue-600" />
                            ) : method.method
                                .toLowerCase()
                                .includes("wallet") ? (
                              <Wallet className="w-5 h-5 text-blue-600" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <span className="font-medium text-gray-800">
                            {method.method}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {method.discount ? (
                          <div className="flex items-center gap-1">
                            <Percent className="w-4 h-4 text-emerald-500" />
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium">
                              {method.discount}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {method.additional_fee ? (
                          <div className="flex items-center gap-1">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-medium">
                              Rp {method.additional_fee.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              method.status
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {method.status ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <div className="tooltip" data-tip={"manage"}>
                            <button
                              onClick={() => {
                                // setSelectedMethod(method);
                                // document
                                //   .getElementById("edit-payment-method-modal")
                                //   .showModal();
                              }}
                              disabled={toggleStatusMutation.isPending}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                method.status
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <Edit />
                            </button>
                          </div>
                          <div
                            className="tooltip"
                            data-tip={
                              method.status ? "Nonaktifkan" : "Aktifkan"
                            }
                          >
                            <button
                              onClick={() => handleToggleStatus(method._id)}
                              disabled={toggleStatusMutation.isPending}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                method.status
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {method.status ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>
                          </div>

                          <div className="tooltip" data-tip="Hapus">
                            <button
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200"
                              onClick={() =>
                                setDeleteConfirm({ show: true, id: method._id })
                              }
                              disabled={
                                toggleStatusMutation.isPending ||
                                deleteMutation.isPending
                              }
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Tambah Metode Pembayaran */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-scaleIn">
              {/* Header Modal */}
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Tambah Metode Pembayaran
                    </h3>
                  </div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData({
                        method: "",
                        discount: "",
                        additional_fee: "",
                        status: true,
                      });
                    }}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nama Metode Pembayaran
                  </label>
                  <input
                    type="text"
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    placeholder="Contoh: QRIS, Bank Transfer, Cash"
                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Masukkan nama metode pembayaran
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      Detail Tambahan (Opsional)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Percent className="w-4 h-4 text-blue-500" />
                      Diskon (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      placeholder="0 - 100"
                      className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Biaya Tambahan (Rp)
                    </label>
                    <input
                      type="number"
                      name="additional_fee"
                      value={formData.additional_fee}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Contoh: 5000"
                      className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Info className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-700">
                          Status Aktif
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.status
                            ? "Metode pembayaran akan langsung tersedia untuk transaksi"
                            : "Metode pembayaran tidak akan ditampilkan di aplikasi"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          status: !prev.status,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.status ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.status ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {/* Footer Modal */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormData({
                        method: "",
                        discount: "",
                        additional_fee: "",
                        status: true,
                      });
                    }}
                    disabled={createMutation.isPending}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </div>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-scaleIn">
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Konfirmasi Hapus
                </h3>
                <p className="text-gray-600 mb-2">
                  Apakah Anda yakin ingin menghapus metode pembayaran ini?
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setDeleteConfirm({ show: false, id: null })}
                    disabled={deleteMutation.isPending}
                  >
                    Tidak
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    onClick={() => handleDeletePaymentMethod(deleteConfirm.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menghapus...</span>
                      </div>
                    ) : (
                      "Ya, Hapus"
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

export default PaymentMethod;
