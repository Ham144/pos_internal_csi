export const APP_NAME = "CSI SUPER POS";
export const environment = "production";
// export const environment = "development";
export const DESC_NAME = "Sistem POS by CSI untuk penjualan di outlet dan event besar"

export const BACKEND_URLS = {
  production: "https://pos.mycsi.net",
  development: "http://192.168.21.193:3003",
};

export const BASE_URL = BACKEND_URLS[environment];
