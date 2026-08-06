import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useRef, useEffect } from "react";
import {
  assignSpgToOutlet,
  assignFavoritedInventoryToOutlet,
  getFavoritedInventorySkus,
  assignUserToOutlet,
  deleteOutlet,
  editOutlet,
  getOuletList,
  registerOutlet,
} from "../api/outletApi";
import {
  ShieldQuestion,
  Package,
  Plus,
  X,
  Building2,
  MapPin,
  CreditCard,
  Clock,
  Tag,
  Users,
  Store,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

import toast from "react-hot-toast";
import ModalPickKasir from "../components/ModalPickKasir";
import { getAllAccount } from "@/api/authApi";
import ModalConfirmation from "../components/ModalConfirmation";
import ModalBrandPick from "@/components/ModalBrandPick";
import { getAllBrands } from "@/api/brandApi";
import ModalRegisterOutlet from "@/components/ModalRegisterOutlet";
import ModalConfirmation2 from "@/components/ModalConfirmation2";
import ModalSpgMultiPick from "@/components/modalSpgMultiPick";
import ModalFavoritedInventoryPick from "@/components/ModalFavoritedInventoryPick";
import { getAllSpg } from "@/api/spgApi";

const Outlet = () => {
  const [showEditForm, setShowEditForm] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState();
  const initialNewOutletForm = {
    namaOutlet: "",
    description: "",
    kasirList: [], //kasir list di state yang beda karena dikirim ke api yg beda
  };
  const [newOutletForm, setNewOutletForm] = useState(initialNewOutletForm);
  const modalPickKasirRef = useRef();
  const [outletToDelete, setOutletToDelete] = useState(null);
  const [selectedSpgIds, setSelectedSpgIds] = useState([]);
  const [selectedFavoritedSkus, setSelectedFavoritedSkus] = useState([]);

  //tanstack
  const queryClient = useQueryClient();
  const { data: outletList, refetch: refetchOutlets } = useQuery({
    queryFn: getOuletList,
    queryKey: ["outlet"],
  });
  const { data: userList } = useQuery({
    queryFn: getAllAccount,
    queryKey: ["user", "kasir"],
  });
  const { data: brandList } = useQuery({
    queryKey: ["brand"],
    queryFn: getAllBrands,
  });
  const { data: spgList } = useQuery({
    queryKey: ["spg"],
    queryFn: getAllSpg,
  });

  useEffect(() => {
    // Refetch outlet list ketika selectedOutlet berubah
    if (selectedOutlet) {
      refetchOutlets();
    }
  }, [selectedOutlet, refetchOutlets]);

  useEffect(() => {
    if (!selectedOutlet?._id) {
      setSelectedFavoritedSkus([]);
      return;
    }
    getFavoritedInventorySkus(selectedOutlet._id)
      .then((res) => setSelectedFavoritedSkus(res?.data?.skus || []))
      .catch(() => setSelectedFavoritedSkus([]));
  }, [selectedOutlet?._id]);

  const { mutateAsync: handleEditOutlet } = useMutation({
    mutationFn: async (body) => {
      // Simpan daftar kasir sebelum edit
      const kasirList = [...(body.kasirList || [])];

      // Hapus kasirList dari body yang dikirim ke API
      const { kasirList: _, ...outletData } = body;

      // Edit outlet tanpa kasirList
      await editOutlet(outletData);

      // Assign kasir ke outlet satu per satu
      if (kasirList?.length > 0) {
        const assignPromises = kasirList?.map(async (kasirId) => {
          return await assignUserToOutlet(kasirId, body._id);
        });
        await Promise.all(assignPromises);
      }

      setSelectedOutlet(null);
      setNewOutletForm(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet"]);
      setSelectedOutlet(null);
      setShowEditForm(false);
      toast.success("Berhasil mengedit outlet");
    },
    onError: (err) => {
      toast.error(err.response.data.message);
    },
  });

  const { mutateAsync: handleAssignSpgToOutlet } = useMutation({
    mutationFn: async ({ spgIds, outletId }) => {
      return await assignSpgToOutlet(spgIds, outletId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet", "spg"]);
      toast.success("Berhasil menambahkan spg ke outlet");
      document.getElementById("modalSpgPick").close();
    },
    onError: (err) => {
      toast.error(err.response.data.message);
    },
  });

  const { mutateAsync: handleAssignFavoritedInventory } = useMutation({
    mutationFn: async ({ skus, outletId }) => {
      return await assignFavoritedInventoryToOutlet(skus, outletId);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["outlet"]);
      setSelectedFavoritedSkus(res?.data?.skus || []);
      setSelectedOutlet((prev) =>
        prev
          ? {
              ...prev,
              favoritedInventoryIds: res?.data?.favoritedInventoryIds || [],
            }
          : prev,
      );
      toast.success(res?.message || "Berhasil menyimpan SKU tampil gambar");
      document.getElementById("modalFavoritedInventoryPick")?.close();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.missingSkus?.length
          ? `SKU tidak terdaftar: ${err.response.data.missingSkus.join(", ")}`
          : "Gagal menyimpan SKU tampil gambar");
      toast.error(msg);
    },
  });

  const { mutateAsync: handleRegisterOutlet } = useMutation({
    mutationFn: async (body) => {
      // Simpan daftar kasir sebelum create
      const kasirList = [...(body.kasirList || [])];

      // Hapus kasirList dari body yang dikirim ke API
      const { kasirList: _, ...outletData } = body;

      // Create outlet tanpa kasirList
      const response = await registerOutlet(outletData);

      // Assign kasir ke outlet baru
      if (kasirList?.length > 0 && response?.data?._id) {
        const assignPromises = kasirList?.map(async (kasirId) => {
          return await assignUserToOutlet(kasirId, response.data._id);
        });
        await Promise.all(assignPromises);
      }

      return response;
    },
    mutationKey: ["outlet"],
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet"]);
      toast.success("Berhasil membuat outlet");
      setNewOutletForm(initialNewOutletForm);
      document.getElementById("newoutlet").close();
    },
    onError: (error) => {
      toast.error(error.response.data.message);
    },
  });

  const { mutateAsync: handleDeleteOutlet } = useMutation({
    mutationFn: (_id) => deleteOutlet(_id),
    mutationKey: ["outlet"],
    onSuccess: () => {
      queryClient.invalidateQueries(["outlet"]);
      toast.success("Berhasil menghapus outlet");
      setSelectedOutlet();
      setShowEditForm(false);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Mungkin anda tidak memiliki akses",
      );
    },
  });

  const [ambiguKasir, setAmbiguKasir] = useState([]);
  const [selectedKasirIds, setSelectedKasirIds] = useState([]);

  const beforeHandleSelectKasir = (kasirIds) => {
    // Simpan kasir IDs dari modal ke state
    setSelectedKasirIds(kasirIds);

    // Cek apakah ada kasir yang sudah berada di outlet lain
    const usersInOtherOutlets = [];

    // Loop untuk mencari kasir yang sudah terdaftar di outlet lain
    kasirIds.forEach((kasirId) => {
      const isUserInOtherOutlet = outletList?.data.some(
        (outlet) =>
          (selectedOutlet ? outlet._id !== selectedOutlet._id : true) &&
          outlet.kasirList &&
          outlet.kasirList.includes(kasirId),
      );

      if (isUserInOtherOutlet) {
        // Tambahkan username ke list untuk ditampilkan di konfirmasi
        const user = userList?.data?.find((u) => u._id === kasirId);
        if (user?.username) {
          usersInOtherOutlets.push(user.username);
        }
      }
    });

    if (usersInOtherOutlets?.length > 0) {
      // Tampilkan modal konfirmasi jika ada konflik
      setAmbiguKasir(usersInOtherOutlets);
      document.getElementById("modal_confirmation2").showModal();
    } else {
      // Jika tidak ada konflik, langsung update state
      handleKasirSelection();
    }
  };

  // Fungsi untuk menerapkan pilihan kasir (tanpa API call)
  const handleKasirSelection = () => {
    if (!selectedKasirIds?.length) return;

    if (selectedOutlet) {
      // Update state untuk outlet yang sudah ada
      setSelectedOutlet((prev) => ({
        ...prev,
        kasirList: selectedKasirIds,
      }));
    } else {
      // Update state untuk outlet baru
      setNewOutletForm((prev) => ({
        ...prev,
        kasirList: selectedKasirIds,
      }));
    }

    // Bersihkan state setelah selesai
    setSelectedKasirIds([]);
    setAmbiguKasir([]);
  };

  const handleEditClick = (outlet) => {
    setSelectedOutlet(outlet);
    setShowEditForm(true);
  };

  // Function to reset the new outlet form
  const resetNewOutletForm = () => {
    setNewOutletForm({
      namaOutlet: "",
      description: "",
      kasirList: [],
      spgList: [],
      logo: null,
      brandIds: [],
    });

    setSelectedOutlet();
    // Also reset the kasir selection modal
    if (modalPickKasirRef.current) {
      modalPickKasirRef.current.resetModal();
    }
  };

  //untuk new outlet
  const tambahkanTerpilih = (brandIds) => {
    setNewOutletForm((prev) => ({
      ...prev,
      brandIds: brandIds,
    }));
    // Invalidate dan refetch data
    queryClient.invalidateQueries({ queryKey: ["outlet"] });
    queryClient.invalidateQueries({ queryKey: ["brand"] });
  };

  // Update handleSpgSelection function
  const handleSpgSelection = async (spgIds) => {
    if (selectedOutlet) {
      setSelectedOutlet((prev) => ({
        ...prev,
        spgList: spgIds,
      }));
      await handleAssignSpgToOutlet({
        spgIds,
        outletId: selectedOutlet._id,
      });
    } else {
      setNewOutletForm((prev) => ({
        ...prev,
        spgList: spgIds,
      }));
    }
  };

  const handleRemoveSpgFromOutlet = async (spgId) => {
    if (!selectedOutlet) return;
    const newList = (selectedOutlet.spgList || []).filter(
      (id) => String(id) !== String(spgId),
    );
    setSelectedOutlet((prev) => ({ ...prev, spgList: newList }));
    await handleAssignSpgToOutlet({
      spgIds: newList,
      outletId: selectedOutlet._id,
    });
  };

  const handleFavoritedSkuSelection = async (skus) => {
    if (!selectedOutlet) return;
    setSelectedFavoritedSkus(skus);
    await handleAssignFavoritedInventory({
      skus,
      outletId: selectedOutlet._id,
    });
  };

  const handleRemoveFavoritedSku = async (sku) => {
    if (!selectedOutlet) return;
    const newList = selectedFavoritedSkus.filter((s) => s !== sku);
    setSelectedFavoritedSkus(newList);
    await handleAssignFavoritedInventory({
      skus: newList,
      outletId: selectedOutlet._id,
    });
  };

  return (
    <div className="flex bg-gradient-to-br from-blue-50 to-white min-h-screen p-6 gap-6 w-full">
      {/* Left Column: Outlet List (75% width) */}
      <div className="flex flex-1 flex-col  space-y-4 w-3/4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              resetNewOutletForm();
              document.getElementById("newoutlet").showModal();
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Outlet Baru
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-white px-5 py-2.5 rounded-xl shadow-md border border-blue-100">
              <span className="text-blue-600 font-semibold">
                Total Outlet: {outletList?.data?.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Kode Outlet
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="untuk format kodeInvoice"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Nama Outlet
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="untuk display dan struk"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    Deskripsi
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Pendapatan
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="Pendapatan total outlet terkait terlepas dari kasir"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Kasir List
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="Kasir yang di assign/set untuk outlet ini"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      SPG List
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="spg yang di assing/set ke outlet ini"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Perusahaan
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="Nama perusahaan yang terkait dengan outlet ini"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Alamat
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="Alamat outlet"
                      >
                        <ShieldQuestion className="w-4 h-4 text-blue-200" />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    NPWP
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">
                    Brand
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {outletList?.data?.map((outlet) => (
                  <tr
                    key={outlet._id}
                    onClick={() => handleEditClick(outlet)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-all duration-200 group"
                  >
                    <td className="px-4 py-4 text-sm">
                      <span className="font-mono bg-blue-50 px-2 py-1 rounded-lg text-blue-700">
                        {outlet.kodeOutlet}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-blue-950" />
                        <span className="font-medium text-gray-800">
                          {outlet.namaOutlet}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate">
                      {outlet.description || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-green-600">
                        {outlet.pendapatan
                          ? Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(Number(outlet.pendapatan))
                          : "Rp 0"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {userList?.data
                          ?.filter((user) =>
                            outlet?.kasirList?.includes(user._id),
                          )
                          ?.slice(0, 2)
                          ?.map((user) => (
                            <span
                              key={user._id}
                              className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium"
                            >
                              {user.username}
                            </span>
                          ))}
                        {outlet?.kasirList?.length > 2 && (
                          <span className="text-xs text-blue-950 font-medium">
                            +{outlet.kasirList.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {spgList?.data
                          ?.filter((spg) =>
                            outlet?.spgList?.some(
                              (id) => String(id) === String(spg._id),
                            ),
                          )
                          .slice(0, 2)
                          .map((spg) => (
                            <span
                              key={spg._id}
                              className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-medium"
                            >
                              {spg.name}
                            </span>
                          ))}
                        {outlet?.spgList?.length > 2 && (
                          <span className="text-xs text-purple-500 font-medium">
                            +{outlet.spgList.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate">
                      {outlet.namaPerusahaan || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate">
                      {outlet.alamat || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {outlet.npwp || "-"}
                    </td>
                    <td className="px-4 py-4">
                      {outlet.brandIds?.length > 0 && (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {brandList?.data?.data
                            ?.filter((brand) =>
                              outlet.brandIds.includes(brand._id),
                            )
                            ?.slice(0, 2)
                            ?.map((brand) => (
                              <span
                                key={brand._id}
                                className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-medium"
                              >
                                {brand.name}
                              </span>
                            ))}
                          {outlet.brandIds.length > 2 && (
                            <span className="text-xs text-blue-600 font-medium">
                              +{outlet.brandIds.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Edit Outlet */}
      {showEditForm && selectedOutlet && (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 sticky top-6 h-screen overflow-hidden flex-1">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Edit Outlet
              </h2>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditOutlet(selectedOutlet);
              }}
              className="flex-1 overflow-y-auto p-6"
            >
              <div className="space-y-5">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOutletToDelete(selectedOutlet?._id);
                      document.getElementById("modal_confirmation").showModal();
                    }}
                    className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 transition-all duration-200 font-medium text-sm shadow-lg shadow-red-200"
                  >
                    Hapus
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium text-sm shadow-lg shadow-blue-200"
                  >
                    Update
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Nama Outlet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <Store className="w-4 h-4 text-blue-950" />
                      Nama Outlet
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan nama outlet"
                      value={selectedOutlet.namaOutlet}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          namaOutlet: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Deskripsi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <FileText className="w-4 h-4 text-blue-950" />
                      Deskripsi
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan deskripsi outlet"
                      value={selectedOutlet.description}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Nama Perusahaan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-blue-950" />
                      Nama Perusahaan
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan nama perusahaan"
                      value={selectedOutlet.namaPerusahaan}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          namaPerusahaan: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Alamat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-blue-950" />
                      Alamat
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan alamat"
                      value={selectedOutlet.alamat}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          alamat: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* NPWP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-blue-950" />
                      NPWP
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan NPWP"
                      value={selectedOutlet.npwp}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          npwp: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Periode Settlement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-950" />
                        Periode Settlement (hari)
                        <div
                          className="tooltip tooltip-left"
                          data-tip="Untuk statistik sales_report filter dan settlement"
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      placeholder="Masukkan periode settlement"
                      value={selectedOutlet.periodeSettlement}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          periodeSettlement: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>

                  {/* Jam Settlement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-950" />
                      Jam Settlement
                    </label>
                    <input
                      type="time"
                      className="w-full border border-gray-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-950 focus:border-transparent transition-all duration-200"
                      value={selectedOutlet.jamSettlement || "00:00"}
                      onChange={(e) =>
                        setSelectedOutlet((prev) => ({
                          ...prev,
                          jamSettlement: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4 text-blue-950" />
                        Brand Terhubung
                        <div
                          className="tooltip tooltip-bottom"
                          data-tip="Brand yang akan ditampilkan di mobile app"
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-xl hover:border-blue-950 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("modalBrandPick").showModal();
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-950" />
                        Tambah Brand
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  {/* Kasir List */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-950" />
                      Kasir List
                    </label>
                    <div
                      onClick={() =>
                        document.getElementById("pickKasir").showModal()
                      }
                      className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer hover:border-blue-950 transition-all duration-200"
                    >
                      {selectedOutlet?.kasirList?.length === 0 ? (
                        <span className="text-gray-400 text-sm">
                          Pilih kasir untuk outlet ini
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {userList?.data
                            ?.filter((user) =>
                              selectedOutlet?.kasirList?.includes(user._id),
                            )
                            ?.map((user) => (
                              <div
                                key={user._id}
                                className="flex items-center bg-blue-100 text-blue-700 rounded-lg px-3 py-1.5 text-sm"
                              >
                                <span>{user.username}</span>
                                <button
                                  type="button"
                                  className="ml-2 hover:text-red-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOutlet((prev) => ({
                                      ...prev,
                                      kasirList: prev.kasirList.filter(
                                        (id) => id !== user._id,
                                      ),
                                    }));
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          <button
                            type="button"
                            className="text-blue-600 hover:bg-blue-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById("pickKasir").showModal();
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SPG List */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-950" />
                      SPG List
                    </label>
                    <div
                      onClick={() => {
                        setSelectedSpgIds(selectedOutlet?.spgList || []);
                        document.getElementById("modalSpgPick").showModal();
                      }}
                      className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer hover:border-blue-950 transition-all duration-200"
                    >
                      {!selectedOutlet?.spgList?.length ? (
                        <span className="text-gray-400 text-sm">
                          Pilih SPG untuk outlet ini
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {spgList?.data
                            ?.filter((spg) =>
                              selectedOutlet?.spgList?.some(
                                (id) => String(id) === String(spg?._id),
                              ),
                            )
                            .map((spg) => (
                              <div
                                key={spg?._id}
                                className="flex items-center bg-purple-100 text-purple-700 rounded-lg px-3 py-1.5 text-sm"
                              >
                                <span>{spg?.name}</span>
                                <button
                                  type="button"
                                  className="ml-2 hover:text-red-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSpgFromOutlet(spg._id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          <button
                            type="button"
                            className="text-purple-600 hover:bg-purple-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSpgIds(selectedOutlet?.spgList || []);
                              document
                                .getElementById("modalSpgPick")
                                .showModal();
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SKU tampil gambar di mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                      <ImageIcon className="w-4 h-4 text-blue-950" />
                      SKU Tampil Gambar (favorites)
                      <div
                        className="tooltip tooltip-bottom"
                        data-tip="SKU yang menampilkan gambar di aplikasi mobile"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    </label>
                    <div
                      onClick={() =>
                        document
                          .getElementById("modalFavoritedInventoryPick")
                          .showModal()
                      }
                      className="w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl cursor-pointer hover:border-blue-950 transition-all duration-200"
                    >
                      {!selectedFavoritedSkus?.length ? (
                        <span className="text-gray-400 text-sm">
                          Pilih SKU yang menampilkan gambar
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedFavoritedSkus.map((sku) => (
                            <div
                              key={sku}
                              className="flex items-center bg-teal-100 text-teal-700 rounded-lg px-3 py-1.5 text-sm"
                            >
                              <span>{sku}</span>
                              <button
                                type="button"
                                className="ml-2 hover:text-red-500 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFavoritedSku(sku);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="text-teal-600 hover:bg-teal-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              document
                                .getElementById("modalFavoritedInventoryPick")
                                .showModal();
                            }}
                          >
                            + Tambah
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logo */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-blue-950" />
                      <span className="text-sm font-medium text-gray-700">
                        Logo Outlet
                      </span>
                      <div className="dropdown dropdown-hover">
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSelectedOutlet({
                              ...selectedOutlet,
                              logo: reader.result,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {selectedOutlet?.logo && (
                      <div className="mt-3 flex justify-center">
                        <img
                          src={selectedOutlet.logo}
                          alt="Preview Logo"
                          className="w-24 h-24 object-contain rounded-xl border-2 border-blue-200 p-1 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalRegisterOutlet
        newOutletForm={newOutletForm}
        setNewOutletForm={setNewOutletForm}
        handleRegisterOutlet={handleRegisterOutlet}
        resetNewOutletForm={resetNewOutletForm}
        brandList={brandList}
        spgList={spgList}
      />
      <ModalPickKasir
        ref={modalPickKasirRef}
        key="kasir"
        callback={beforeHandleSelectKasir}
        currentSelected={
          selectedOutlet
            ? selectedOutlet.kasirList
            : newOutletForm?.kasirList || []
        }
      />
      <ModalConfirmation
        onConfirm={() => handleDeleteOutlet(outletToDelete)}
        onCancel={() => {
          setOutletToDelete(null);
          document.getElementById("modal_confirmation").close();
        }}
        title="Konfirmasi Hapus Outlet"
        message={`Apakah Anda yakin ingin menghapus outlet "${selectedOutlet?.namaOutlet}"? Tindakan ini tidak dapat dibatalkan.`}
      />
      <ModalBrandPick
        selectedOutlet={selectedOutlet}
        setSelectedOutlet={setSelectedOutlet}
        TambahkanTerpilih={tambahkanTerpilih}
        newOutletForm={newOutletForm}
      />
      <ModalConfirmation2
        onConfirm={() => {
          handleKasirSelection();
          document.getElementById("modal_confirmation2").close();
        }}
        onCancel={() => {
          document.getElementById("modal_confirmation2").close();
          setAmbiguKasir([]);
          setSelectedKasirIds([]);
        }}
        title={"Konfirmasi Pemindahan Kasir"}
        message={`${ambiguKasir.join(
          ", ",
        )} sudah terdaftar di outlet lain. Satu kasir hanya dapat ditugaskan ke satu outlet, Apakah anda yakin ingin memindahkan kasir?`}
      />
      <ModalSpgMultiPick
        selectedOutletObj={selectedOutlet}
        selectedSpgIds={
          selectedOutlet ? selectedOutlet.spgList : newOutletForm?.spgList || []
        }
        setSelectedSpgIds={handleSpgSelection}
        key={"modalSpgMultiPick"}
      />
      <ModalFavoritedInventoryPick
        selectedSkus={selectedFavoritedSkus}
        setSelectedSkus={handleFavoritedSkuSelection}
      />
    </div>
  );
};

export default Outlet;
