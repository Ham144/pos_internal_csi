import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import {
  useCurrentBill,
  useDebouceTime,
  useFiturEnabled,
  useVoucherOffline,
} from "../store";
import { View, Text, ToastAndroid, Platform } from "react-native";
import { TicketPercent } from "lucide-react-native";

//voucher tidak bisa diperiksa/dipakai di mobile, Pelanggan.model terlalu besar untuk disimpan di mobile (harus online)
//voucher hanya bisa creation di mobile offline, dan menampilkan di RegisterInvoice dengan
//untuk mengecek apakah user memiliki voucher
const VoucherOfflineCreationOnly = () => {
  //zustand
  const { currentBill, futureVoucher, setFutureVoucher } = useCurrentBill();
  const { voucherOffline, setVoucherOffline } = useVoucherOffline();
  const { debounceTime } = useDebouceTime();

  const { futureVoucherEnabled } = useFiturEnabled();

  const applyVoucherToItems = async (voucherDB, items) => {
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        //----------normal-----
        let voucher = null;

        const MultiMatch = voucherDB.filter((vouch) => {
          if (!vouch?.skuList?.includes(item?.sku)) {
            return false;
          }
          if (
            new Date(vouch?.berlakuDari) > new Date() ||
            new Date(vouch?.berlakuHingga) < new Date()
          ) {
            console.log(
              `voucher ${vouch?.judulVoucher} , atau tidak lagi berlaku`
            );
            return false;
          }
          if (vouch?.tipeSyarat == "quantity") {
            if (vouch?.minimalPembelianQuantity > item?.quantity) {
              console.log(
                `voucher ${vouch?.judulVoucher} , syarat quantity tidak terpenuhi`
              );
              return false;
            }
          }
          if (vouch?.tipeSyarat == "totalRp") {
            if (item?.totalRp < vouch?.minimalPembelianTotalRp) {
              console.log(
                `voucher ${vouch?.judulVoucher} , syarat totalRp tidak terpenuhi`
              );
              return false;
            }
          }
          if (vouch?.quantityTersedia < 1) {
            console.log(`voucher ${vouch?.judulVoucher} , tidak tersedia`);
            return false;
          }
          return true;
        });

        if (!MultiMatch?.length) {
          return null; // Skip this item by returning null
        }

        //jika ada lebih dari 1 voucher, maka proses banding yang paling untung
        if (MultiMatch.length > 1) {
          console.log(
            `lebih dari satu voucher bertahan untuk ${item.sku} , saatnya memilih yang paling untung`
          );
          let palingUntung = 0;
          let palingUntungVoucher = null;

          for (const voucher of MultiMatch) {
            //cari yang paling untung
            const rupiah = voucher?.potongan;
            palingUntung = voucher;
            if (rupiah > palingUntung) {
              palingUntung = rupiah;
              palingUntungVoucher = voucher;
            }
          }
          voucher = palingUntungVoucher;
        } else if (MultiMatch?.length == 1) {
          console.log(
            "MultiVoucherDB hanya tersisa satu, maka langsung implementasikan"
          );
          voucher = MultiMatch[0];
        }

        if (voucher) {
          return {
            ...item,
            voucher: true,
            voucherInfo: {
              voucherId: voucher?._id,
              tipe: voucher?.tipe,
              judulVoucher: voucher?.judulVoucher,
              potongan: voucher?.potongan,
              berlakuDari: voucher?.berlakuDari,
              berlakuHingga: voucher?.berlakuHingga,
              minimalPembelianQuantity: voucher?.minimalPembelianQuantity,
              minimalPembelianTotalRp: voucher?.minimalPembelianTotalRp,
              quantityTersedia: voucher?.quantityTersedia,
            },
          };
        } else {
          return null;
        }
      })
    );

    // Filter out the null values from updatedItems
    const bukanNull = updatedItems.filter((item) => item !== null);
    return bukanNull;
  };

  const fetchVoucherFilter = async () => {
    let voucherDB = voucherOffline;

    try {
      // Memeriksa apakah ada data di local storage
      if (voucherDB?.length) {
        const processesedItems = await applyVoucherToItems(
          voucherDB,
          currentBill
        );
        setFutureVoucher(processesedItems);
      } else {
        const voucherStorage = JSON.parse(
          await AsyncStorage.getItem("voucher")
        );
        if (!voucherStorage) {
          if (Platform.OS == "android")
            ToastAndroid?.show(
              "gagal mengambil voucher dari local, coba sync ulang",
              ToastAndroid.SHORT
            );
        } else {
          setVoucherOffline(voucherStorage);
          const processesedItems = await applyVoucherToItems(
            voucherDB,
            currentBill
          );
          setFutureVoucher(processesedItems);
        }
      }
    } catch (error) {
      console.log(error);
      ToastAndroid?.show(
        "gagal mengambil diskon dari local, coba sync",
        ToastAndroid.SHORT
      );
    }
  };

  const debounceTimeout = useRef(null);
  useEffect(() => {
    if (!currentBill || !futureVoucherEnabled) return;
    clearTimeout(debounceTimeout.current); // Hapus timeout sebelumnya jika ada
    debounceTimeout.current = setTimeout(() => {
      fetchVoucherFilter();
    }, debounceTime); // Tunggu 500ms sebelum memanggil fetchDiskon (bisa disesuaikan)
    return () => clearTimeout(debounceTimeout.current); // Cleanup jika `currentBill` berubah sebelum debounce selesai
  }, [currentBill]);

  return (
    <View className=" justify-between">
      <Text className="text-xs text-gray-500 font-bold font-aldrich">
        Fitur Future Voucher (Active)
      </Text>
      <View className="flex-1 w-full ">
        {futureVoucher.length ? (
          futureVoucher.map((vouch, index) => (
            <View key={index} className="flex flex-col w-full">
              {/* Voucher Description */}
              <View className="flex justify-between w-full gap-x-3">
                <Text className="text-xs text-gray-500 font-aldrich">
                  {vouch?.description}
                </Text>

                {/* Voucher Info */}
                <View className="flex-row items-center absolute right-0 justify-between">
                  <Text className="text-xs text-gray-500 font-aldrich">
                    {vouch?.voucherInfo?.judulVoucher ||
                      "Voucher tidak berjudul"}
                  </Text>

                  <View className="flex-row items-center gap-x-3 justify-between ml-2">
                    <Text>
                      <TicketPercent size={13} color={"green"} />
                    </Text>
                    <Text className="font-aldrich text-xs">
                      {Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(vouch?.voucherInfo?.potongan)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-xs font-aldrich text-gray-500">
            Tidak ada Future Use Voucher
          </Text>
        )}
      </View>
    </View>
  );
};

export default VoucherOfflineCreationOnly;
