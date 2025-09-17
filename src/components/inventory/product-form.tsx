"use client";

import { useState } from "react";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { uploadImage } from "@/lib/storage-helpers";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  quantity: z.coerce.number().int().min(0, "La cantidad debe ser un número entero"),
  salePrice: z.coerce.number().min(0, "El precio de venta debe ser positivo"),
});

// We remove imageUrl from the form schema, as we'll handle it separately
type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product;
  // onSubmit now receives the image URL as a separate argument
  onSubmit: (data: ProductFormData & { imageUrl: string }) => void;
}

export function ProductForm({ product, onSubmit }: ProductFormProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      quantity: product?.quantity || 0,
      salePrice: product?.salePrice || 0,
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
    setIsUploading(true);
    let imageUrl = product?.imageUrl || ""; // Keep old image if no new one is uploaded

    try {
      if (imageFile) {
        // If there's a new file, upload it
        imageUrl = await uploadImage(imageFile);
        toast({
          title: "Imagen Subida",
          description: "La nueva imagen del producto se ha guardado.",
        });
      } else if (!imageUrl) {
        // If there is no new file and no existing image, it's an error
        toast({
          variant: "destructive",
          title: "Error",
          description: "Debes seleccionar una imagen para el producto.",
        });
        setIsUploading(false);
        return;
      }

      // Call the original onSubmit with the complete data
      onSubmit({ ...data, imageUrl });

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
                    <Image src={previewUrl} alt="Vista previa" fill className="object-contain rounded-lg" />
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
                disabled={isUploading}
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
                <Input placeholder="Ej. Taza Artesanal" {...field} disabled={isUploading} />
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
                  <Input type="number" {...field} disabled={isUploading} />
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
                  <Input type="number" step="0.01" {...field} disabled={isUploading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? <Loader2 className="animate-spin" /> : (product ? "Guardar Cambios" : "Añadir Producto")}
        </Button>
      </form>
    </Form>
  );
}
