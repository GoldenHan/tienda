# Sistema de Gestión de Inventario y Punto de Venta (POS)

## Descripción General

Esta es una aplicación web full-stack construida con Next.js, diseñada como un sistema de punto de venta (POS) y gestión de inventario. Su arquitectura multitenencia permite que múltiples empresas utilicen la misma aplicación, manteniendo sus datos completamente aislados y seguros.

El sistema está preparado para manejar lógicas de negocio complejas, como la gestión de inventario con diferentes unidades de medida (compra y venta), y utiliza las Server Actions de Next.js para garantizar la seguridad y la integridad de los datos en operaciones críticas.

## Características Principales

- **Arquitectura Multitenencia Segura**: Los datos de cada empresa (productos, ventas, usuarios, etc.) están estrictamente aislados utilizando un identificador único (`companyId`) en la base de datos.
- **Gestión Avanzada de Productos**:
  - Creación, edición y eliminación de productos.
  - **Unidades de Medida Flexibles**: Permite definir una **unidad de almacenamiento** (ej. comprar queso por 'libras') y múltiples **unidades de venta** (ej. venderlo por 'onza' o 'media libra'), con factores de conversión automáticos que ajustan el stock y el precio de forma precisa.
- **Registro de Ventas y Control de Stock**: Las ventas se registran en tiempo real, descontando automáticamente las cantidades correspondientes del inventario.
- **Gestión de Usuarios y Roles**: Permite administrar qué usuarios pertenecen a qué empresa y qué nivel de acceso tienen.
- **Arqueo de Caja**: Incluye funcionalidades para realizar el balance y cierre de la caja al final del día o turno.
- **Seguridad Robusta**:
  - **Autenticación Basada en Tokens (JWT)**: La seguridad de las sesiones se gestiona mediante JSON Web Tokens, que se validan en cada solicitud protegida.
  - **Middleware de Autorización**: Un middleware centralizado intercepta las peticiones para verificar la autenticación del usuario y su pertenencia a la empresa correcta antes de permitir el acceso a los datos.
  - **Server Actions Seguras**: Las operaciones críticas (crear usuarios, registrar ventas, etc.) se ejecutan como Server Actions en el servidor, validando permisos y garantizando transacciones atómicas y seguras.

## Cómo Desplegar de Forma Local

Sigue estos pasos para clonar, configurar y ejecutar el proyecto en tu máquina de desarrollo.

### Prerrequisitos

- Node.js (versión 20.x o superior)
- `npm` o un gestor de paquetes equivalente (`yarn`, `pnpm`)
- Una base de datos (por ejemplo, PostgreSQL, MySQL, MongoDB) para almacenar los datos.

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

Crea un archivo `.env.local` en la raíz del proyecto para almacenar las variables de entorno secretas. Deberás configurar lo siguiente:

```
# Ejemplo de variables de entorno

# URL de conexión a tu base de datos
DATABASE_URL="postgresql://user:password@host:port/database"

# Una cadena secreta y larga para firmar los JWT
JWT_SECRET="tu_secreto_super_secreto_para_jwt"
```

**Nota**: Asegúrate de que tu archivo `.env.local` esté incluido en `.gitignore` para no exponer tus credenciales en el repositorio.

### 4. Ejecutar las Migraciones de la Base de Datos (si aplica)

Si estás utilizando un ORM como Prisma o Drizzle, este es el momento de aplicar las migraciones para crear la estructura de la base de datos.

```bash
# Ejemplo con Prisma
npx prisma migrate dev
```

### 5. Ejecutar el Servidor de Desarrollo

Una vez configuradas las variables de entorno, inicia el servidor de Next.js.

```bash
npm run dev
```

### 6. Abrir la Aplicación

Abre tu navegador y visita [http://localhost:3000](http://localhost:3000). La aplicación web debería estar funcionando.

## Esquema de la Base de Datos

A continuación se presenta un esquema SQL genérico como punto de partida. Puedes adaptarlo a tu motor de base de datos preferido (PostgreSQL, MySQL, etc.).

```sql
-- Tabla para las empresas (Tenants)
CREATE TABLE companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para los usuarios
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee', -- Ej: 'admin', 'employee'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Tabla para los productos
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    -- Unidad en la que se almacena y cuenta el stock (ej: 'kg', 'litro', 'unidad')
    storage_unit VARCHAR(50) NOT NULL,
    stock_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Tabla para las unidades de venta de cada producto
-- Permite vender un producto en unidades diferentes a la de almacenamiento
-- Ej: Almacenar queso en 'kg' (storage_unit) y venderlo en 'gramo' o 'libra'
CREATE TABLE product_sale_units (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    unit_name VARCHAR(50) NOT NULL, -- Ej: 'gramo', 'libra', 'porción'
    price DECIMAL(10, 2) NOT NULL,
    -- Factor de conversión respecto a la unidad de almacenamiento del producto
    -- Ej: Si storage_unit es 'kg' y unit_name es 'gramo', conversion_factor es 0.001
    conversion_factor DECIMAL(10, 5) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabla para las ventas
CREATE TABLE sales (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla para los artículos de una venta (tabla de unión)
CREATE TABLE sale_items (
    id VARCHAR(255) PRIMARY KEY,
    sale_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    -- La unidad en la que se vendió (de la tabla product_sale_units)
    sale_unit_name VARCHAR(50) NOT NULL,
    quantity_sold DECIMAL(10, 3) NOT NULL,
    price_at_sale DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

```
