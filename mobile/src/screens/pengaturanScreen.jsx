import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import PengaturanPrinterConfig from "../components/PengaturanPrinterConfig";
import PengaturanInputBill from "../components/PengaturanInputBill";
import PengaturanFitur from "../components/PengaturanFitur";
import PengaturanOutlet from "../components/PengaturanOutlet";
import { SquareChevronRight, Menu } from "lucide-react-native";
import PengaturanBackend from "../components/PengaturanBackend";
import PengaturanAplikasi from "../components/PengaturanAplikasi";

const PengaturanScreen = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState("pengaturanPrinterConfig");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pengaturanItems = [
    { id: "pengaturanPrinterConfig", label: "Pengaturan Printer" },
    { id: "pengaturanBackend", label: "Pengaturan Backend" },
    { id: "pengaturanFitur", label: "Pengaturan Fitur" },
    { id: "pengaturaninputbill", label: "Pengaturan Input Bill" },
    { id: "myoutlet", label: "My Outlet" },
    { id: "pengaturanAplikasi", label: "Pengaturan Aplikasi" },
  ];

  const renderContent = () => {
    switch (currentTab) {
      case "pengaturanBackend":
        return <PengaturanBackend />;
      case "pengaturanPrinterConfig":
        return <PengaturanPrinterConfig />;
      case "pengaturanFitur":
        return <PengaturanFitur />;
      case "pengaturaninputbill":
        return <PengaturanInputBill />;
      case "myoutlet":
        return <PengaturanOutlet />;
      case "pengaturanAplikasi":
        return <PengaturanAplikasi />;
      default:
        return <Text>Tutorial</Text>;
    }
  };

  return (
    <View className="flex-row h-full items-center relative">
      {/* Sidebar - Enhanced for Mobile Overlay */}
      <View
        className={`${
          isSidebarOpen ? "flex" : "hidden"
        } lg:flex w-64 lg:w-1/4 xl:w-1/5 bg-white rounded-r-3xl h-full px-4 py-20 absolute lg:relative z-[60] lg:z-0 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out`}
        style={styles.sidebar}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {pengaturanItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setCurrentTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`p-4 mb-3 rounded-2xl transition-colors duration-200 ${
                currentTab === item.id
                  ? "bg-blue-600 shadow-md"
                  : "bg-gray-50 active:bg-gray-100"
              }`}
              style={currentTab === item.id ? styles.activeTab : null}
            >
              <Text
                className={`text-sm font-bold ${
                  currentTab === item.id ? "text-white" : "text-gray-600"
                }`}
                style={{ fontFamily: currentTab === item.id ? "gilroyBold" : "gilroyRegular" }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Area - Full screen width on mobile */}
      <View className="flex-1 p-4 h-full z-0">{renderContent()}</View>

      {/* Mobile Menu Button - Moved to end for Z-Index */}
      <TouchableOpacity
        onPress={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-4 left-4 bg-blue-600 p-3 rounded-2xl shadow-lg"
        style={{ elevation: 100, zIndex: 1000 }}
      >
        <Menu size={24} color="white" />
      </TouchableOpacity>

      {/* Drawer Button */}
      <View className="absolute bottom-14 left-0">
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                className="px-2 bg-blue-300 py-4 rounded-r-lg items-center justify-center"
              >
                <Text>
                  <SquareChevronRight size={20} color={"white"} />
                </Text>
              </TouchableOpacity>
            </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  drawerButton: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default PengaturanScreen;