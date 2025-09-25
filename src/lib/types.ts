

export type Product = {
  id: string;
  name: string;
  description: string;
  purchaseCost: number;
  salePrice: number;
  quantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  imageHint: string;
  createdAt?: string;
  categoryId: string;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number; // Price at the time of sale
  total: number;
};

export type Currency = 'NIO' | 'USD';

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  grandTotal: number;
  employeeId: string;
  employeeName: string;
  paymentCurrency: Currency;
};

export type Inflow = {
  id:string;
  reason: string;
  total: number;
  date: string;
  currency: Currency;
};

export type CashOutflow = {
  id: string;
  date: string;
  amount: number;
  reason: string;
  currency: Currency;
};

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
  secretCode: string;
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
    createdAt: any; // Using 'any' for Firestore ServerTimestamp flexibility
}

    

    
