import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DrawerNavigation from "../navigations/DrawerNavigator.jsx";
import LoginScreen from "../screens/LoginScreen.jsx";
import { getUserInfo } from "../api.js";
import { useOnlineSync } from "../hooks/useOnlineSync.js";
import * as Updates from 'expo-updates'
import { environment } from "../constant.js";

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const { data: isOnline } = useOnlineSync();
  
    useEffect(() => {
      async function checkAndApplyUpdates() {
        if (environment == "development") return;

        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (error) {
          // Native ON_LOAD sudah handle; gagal di sini biasanya offline sementara
        }
      }
      
      checkAndApplyUpdates();
    }, []);


  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        setIsAuthenticated(!!token);
        if (token) {
          if (isOnline) {
            //kalau online periksa validitas token
            const userInfo = await getUserInfo();
            if (userInfo) {
              await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
            } else {
              setIsAuthenticated(false);
            }
          } else {
            //kalau offline tidak perlu periksa validitas token
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (userInfo) {
              setIsAuthenticated(true);
            } else {
              Alert?.alert(
                "Data login tidak Ditemukan dan aplikasi sedang offline",
                "Hidupkan Koneksi Internet atau cobalah lagi nanti"
              );
              setIsAuthenticated(false);
            }
          }
        } else {
          const storedUserInfo = await AsyncStorage.getItem("userInfo");
          if (storedUserInfo) {
            AsyncStorage.removeItem("userInfo");
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        AsyncStorage.removeItem("token");
      }
    };

    checkAuthStatus();
  }, [isOnline]);

  const handleLoginSuccess = async () => {
    const userInfoRaw = await getUserInfo();
    const userInfo = userInfoRaw?.userInfo;

    if (userInfo) {
      await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1E3A8A",
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: "white", marginTop: 16 }}>
          Memeriksa status login anda...
        </Text>
      </View>
    );
  }

  return isAuthenticated ? (
    <DrawerNavigation />
  ) : (
    <LoginScreen onLoginSuccess={handleLoginSuccess} />
  );
}
