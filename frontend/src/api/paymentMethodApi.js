import axios from "axios";
import { BASE_URL } from "./constant";

export const getAllPaymentMethod = async () => {
  const response = await axios.get(
    `${BASE_URL}/api/v1/payment/getAllPaymentMethod`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const createPaymentMethod = async (data) => {
  const response = await axios.post(
    `${BASE_URL}/api/v1/payment/createPaymentMethod`,
    data,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const deletePaymentMethod = async (id) => {
  const response = await axios.delete(
    `${BASE_URL}/api/v1/payment/deletePaymentMethod/${id}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const togglePaymentMethodStatus = async (id) => {
  const response = await axios.patch(
    `${BASE_URL}/api/v1/payment/togglePaymentMethodStatus/${id}`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};
