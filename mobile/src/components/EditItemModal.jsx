import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
import React, { useState } from "react";
import { useCurrentBill } from "../store";
import { TextInput } from "react-native-gesture-handler";

export default function EditItemModal({
  showEditItemModal,
  setShowEditItemModal,
  tempEditItem,
}) {
  const editCurrentBill = useCurrentBill((state) => state.editCurrentBill);
  const [description, setDescription] = useState(
    tempEditItem?.description || "",
  );
  const [quantity, setQuantity] = useState(
    tempEditItem?.quantity?.toString() || "1",
  );
  const [catatan, setCatatan] = useState(tempEditItem?.catatan || "");

  const handleEditConfirm = () => {
    if (quantity === "" || parseInt(quantity) < 1) {
      ToastAndroid?.show(
        "Quantity tidak boleh kurang dari 1",
        ToastAndroid.SHORT,
      );
      return;
    }
    const newItem = {
      ...tempEditItem,
      description: description,
      quantity: parseInt(quantity),
      catatan: catatan,
      totalRp: parseFloat(tempEditItem.RpHargaDasar) * parseInt(quantity),
    };
    editCurrentBill(newItem);
    setShowEditItemModal(false);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showEditItemModal}
      onRequestClose={() => setShowEditItemModal(false)}
    >
      <View className="flex-1 justify-center items-center">
        <View className="bg-white rounded-lg p-4 gap-y-5 shadow-lg">
          {/* Edit Description */}
          <View>
            <Text className="text-xs font-semibold mb-4">Edit Description</Text>
            <TextInput
              editable={tempEditItem?.description === "Produk tanpa sku"}
              style={{
                borderWidth: 1,
                padding: 10,
                borderRadius: 10,
                borderColor: "#ccc",
                textAlign: "center",
                backgroundColor:
                  tempEditItem?.description !== "Produk tanpa sku"
                    ? "#ccc"
                    : "#fff",
              }}
              placeholder="Item name"
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
          </View>

          {/* Edit Quantity */}
          <View className="flex flex-col gap-y-2 items-center  justify-center">
            <Text className="text-xs font-semibold mr-4">Edit Quantity</Text>
            <View className="flex flex-row items-center bg-white rounded-full border border-gray-300  px-4 py-2">
              <TouchableOpacity
                className="text-sm font-semibold text-gray-600 bg-blue-950 rounded-full px-9 py-1"
                onPress={() => {
                  if (parseInt(quantity) > 1) {
                    setQuantity((prev) => (parseInt(prev) - 1).toString());
                  }
                }}
              >
                <Text className="text-sm font-semibold text-white">-</Text>
              </TouchableOpacity>
              <TextInput
                style={{
                  height: 40,
                  textAlign: "center",
                  fontSize: 16,
                  paddingHorizontal: 50,
                }}
                keyboardType="number-pad"
                value={quantity}
                onChangeText={(text) => {
                  if (text === "" || parseInt(text) >= 0) {
                    setQuantity(text);
                  }
                }}
              />
              <TouchableOpacity
                className="text-sm font-semibold text-gray-600 bg-blue-950 rounded-full px-9 py-1"
                onPress={() => {
                  const newQuantity = parseInt(quantity) + 1;
                  if (newQuantity <= tempEditItem?.limitQuantity) {
                    setQuantity(newQuantity.toString());
                  }
                }}
              >
                <Text className="text-sm font-semibold text-white">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit catatan */}
          <View>
            <Text className="text-xs font-semibold mb-4">Edit catatan</Text>
            <TextInput
              style={{
                borderWidth: 1,
                padding: 10,
                borderRadius: 10,
                borderColor: "#ccc",
                textAlign: "center",
                height: 40,
              }}
              placeholder="Tambah catatan tambahan"
              value={catatan}
              onChangeText={(text) => setCatatan(text)}
            />
          </View>

          {/* Confirm and Cancel buttons */}
          <View className="flex-row items-center justify-center gap-x-4 mt-4 w-full">
            <TouchableOpacity
              className="py-2 px-4 rounded-full bg-blue-600"
              onPress={handleEditConfirm}
            >
              <Text className="text-sm font-semibold text-white">Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-2 px-4 rounded-full bg-gray-200"
              onPress={() => setShowEditItemModal(false)}
            >
              <Text className="text-sm font-semibold text-gray-600">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
