import midtransClient from "midtrans-client";

// Inisialisasi Snap client menggunakan variabel .env
const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === "production",
  serverKey: process.env.PAYMENT_MIDTRANS_SERVER_KEY,
  clientKey: process.env.PAYMENT_MIDTRANS_CLIENT_KEY,
});

// Fungsi utilitas untuk membuat token pembayaran
export const createPaymentToken = async ({
  orderId,
  grossAmount,
  customerDetails,
}) => {
  try {
    const parameter = {
      transaction_details: {
        order_id: orderId, 
        gross_amount: grossAmount,
      },
      customer_details: customerDetails,
    };

    const transaction = await snap.createTransaction(parameter);
    return transaction.token; // Mengembalikan snapToken
  } catch (error) {
    console.error("Midtrans Util Error:", error);
    throw error;
  }
};
