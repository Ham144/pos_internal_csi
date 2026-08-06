import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "expo-router";
import { useCurrentBill } from "../store";

const useAccount = () => {
  const navigation = useNavigation();
  const { clearSale } = useCurrentBill();

  const logoutNoSync = async () => {
    try {
      // Clear current bill state
      clearSale();
      AsyncStorage.removeItem("userInfo");
      AsyncStorage.removeItem("BASE_URL");
      AsyncStorage.removeItem("lastInventoryUpdate");
      AsyncStorage.removeItem("lastSyncTime");
      AsyncStorage.removeItem("outlet");
      AsyncStorage.removeItem("inventories");
      AsyncStorage.removeItem("customer");
      AsyncStorage.removeItem("diskon");
      AsyncStorage.removeItem("promo");
      AsyncStorage.removeItem("voucher");
      AsyncStorage.removeItem("paymentMethod");
      AsyncStorage.removeItem("spg");
      AsyncStorage.removeItem("bills");
      AsyncStorage.removeItem("favoritedInventorySkus");
      AsyncStorage.removeItem("removedInventorySkus");
      AsyncStorage.removeItem("token");

      // Reset dan navigasi ke halaman login
      navigation.reset({
        index: 0,
        routes: [{ name: "index" }],
      });
    } catch (error) {
      console.error("Gagal logout:", error);
      // Tetap coba reset navigasi meskipun ada error
      navigation.reset({
        index: 0,
        routes: [{ name: "index" }],
      });
    }
  };

  return { logoutNoSync };
};

export default useAccount;
