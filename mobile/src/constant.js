const environment = "production";
// const environment = "development"
export const BASE_URL =
  environment == "production"
    ? "https://pos.mycsi.net" //https://pos.mycsi.net
    : "http://192.168.169.12:3003"; //development
