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
        "flex flex-col overflow-hidden transition-all duration-300",
        isOutOfStock 
          ? "cursor-not-allowed bg-muted/50" 
          : "cursor-pointer hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 hover:border-primary/50"
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
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 33vw"
          className={cn("object-cover transition-transform duration-300 group-hover:scale-105", isOutOfStock && "grayscale")}
        />
        {isOutOfStock && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <p className="text-white font-bold tracking-widest text-sm">AGOTADO</p>
           </div>
        )}
      </CardHeader>
      <CardContent className="p-3 flex-1">
        <h3 className="font-semibold text-sm truncate">{product.name}</h3>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between items-center">
        <p className="font-bold text-base">
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
