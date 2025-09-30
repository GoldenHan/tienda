
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, LayoutDashboard, Tablet, Boxes, PackagePlus, ShoppingCart, PiggyBank, BarChart3, Users, Settings } from "lucide-react";


export default function GuidePage() {

    return (
        <div className="flex flex-col">
            <header className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <HelpCircle className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-headline">
                            Guía de Usuario
                        </h1>
                        <p className="text-muted-foreground">
                            Aprende a sacar el máximo provecho de cada sección de la aplicación.
                        </p>
                    </div>
                </div>
            </header>
            <main className="flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
                <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                             <div className="flex items-center gap-3"><LayoutDashboard /> Panel Principal</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">El panel principal es tu centro de control. Ofrece una vista rápida y en tiempo real de las métricas más importantes de tu negocio para el día actual.</p>
                           <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Tarjetas de Estadísticas:</strong> Muestran las ventas totales (en C$ y USD), el beneficio neto estimado del día, el total de productos en tu inventario y un contador de ventas que necesitan revisión.</li>
                                <li><strong>Últimas Ventas:</strong> Un listado de las transacciones más recientes para un seguimiento rápido.</li>
                                <li><strong>Productos con Stock Bajo:</strong> Una alerta crucial que te muestra los productos que están por agotarse, permitiéndote tomar acciones de reabastecimiento a tiempo.</li>
                                <li><strong>Ventas para Revisión:</strong> Si un empleado marca una venta con alguna incidencia, aparecerá aquí para que como administrador puedas revisarla en el historial de ventas.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-2">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                             <div className="flex items-center gap-3"><Tablet /> Punto de Venta (POS)</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">Aquí es donde ocurre la magia de la venta. La interfaz está diseñada para ser rápida e intuitiva.</p>
                           <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Selección de Productos:</strong> Navega por categorías o usa el buscador para encontrar productos. Haz clic en un producto para añadirlo al carrito.</li>
                                <li><strong>Carrito de Compras:</strong> A la derecha, puedes ver los productos añadidos, ajustar cantidades o eliminar artículos.</li>
                                <li><strong>Proceso de Pago:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>Ingresa el monto que el cliente te entrega en "Monto Recibido".</li>
                                        <li>Selecciona la moneda en la que paga el cliente (Pagar en) y en la que deseas dar el vuelto (Dar Vuelto en). El sistema calculará el cambio automáticamente.</li>
                                        <li>El botón "Completar Venta" solo se activa cuando el monto recibido es suficiente.</li>
                                    </ul>
                                </li>
                                <li><strong>Marcar para Revisión:</strong> Después de completar una venta, puedes marcarla para que un administrador la revise si hubo alguna incidencia (ej. un error en el cobro). Deberás añadir una nota explicando el motivo.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><Boxes /> Inventario</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">El corazón de tu negocio. Una gestión de inventario precisa es clave para el éxito.</p>
                           <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Añadir Producto:</strong> Crea nuevos productos uno por uno, especificando todos sus detalles.</li>
                                <li><strong>Importar Productos:</strong> Usa la opción "Importar" para subir un archivo de Excel con todos tus productos. Descarga la plantilla para asegurarte de que el formato es correcto.</li>
                                <li><strong>Unidades de Medida (¡Importante!):</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li><strong>Unidad de Almacenamiento:</strong> Es la unidad en la que compras y gestionas tu stock (ej. 'lb' para queso, 'unidad' para una gaseosa).</li>
                                        <li><strong>Unidades de Venta:</strong> Define cómo vendes el producto. Para el queso (almacenado en 'lb'), puedes añadir unidades de venta como "Onza" (con factor 16) o "Media Libra" (con factor 2). El sistema usará este factor para calcular el precio y descontar el stock correctamente.</li>
                                    </ul>
                                </li>
                               <li><strong>Editar y Eliminar:</strong> Usa el menú de acciones (tres puntos) en cada fila para modificar o eliminar un producto.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-4">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><PackagePlus /> Planificador de Pedidos</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">Esta sección te permite planificar tus compras y reabastecer tu inventario de forma inteligente y controlada.</p>
                           <h3 className="font-semibold mt-4 mb-2">Flujo de Trabajo:</h3>
                           <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Crear un Borrador:</strong> Añade productos al "Borrador de Pedido Actual" usando las sugerencias de stock bajo o el buscador. Puedes ajustar las cantidades que planeas comprar.</li>
                                <li><strong>Guardar el Borrador:</strong> Cuando estés listo, haz clic en "Guardar Borrador". Asígnale un nombre descriptivo (ej. "Pedido semanal de lácteos"). Puedes crear tantos borradores como necesites.</li>
                                <li><strong>Consolidar y Abastecer:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li>En la sección "Borradores Guardados", selecciona uno o más borradores que quieras ejecutar.</li>
                                        <li>El sistema te mostrará el "Costo Total Seleccionado" y lo comparará con el dinero disponible en tu Caja General.</li>
                                        <li>Si tienes fondos suficientes, haz clic en "Confirmar Abastecimiento".</li>
                                    </ul>
                                </li>
                                <li><strong>Acción Automática:</strong> Al confirmar, el sistema automáticamente añadirá los productos a tu inventario y creará un egreso en el Arqueo de Caja por el costo total, manteniendo todo sincronizado.</li>
                           </ol>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><ShoppingCart /> Historial de Ventas</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">Consulta, audita y corrige cualquier transacción pasada.</p>
                           <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Revisar Transacciones:</strong> Cada venta está en un acordeón desplegable que muestra los productos vendidos.</li>
                                <li><strong>Ventas Marcadas:</strong> Las ventas que necesitan revisión aparecerán resaltadas en rojo y con un ícono de bandera.</li>
                                <li><strong>Editar una Venta:</strong> Haz clic en el botón de editar (ícono de lápiz) para modificar una transacción. Puedes cambiar la cantidad de productos o eliminarlos (poniendo la cantidad en 0).</li>
                                <li><strong>Ajuste Automático:</strong> Si tu edición resulta en un reembolso para el cliente (porque eliminaste un producto, por ejemplo), el sistema lo calculará y generará un egreso de caja automático para registrar la devolución del dinero. El stock también se ajustará automáticamente.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-6">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><PiggyBank /> Arqueo de Caja</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">El control diario de tu efectivo. Esta sección resume todos los movimientos de dinero para una fecha seleccionada.</p>
                           <ul className="list-disc pl-5 space-y-2">
                               <li><strong>Selección de Fecha:</strong> Elige el día que quieres consultar.</li>
                               <li><strong>Balances:</strong> Muestra el saldo actual de la Caja General y la Caja Chica en ambas monedas, y un balance total consolidado en córdobas.</li>
                               <li><strong>Acciones Rápidas:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li><strong>Añadir Ingreso/Egreso:</strong> Registra entradas o salidas de dinero que no son por ventas (ej. pago de servicios, aportes de capital).</li>
                                        <li><strong>Transferir:</strong> Mueve dinero entre la Caja General y la Caja Chica.</li>
                                        <li><strong>Cerrar Arqueo:</strong> Al final del día, cierra el arqueo. Esto lo bloquea para evitar modificaciones accidentales.</li>
                                    </ul>
                                </li>
                               <li><strong>Movimientos del Día:</strong> Una tabla detallada con cada venta, ingreso, egreso y transferencia del día.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-7">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><BarChart3 /> Reportes</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">Analiza el rendimiento de tu negocio y exporta tus datos.</p>
                           <ul className="list-disc pl-5 space-y-2">
                               <li><strong>Reporte de Ventas y Beneficios:</strong> Filtra por rango de fechas para ver el detalle de productos vendidos, los ingresos generados y el beneficio neto.</li>
                               <li><strong>Reporte de Inventario:</strong> Obtén una "foto" de tu inventario actual, su valor de costo total y el estado de cada producto.</li>
                               <li><strong>Reporte de Egresos/Ingresos:</strong> Un listado completo de todos los movimientos de caja manuales, con la opción de reimprimir sus respectivos recibos.</li>
                               <li><strong>Exportar:</strong> Todos los reportes se pueden imprimir o exportar a formatos como Excel (.xlsx) para un análisis más profundo.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-8">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/50 rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><Users /> Gestión de Usuarios</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">Administra el acceso de tu equipo a la aplicación.</p>
                           <ul className="list-disc pl-5 space-y-2">
                               <li><strong>Roles de Usuario:</strong>
                                    <ul className="list-disc pl-6 mt-1 space-y-1">
                                        <li><strong>Propietario (Primary-Admin):</strong> Control total. Solo este rol puede transferir la propiedad.</li>
                                        <li><strong>Admin:</strong> Puede acceder a todas las secciones, pero no puede modificar a otros admins ni al propietario.</li>
                                        <li><strong>Empleado:</strong> Solo tiene acceso al Panel (con vista limitada) y al Punto de Venta.</li>
                                    </ul>
                                </li>
                               <li><strong>Acciones:</strong> Como administrador, puedes añadir nuevos usuarios, cambiar roles (ej. promover un empleado a admin) y eliminar usuarios.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-9">
                        <AccordionTrigger className="font-semibold text-lg p-4 bg-muted/so rounded-lg hover:no-underline">
                           <div className="flex items-center gap-3"><Settings /> Configuración</div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-2">
                           <p className="mb-4">Ajusta los parámetros globales de tu cuenta y negocio.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Mi Cuenta:</strong> Cambia tu contraseña.</li>
                                <li><strong>Configuración de la Empresa:</strong> Actualiza el nombre, el logo, la tasa de cambio USD-NIO y el fondo inicial de la Caja Chica.</li>
                                <li><strong>Gestionar Arqueos:</strong> Si necesitas modificar un día ya cerrado, aquí puedes reabrirlo.</li>
                                <li><strong>Gestionar Categorías:</strong> Crea o elimina las categorías de productos que aparecen en el Punto de Venta y en la gestión de inventario.</li>
                           </ul>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </main>
        </div>
    );
}

    