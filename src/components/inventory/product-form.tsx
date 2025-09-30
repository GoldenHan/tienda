
"use client";

import { useState } from "react";
import Image from "next/image";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, Category, SellingUnit } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, Trash2, PlusCircle } from "lucide-react";
import { uploadImage } from "@/lib/storage-helpers";
import { Textarea } from "../ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "@/context/auth-context";
import { getCompanyIdForUser } from "@/lib/firestore-helpers";
import { Separator } from "../ui/separator";

const sellingUnitSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  abbreviation: z.string().min(1, "La abreviatura es requerida"),
  factor: z.coerce.number().min(0.0001, "El factor debe ser positivo"),
});

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "La cantidad debe ser un número positivo"),
  salePrice: z.coerce.number().min(0, "El precio de venta debe ser positivo"),
  purchaseCost: z.coerce.number().min(0, "El costo de compra debe ser positivo"),
  lowStockThreshold: z.coerce.number().min(0, "El umbral debe ser un número positivo"),
  categoryId: z.string().min(1, "Debes seleccionar una categoría"),
  stockingUnit: z.enum(['unidad', 'lb', 'oz', 'L', 'kg']),
  sellingUnits: z.array(sellingUnitSchema).min(1, "Debe haber al menos una unidad de venta."),
});


type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: Omit<Product, 'id'>) => void;
  isSubmitting?: boolean;
}

export function ProductForm({ product, categories, onSubmit, isSubmitting }: ProductFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: product ? {
        ...product,
    } : {
      name: "",
      description: "",
      quantity: 0,
      salePrice: 0,
      purchaseCost: 0,
      lowStockThreshold: 10,
      categoryId: "",
      stockingUnit: 'unidad',
      sellingUnits: [{ name: "Unidad", abbreviation: "u", factor: 1 }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "sellingUnits",
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
        const companyId = await getCompanyIdForUser(user.uid);
        finalImageUrl = await uploadImage(imageFile, companyId);
        finalImageHint = imageFile.name.split('.')[0].replace(/[-_]/g, ' ').substring(0, 20) || 'producto';
        toast({
          title: "Imagen Subida",
          description: "La nueva imagen del producto se ha guardado.",
        });
      } else if (!product?.imageUrl) {
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
  
  const stockingUnit = form.watch('stockingUnit');
  const unitLabels = { unidad: "Unidad", lb: "Libra", oz: "Onza", L: "Litro", kg: "Kilogramo"};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        
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
                <Input placeholder="Ej. Queso Seco" {...field} disabled={isLoading} />
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
                        <SelectValue placeholder="Selecciona una categoría" />
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
                name="stockingUnit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unidad de Almacenamiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="unidad">Unidad</SelectItem>
                            <SelectItem value="lb">Libra (lb)</SelectItem>
                            <SelectItem value="oz">Onza (oz)</SelectItem>
                            <SelectItem value="L">Litro (L)</SelectItem>
                            <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>La unidad en que compras y gestionas el stock.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Cantidad en Stock ({unitLabels[stockingUnit]})</FormLabel>
                    <FormControl>
                    <Input type="number" step="any" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <Separator />
        
        <div>
            <FormLabel>Unidades de Venta</FormLabel>
            <FormDescription className="mb-4">Define cómo se venderá este producto. El precio base y el factor de conversión se basan en la unidad de almacenamiento.</FormDescription>
            <div className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md">
                        <div className="grid grid-cols-3 gap-2 flex-1">
                             <FormField
                                control={form.control}
                                name={`sellingUnits.${index}.name`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Nombre</FormLabel>
                                    <FormControl><Input placeholder="Ej. Onza" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`sellingUnits.${index}.abbreviation`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Abreviatura</FormLabel>
                                    <FormControl><Input placeholder="Ej. oz" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`sellingUnits.${index}.factor`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Factor vs {unitLabels[stockingUnit]}</FormLabel>
                                    <FormControl><Input type="number" step="any" placeholder="Ej. 16" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive mt-6" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', abbreviation: '', factor: 1 })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Unidad de Venta
                </Button>
                <FormField
                    control={form.control}
                    name="sellingUnits"
                    render={() => <FormMessage />}
                />
            </div>
        </div>

        <Separator />
        
         <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de Compra (por {unitLabels[stockingUnit]})</FormLabel>
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
                <FormLabel>Precio de Venta (por {unitLabels[stockingUnit]})</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Umbral Stock Bajo (en {unitLabels[stockingUnit]})</FormLabel>
                <FormControl>
                  <Input type="number" step="any" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : (product ? "Guardar Cambios" : "Añadir Producto")}
        </Button>
      </form>
    </Form>
  );
}
