import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ToastAndroid,
  FlatList,
} from "react-native";
import RegisterInvoice from "../components/RegisterInvoice";
import { Plus } from "lucide-react-native";
import { useCurrentBill, useInventoriesOffline, useLoading } from "../store";
import OptionInventoriesModal from "../components/OptionInventoriesModal";
import FilterInventories from "../components/FilterInventories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  filterVisibleInventories,
  loadRemovedInventorySkus,
} from "../utils/inventoryFilters";

const LibrariesScreen = () => {
  const [showfilterModal, setshowFilterModal] = useState(false);
  const [isShowOptionsInventories, setShowOptionsInventories] = useState(false);
  const [selectedItem, setSelectedItem] = useState();
  const [favoritedInventorySkus, setFavoritedInventorySkus] = useState([]);
  const { setLoadingPrinting } = useLoading();

  // Filter state for date, limit, skip, etc.
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
    limit: 100,
    skip: 0,
    asc: true,
    searchKey: "",
  });
  const [userInfo, setUserInfo] = useState();

  //zustand
  const { _id, addToCurrentBill, createCurrentBill, done } = useCurrentBill();
  //sebelum difilter (Search)
  const { inventoriesOffline: inventoriList, setInventoriesOffline } =
    useInventoriesOffline();

  //setelah difilter
  const [filteredInventories, setFilteredInventories] = useState([]);
  const searchTimeout = useRef(null);

  // Di dalam komponen LibrariesScreen
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState("");
  const intervalIdRef = useRef(null);

  // Fungsi untuk memeriksa pembaruan inventaris
  const checkInventoryUpdates = async () => {
    try {
      const lastUpdate = await AsyncStorage.getItem("lastInventoryUpdate");
      if (lastUpdate && lastUpdate !== lastUpdateTimestamp) {
        setLastUpdateTimestamp(lastUpdate);

        const storedInventories = filterVisibleInventories(
          JSON.parse(await AsyncStorage.getItem("inventories")),
          await loadRemovedInventorySkus(AsyncStorage),
        );

        setInventoriesOffline(storedInventories);
        handleSearch(storedInventories);
      }
    } catch (error) {
      console.log(error);
      ToastAndroid.show(error.message, ToastAndroid.LONG);
    }
  };

  const handleSearch = (inventories = inventoriList) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (!inventories) return;

      const searchTerm = filter.searchKey.toLowerCase();

      const filtered = inventories.filter((product) => {
        return (
          product.description?.toLowerCase().includes(searchTerm) ||
          product.sku?.toLowerCase().includes(searchTerm) ||
          product.barcode?.toLowerCase().includes(searchTerm)
        );
      });

      // 🔥 Hapus duplikat berdasarkan SKU
      const uniqueFiltered = Array.from(
        new Map(filtered?.map((item) => [item.sku, item])).values(),
      );

      setFilteredInventories(uniqueFiltered);
    }, 300);
  };

  // Set up polling when component mounts and clean up on unmount
  useEffect(() => {
    // Initial check
    checkInventoryUpdates();

    // Set up interval with longer duration
    intervalIdRef.current = setInterval(checkInventoryUpdates, 10000);

    // Clean up on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [filter.searchKey]);

  // Load initial data
  useEffect(() => {
    const initialCheck = async () => {
      const lastUpdate = await AsyncStorage.getItem("lastInventoryUpdate");
      const userInfo = await AsyncStorage.getItem("userInfo");
      const favoritedRaw = await AsyncStorage.getItem("favoritedInventorySkus");
      setFavoritedInventorySkus(favoritedRaw ? JSON.parse(favoritedRaw) : []);
      setLastUpdateTimestamp(lastUpdate || "");
      setUserInfo(userInfo);
    };
    initialCheck();
  }, []);

  // Single effect to handle filtering
  useEffect(() => {
    if (inventoriList) {
      handleSearch();
    }
  }, [inventoriList, filter.searchKey]);

  useEffect(() => {
    function resetFilter() {
      setFilter({
        startDate: "",
        endDate: "",
        limit: 100,
        skip: 0,
        asc: true,
        searchKey: "",
      });
    }
    resetFilter();
    const fetchInventoriesFromStorageToZustand = async () => {
      const storedInventories = JSON.parse(
        await AsyncStorage.getItem("inventories"),
      );
      const removedSkus = await loadRemovedInventorySkus(AsyncStorage);
      const visibleInventories = filterVisibleInventories(
        storedInventories,
        removedSkus,
      );

      const uniqueInventories = Array.from(
        new Map(
          visibleInventories?.map((item) => [item._id || item.sku, item]),
        ).values(),
      );

      setInventoriesOffline(uniqueInventories);
      setFilteredInventories(uniqueInventories);
    };

    fetchInventoriesFromStorageToZustand();
  }, []);

  const handleCreateCurrentBill = async (item) => {
    setLoadingPrinting(false);
    if (!item?.sku || !item?.RpHargaDasar) {
      ToastAndroid?.show("Item tidak lengkap", ToastAndroid.SHORT);
      return;
    }

    const bill = {
      sku: item.sku,
      description: item?.description,
      quantity: 1,
      RpHargaDasar: item?.RpHargaDasar?.$numberDecimal,
      limitQuantity: item.quantity,
      user: userInfo?.username,
    };

    // Using setTimeout to move the operation off the main thread
    setTimeout(() => {
      createCurrentBill(bill);
    }, 0);
  };

  const HandleAddToInvoice = async (item) => {
    if (!item?.sku || !item?.RpHargaDasar) {
      ToastAndroid?.show("Item tidak lengkap", ToastAndroid.SHORT);
      return;
    }

    const bill = {
      sku: item.sku,
      description: item.description,
      quantity: 1,
      RpHargaDasar: item?.RpHargaDasar?.$numberDecimal,
      limitQuantity: item.quantity,
    };

    // Using setTimeout to move the operation off the main thread
    setTimeout(() => {
      addToCurrentBill(bill);
    }, 0);
  };

  // Close modal function
  const handleHideFilterModal = () => {
    setshowFilterModal(false);
  };

  const handleShowOptions = (item) => {
    setShowOptionsInventories(true);
    setSelectedItem(item);
  };

  return (
    <View className="flex-1 bg-white flex-row pt-1">
      {/* Left Side */}
      <View className="w-full absolute ">
        <FilterInventories
          filter={filter}
          setFilter={setFilter}
          handleHideFilterModal={handleHideFilterModal}
          handleSearch={handleSearch}
          showfilterModal={showfilterModal}
          key={"searchbardanfilternya"}
        />
      </View>
      <FlatList
        data={filteredInventories} // Efficient rendering
        contentContainerStyle={{ paddingBottom: 10, paddingTop: 50 }}
        maxToRenderPerBatch={30}
        initialNumToRender={20}
        keyExtractor={(item) => item?.sku} // Use unique key
        renderItem={({ item }) => (
          <TouchableOpacity
            disabled={done}
            onPress={() => handleShowOptions(item)}
            className={`flex-row items-center justify-between w-full bg-white shadow-md rounded-lg mb-4 p-4 ${
              item?.isDisabled || item?.quantity <= 0 || item?.RpHargaDasar == 0
                ? "opacity-50"
                : ""
            }`}
          >
            {/* Deskripsi Produk */}
            <View style={{ flex: 1 }}>
              <Text
                className="text-gray-800 font-semibold"
                style={{ fontFamily: "gilroyRegular" }}
              >
                {item?.sku || item?.description}
              </Text>

              {/* SKU (Kode Produk) */}
              <Text className="text-sm text-gray-500 mr-2">
                <Text
                  className="font-medium"
                  style={{ fontFamily: "gilroyRegular" }}
                >
                  {favoritedInventorySkus?.includes(item.sku) && "fav"}
                </Text>
              </Text>

              {/* Brand */}
              <Text className="text-sm text-gray-500 mr-2">
                Brand:{" "}
                <Text
                  className="font-medium"
                  style={{ fontFamily: "gilroyRegular" }}
                >
                  {item?.description || "tidak ada desc"}
                </Text>
              </Text>
            </View>

            {/* Harga Dasar */}
            <View>
              <Text
                className="text-lg text-green-600 font-bold mr-2"
                style={{ fontFamily: "gilroyRegular" }}
              >
                Rp.{" "}
                {Intl.NumberFormat("id-ID", {
                  currency: "IDR",
                }).format(item?.RpHargaDasar?.$numberDecimal)}
              </Text>
            </View>

            {/* Quantity and Action */}
            <View className="flex-row items-center justify-center">
              {/* Stok */}
              <Text
                className="text-sm text-gray-600 mr-2"
                style={{ fontFamily: "gilroyRegular" }}
              >
                {item?.quantity > 0 ? (
                  <>
                    Stok:{" "}
                    <Text
                      className="font-medium"
                      style={{ fontFamily: "gilroyRegular" }}
                    >
                      {item?.quantity}
                    </Text>{" "}
                    items
                  </>
                ) : (
                  <Text
                    className="text-sm text-red-600 mr-2"
                    style={{ fontFamily: "gilroyRegular" }}
                  >
                    Stok habis {item?.quantity}
                  </Text>
                )}
              </Text>

              {/* Tombol Tindakan */}
              {item.isDisabled ? (
                <View className="gap-y-2 flex items-center">
                  <Text
                    className="text-gray-500 text-center"
                    style={{ fontFamily: "gilroyRegular" }}
                  >
                    Item Disabled
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  disabled={item?.isDisabled || item?.RpHargaDasar < 1 || done}
                  className="bg-blue-950 rounded-md text-center px-4 py-2 flex items-center justify-center hover:opacity-25"
                  onPress={() => {
                    setTimeout(() => {
                      if (!_id) {
                        handleCreateCurrentBill(item);
                      } else {
                        HandleAddToInvoice(item);
                      }
                    }, 0);
                  }}
                >
                  <Text
                    className="text-white"
                    style={{ fontFamily: "gilroyRegular" }}
                  >
                    <Plus size={30} color="white" />
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex items-center justify-center">
            <Text
              className="text-lg font-bold text-gray-800"
              style={{ fontFamily: "gilroyRegular" }}
            >
              Tidak Ada Inventori yang bisa ditampilkan
            </Text>
          </View>
        )}
        windowSize={5} // Keep 5 screens worth of items in memory
        removeClippedSubviews={true} // Improve memory efficiency
      />

      {/* Right Side */}
      <RegisterInvoice />
      {/* Modal options seperti menambah ke favorite */}
      {isShowOptionsInventories && (
        <OptionInventoriesModal
          isShowOptionsInventories={isShowOptionsInventories}
          setShowOptionsInventories={setShowOptionsInventories}
          selectedItem={selectedItem}
        />
      )}
    </View>
  );
};

export default LibrariesScreen;
