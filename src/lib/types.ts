
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

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  grandTotal: number;
};

export type Inflow = {
  id:string;
  reason: string;
  total: number;
  date: string;
};

export type CashOutflow = {
  id: string;
  date: string;
  amount: number;
  reason: string;
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

// This represents the document in the root /users/{userId} collection
// It is the source of truth for authorization
export type User = {
  uid: string;
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  createdAt: string;
};

export type EmployeeData = {
  name: string;
  email: string;
  password: string;
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
