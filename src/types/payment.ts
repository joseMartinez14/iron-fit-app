export interface Client {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  paymentDate: string;
  validUntil: string;
  client: Client;
}

export interface PaymentStats {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  totalAmount: number;
}

// Additional types from service.ts
export interface PaymentResponse {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  paymentDate: string;
  validUntil: string;
  client: {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
  };
}

export interface PaymentFilters {
  includeInactiveClients?: boolean;
  statusFilter?: "paid" | "pending" | "failed";
  validUntilAfter?: string; // ISO date string
  validUntilBefore?: string; // ISO date string
}

export interface PaymentServiceResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  payments?: T[];
  stats?: PaymentServiceStats | null;
}

export interface PaymentServiceStats {
  totalClients?: number;
  clientsWithPayments?: number;
  clientsWithoutPayments?: number;
  totalPayments?: number;
  paidPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
  expiredPayments: number;
}

export interface ClientPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  payments: PaymentResponse[];
  client?: {
    id: string;
    name: string;
    phone?: string;
    isActive: boolean;
  };
}

export interface PaymentStatsResponse {
  success: boolean;
  message?: string;
  error?: string;
  stats: {
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    totalRevenue: number;
    expiredPayments: number;
    clientsWithPayments: number;
    clientsWithoutPayments: number;
    totalClients: number;
  } | null;
}

export interface ClientWithoutRecentPayment {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  lastPayment: {
    id: string;
    amount: number;
    status: string;
    paymentDate: string;
    validUntil: string;
  } | null;
  daysSinceLastPayment: number | null;
}

export interface ClientsWithoutRecentPaymentsResponse {
  success: boolean;
  message?: string;
  error?: string;
  clients: ClientWithoutRecentPayment[];
  thresholdDays?: number;
}

// Import the Prisma enum type
export type PaymentStatus = "paid" | "pending" | "failed";

export interface CreatePaymentData {
  clientId: string;
  amount: number;
  status: PaymentStatus;
  paymentDate: string; // ISO date string
  validUntil: string; // ISO date string
  notes?: string;
  preventDuplicates?: boolean; // Optional flag to prevent duplicate payments
}

export interface CreatePaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  payment?: PaymentResponse;
  createdBy?: string;
  updatedBy?: string;
}
