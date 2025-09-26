
"use client";

import { useState } from "react";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, Category } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { uploadImage } from "@/lib/storage-helpers";
import { Textarea } from "../ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "@/context/auth-context";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "La cantidad debe ser un número entero"),
  salePrice: z.coerce.number().min(0, "El precio de venta debe ser positivo"),
  purchaseCost: z.coerce.number().min(0, "El costo de compra debe ser positivo"),
  lowStockThreshold: z.coerce.number().int().min(0, "El umbral debe ser un número entero"),
  categoryId: z.string().min(1, "Debes seleccionar una categoría"),
});

type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData & { imageUrl: string, imageHint: string }) => void;
  isSubmitting?: boolean;
}

export function ProductForm({ product, categories, onSubmit, isSubmitting }: ProductFormProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Needed for uploadImage
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      quantity: product?.quantity || 0,
      salePrice: product?.salePrice || 0,
      purchaseCost: product?.purchaseCost || 0,
      lowStockThreshold: product?.lowStockThreshold || 10,
      categoryId: product?.categoryId || "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "No se encontró un usuario autenticado." });
        return;
    }
    
    setIsUploading(true);
    let finalImageUrl = product?.imageUrl || "";
    let finalImageHint = product?.imageHint || "producto";

    try {
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, user.uid); // Pass userId to uploadImage
        finalImageHint = imageFile.name.split('.')[0].replace(/[-_]/g, ' ').substring(0, 20) || 'producto';
        toast({
          title: "Imagen Subida",
          description: "La nueva imagen del producto se ha guardado.",
        });
      } else if (!product?.imageUrl) {
        // Only assign placeholder if it's a new product with no image
        const randomPlaceholder = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
        finalImageUrl = randomPlaceholder.imageUrl;
        finalImageHint = randomPlaceholder.imageHint;
         toast({
          title: "Imagen de Ejemplo Asignada",
          description: "Puedes cambiarla subiendo tu propia imagen.",
        });
      }
      
      if (!finalImageUrl) {
         toast({
          variant: "destructive",
          title: "Error de Imagen",
          description: "No se pudo determinar la imagen para el producto.",
        });
        setIsUploading(false);
        return;
      }

      onSubmit({ ...data, imageUrl: finalImageUrl, imageHint: finalImageHint });

    } catch (error) {
      console.error("Error al subir imagen o guardar producto:", error);
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: "No se pudo subir la imagen o guardar el producto. Inténtalo de nuevo.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const isLoading = isUploading || isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        
        <FormItem>
          <FormLabel>Imagen del Producto</FormLabel>
          <FormControl>
            <div className="w-full">
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="relative w-full h-48 border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-muted-foreground hover:border-primary transition-colors">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Vista previa" fill className="object-contain rounded-lg p-2" />
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 mb-2" />
                      <p>Haz clic para subir una imagen</p>
                      <p className="text-xs">(JPG, PNG, WEBP)</p>
                    </>
                  )}
                </div>
              </label>
              <Input 
                id="image-upload"
                type="file" 
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange} 
                disabled={isLoading}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Taza Artesanal" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría para el producto" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {categories.length === 0 ? (
                        <SelectItem value="no-cat" disabled>Crea una categoría en Configuración</SelectItem>
                    ) : (
                        categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                        </SelectItem>
                        ))
                    )}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe el producto" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad en Stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Umbral Stock Bajo</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
         <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de Compra (C$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio de Venta (C$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : (product ? "Guardar Cambios" : "Añadir Producto")}
        </Button>
      </form>
    </Form>
  );
}
