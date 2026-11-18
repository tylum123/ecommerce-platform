/**
 * Payment & Repository Utilities for White-label Retail + Clinic system.
 */

// ---------------------------------------------------------------------------
// 1. VietQR Generator
// ---------------------------------------------------------------------------

export interface VietQrDetails {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
  qrUrl: string;
  payload: string;
}

export function generateVietQrPaymentDetails(params: {
  amount: number;
  orderCode: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
}): VietQrDetails {
  const bankId = params.bankId || process.env.VIETQR_BANK_ID || "MB";
  const accountNo = params.accountNo || process.env.VIETQR_ACCOUNT_NO || "0901234567";
  const accountName = params.accountName || process.env.VIETQR_ACCOUNT_NAME || "CONG TY CO PHAN NARI HOME BEAUTY AND CLINIC";
  const template = process.env.VIETQR_TEMPLATE || "compact2";

  const addInfo = encodeURIComponent(`Thanh toan don hang ${params.orderCode}`);
  const encodedName = encodeURIComponent(accountName);
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${params.amount}&addInfo=${addInfo}&accountName=${encodedName}`;

  const payloadObject = {
    standard: "VietQR-NAPAS247",
    bankId,
    accountNo,
    accountName,
    amount: params.amount,
    currency: "VND",
    orderCode: params.orderCode,
    description: `Thanh toan don hang ${params.orderCode}`,
    qrUrl,
  };

  return {
    bankId,
    accountNo,
    accountName,
    amount: params.amount,
    orderCode: params.orderCode,
    qrUrl,
    payload: JSON.stringify(payloadObject),
  };
}
