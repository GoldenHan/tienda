import type { Product, Sale, Inflow, SalesData, InventoryData } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const image = PlaceHolderImages.find(img => img.id === id);
  return image || { imageUrl: 'https://picsum.photos/seed/placeholder/400/400', imageHint: 'placeholder' };
};

export const products: Product[] = [
  {
    id: 'prod_1',
    name: 'Artisan Ceramic Mug',
    description: 'Handcrafted mug with a unique glaze finish.',
    purchaseCost: 8.5,
    salePrice: 22.0,
    quantity: 42,
    lowStockThreshold: 10,
    imageUrl: getImage('ceramic_mug').imageUrl,
    imageHint: getImage('ceramic_mug').imageHint,
  },
  {
    id: 'prod_2',
    name: 'Linen Throw Pillow',
    description: 'Soft and durable linen pillow for a cozy home.',
    purchaseCost: 15.0,
    salePrice: 45.0,
    quantity: 8,
    lowStockThreshold: 5,
    imageUrl: getImage('throw_pillow').imageUrl,
    imageHint: getImage('throw_pillow').imageHint,
  },
  {
    id: 'prod_3',
    name: 'Soy Wax Candle',
    description: 'Scented candle with natural soy wax. Lavender scent.',
    purchaseCost: 6.0,
    salePrice: 18.0,
    quantity: 60,
    lowStockThreshold: 15,
    imageUrl: getImage('wax_candle').imageUrl,
    imageHint: getImage('wax_candle').imageHint,
  },
  {
    id: 'prod_4',
    name: 'Leather Bound Journal',
    description: 'A5 journal with premium paper and a soft leather cover.',
    purchaseCost: 12.0,
    salePrice: 35.0,
    quantity: 25,
    lowStockThreshold: 10,
    imageUrl: getImage('leather_journal').imageUrl,
    imageHint: getImage('leather_journal').imageHint,
  },
  {
    id: 'prod_5',
    name: 'Minimalist Wall Clock',
    description: 'Silent wall clock with a clean, modern design.',
    purchaseCost: 25.0,
    salePrice: 70.0,
    quantity: 12,
    lowStockThreshold: 5,
    imageUrl: getImage('wall_clock').imageUrl,
    imageHint: getImage('wall_clock').imageHint,
  },
];

export const sales: Sale[] = [
  { id: 'sale_1', productName: 'Artisan Ceramic Mug', quantity: 2, salePrice: 22.0, total: 44.0, date: '2024-05-28' },
  { id: 'sale_2', productName: 'Linen Throw Pillow', quantity: 1, salePrice: 45.0, total: 45.0, date: '2024-05-28' },
  { id: 'sale_3', productName: 'Soy Wax Candle', quantity: 3, salePrice: 18.0, total: 54.0, date: '2024-05-27' },
  { id: 'sale_4', productName: 'Leather Bound Journal', quantity: 1, salePrice: 35.0, total: 35.0, date: '2024-05-26' },
  { id: 'sale_5', productName: 'Artisan Ceramic Mug', quantity: 1, salePrice: 22.0, total: 22.0, date: '2024-05-25' },
];

export const inflows: Inflow[] = [
  { id: 'inflow_1', productName: 'Artisan Ceramic Mug', quantity: 50, purchaseCost: 8.5, total: 425.0, date: '2024-05-01' },
  { id: 'inflow_2', productName: 'Linen Throw Pillow', quantity: 20, purchaseCost: 15.0, total: 300.0, date: '2024-05-02' },
];

export const salesData: SalesData[] = [
    { month: 'Jan', sales: 1860, profit: 800 },
    { month: 'Feb', sales: 3050, profit: 1400 },
    { month: 'Mar', sales: 2370, profit: 1100 },
    { month: 'Apr', sales: 730, profit: 300 },
    { month: 'May', sales: 2090, profit: 950 },
    { month: 'Jun', sales: 2140, profit: 1200 },
];

export const inventoryData: InventoryData[] = products.map(p => ({
  name: p.name,
  quantity: p.quantity,
  value: p.quantity * p.salePrice,
}));
