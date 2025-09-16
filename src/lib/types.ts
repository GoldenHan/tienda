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

export type Sale = {
  id: string;
  productName: string;
  quantity: number;
  salePrice: number;
  total: number;
  date: string;
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
