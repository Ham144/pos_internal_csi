import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  getPurchaseOrderList,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../api/purchaseOrderApi";
import { toast } from "react-hot-toast";
import { getAllinventories } from "../api/itemLibraryApi";
import PickSingleInventoriesDialog from "../components/singleInventoriesList";
import { useFilter } from "../store";
import ModalOptions from "../components/ModalOptions";
import { useNavigate } from "react-router";
import ModalDetailPurchaseOrder from "@/components/ModalDetailPurchaseOrder";

import {
  Download,
  Upload,
  PlusCircle,
  FileText,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Edit,
  Eye,
  PackageIcon,
  Truck,
  Barcode,
  FileSpreadsheet,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCw,
} from "lucide-react";

export default function PurchaseOrdersCreate() {
  const [file, setFile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const navigate = useNavigate();

  //temporary
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tempSeelectedOrder, setTempSelectedOrder] = useState(null);
  const [newOrder, setNewOrder] = useState(null);
  const [tempSkuTerpilih, setTempSkuTerplih] = useState();
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  //tanstack
  const queryClient = useQueryClient();

  //zustand
  const { filter, setFilter } = useFilter();

  const { data: inventoriyList } = useQuery({
    queryKey: ["inventories", filter],
    queryFn: (filter) => getAllinventories(filter),
  });

  const { mutateAsync: handleUpdatePurchaseOrder } = useMutation({
    mutationFn: (order) => updatePurchaseOrder(order),
    onSuccess: (response) => {
      queryClient.invalidateQueries(["purchaseOrder"]);
      toast.success(response.message);
      setIsOpen(false);
      setNewOrder();
      setSelectedOrder();
    },
    onError: (error) => {
      console.log(error);
      toast.error(error?.response?.data?.message);
    },
  });

  const { mutateAsync: handleCreatePurchaseOrder } = useMutation({
    mutationFn: (body) => createPurchaseOrder(body),
    onSuccess: (response) => {
      toast.success(response?.message);
      queryClient.invalidateQueries(["purchaseOrder"]);
      setIsOpen(false);
      setNewOrder();
      setSelectedOrder();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message);
      toast.error(error?.response?.data?.missingSkus.join(", "));
    },
  });

  const { mutateAsync: handleDeletePurchaseOrder } = useMutation({
    mutationFn: async (orderId) => {
      const response = await deletePurchaseOrder(orderId);
      return response?.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["purchaseOrder"]);
      toast.success("berhasil menghapus PO");
      setSelectedOrder(null);
      setNewOrder(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error?.response?.data?.message || "Gagal menghapus PO");
    },
  });

  const { data: purchaseOrderList } = useQuery({
    queryKey: ["purchaseOrder", dateRange],
    queryFn: () =>
      getPurchaseOrderList({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleImportPurchaseOrder = () => {
    setFile(null);
    setIsOpen(true);
  };

  const handleSubmitImportPO = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split("\n");

      // Skip header row
      const dataRows = rows.slice(1);

      const purchaseOrders = [];
      let currentPO = null;

      dataRows.forEach((row) => {
        if (!row.trim()) return; // Skip empty rows

        const columns = row.split(",").map((col) => col.trim());
        const [erp, plat, sku, request, barcode, keterangan] = columns;

        // Jika ada Erp, ini adalah PO baru
        if (erp) {
          if (currentPO) {
            purchaseOrders.push(currentPO);
          }
          currentPO = {
            Erp: erp,
            plat: plat || "",
            items: [],
          };
        }

        // Jika ada SKU, tambahkan sebagai item
        if (sku) {
          currentPO.items.push({
            sku: sku,
            request: parseInt(request) || 0,
            barcodeItem: barcode || "",
            keterangan: keterangan || "",
            received: 0,
          });
        }
      });

      // Jangan lupa untuk push PO terakhir
      if (currentPO) {
        purchaseOrders.push(currentPO);
      }

      try {
        for (const order of purchaseOrders) {
          await handleCreatePurchaseOrder(order);
        }
        setIsOpen(false);
        setFile(null);
        toast.success(
          `Successfully created ${purchaseOrders.length} purchase orders`,
        );
      } catch (error) {
        console.error("Error creating purchase orders:", error);
        toast.error(
          error?.response?.data?.message || "Failed to create purchase orders",
        );
      }
    };
    reader.readAsText(file);
  };

  const statusPercentage = (order) => {
    // Pastikan order dan items ada
    if (
      !order ||
      !order.items ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return 0; // Kembalikan 0% jika tidak ada item
    }

    // Hitung total request dan total received
    const totalRequest = order.items.reduce(
      (sum, item) => sum + (item.request || 0),
      0,
    );
    const totalReceived = order.items.reduce(
      (sum, item) => sum + (item.received || 0),
      0,
    );

    // Jika totalRequest adalah 0, kembalikan 0% untuk menghindari pembagian dengan 0
    if (totalRequest === 0) {
      return 0;
    }

    // Hitung persentase
    const percentage = (totalReceived / totalRequest) * 100;

    // Bulatkan ke 2 desimal dan pastikan tidak melebihi 100%
    return Math.min(Math.round(percentage * 100) / 100, 100);
  };

  const handleExportPurchaseOrder = () => {
    // Template headers dengan format baru
    const headers = [
      "Purchase Code (Erp)",
      "Plat",
      "SKU",
      "Request",
      "Barcode",
      "Keterangan",
    ];

    // Contoh template dengan 2 baris untuk memperlihatkan format
    const templateRows = [
      ["PO-001", "B1234CD", "14FSK", "5", "BARC123", "keterangan"],
      ["", "", "12DARTW", "2", "BARC789", "adawd"], // Baris kedua untuk item yang sama
      ["PO-002", "B5678EF", "12DSETWI", "5", "BARC123", "keqw3rwq"], // PO baru
    ];

    const rows = [headers, ...templateRows];
    const csvContent = rows.map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    link.download = "purchase_order_template.csv";
    link.click();
  };

  const handleKonfirmasiSkuPurchaseCode = () => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...(selectedOrder?.items || newOrder?.items)];

      // Simpan nilai barcode yang sudah ada sebelumnya
      const existingBarcodeItem = updatedItems[selectedItemIndex].barcodeItem;

      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        sku: tempSkuTerpilih,
        // Pertahankan nilai barcode yang sudah ada, jangan otomatis ambil dari inventori
        barcodeItem: existingBarcodeItem || "",
      };

      if (selectedOrder) {
        setSelectedOrder({
          ...selectedOrder,
          items: updatedItems,
        });
      } else {
        setNewOrder({
          ...newOrder,
          items: updatedItems,
        });
      }
    }
    setTempSkuTerplih(null);
    setShowSkuModal(false);
    setSelectedItemIndex(null);
    document.getElementById("picksingleinventoriesdialog").close();
  };

  const handleClickRow = (order) => {
    setSelectedOrder(null);
    const statusAllCompleted = order.items.every((item) => {
      // Pastikan mengembalikan nilai boolean di semua kondisi
      return item.received >= item.request;
    });

    // Set order yang dipilih
    setTempSelectedOrder(order);
    setSelectedOrder(order);

    if (statusAllCompleted) {
      document.getElementById("modalDetailPurchaseOrder").showModal();
    } else {
      document.getElementById("clickrow").showModal();
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder?._id) {
      toast.error("No purchase order selected");
      return;
    }

    if (
      selectedOrder.status === "terpenuhi" ||
      selectedOrder.status === "dibatalkan"
    ) {
      toast.error("Cannot delete completed or cancelled orders");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase order? This action cannot be undone.",
    );

    if (confirmed) {
      try {
        await handleDeletePurchaseOrder(selectedOrder._id);
      } catch (error) {
        console.error("Error deleting purchase order:", error);
      }
    }
  };

  function downloadPurchaseOrderCsv() {
    if (!purchaseOrderList?.data?.length) {
      return toast("tidak ada yang bisa didownload");
    }
    const rows = [];

    // Header CSV
    rows.push([
      "Erp",
      "Plat",
      "Dibuat Oleh",
      "Dipenuhi Oleh",
      "SKU",
      "Request",
      "Received",
      "Keterangan",
      "Tanggal Terpenuhi",
      "Time",
    ]);

    // Isi data dari setiap PO dan item-nya
    purchaseOrderList?.data.forEach((po) => {
      po.items.forEach((item) => {
        rows.push([
          po.Erp,
          po.plat,
          po.dibuatOleh,
          po.dipenuhiOleh,
          item.sku,
          item.request,
          item.received,
          item.keterangan,
          new Date(item.tanggalTerpenuhi).toLocaleString("id-ID"), // Format tanggal
        ]);
      });
    });

    // Konversi ke CSV string
    const csvContent = rows.map((e) => e.join(",")).join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "purchase_order.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-gray-50 p-4">
      {/* Header Actions */}
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
              <PackageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Purchase Order
              </h1>
              <p className="text-sm text-gray-500">
                Kelola dan monitor semua purchase order
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Total Data Badge */}
            <div className="badge badge-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 px-4 py-3">
              <FileText className="w-4 h-4 mr-2" />
              Total: {purchaseOrderList?.data?.length || 0}
            </div>

            {/* Download All Button */}
            <button
              onClick={downloadPurchaseOrderCsv}
              className="btn bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Semua
            </button>

            {/* Create New PO Button */}
            <button
              onClick={() => {
                setSelectedOrder(null);
                setNewOrder({ Erp: "", plat: "" });
              }}
              className="btn bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Buat PO Baru
            </button>

            {/* Import/Export Dropdown */}
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-outline border-gray-300 hover:bg-blue-50 hover:border-blue-300"
              >
                <Download className="w-5 h-5 mr-2" />
                Import/Export
              </label>
              <ul className="dropdown-content z-40 menu p-2 shadow-xl bg-white rounded-xl w-56 border border-blue-100">
                <li>
                  <button
                    onClick={handleImportPurchaseOrder}
                    className="flex items-center gap-2 text-gray-700 hover:bg-blue-50 rounded-lg p-3"
                  >
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span>Import CSV</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Anda akan meng-export template. Pastikan Anda membaca instruksi: " +
                          "Ganti 'Purchase Code (Erp)' untuk membuat PO baru yang unik. " +
                          "Jika 'Purchase Code (Erp)' sama dengan yang sudah ada, akan terjadi error.",
                      );
                      if (confirmed) handleExportPurchaseOrder();
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:bg-blue-50 rounded-lg p-3"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span>Export Template</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Badge */}
        <div className="mt-4 flex items-center gap-2">
          <div className="badge badge-info gap-2 p-3 bg-blue-50 text-blue-700 border-blue-200">
            <Info className="w-4 h-4" />
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate("/artikel_documentation")}
            >
              Kunjungi artikel documentation untuk tutorial import/export
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Table Section */}
        <div
          className={`transition-all duration-300 ${
            selectedOrder || newOrder ? "lg:w-2/3" : "w-full"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                      Purchase Code (ERP)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">
                      Plat
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">
                      Jumlah Item
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-white uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseOrderList?.data?.length > 0 ? (
                    purchaseOrderList.data.map((order, index) => (
                      <tr
                        key={order._id || index}
                        onClick={() => handleClickRow(order)}
                        className={`
                                                ${index % 2 === 0 ? "bg-white" : "bg-blue-50/30"}
                                                hover:bg-blue-100/50 transition-colors cursor-pointer group
                                            `}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                              <PackageIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-blue-700">
                              {order.Erp}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.plat || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {order.items?.length || 0} item
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${statusPercentage(order)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-center mt-1 font-medium text-gray-600">
                            {statusPercentage(order)}% selesai
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <PackageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">
                            Tidak ada data Purchase Order
                          </p>
                          <button
                            onClick={() => setNewOrder({ Erp: "", plat: "" })}
                            className="mt-4 btn btn-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Buat PO Pertama
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Form Section */}
        {(selectedOrder || newOrder) && (
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden sticky top-4">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  {selectedOrder ? (
                    <Edit className="w-5 h-5" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                  {selectedOrder
                    ? "Edit Purchase Order"
                    : "Buat Purchase Order Baru"}
                </h2>
              </div>

              {/* Form Actions */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex flex-col items-center p-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Hapus</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setNewOrder(null);
                    }}
                    className="flex flex-col items-center p-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Batal</span>
                  </button>
                  <button
                    onClick={() => {
                      selectedOrder
                        ? handleUpdatePurchaseOrder(selectedOrder)
                        : handleCreatePurchaseOrder(newOrder);
                    }}
                    className="flex flex-col items-center p-3 rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                  >
                    <Save className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">
                      {selectedOrder ? "Simpan" : "Buat"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {/* ERP Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <PackageIcon className="w-4 h-4 text-blue-500" />
                    Purchase Code (ERP)
                  </label>
                  <input
                    type="text"
                    value={selectedOrder?.Erp || newOrder?.Erp || ""}
                    onChange={(e) =>
                      selectedOrder
                        ? setSelectedOrder({
                            ...selectedOrder,
                            Erp: e.target.value,
                          })
                        : setNewOrder({ ...newOrder, Erp: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Masukkan kode ERP"
                    required
                  />
                </div>

                {/* Plat Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    Plat (Opsional)
                  </label>
                  <input
                    type="text"
                    value={selectedOrder?.plat || newOrder?.plat || ""}
                    onChange={(e) =>
                      selectedOrder
                        ? setSelectedOrder({
                            ...selectedOrder,
                            plat: e.target.value,
                          })
                        : setNewOrder({ ...newOrder, plat: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    placeholder="Contoh: B 1234 XYZ"
                  />
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-blue-500" />
                    Daftar Item
                  </label>

                  {(selectedOrder?.items || newOrder?.items || []).map(
                    (item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3"
                      >
                        {/* SKU Selector */}
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">SKU</label>
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <PackageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={item.sku ?? ""}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white"
                                readOnly
                                placeholder="Pilih SKU"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemIndex(index);
                                setTempSkuTerplih(item?.sku);
                                document
                                  .getElementById("picksingleinventoriesdialog")
                                  .showModal();
                              }}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                              Pilih
                            </button>
                          </div>
                        </div>

                        {/* Request Field */}
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">
                            Jumlah Request
                          </label>
                          <input
                            type="number"
                            value={item.request ?? ""}
                            onChange={(e) => {
                              const updatedItems = [
                                ...(selectedOrder?.items || newOrder?.items),
                              ];
                              updatedItems[index].request = e.target.value
                                ? Number(e.target.value)
                                : null;
                              selectedOrder
                                ? setSelectedOrder({
                                    ...selectedOrder,
                                    items: updatedItems,
                                  })
                                : setNewOrder({
                                    ...newOrder,
                                    items: updatedItems,
                                  });
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            placeholder="Masukkan jumlah"
                          />
                        </div>

                        {/* Barcode Field */}
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">
                            Barcode
                          </label>
                          <input
                            type="text"
                            value={item.barcodeItem || ""}
                            onChange={(e) => {
                              const updatedItems = [
                                ...(selectedOrder?.items || newOrder?.items),
                              ];
                              updatedItems[index].barcodeItem = e.target.value;
                              selectedOrder
                                ? setSelectedOrder({
                                    ...selectedOrder,
                                    items: updatedItems,
                                  })
                                : setNewOrder({
                                    ...newOrder,
                                    items: updatedItems,
                                  });
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            placeholder="Masukkan barcode"
                          />
                        </div>

                        {/* Keterangan Field */}
                        <div className="space-y-2">
                          <label className="text-xs text-gray-500">
                            Keterangan
                          </label>
                          <textarea
                            value={item.keterangan || ""}
                            onChange={(e) => {
                              const updatedItems = [
                                ...(selectedOrder?.items || newOrder?.items),
                              ];
                              updatedItems[index].keterangan = e.target.value;
                              selectedOrder
                                ? setSelectedOrder({
                                    ...selectedOrder,
                                    items: updatedItems,
                                  })
                                : setNewOrder({
                                    ...newOrder,
                                    items: updatedItems,
                                  });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            placeholder="Masukkan keterangan (opsional)"
                          />
                        </div>

                        {/* Delete Item Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedItems = [
                              ...(selectedOrder?.items || newOrder?.items),
                            ];
                            updatedItems.splice(index, 1);
                            selectedOrder
                              ? setSelectedOrder({
                                  ...selectedOrder,
                                  items: updatedItems,
                                })
                              : setNewOrder({
                                  ...newOrder,
                                  items: updatedItems,
                                });
                          }}
                          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus Item
                        </button>
                      </div>
                    ),
                  )}

                  {/* Add Item Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const newItem = {
                        received: null,
                        barcodeItem: "",
                        keterangan: "",
                        tanggalTerpenuhi: null,
                      };
                      selectedOrder
                        ? setSelectedOrder({
                            ...selectedOrder,
                            items: [...(selectedOrder.items || []), newItem],
                          })
                        : setNewOrder({
                            ...newOrder,
                            items: [...(newOrder?.items || []), newItem],
                          });
                    }}
                    className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Tambah Item Baru
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload CSV Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Upload CSV</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitImportPO} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Pilih file CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {file && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <span className="font-medium">File terpilih:</span>{" "}
                    {file.name}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalDetailPurchaseOrder
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
      />

      <ModalOptions
        options={[
          {
            label: "Edit PO",
            icon: <Edit className="w-4 h-4" />,
            onClick: () => {
              setSelectedOrder(tempSeelectedOrder);
              document.getElementById("clickrow").close();
            },
          },
          {
            label: "Show Detail",
            icon: <Eye className="w-4 h-4" />,
            onClick: () => {
              setSelectedOrder(tempSeelectedOrder);
              document.getElementById("modalDetailPurchaseOrder")?.showModal();
              document.getElementById("clickrow").close();
            },
          },
        ]}
        onClose={() => setTempSelectedOrder(null)}
        modalId="clickrow"
        title="Pilih Aksi"
      />

      <PickSingleInventoriesDialog
        inventoryList={inventoriyList?.data}
        tempSkuTerpilih={tempSkuTerpilih}
        setDescription={(value) => {
          selectedOrder
            ? setSelectedOrder({ ...selectedOrder, description: value })
            : setNewOrder({ ...newOrder, description: value });
        }}
        setTempSkuTerpilh={setTempSkuTerplih}
        title="Pilih SKU untuk Purchase Order"
        handleKonfirmasi={handleKonfirmasiSkuPurchaseCode}
        searchKey=""
      />
    </div>
  );
}
