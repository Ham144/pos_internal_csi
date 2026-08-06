import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ToastAndroid,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { printTest } from "../api";
import { Picker } from "@react-native-picker/picker";

const PengaturanPrinterConfig = () => {
  // States for multiple configs
  const [printerConfigs, setPrinterConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [loadingTest, setLoadingTest] = useState(false);

  // Current editing config
  const [currentConfig, setCurrentConfig] = useState({
    id: Date.now().toString(),
    name: "",
    tipePrinter: "",
    ipPrinter: "",
    portPrinter: "",
    isDefault: true,
  });

  // Load saved configs
  useEffect(() => {
    loadPrinterConfigs();
  }, []);

  const loadPrinterConfigs = async () => {
    try {
      const savedConfigs = await AsyncStorage.getItem("printerConfigs");
      const configs = savedConfigs ? JSON.parse(savedConfigs) : [];
      setPrinterConfigs(configs);

      if (configs.length > 0) {
        // Set selected config to default one if exists
        const defaultConfig = configs.find((config) => config.isDefault);
        if (defaultConfig) {
          setSelectedConfigId(defaultConfig.id);
          setCurrentConfig(defaultConfig);
          setIsAddingNew(false);
        } else {
          // Jika tidak ada default, pilih yang pertama
          setSelectedConfigId(configs[0].id);
          setCurrentConfig(configs[0]);
          setIsAddingNew(false);
        }
      } else {
        // Jika tidak ada konfigurasi, set mode tambah baru
        setIsAddingNew(true);
        setCurrentConfig({
          id: Date.now().toString(),
          name: "",
          tipePrinter: "",
          ipPrinter: "",
          portPrinter: "",
          isDefault: true, // Konfigurasi pertama akan menjadi default
        });
      }
    } catch (error) {
      console.error("Error loading printer configs:", error);
      Alert.alert("Error", "Failed to load printer configurations");

      // Jika terjadi error, tetap set mode tambah baru
      setIsAddingNew(true);
      setCurrentConfig({
        id: Date.now().toString(),
        name: "",
        tipePrinter: "",
        ipPrinter: "",
        portPrinter: "",
        isDefault: true,
      });
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedConfigId(null);
    setCurrentConfig({
      id: Date.now().toString(),
      name: "",
      tipePrinter: "",
      ipPrinter: "",
      portPrinter: "",
      isDefault: printerConfigs.length === 0, // First config will be default
    });
  };

  const handleSelectConfig = (configId) => {
    if (!configId) {
      // Jika tidak ada konfigurasi yang dipilih, set mode tambah baru
      handleAddNew();
      return;
    }

    const selected = printerConfigs.find((config) => config.id === configId);
    if (selected) {
      setSelectedConfigId(configId);
      setCurrentConfig(selected);
      setIsAddingNew(false);
    }
  };

  const handleSetDefault = async () => {
    try {
      const updatedConfigs = printerConfigs.map((config) => ({
        ...config,
        isDefault: config.id === currentConfig.id,
      }));

      await AsyncStorage.setItem(
        "printerConfigs",
        JSON.stringify(updatedConfigs),
      );
      setPrinterConfigs(updatedConfigs);
      ToastAndroid.show("Default printer updated", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error setting default printer:", error);
      Alert.alert("Error", "Failed to set default printer");
    }
  };

  const handleSaveConfig = async () => {
    if (
      !currentConfig.name ||
      !currentConfig.tipePrinter ||
      !currentConfig.ipPrinter ||
      !currentConfig.portPrinter
    ) {
      Alert.alert("Error", "Semua field harus diisi");
      return;
    }

    try {
      let updatedConfigs;
      if (isAddingNew) {
        // Jika menambahkan konfigurasi baru
        const newConfig = {
          ...currentConfig,
          // Pastikan ID selalu unik
          id: currentConfig.id || Date.now().toString(),
          // Jika ini konfigurasi pertama, set sebagai default
          isDefault: currentConfig.isDefault || printerConfigs.length === 0,
        };

        updatedConfigs = [...printerConfigs, newConfig];

        // Update currentConfig dengan ID yang benar
        setCurrentConfig(newConfig);
      } else {
        // Jika mengedit konfigurasi yang ada
        updatedConfigs = printerConfigs.map((config) =>
          config.id === currentConfig.id ? currentConfig : config,
        );
      }

      await AsyncStorage.setItem(
        "printerConfigs",
        JSON.stringify(updatedConfigs),
      );
      setPrinterConfigs(updatedConfigs);
      setSelectedConfigId(currentConfig.id);
      setIsAddingNew(false);

      ToastAndroid.show(
        "Konfigurasi printer berhasil disimpan!",
        ToastAndroid.SHORT,
      );
    } catch (error) {
      console.error("Error saving printer config:", error);
      Alert.alert("Error", "Gagal menyimpan konfigurasi printer");
    }
  };

  const handleDeleteConfig = async () => {
    if (currentConfig.isDefault) {
      Alert.alert("Error", "Cannot delete default printer configuration");
      return;
    }

    Alert.alert(
      "Konfirmasi",
      "Yakin ingin menghapus konfigurasi printer ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedConfigs = printerConfigs.filter(
                (config) => config.id !== currentConfig.id,
              );
              await AsyncStorage.setItem(
                "printerConfigs",
                JSON.stringify(updatedConfigs),
              );
              setPrinterConfigs(updatedConfigs);

              if (updatedConfigs.length > 0) {
                handleSelectConfig(updatedConfigs[0].id);
              } else {
                handleAddNew();
              }

              ToastAndroid.show(
                "Konfigurasi printer berhasil dihapus!",
                ToastAndroid.SHORT,
              );
            } catch (error) {
              console.error("Error deleting printer config:", error);
              Alert.alert("Error", "Gagal menghapus konfigurasi printer");
            }
          },
        },
      ],
    );
  };
  const handleTestConfig = async () => {
    setLoadingTest(true);
    try {
      await printTest(currentConfig);
      ToastAndroid?.show(
        "Berhasil test konfigurasi printer",
        ToastAndroid.LONG,
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", error?.message);
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Pengaturan Printer</Text>

      {/* Printer Config Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pilih Konfigurasi</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Text style={styles.addButtonText}>+ Tambah Baru</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedConfigId}
            onValueChange={handleSelectConfig}
            style={styles.picker}
          >
            <Picker.Item label="Pilih konfigurasi printer..." value={null} />
            {printerConfigs.map((config) => (
              <Picker.Item
                key={config.id}
                label={`${config.name}${config.isDefault ? " (Default)" : ""}`}
                value={config.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Configuration Form */}
      <View style={styles.formSection}>
        {/* Nama Konfigurasi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Konfigurasi</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Printer Kasir 1"
            value={currentConfig.name}
            onChangeText={(text) =>
              setCurrentConfig({ ...currentConfig, name: text })
            }
          />
        </View>

        {/* Tipe Printer */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipe Printer</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currentConfig.tipePrinter}
              onValueChange={(itemValue) =>
                setCurrentConfig({ ...currentConfig, tipePrinter: itemValue })
              }
              style={styles.picker}
            >
              <Picker.Item label="Pilih Tipe Printer" value="" />
              <Picker.Item label="EPSON" value="EPSON" />
              <Picker.Item label="DARUMA" value="DARUMA" />
              <Picker.Item label="STAR" value="STAR" />
              <Picker.Item label="TANCA" value="TANCA" />
            </Picker>
          </View>
        </View>

        {/* IP Printer */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>IP Printer</Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.21.01"
            keyboardType="numeric"
            placeholderTextColor="#999"
            value={currentConfig.ipPrinter}
            onChangeText={(text) =>
              setCurrentConfig({ ...currentConfig, ipPrinter: text })
            }
          />
        </View>

        {/* Port Printer */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Port Printer</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="9100"
            placeholderTextColor="#999"
            value={currentConfig.portPrinter}
            onChangeText={(text) =>
              setCurrentConfig({ ...currentConfig, portPrinter: text })
            }
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={
              !currentConfig.tipePrinter ||
              !currentConfig.ipPrinter ||
              !currentConfig.portPrinter
            }
            onPress={handleTestConfig}
            className={`${
              !currentConfig.tipePrinter ||
              !currentConfig.ipPrinter ||
              !currentConfig.portPrinter
                ? "bg-gray-300"
                : "bg-blue-950"
            } flex-1 p-3 text-center rounded-md`}
          >
            {loadingTest ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Test</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={
              !currentConfig.tipePrinter ||
              !currentConfig.ipPrinter ||
              !currentConfig.portPrinter
            }
            onPress={handleSaveConfig}
            className={`${
              !currentConfig.tipePrinter ||
              !currentConfig.ipPrinter ||
              !currentConfig.portPrinter
                ? "bg-gray-300"
                : "bg-blue-950"
            } flex-1 p-3 text-center rounded-md`}
          >
            {loadingTest ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Simpan</Text>
            )}
          </TouchableOpacity>
          {!currentConfig.isDefault && !isAddingNew && (
            <TouchableOpacity
              style={[styles.button, styles.defaultButton]}
              onPress={handleSetDefault}
            >
              <Text style={styles.buttonText}>Set Default</Text>
            </TouchableOpacity>
          )}
          {!isAddingNew &&
            printerConfigs.length > 1 &&
            !currentConfig.isDefault && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeleteConfig}
              >
                <Text style={styles.buttonText}>Hapus</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    </ScrollView>
  );
};

export default PengaturanPrinterConfig;

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  addButton: {
    backgroundColor: "#10b981",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  picker: {
    height: 50,
  },
  formSection: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
    color: "#1f2937",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },
  testButton: {
    backgroundColor: "#3b82f6",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
  },
  defaultButton: {
    backgroundColor: "#10b981",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
  },
});
