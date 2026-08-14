import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCurrentBill } from "../store";

const useAccount = () => {
  const { clearSale } = useCurrentBill();

  const logoutNoSync = async () => {
    try {
      // Clear current bill state
      clearSale();
      await AsyncStorage.multiRemove([
        "userInfo",
        "BASE_URL",
        "lastInventoryUpdate",
        "lastSyncTime",
        "outlet",
        "inventories",
        "customer",
        "diskon",
        "promo",
        "voucher",
        "paymentMethod",
        "spg",
        "bills",
        "favoritedInventorySkus",
        "removedInventorySkus",
        "token",
      ]);

      // Reset ke halaman login via Expo Router agar tidak tergantung pada navigation context
      router.replace("/");
    } catch (error) {
      console.error("Gagal logout:", error);
      router.replace("/");
    }
  };

  return { logoutNoSync };
};

export default useAccount;
