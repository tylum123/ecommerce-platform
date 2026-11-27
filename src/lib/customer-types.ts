import type { ErpOrderItem, ErpOrderStatus, PaymentStatus, UserTier } from "@/lib/erp-types";

export interface CustomerProfileRecord {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  defaultAddress: string;
  tier: UserTier;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPortalOrder {
  id: string;
  orderCode: string;
  createdAt: string;
  status: ErpOrderStatus;
  statusLabel: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  deliveryType: string;
  branchId: string | null;
  branchName: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  items: ErpOrderItem[];
}

export interface CustomerLoyaltySummary {
  tier: UserTier;
  points: number;
  nextTier: UserTier | null;
  pointsToNextTier: number;
  totalSpent: number;
  ordersCount: number;
}

export interface CustomerPortalPayload {
  profile: CustomerProfileRecord;
  orders: CustomerPortalOrder[];
  loyalty: CustomerLoyaltySummary;
}
