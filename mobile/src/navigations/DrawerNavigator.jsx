import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import PointOfSaleNavigator from "@/navigations/PointOfSaleNavigator.jsx";
import AktivitasScreen from "@/screens/AktivitasScreen.jsx";
import InventoriScreen from "@/screens/InventoriScreen.jsx";
import PengaturanScreen from "@/screens/pengaturanScreen.jsx";
import SummaryScreen from "@/screens/SummaryScreen.jsx";

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator>
      <Drawer.Screen
        name="Point of Sale"
        component={PointOfSaleNavigator}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Aktivitas"
        component={AktivitasScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Inventori"
        component={InventoriScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Ringkasan"
        component={SummaryScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Pengaturan"
        component={PengaturanScreen}
        options={{ headerShown: false }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;