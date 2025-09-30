
"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Table, Download } from "lucide-react";
import { addMultipleProducts, addCategory } from "@/lib/actions/setup";
import { Category, Product } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface ProductImporterProps {
    allProducts: Product[];
    categories: Category[];
    onImport: () => void;
}

const REQUIRED_COLUMNS = ["Nombre", "Cantidad", "Precio de Venta", "Costo de Compra", "Unidad de Medida"];
const OPTIONAL_COLUMNS = ["Descripcion", "Umbral Stock Bajo", "Nombre Categoria"];

const validUnits: Product['stockingUnit'][] = ['unidad', 'lb', 'kg', 'L', 'qq'];

export function ProductImporter({ allProducts, categories, onImport }: ProductImporterProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para importar productos." });
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<any>(worksheet);

            const headers = Object.keys(json[0] || {});
            const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                throw new Error(`Faltan las siguientes columnas obligatorias en el archivo: ${missingColumns.join(", ")}`);
            }

            const existingCategoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
            const existingProductNames = new Set(allProducts.map(p => p.name.toLowerCase()));
            
            const productsToCreate: Omit<Product, "id">[] = [];
            let skippedCount = 0;

            for (const row of json) {
                const productName = row["Nombre"]?.toString().trim();
                if (!productName) continue;

                if (existingProductNames.has(productName.toLowerCase())) {
                    skippedCount++;
                    continue;
                }

                const categoryName = row["Nombre Categoria"]?.toString().trim();
                let categoryId = "";

                if (categoryName) {
                    const lowerCategoryName = categoryName.toLowerCase();
                    if (existingCategoryMap.has(lowerCategoryName)) {
                        categoryId = existingCategoryMap.get(lowerCategoryName)!;
                    } else {
                        const newId = await addCategory(categoryName, user.uid);
                        existingCategoryMap.set(lowerCategoryName, newId);
                        categoryId = newId;
                    }
                } else {
                     const sinCategoria = "Sin Categoría";
                     if (existingCategoryMap.has(sinCategoria.toLowerCase())) {
                        categoryId = existingCategoryMap.get(sinCategoria.toLowerCase())!;
                     } else {
                        const newId = await addCategory(sinCategoria, user.uid);
                        existingCategoryMap.set(sinCategoria.toLowerCase(), newId);
                        categoryId = newId;
                     }
                }

                const randomPlaceholder = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
                
                const unitInput = (row["Unidad de Medida"] || 'unidad').toString().toLowerCase();
                const stockingUnit: Product['stockingUnit'] = validUnits.includes(unitInput as any) ? unitInput as Product['stockingUnit'] : 'unidad';
                
                if (!validUnits.includes(unitInput as any)) {
                     console.warn(`Unidad de medida no válida "${unitInput}" para el producto "${row["Nombre"]}". Se usará "unidad" por defecto.`);
                }

                const newProduct: Omit<Product, "id"> = {
                    name: productName,
                    description: row["Descripcion"] || "",
                    quantity: Number(row["Cantidad"]) || 0,
                    salePrice: Number(row["Precio de Venta"]) || 0,
                    purchaseCost: Number(row["Costo de Compra"]) || 0,
                    lowStockThreshold: Number(row["Umbral Stock Bajo"]) || 10,
                    categoryId: categoryId,
                    imageUrl: randomPlaceholder.imageUrl,
                    imageHint: randomPlaceholder.imageHint,
                    stockingUnit: stockingUnit,
                };

                productsToCreate.push(newProduct);
                existingProductNames.add(productName.toLowerCase());
            }

            if (productsToCreate.length > 0) {
                await addMultipleProducts(productsToCreate, user.uid);
            }
            
            toast({
                title: "Importación Completada",
                description: `${productsToCreate.length} productos nuevos añadidos. ${skippedCount > 0 ? `${skippedCount} productos omitidos por ya existir.` : ''}`,
            });
            onImport();

        } catch (error: any) {
            console.error("Error al importar productos:", error);
            toast({
                variant: "destructive",
                title: "Error de Importación",
                description: error.message || "No se pudo procesar el archivo.",
            });
        } finally {
            setIsImporting(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const handleDownloadTemplate = () => {
        const data = [
            {
                "Nombre": "Ejemplo: Queso Seco",
                "Descripcion": "Ejemplo: Queso de crema de exportación",
                "Cantidad": 10,
                "Precio de Venta": 160,
                "Costo de Compra": 120,
                "Umbral Stock Bajo": 2,
                "Nombre Categoria": "Lácteos",
                "Unidad de Medida": "lb"
            },
            {
                "Nombre": "Ejemplo: Coca-Cola 3L",
                "Descripcion": "Ejemplo: Gaseosa en botella de plástico de 3 litros",
                "Cantidad": 24,
                "Precio de Venta": 80,
                "Costo de Compra": 65,
                "Umbral Stock Bajo": 5,
                "Nombre Categoria": "Bebidas",
                "Unidad de Medida": "unidad"
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Productos");
        XLSX.writeFile(workbook, "plantilla_productos.xlsx");
    };

    return (
        <div className="space-y-4">
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                <p className="font-bold mb-2">Columnas Obligatorias:</p>
                <ul className="list-disc list-inside">
                    {REQUIRED_COLUMNS.slice(0, -1).map(col => <li key={col}><strong>{col}</strong></li>)}
                     <li><strong>Unidad de Medida</strong> (Valores válidos: 'unidad', 'lb', 'kg', 'L', 'qq')</li>
                </ul>
                 <p className="font-bold mt-2 mb-2">Columnas Opcionales:</p>
                <ul className="list-disc list-inside">
                    {OPTIONAL_COLUMNS.map(col => <li key={col}><strong>{col}</strong></li>)}
                </ul>
             </div>

            <Button variant="secondary" onClick={handleDownloadTemplate} className="w-full">
                <Download className="mr-2" />
                Descargar Plantilla de Excel
            </Button>
            
            <div className="relative">
                <Input
                    ref={fileInputRef}
                    id="excel-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    disabled={isImporting}
                    className="hidden"
                />
                <label htmlFor="excel-upload">
                    <Button asChild disabled={isImporting} className="w-full cursor-pointer">
                        <div>
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    <Table className="mr-2"/>
                                    Seleccionar Archivo Excel
                                </>
                            )}
                        </div>
                    </Button>
                </label>
            </div>

        </div>
    );
}

    