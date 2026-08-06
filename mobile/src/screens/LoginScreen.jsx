import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { login, getBaseUrl, pingBackend } from "../api";
import { Settings, X } from "lucide-react-native";
import { BASE_URL } from "../constant";

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [backendUrl, setBackendUrl] = useState("");

  // Backend URL templates
  const BACKEND_TEMPLATES = {
    production: "https:pos.mycsi.net",
    development: "http://192.168.169.12:3000",
  };

  // Query for checking backend connection
  const { data: isConnected } = useQuery({
    queryKey: ["ping", backendUrl],
    queryFn: () => pingBackend(backendUrl),
    enabled: !!backendUrl && showBackendModal,
    retry: 1,
  });

  // Load current backend URL
  useEffect(() => {
    const loadBackendUrl = async () => {
      const url = await getBaseUrl();
      setBackendUrl(url);
    };
    loadBackendUrl();
  }, []);

  // Save backend URL
  const handleSaveBackend = async () => {
    try {
      await AsyncStorage.setItem("BASE_URL", JSON.stringify(backendUrl));
      ToastAndroid?.show("Backend URL berhasil disimpan", ToastAndroid.SHORT);
      setShowBackendModal(false);
    } catch (error) {
      ToastAndroid?.show("Gagal menyimpan Backend URL", ToastAndroid.SHORT);
    }
  };

  const { mutate: handleLogin, isPending } = useMutation({
    mutationFn: async () => {
      const response = await login(username, password);
      return response;
    },
    onSuccess: (response) => {
      if (response?.data?.token) {
        AsyncStorage.setItem("token", response?.data?.token);
        onLoginSuccess();
      }
    },
    onError: (error) => {
      setError(error.message || "Terjadi kesalahan saat login");
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View className="flex-row justify-between items-center mb-4">
          <Text style={styles.title}>Selamat Datang</Text>
          <TouchableOpacity
            onPress={() => setShowBackendModal(true)}
            className="p-2 rounded-full bg-gray-100"
          >
            <Settings size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => handleLogin()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showBackendModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-[90%] max-w-md bg-white rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Konfigurasi Backend
              </Text>
              <TouchableOpacity
                onPress={() => setShowBackendModal(false)}
                className="p-2"
              >
                <Text>
                  <X size={20} color="#4B5563" />
                </Text>
              </TouchableOpacity>
            </View>

            {/* Connection Status */}
            <View
              className={`p-3 rounded-lg mb-4 ${
                isConnected ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <TouchableOpacity
                className={`flex  items-center rounded-lg ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
                disabled={true}
              >
                <Text className="text-center text-white font-medium">
                  Indikator
                </Text>
                <Text className="text-center text-white font-medium">
                  {isConnected ? "Terhubung" : "Tidak Terhubung"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Backend URL Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Backend URL
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 bg-white"
                value={backendUrl}
                onChangeText={setBackendUrl}
                placeholder="http://your-backend-url:port"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Quick Switch Buttons */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Quick Switch
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  className="px-3 py-2 bg-green-500 rounded-lg"
                  onPress={() => setBackendUrl(BACKEND_TEMPLATES.production)}
                >
                  <Text className="text-white font-medium">Production</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-3 py-2 bg-blue-950 rounded-lg"
                  onPress={() => setBackendUrl(BACKEND_TEMPLATES.development)}
                >
                  <Text className="text-white font-medium">Development</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 justify-center p-3 rounded-lg ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
                onPress={() => {
                  setBackendUrl(BASE_URL);
                }}
              >
                <Text className="text-center text-white font-medium">
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 text-center text-white bg-blue-950 rounded-lg p-3`}
                onPress={handleSaveBackend}
              >
                {isConnected ? (
                  <Text className="text-center text-white font-bold">
                    Simpan
                  </Text>
                ) : (
                  <Text className="text-center text text-white font-medium">
                    Tetap Simpan
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "center",
  },
});

export default LoginScreen;
