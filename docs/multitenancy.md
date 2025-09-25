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

1.  **Custom Claims de Firebase Authentication**: Durante el inicio de sesión, a cada usuario se le asigna un "custom claim" en su token de autenticación que contiene su `companyId`.

2.  **Reglas de Seguridad de Firestore**: Las reglas de seguridad (`firestore.rules`) son la principal línea de defensa. Utilizan el `companyId` del token del usuario para garantizar que solo pueda acceder a los documentos que pertenecen a su empresa. Cualquier intento de leer o escribir datos de otra empresa es denegado a nivel de base de datos.
    ```firestore
    // Ejemplo de regla
    match /companies/{companyId}/{document=**} {
      function isMemberOfCompany(companyId) {
        return request.auth != null && request.auth.token.companyId == companyId;
      }
      allow read, write: if isMemberOfCompany(companyId);
    }
    ```

3.  **Lógica del Lado del Servidor (Server Actions)**: Todas las operaciones de escritura (crear, actualizar, eliminar) se realizan a través de "Server Actions" de Next.js. Estas acciones siempre validan el `companyId` del usuario que realiza la solicitud antes de interactuar con la base de datos, añadiendo una capa adicional de seguridad.

Esta arquitectura garantiza un entorno multitenencia robusto y seguro sin necesidad de bases de datos separadas por cliente, lo que la hace escalable y eficiente.
