export const APP_NAME = "Internal POS CSI";
export const environment = "production";
// export const environment = "development";

export const BACKEND_URLS = {
  production: "https://internal-pos.mycsi.net",
  development: "http://192.168.21.193:3003",
};

export const BASE_URL = BACKEND_URLS[environment];
