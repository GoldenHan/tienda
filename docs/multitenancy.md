# Arquitectura Multitenencia

La aplicación está diseñada con una arquitectura multitenencia desde su núcleo, garantizando que los datos de cada empresa estén completamente aislados y seguros.

## Aislamiento de Datos por `companyId`

El modelo de datos se basa en un identificador único por empresa (`companyId`). Toda la información crítica para un negocio, como productos, ventas, usuarios, categorías y arqueos de caja, se almacena en subcolecciones dentro del documento de esa empresa en Firestore.

La estructura general en Firestore es la siguiente:

```
/companies/{companyId}/products/{productId}
/companies/{companyId}/sales/{saleId}
/companies/{companyId}/users/{userId}
... y así sucesivamente para otras colecciones.
```

## Mecanismos de Seguridad

El aislamiento no depende únicamente de la lógica de la aplicación, sino que se refuerza en múltiples capas:

1.  **Custom Claims de Firebase Authentication**: Durante el inicio de sesión, a cada usuario se le asigna un "custom claim" en su token de autenticación que contiene su `companyId` y su `role` ('primary-admin', 'admin', o 'employee').

2.  **Reglas de Seguridad de Firestore**: Las reglas de seguridad (`firestore.rules`) son la principal línea de defensa. Utilizan el `companyId` y el `role` del token del usuario para garantizar que solo pueda acceder a los documentos que pertenecen a su empresa y que tenga los permisos adecuados para leer o escribir. Cualquier intento de acceder a datos de otra empresa o de realizar una acción no autorizada es denegado a nivel de base de datos.
    ```firestore
    // Ejemplo de regla para lectura
    match /companies/{companyId}/{document=**} {
      function isMemberOfCompany(companyId) {
        return request.auth != null && request.auth.token.companyId == companyId;
      }
      allow read: if isMemberOfCompany(companyId);
    }
    
    // Ejemplo de regla para escritura (solo admins)
    match /companies/{companyId}/products/{productId} {
      function isAdminOfCompany(companyId) {
        return isMemberOfCompany(companyId) && (request.auth.token.role == 'admin' || request.auth.token.role == 'primary-admin');
      }
      allow write: if isAdminOfCompany(companyId);
    }
    ```

3.  **Lógica del Lado del Servidor (Server Actions)**: Operaciones críticas o complejas (crear usuarios, registrar ventas con actualización de stock, cambiar el estado de un arqueo) se realizan a través de "Server Actions" de Next.js. Estas acciones se ejecutan en el servidor, donde pueden verificar de forma segura el rol del usuario y realizar múltiples pasos en la base de datos de manera atómica (con transacciones), garantizando la integridad de los datos.

Esta arquitectura garantiza un entorno multitenencia robusto y seguro sin necesidad de bases de datos separadas por cliente, lo que la hace escalable y eficiente.
