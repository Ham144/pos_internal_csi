import React, { memo } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import CheckDiskonOffline from "./checkDiskonOffline";
import CheckPromoOffline from "./checkPromoOffline";
import VoucherOfflineCreationOnly from "./VoucherOfflineCreationOnly";

export const BillAdjustmentsPanel = memo(
  ({ promoEnabled, diskonEnabled, futureVoucherEnabled }) => (
    <View className="flex-1 overflow-hidden">
      <ScrollView className="flex-1 divide-y divide-gray-100">
        {promoEnabled !== false && (
          <View className="py-1">
            <CheckPromoOffline />
          </View>
        )}
        {diskonEnabled !== false && (
          <View className="py-1">
            <CheckDiskonOffline />
          </View>
        )}
        {futureVoucherEnabled !== false && (
          <View className="py-1">
            <VoucherOfflineCreationOnly />
          </View>
        )}
      </ScrollView>
    </View>
  )
);
