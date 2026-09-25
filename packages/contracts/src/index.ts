export type RiskLevel = "R0" | "R1" | "R2" | "R3";
export type OperationStatus = "PENDING_CONFIRMATION" | "AWAITING_AUTH" | "EXECUTED" | "FAILED" | "EXPIRED" | "CANCELLED";
export type OperationType = "TRANSFER" | "SCHEDULED_TRANSFER" | "SPLIT_REQUEST" | "INVESTMENT" | "REDEMPTION" | "CARD_CONTROL" | "CARD_LOSS" | "SUBSCRIPTION_CANCEL" | "FUND_RESERVATION" | "MERCHANT_ORDER";

export interface Money { amount: number; currency: "CNY" }
export interface Payee { id: string; name: string; maskedPhone: string; bankName: string; last4: string }
export interface Account { id: string; name: string; last4: string; balance: number; available: number; currency: "CNY" }

export interface PendingOperation {
  operationId: string;
  idempotencyKey: string;
  type: OperationType;
  riskLevel: RiskLevel;
  status: OperationStatus;
  title: string;
  summary: string;
  details: Record<string, string | number | boolean>;
  expiresAt: string;
  createdAt: string;
}

export interface ChatResponse {
  message: string;
  intent: string;
  operation?: PendingOperation;
  suggestions?: string[];
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  direction: "debit" | "credit";
  category: string;
  confidence: number;
  date: string;
  location: string;
  anomaly?: { severity: "low" | "medium" | "high"; signals: string[] };
}

export interface DashboardData {
  user: { name: string; greeting: string };
  accounts: Account[];
  monthlySpend: number;
  monthlyIncome: number;
  pendingOperations: number;
  subscriptionTotal: number;
  categoryBreakdown: Array<{ category: string; amount: number; color: string }>;
  recentTransactions: Transaction[];
}
