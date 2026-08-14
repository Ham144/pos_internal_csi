import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { useCurrentBill } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DetailModal = ({ visible, setModalVisible }) => {
  const { setPaymentMethod, setSpg } = useCurrentBill();
  const [spgList, setSpgList] = useState([]);
  const [paymentMethodList, setPaymentMethodList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpgList, setFilteredSpgList] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState();
  const [selectedSpg, setSelectedSpg] = useState();

  // Load payment methods from AsyncStorage
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const storedPaymentMethods =
          await AsyncStorage.getItem("paymentMethod");
        if (storedPaymentMethods) {
          const parsedPaymentMethods = JSON.parse(storedPaymentMethods);
          const activePaymentMethods = parsedPaymentMethods.filter(
            (method) => method.status,
          );
          setPaymentMethodList(activePaymentMethods);
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };
    fetchPaymentMethods();
  }, []);

  // Load SPG list from storage
  useEffect(() => {
    const fetchSpgList = async () => {
      try {
        const spgListFromStorage = await AsyncStorage.getItem("spg");
        if (spgListFromStorage) {
          const parsedList = JSON.parse(spgListFromStorage);
          setSpgList(parsedList);
          setFilteredSpgList(parsedList);
        }
      } catch (error) {
        console.error("Error fetching SPG list:", error);
      }
    };
    fetchSpgList();
  }, []);

  // Handle payment method selection
  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method.method);
  };

  // Handle SPG selection
  const handleSelectSpg = (spgItem) => {
    setSelectedSpg(spgItem);
  };

  // Handle search input change
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredSpgList(spgList);
    } else {
      const filtered = spgList.filter((spg) =>
        spg.name.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredSpgList(filtered);
    }
  };

  // Handle confirmation
  const handleKonfirmasi = () => {
    if (selectedPaymentMethod && selectedSpg) {
      setPaymentMethod(selectedPaymentMethod);
      setSpg(selectedSpg);
      setModalVisible(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-4">
        <View className="w-full bg-white rounded-xl p-4">
          {/* Header */}
          <View className="flex-col justify-between items-center mb-3">
            <View className="flex-row justify-between items-center w-full">
              <Text className="text-xl font-bold text-gray-800 font-aldrich text-center">
                Pilih SPG
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-2"
              >
                <Text className="text-lg text-red-500 font-semibold">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="max-h-[50vh]">
            <View className="flex-row gap-4">
              {/* Payment Methods List */}
              {/* <View className="flex-1 bg-gray-100 rounded-lg">
                <View className="max-h-[300px]">
                  <ScrollView className="p-2 py-5">
                    {paymentMethodList.map((method, i) => (
                      <TouchableOpacity
                        key={i}
                        className={`p-3 border-b border-gray-200 ${
                          selectedPaymentMethod === method.method
                            ? "bg-blue-100"
                            : ""
                        }`}
                        onPress={() => handleSelectPaymentMethod(method)}
                      >
                        <View className="flex-col">
                          <Text className="text-gray-800 font-semibold">
                            {method.method}{" "}
                            {selectedPaymentMethod === method.method ? "✓" : ""}
                          </Text>
                          {method.discount > 0 && (
                            <Text className="text-green-600 text-sm">
                              Diskon: {method.discount}%
                            </Text>
                          )}
                          {method.additional_fee > 0 && (
                            <Text className="text-red-600 text-sm">
                              Biaya tambahan:{" "}
                              {formatCurrency(method.additional_fee)}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View> */}

              {/* SPG List */}
              <View className="flex-1 bg-gray-100 rounded-lg">
                <View className="p-2 border-b border-gray-300">
                  <TextInput
                    className="bg-white p-2 rounded-md border border-gray-300"
                    placeholder="Cari nama SPG..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                </View>
                <View className="max-h-[300px]">
                  <ScrollView className="p-2 py-5">
                    {filteredSpgList.map((spgItem) => (
                      <TouchableOpacity
                        key={spgItem._id || spgItem.name}
                        className={`p-2 border-b border-gray-200 ${
                          selectedSpg && spgItem._id === selectedSpg._id
                            ? "bg-blue-100"
                            : ""
                        }`}
                        onPress={() => handleSelectSpg(spgItem)}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-800">
                            {spgItem.name}{" "}
                            {selectedSpg && spgItem._id === selectedSpg._id
                              ? "✓"
                              : ""}
                          </Text>
                          <Text className="text-gray-600">{spgItem.email}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {filteredSpgList.length === 0 && (
                      <View className="p-4 items-center">
                        <Text className="text-gray-500">
                          Tidak ada SPG dengan nama tersebut
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View className="flex-row gap-x-2 mt-4">
            <TouchableOpacity
              className="flex-1 bg-gray-300 py-3 rounded-lg active:opacity-80"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-center text-gray-800 font-semibold">
                Tutup
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg active:opacity-80 ${
                selectedPaymentMethod && selectedSpg
                  ? "bg-blue-600"
                  : "bg-blue-300"
              }`}
              disabled={!selectedPaymentMethod || !selectedSpg}
              onPress={handleKonfirmasi}
            >
              <Text className="text-center text-white font-semibold">
                Konfirmasi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DetailModal;
