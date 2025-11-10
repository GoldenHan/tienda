# Sistema de Gestión de Inventario y Punto de Venta (POS)

## Descripción General

Esta es una aplicación web full-stack construida con Next.js y Firebase, diseñada como un sistema de punto de venta (POS) y gestión de inventario. Su arquitectura multitenencia permite que múltiples empresas utilicen la misma aplicación, manteniendo sus datos completamente aislados y seguros.

El sistema está preparado para manejar lógicas de negocio complejas, como la gestión de inventario con diferentes unidades de medida (compra y venta), y utiliza las Server Actions de Next.js para garantizar la seguridad y la integridad de los datos en operaciones críticas.

## Características Principales

- **Arquitectura Multitenencia Segura**: Los datos de cada empresa (productos, ventas, usuarios, etc.) están estrictamente aislados utilizando el `companyId` en la base de datos de Firestore.
- **Gestión Avanzada de Productos**:
  - Creación, edición y eliminación de productos.
  - **Unidades de Medida Flexibles**: Permite definir una **unidad de almacenamiento** (ej. comprar queso por 'libras') y múltiples **unidades de venta** (ej. venderlo por 'onza' o 'media libra'), con factores de conversión automáticos que ajustan el stock y el precio de forma precisa.
- **Registro de Ventas y Control de Stock**: Las ventas se registran en tiempo real, descontando automáticamente las cantidades correspondientes del inventario.
- **Gestión de Usuarios y Roles**: Permite administrar qué usuarios pertenecen a qué empresa y qué nivel de acceso tienen (funcionalidad en desarrollo).
- **Arqueo de Caja**: Incluye funcionalidades para realizar el balance y cierre de la caja al final del día o turno.
- **Seguridad Robusta**: Las operaciones críticas (crear usuarios, registrar ventas, etc.) se ejecutan como Server Actions en el servidor, validando permisos y garantizando transacciones atómicas y seguras.

## Cómo Desplegar de Forma Local

Sigue estos pasos para clonar, configurar y ejecutar el proyecto en tu máquina de desarrollo.

### Prerrequisitos

- Node.js (versión 20.x o superior)
- `npm` o un gestor de paquetes equivalente (`yarn`, `pnpm`)
- Acceso a un proyecto de Firebase con Firestore y Authentication habilitados.

### 1. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_DIRECTORIO>
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Necesitas crear dos archivos en la raíz del proyecto para las variables de entorno.

#### A. Archivo `.env.local` (para el lado del cliente)

Este archivo contiene las claves públicas de tu proyecto de Firebase, que son seguras para exponer en el navegador.

Crea un archivo llamado `.env.local` y añade el siguiente contenido, reemplazando los valores con los de tu proyecto de Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-proyecto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef123456"
```

#### B. Archivo `.env` (para el lado del servidor)

Este archivo contiene la clave de la cuenta de servicio, que es **secreta** y solo debe usarse en el servidor.

1.  En la consola de Firebase, ve a "Configuración del proyecto" > "Cuentas de servicio".
2.  Haz clic en "Generar nueva clave privada" y descarga el archivo JSON.
3.  **Importante**: Copia todo el contenido del archivo JSON y pégalo como una sola línea. Puedes usar un minificador de JSON online para esto.
4.  Crea un archivo llamado `.env` y añade la clave:

```
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":...}'
```

### 4. Ejecutar el Servidor de Desarrollo

Una vez configuradas las variables de entorno, inicia el servidor de Next.js.

```bash
npm run dev
```

### 5. Abrir la Aplicación

Abre tu navegador y visita [http://localhost:3000](http://localhost:3000). La aplicación web debería estar funcionando.
