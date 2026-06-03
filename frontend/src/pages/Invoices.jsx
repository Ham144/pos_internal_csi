import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Fragment } from "react";
import { getInvoiceFilterComplex, voidInvoice } from "../api/invoiceApi";
import { getAllSpg } from "../api/spgApi";
import { getAllAccount } from "../api/authApi";
import { useUserInfo } from "../store";
import { getOuletList, getOuletByUserId } from "../api/outletApi";
import ModalVoid from "@/components/ModalVoid";
import toast from "react-hot-toast";
import { getAllinventories } from "@/api/itemLibraryApi";
import ModalDetailInvoice from "@/components/ModalDetailInvoice";

import {
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  UserCircle,
  Download,
  ChevronUp,
  ChevronDown,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  ShoppingCart,
  Tag,
  Gift,
  Percent,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  Ban,
} from "lucide-react";

// angka mentah untuk CSV — hindari 300.000 yang dibaca Excel sebagai 300
const csvAngka = (nilai) =>
  nilai != null && nilai !== "" ? String(nilai) : "";

export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options);
  } catch (e) {
    return "Tanggal tidak valid";
  }
};

const Invoices = () => {
  const { userInfo } = useUserInfo();
  const [showDetail, setShowDetail] = useState(null);

  const queryClient = useQueryClient();
  const { mutate: handleVoidInvoice } = useMutation({
    mutationFn: (invoiceId) => voidInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "invoices",
          "user",
          "outlet",
          "spg",
          "kasir",
          "diskon",
          "promo",
          "voucher",
          "invoice",
        ],
      });
      toast?.success("Invoice berhasil dibatalkan");
      setSelectedInvoice(null);
      document.getElementById("void").checked = false;
      queryClient.invalidateQueries({
        queryKey: ["invoice", getQueryParams()],
      });
    },
    onError: (error) => {
      toast?.error(
        error?.response?.data?.message || "Gagal membatalkan invoice",
      );
      setSelectedInvoice(null);
      document.getElementById("void").checked = false;
    },
  });

  //inventoris
  const { data: handleGetInventoryById } = useQuery({
    queryKey: ["inventories"],
    queryFn: getAllinventories,
  });

  // Fetch data outlet berdasarkan user yang login
  const { data: myOutlet } = useQuery({
    queryKey: ["outlet", userInfo?._id],
    queryFn: () => getOuletByUserId(userInfo?._id),
    enabled: !!userInfo?._id,
  });

  // Fetch data semua outlet
  const { data: outletData } = useQuery({
    queryKey: ["outlet"],
    queryFn: getOuletList,
  });

  // State untuk filter
  const [status, setStatus] = useState("all");
  const [sortBy, setsortBy] = useState("time");
  const [outlet, setOutlet] = useState(myOutlet?.data?.kodeOutlet || "");
  const [spg, setSpg] = useState("");
  const [kasir, setKasir] = useState("");
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // State untuk expandable rows
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Format status untuk API
  const getStatusForApi = () => {
    if (status === "complete") return { done: "true", isVoid: "false" };
    if (status === "void") return { isVoid: "true" };
    if (status === "pending") return { done: "false", isVoid: "false" };
    if (status === "all") return {}; // Tidak perlu filter untuk "all"
    return {};
  };

  // Format sortBy untuk API
  const getsortByForApi = () => {
    if (sortBy === "time") return { sortBy: "createdAt", sortOrder: "desc" };
    if (sortBy === "invoice")
      return { sortBy: "kodeInvoice", sortOrder: "asc" };
    if (sortBy === "total") return { sortBy: "total", sortOrder: "desc" };
    return { sortBy: "createdAt", sortOrder: "desc" };
  };

  // Membuat query params untuk API
  const getQueryParams = () => {
    const statusParams = getStatusForApi();
    const sortByParams = getsortByForApi();

    return {
      ...statusParams,
      ...sortByParams,
      kodeOutlet: outlet,
      spg: spg || undefined,
      kasir: kasir || undefined,
      limit: limit === "All" ? "All" : parseInt(limit),
      search: search || undefined,
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined,
      page: currentPage,
    };
  };

  // Fetch data invoice menggunakan TanStack Query
  const {
    data: invoiceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["invoice", getQueryParams()],
    queryFn: () => getInvoiceFilterComplex(["", getQueryParams()]),
    keepPreviousData: true,
  });

  // Fetch data SPG
  const { data: spgData } = useQuery({
    queryKey: ["spg"],
    queryFn: getAllSpg,
  });

  // Fetch data Kasir/Accounts
  const { data: accountsData } = useQuery({
    queryKey: ["user"],
    queryFn: getAllAccount,
  });

  // Toggle expanded row
  const toggleExpandRow = (invoiceId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [invoiceId]: !prev[invoiceId],
    }));
  };

  // Mendapatkan nama SPG dari ID
  const getSpgNameById = (spgId) => {
    if (!spgData?.data) return spgId;
    const spgItem = spgData?.data?.find((item) => item._id == spgId);
    return spgItem ? spgItem?.name : "spg telah dihapus" || "spg tidak ada?";
  };

  // Mendapatkan nama Kasir dari salesPerson
  const getKasirName = (salesPerson) => {
    if (!accountsData?.data) return salesPerson || "-";
    const account = accountsData.data.find(
      (item) => item.email === salesPerson || item.name === salesPerson,
    );
    return account ? account.name : salesPerson || "-";
  };

  // Set default outlet berdasarkan user yang login
  useEffect(() => {
    if (myOutlet?.data?.kodeOutlet) {
      setOutlet(myOutlet.data.kodeOutlet);
    }
  }, [myOutlet]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, sortBy, outlet, spg, kasir, limit, search, dateRange]);

  // Function to export data to CSV
  const exportToCSV = () => {
    if (!invoiceData?.data) return;

    // 1. Prepare CSV headers
    const headers = [
      "Kode Invoice",
      "EXT CODE",
      "Nomor Transaksi",
      "Tanggal Sync",
      "Tanggal Bill",
      "Kasir",
      "SPG",
      "total invoice",
      "nett total invoice",
      "Status",
      "Billing",
      "Bayar",
      "Kwitansi",
      "sku(items)",
      "harga dasar",
      "sku quantity",
      "Diskon",
      "sku total",
      "Voucher",
    ];

    // 2. Flatten rows
    const rows = [];
    invoiceData.data.forEach((invoice) => {
      const baseInfo = [
        invoice.kodeInvoice,
        invoice._id,
        invoice.nomorTransaksi || "",
        formatDate(invoice.createdAt), //Waktu Sync
        formatDate(invoice.tanggalBayar), //waktu print billing bukan kwitansi
        getKasirName(invoice.salesPerson),
        getSpgNameById(invoice.spg),
        csvAngka(invoice.subTotal) || "-",
        csvAngka(invoice.total) || "-",
        invoice.isVoid ? "Dibatalkan" : invoice.done ? "Selesai" : "Tertunda",
        invoice.isPrintedCustomerBilling ? "Sudah" : "Belum",
        invoice.done ? "Lunas" : "Belum",
        invoice.isPrintedKwitansi ? "Sudah" : "Belum",
      ];

      // a) currentBill items
      invoice.currentBill?.forEach((item) => {
        // cari diskon & voucher yang match sku ini
        const diskEntry = invoice.diskon?.find((d) => d.sku === item.sku);
        const voucherEntry = invoice.futureVoucher?.find(
          (v) => v.sku === item.sku,
        );

        rows.push([
          ...baseInfo,
          item.sku,
          csvAngka(item.RpHargaDasar),
          item.quantity,
          csvAngka(diskEntry?.diskonInfo?.RpPotonganHarga),
          csvAngka(item.totalRp),
          voucherEntry?.voucherInfo?.judulVoucher || "",
        ]);
      });

      // b) promo bonus items
      invoice.promo?.forEach((p) => {
        const bonusSku = p.promoInfo?.skuBarangBonus || "";
        rows.push([
          ...baseInfo,
          bonusSku,
          "", // harga dasar kosong
          p.promoInfo?.quantityBonus || 0,
          "", // diskon kosong
          "0", // sku total = 0
          "", // voucher kosong
        ]);
      });
    });

    // 3. Generate CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // 4. Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section dengan Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl mb-8 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Manajemen Transaksi
                </h1>
                <p className="text-blue-100 mt-1 text-sm md:text-base">
                  Pantau dan kelola seluruh transaksi dengan detail penjualan
                  lengkap
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-auto">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                <div className="pl-3">
                  <Search className="w-5 h-5 text-white/70" />
                </div>
                <input
                  type="text"
                  placeholder="Cari invoice..."
                  className="bg-transparent border-0 text-white placeholder-white/70 focus:outline-none px-3 py-2.5 w-full md:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2.5 text-white font-medium">
                  Cari
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Transaksi
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Tanggal Mulai */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Tanggal Akhir */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Tanggal Akhir
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Outlet */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Outlet
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                    value={outlet}
                    onChange={(e) => setOutlet(e.target.value)}
                  >
                    {outletData?.data?.map((outletItem) => (
                      <option
                        key={outletItem?.kodeOutlet}
                        value={outletItem.kodeOutlet}
                        className={
                          outletItem.kodeOutlet === myOutlet?.data?.kodeOutlet
                            ? "font-bold bg-blue-50"
                            : ""
                        }
                      >
                        {outletItem.namaOutlet} | {outletItem.kodeOutlet}
                        {outletItem.kodeOutlet === myOutlet?.data?.kodeOutlet
                          ? " (Outlet Saya)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Filter className="w-4 h-4 text-blue-500" />
                  Jumlah Data
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                >
                  {[50, 100, 200, 400, 800, "All"].map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* SPG */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  SPG
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                    value={spg}
                    onChange={(e) => setSpg(e.target.value)}
                  >
                    <option value="">Semua SPG</option>
                    {spgData?.data?.map((spgItem) => (
                      <option key={spgItem._id} value={spgItem._id}>
                        {spgItem.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kasir */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <UserCircle className="w-4 h-4 text-blue-500" />
                  Kasir
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <select
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                    value={kasir?.username}
                    onChange={(e) => setKasir(e.target.value)}
                  >
                    <option value="">Semua Kasir</option>
                    {accountsData?.data?.map((account) => (
                      <option key={account.username} value={account.username}>
                        {account.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={!invoiceData?.data?.length}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Download className="w-5 h-5" />
              Export ke CSV
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 mb-8 p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Semua", icon: Filter, color: "blue" },
              {
                key: "complete",
                label: "Selesai",
                icon: CheckCircle,
                color: "green",
              },
              { key: "void", label: "Dibatalkan", icon: XCircle, color: "red" },
              {
                key: "pending",
                label: "Tertunda",
                icon: Clock,
                color: "yellow",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    status === tab.key
                      ? `bg-${tab.color}-500 text-white shadow-lg shadow-${tab.color}-500/25`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-blue-600 font-medium animate-pulse">
                Memuat data transaksi...
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Gagal Memuat Data
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                {error?.message ||
                  "Terjadi kesalahan saat memuat data. Silakan coba lagi."}
              </p>
            </div>
          ) : invoiceData?.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Tidak Ada Data Transaksi
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Tidak ditemukan transaksi dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50">
                    <tr>
                      <th className="w-12 px-4 py-3"></th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50"
                        onClick={() => setsortBy("invoice")}
                      >
                        <div className="flex items-center gap-1">
                          Kode Invoice
                          {sortBy === "invoice" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Ext Doc
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50"
                        onClick={() => setsortBy("time")}
                      >
                        <div className="flex items-center gap-1">
                          Tanggal Sync
                          {sortBy === "time" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Tanggal Bill
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Kasir
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        SPG
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Harga Asli
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold text-blue-800 uppercase tracking-wider cursor-pointer hover:bg-blue-200/50"
                        onClick={() => setsortBy("total")}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Total
                          {sortBy === "total" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Billing
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Bayar
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Kwitansi
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-800 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 ">
                    {invoiceData?.data?.map((invoice) => (
                      <Fragment key={invoice._id}>
                        <tr className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              className="btn btn-circle btn-xs btn-ghost text-blue-600 hover:bg-blue-100"
                              onClick={() => toggleExpandRow(invoice._id)}
                            >
                              {expandedRows[invoice._id] ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-blue-900">
                                {invoice.kodeInvoice}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {invoice._id.slice(-6)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(invoice.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {invoice?.tanggalBayar
                              ? new Date(
                                  invoice.tanggalBayar,
                                ).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-sm">
                              {getKasirName(invoice.salesPerson)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {getSpgNameById(invoice?.spg) || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="text-green-600 font-semibold">
                              Rp{" "}
                              {invoice.subTotal?.toLocaleString("id-ID") || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="text-blue-600 font-semibold">
                              Rp {invoice.total?.toLocaleString("id-ID") || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {invoice.isPrintedCustomerBilling ? (
                              <div
                                className="tooltip"
                                data-tip="Sudah Cetak Billing"
                              >
                                <div className="badge badge-success badge-sm gap-1 text-white">
                                  <Printer className="w-3 h-3" />
                                  Cetak
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {invoice.done ? (
                              <div className="tooltip" data-tip="Sudah Bayar">
                                <div className="badge badge-success badge-sm gap-1 text-white">
                                  <CheckCircle className="w-3 h-3" />
                                  Lunas
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {invoice.isPrintedKwitansi ? (
                              <div
                                className="tooltip"
                                data-tip="Sudah Cetak Kwitansi"
                              >
                                <div className="badge badge-success badge-sm gap-1 text-white">
                                  <Printer className="w-3 h-3" />
                                  Cetak
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`badge rounded-full px-3 py-2 font-medium text-xs ${
                                invoice.isVoid
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : invoice.done
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {invoice.isVoid
                                ? "Dibatalkan"
                                : invoice.done
                                  ? "Selesai"
                                  : "Tertunda"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors tooltip"
                                data-tip="Detail"
                                onClick={() => {
                                  document
                                    .getElementById("modalDetailInvoice")
                                    .showModal();
                                  setShowDetail(invoice);
                                }}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                              {!invoice.isVoid &&
                                invoice?.done &&
                                invoice.requestingVoid && (
                                  <button
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors tooltip"
                                    data-tip="Void"
                                    onClick={() =>
                                      setSelectedInvoice(invoice._id)
                                    }
                                  >
                                    <Ban className="w-4 h-4 text-red-600" />
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Detail */}
                        {expandedRows[invoice._id] && (
                          <tr>
                            <td colSpan="14" className="bg-blue-50/30 p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Items Purchased */}
                                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                      <ShoppingCart className="w-4 h-4" />
                                      Item Pembelian
                                    </h3>
                                  </div>
                                  <div className="p-4 max-h-[300px] overflow-y-auto">
                                    {invoice.currentBill?.length > 0 ? (
                                      <div className="space-y-2">
                                        {invoice.currentBill.map(
                                          (item, idx) => (
                                            <div
                                              key={idx}
                                              className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                                            >
                                              <div>
                                                <p className="font-medium text-sm">
                                                  {item.description}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Rp{" "}
                                                  {item.RpHargaDasar?.toLocaleString(
                                                    "id-ID",
                                                  )}{" "}
                                                  x {item.quantity}
                                                </p>
                                              </div>
                                              <p className="font-semibold text-blue-600 text-sm">
                                                Rp{" "}
                                                {item.totalRp?.toLocaleString(
                                                  "id-ID",
                                                )}
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-center text-gray-500 py-4 text-sm">
                                        Tidak ada item
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Promo & Diskon */}
                                <div className="space-y-4">
                                  {invoice?.diskon?.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2">
                                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                          <Tag className="w-4 h-4" />
                                          Diskon
                                        </h3>
                                      </div>
                                      <div className="p-4 max-h-[200px] overflow-y-auto">
                                        {invoice.diskon.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex justify-between items-center p-2 bg-orange-50 rounded-lg mb-2"
                                          >
                                            <span className="text-sm">
                                              {item.diskonInfo?.judulDiskon}
                                            </span>
                                            <span className="badge badge-sm bg-orange-100 text-orange-700">
                                              {item.diskonInfo?.RpPotonganHarga
                                                ? `Rp ${item.diskonInfo.RpPotonganHarga.toLocaleString("id-ID")}`
                                                : `${item.diskonInfo?.percentPotonganHarga}%`}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {invoice?.promo?.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
                                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-2">
                                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                          <Gift className="w-4 h-4" />
                                          Promo
                                        </h3>
                                      </div>
                                      <div className="p-4 max-h-[200px] overflow-y-auto">
                                        {invoice.promo.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex justify-between items-center p-2 bg-purple-50 rounded-lg mb-2"
                                          >
                                            <span className="text-sm">
                                              {item.promoInfo?.judulPromo}
                                            </span>
                                            <span className="badge badge-sm bg-purple-100 text-purple-700">
                                              +{item.promoInfo?.quantityBonus}{" "}
                                              {item.promoInfo?.skuBarangBonus}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {invoiceData?.pagination && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-white">
                  <div className="text-sm text-gray-600">
                    Menampilkan{" "}
                    <span className="font-semibold text-blue-600">
                      {invoiceData.data.length}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-blue-600">
                      {invoiceData.pagination.total}
                    </span>{" "}
                    data
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    {Array.from(
                      {
                        length: Math.min(5, invoiceData.pagination.totalPages),
                      },
                      (_, i) => {
                        let pageNum;
                        if (invoiceData.pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          invoiceData.pagination.totalPages - 2
                        ) {
                          pageNum = invoiceData.pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                                : "border border-gray-200 hover:bg-blue-50 text-gray-700"
                            }`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

                    <button
                      className="p-2 rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, invoiceData.pagination.totalPages),
                        )
                      }
                      disabled={
                        currentPage >= invoiceData.pagination.totalPages
                      }
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ModalVoid
        setSelectedInvoice={setSelectedInvoice}
        handleVoidInvoice={handleVoidInvoice}
        selectedInvoice={selectedInvoice}
      />
      <ModalDetailInvoice showDetail={showDetail} />
    </div>
  );
};

export default Invoices;
