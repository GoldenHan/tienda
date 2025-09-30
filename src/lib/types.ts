

export type SellingUnit = {
  name: string;
  abbreviation: string;
  factor: number; // How many of this unit are in one stockingUnit
}

export type Product = {
  id: string;
  name: string;
  description: string;
  purchaseCost: number;
  salePrice: number; // Price for one stockingUnit
  quantity: number; // Quantity in stockingUnit
  lowStockThreshold: number;
  imageUrl: string;
  imageHint: string;
  createdAt?: string;
  categoryId: string;
  stockingUnit: 'unidad' | 'lb' | 'oz' | 'L' | 'kg';
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number; // Price at the time of sale
  total: number;
  unit?: string; // e.g. 'lb', 'oz', 'unidad'
};

export type OrderItem = {
  productId: string;
  productName: string;
  orderQuantity: number;
  purchaseCost: number;
}

export type OrderDraft = {
  id: string;
  title: string;
  items: OrderItem[];
  totalCost: number;
  status: 'draft' | 'completed';
  createdAt: string;
}

export type Currency = 'NIO' | 'USD';
export type CashBox = 'general' | 'petty';

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  grandTotal: number;
  employeeId: string;
  employeeName: string;
  paymentCurrency: Currency;
  needsReview?: boolean;
  reviewNotes?: string;
};

export type Inflow = {
  id:string;
  reason: string;
  total: number;
  date: string;
  currency: Currency;
  cashBox: CashBox;
};

export type CashOutflow = {
  id: string;
  date: string;
  amount: number;
  reason: string;
  currency: Currency;
  cashBox: CashBox;
  type: 'manual' | 'restock' | 'adjustment' | 'withdrawal';
};

export type CashTransfer = {
    id: string;
    date: string;
    amount: number;
    currency: Currency;
    fromBox: CashBox;
    toBox: CashBox;
    reason: string;
}

export type SalesData = {
  month: string;
  sales: number;
  profit: number;
};

export type InventoryData = {
  name: string;
  quantity: number;
  value: number;
};

export type UserRole = 'primary-admin' | 'admin' | 'employee';

export type User = {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  createdAt: string;
};

export type NewUserData = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee';
};

export type InitialAdminData = {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
};

export type Reconciliation = {
  id: string; // YYYY-MM-DD
  status: 'open' | 'closed';
  updatedAt: string;
};

export type Category = {
    id: string;
    name: string;
}

export type Company = {
    id: string;
    name: string;
    ownerUid: string;
    exchangeRate: number;
    pettyCashInitial: number;
    createdAt: any; // Using 'any' for Firestore ServerTimestamp flexibility
    logoUrl?: string;
    securityCodeSet?: boolean;
}
