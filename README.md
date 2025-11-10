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
