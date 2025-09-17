import type { Product, Sale, Inflow, SalesData, InventoryData } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const image = PlaceHolderImages.find(img => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/placeholder/400/400', imageHint: 'placeholder' };
};

export const products: Product[] = [];

export const sales: Sale[] = [];

export const inflows: Inflow[] = [];

export const salesData: SalesData[] = [
    { month: 'Jan', sales: 0, profit: 0 },
    { month: 'Feb', sales: 0, profit: 0 },
    { month: 'Mar', sales: 0, profit: 0 },
    { month: 'Apr', sales: 0, profit: 0 },
    { month: 'May', sales: 0, profit: 0 },
    { month: 'Jun', sales: 0, profit: 0 },
];

export const inventoryData: InventoryData[] = products.map(p => ({
  name: p.name,
  quantity: p.quantity,
  value: p.quantity * p.salePrice,
}));
