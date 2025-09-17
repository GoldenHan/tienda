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
  id: string;
  productName: string;
  quantity: number;
  purchaseCost: number;
  total: number;
  date: string;
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

export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  companyId: string;
  createdAt: any; 
};

export type EmployeeData = {
  name: string;
  email: string;
  password: string;
};

export type Company = {
  id: string;
  name: string;
  adminUid: string;
  createdAt: any;
};
