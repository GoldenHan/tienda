
import { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { useAuth } from "@/context/auth-context";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center rounded-lg border">
        {isEmployee 
          ? "Todavía no hay productos para vender. Por favor, espera a que un administrador los añada al inventario."
          : "No hay productos en esta categoría. Ve a la sección 'Inventario' para añadir algunos y empezar a vender."
        }
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
