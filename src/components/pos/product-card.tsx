import Image from "next/image";
import { Product } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.quantity <= 0;

  return (
    <Card 
      className={cn(
        "flex flex-col overflow-hidden transition-all",
        isOutOfStock 
          ? "cursor-not-allowed bg-muted/50" 
          : "cursor-pointer hover:shadow-lg hover:-translate-y-1"
      )}
      onClick={() => !isOutOfStock && onAddToCart(product)}
      role="button"
      aria-disabled={isOutOfStock}
    >
      <CardHeader className="p-0 relative aspect-square w-full">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className={cn("object-cover", isOutOfStock && "grayscale")}
        />
        {isOutOfStock && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-bold">AGOTADO</p>
           </div>
        )}
      </CardHeader>
      <CardContent className="p-3 flex-1">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <p className="font-bold text-lg">
          {new Intl.NumberFormat("es-NI", {
            style: "currency",
            currency: "NIO",
          }).format(product.salePrice)}
        </p>
        <p className="text-xs text-muted-foreground">
          Stock: {product.quantity}
        </p>
      </CardFooter>
    </Card>
  );
}
