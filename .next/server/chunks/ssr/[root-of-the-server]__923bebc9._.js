module.exports = [
"[externals]/firebase-admin/app [external] (firebase-admin/app, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase-admin/app");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/firebase-admin/auth [external] (firebase-admin/auth, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase-admin/auth");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/firebase-admin/firestore [external] (firebase-admin/firestore, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("firebase-admin/firestore");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/lib/firebase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "adminAuth",
    ()=>adminAuth,
    "adminDb",
    ()=>adminDb
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase-admin/app [external] (firebase-admin/app, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase-admin/auth [external] (firebase-admin/auth, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase-admin/firestore [external] (firebase-admin/firestore, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
let app;
if (!(0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__["getApps"])().length) {
    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
            throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Pega el contenido de tu archivo JSON de cuenta de servicio en el archivo .env.");
        }
        const serviceAccount = JSON.parse(serviceAccountJson);
        app = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__["initializeApp"])({
            credential: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__["cert"])(serviceAccount)
        });
    } catch (error) {
        let errorMessage = "No se pudo inicializar Firebase Admin. Revisa tus credenciales en el archivo .env.";
        if (error.message.includes("Unexpected token")) {
            errorMessage += " El valor de FIREBASE_SERVICE_ACCOUNT_JSON parece no ser un JSON válido.";
        } else {
            errorMessage += " El error fue: " + error.message;
        }
        console.error("Error de Inicialización de Firebase Admin:", errorMessage);
        throw new Error(errorMessage);
    }
} else {
    app = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$app__$5b$external$5d$__$28$firebase$2d$admin$2f$app$2c$__esm_import$29$__["getApps"])()[0];
}
const adminAuth = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$auth__$5b$external$5d$__$28$firebase$2d$admin$2f$auth$2c$__esm_import$29$__["getAuth"])(app);
const adminDb = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["getFirestore"])(app);
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http2 [external] (http2, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/src/lib/firebase/client.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/firebase/client.ts
__turbopack_context__.s([
    "app",
    ()=>app,
    "auth",
    ()=>auth,
    "db",
    ()=>db,
    "firestore",
    ()=>db,
    "functions",
    ()=>functions,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm2017.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/firebase/node_modules/@firebase/auth/dist/node-esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.node.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/node-esm/index.node.esm.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$functions$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/functions/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/functions/dist/esm/index.esm2017.js [app-rsc] (ecmascript)");
;
;
;
;
;
// 🔹 Configuración de Firebase desde variables de entorno
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "TU_API_KEY"),
    authDomain: ("TURBOPACK compile-time value", "TU_AUTH_DOMAIN"),
    projectId: ("TURBOPACK compile-time value", "TU_PROJECT_ID"),
    storageBucket: ("TURBOPACK compile-time value", "TU_STORAGE_BUCKET"),
    messagingSenderId: ("TURBOPACK compile-time value", "TU_MESSAGING_SENDER_ID"),
    appId: ("TURBOPACK compile-time value", "TU_APP_ID")
};
// 🔹 Singleton: inicializa Firebase una sola vez
function getFirebaseApp() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getApps"])().length) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getApp"])();
}
// 🔹 Inicializaciones (ya nunca son null)
const app = getFirebaseApp();
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAuth"])(app);
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$node$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$node$2d$esm$2f$index$2e$node$2e$esm$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStorage"])(app);
const functions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFunctions"])(app);
;
}),
"[project]/src/lib/actions/setup.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"003e55ce336b04d3a13975537d10e57747b5e9f2bb":"isInitialSetupRequired","40a50b4c975703f0765316cfe18601634cc06249b3":"getCompanyIdForUser","40b4177845e77e8779f45ba6afa1f228a6a569e41b":"createInitialAdminUser","6016f397cd7b1af63a40a9524f5043744a2a7a83ae":"addProduct","601d0ca6501ea0fde1bd25f0e8a7c52f83bf650c46":"addCashOutflow","602bfd04158ac023b2535248905eba56303a1ee685":"addWithdrawal","606d00bf53eb3c874e402113c48bf71ca1136b581d":"addUser","6070ff61111770630df4f38d3681dee87b4cc2c8eb":"deleteProduct","6072045fcd1715096f3a15a725bfd9b731bdab6c02":"addInflow","60998521e10008b5be4736c9baecdccf10f45ca335":"deleteUser","609e042c915eb7cdbc4995b28d67702754a6c14ab2":"restockInventory","60af76ae54149699aae0f1cd62ef0c549db3f7bcef":"addCashTransfer","60b8000a054ac48e3da8a0e61c79c165146ed5e1d9":"transferPrimaryAdmin","60bc5cf0e782dfa5f5c2adc8ef24d9769df3047ee2":"updateCompanySettings","60bc756288ea91f392869242516f3561c27e364ac9":"addCategory","60c411047e876b0cdc479de887e18ef01bd4652d9d":"deleteOrderDraft","60d96209c3374915a470d98d53bbd12c85618fa2f5":"deleteCategory","60fc2057ee55605250f429cf5a54781dfb5f72910a":"addMultipleProducts","700197b074ce1edc73f5da1ee0524c7b1cfa96e4f7":"markSaleForReview","701cf7b4050c596e5db93b8723c3249b67749eb446":"updateProduct","70323c30dbcab97319ac1e929235bbb75e5a66711e":"updateUserRole","70367746f6be61e9677f725a550e09a604fe306922":"updateReconciliationStatus","707d15a1e95d772d5612c575cb0d30b3df384fe478":"updateSaleAndAdjustStock","708d1676e6444238073d11a9285f9f518027fed1be":"setCompanySecurityCode","70b17520616514f10e95c5f024831ccbf0b3e3b2e6":"addSale","70f7a0bcba774c5955d46ec1c548d36cade37a11e5":"initiateCompanyWipe","78b23efff676fa59d85fba62c1a7dacab3415d698a":"adjustStockForLoss","78dc9e243b8de082427c204333953f96df345ef361":"addOrderDraft"},"",""] */ __turbopack_context__.s([
    "addCashOutflow",
    ()=>addCashOutflow,
    "addCashTransfer",
    ()=>addCashTransfer,
    "addCategory",
    ()=>addCategory,
    "addInflow",
    ()=>addInflow,
    "addMultipleProducts",
    ()=>addMultipleProducts,
    "addOrderDraft",
    ()=>addOrderDraft,
    "addProduct",
    ()=>addProduct,
    "addSale",
    ()=>addSale,
    "addUser",
    ()=>addUser,
    "addWithdrawal",
    ()=>addWithdrawal,
    "adjustStockForLoss",
    ()=>adjustStockForLoss,
    "createInitialAdminUser",
    ()=>createInitialAdminUser,
    "deleteCategory",
    ()=>deleteCategory,
    "deleteOrderDraft",
    ()=>deleteOrderDraft,
    "deleteProduct",
    ()=>deleteProduct,
    "deleteUser",
    ()=>deleteUser,
    "getCompanyIdForUser",
    ()=>getCompanyIdForUser,
    "initiateCompanyWipe",
    ()=>initiateCompanyWipe,
    "isInitialSetupRequired",
    ()=>isInitialSetupRequired,
    "markSaleForReview",
    ()=>markSaleForReview,
    "restockInventory",
    ()=>restockInventory,
    "setCompanySecurityCode",
    ()=>setCompanySecurityCode,
    "transferPrimaryAdmin",
    ()=>transferPrimaryAdmin,
    "updateCompanySettings",
    ()=>updateCompanySettings,
    "updateProduct",
    ()=>updateProduct,
    "updateReconciliationStatus",
    ()=>updateReconciliationStatus,
    "updateSaleAndAdjustStock",
    ()=>updateSaleAndAdjustStock,
    "updateUserRole",
    ()=>updateUserRole
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/firebase-admin/firestore [external] (firebase-admin/firestore, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$functions$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/functions/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/functions/dist/esm/index.esm2017.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/index.mjs [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/firebase/node_modules/@firebase/auth/dist/node-esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase/client.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
// -----------------
// Helpers Admin
// -----------------
const getAdminDbOrThrow = ()=>{
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"]) throw new Error("La base de datos de administrador no está configurada.");
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminDb"];
};
const getAdminAuthOrThrow = ()=>{
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"]) throw new Error("La autenticación de administrador no está configurada.");
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminAuth"];
};
async function getCompanyIdForUser(userId) {
    const db = getAdminDbOrThrow();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists || !userSnap.data()?.companyId) {
        throw new Error("Usuario no asociado a ninguna empresa.");
    }
    return userSnap.data().companyId;
}
async function isInitialSetupRequired() {
    const db = getAdminDbOrThrow();
    const companiesCol = db.collection("companies");
    const snapshot = await companiesCol.limit(1).get();
    return snapshot.empty;
}
async function createInitialAdminUser(data) {
    const db = getAdminDbOrThrow();
    const auth = getAdminAuthOrThrow();
    const companyRef = db.collection("companies").doc();
    const userRecord = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.adminName
    });
    await auth.setCustomUserClaims(userRecord.uid, {
        role: "primary-admin",
        companyId: companyRef.id
    });
    const batch = db.batch();
    batch.set(companyRef, {
        id: companyRef.id,
        name: data.companyName,
        ownerUid: userRecord.uid,
        exchangeRate: 36.5,
        pettyCashInitial: 0,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp(),
        logoUrl: "",
        securityCodeSet: false
    });
    const userRef = db.doc(`users/${userRecord.uid}`);
    batch.set(userRef, {
        uid: userRecord.uid,
        name: data.adminName,
        email: data.email,
        role: "primary-admin",
        companyId: companyRef.id,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp()
    });
    await batch.commit();
    return {
        uid: userRecord.uid,
        companyId: companyRef.id
    };
}
async function updateCompanySettings(settings, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const companyRef = db.doc(`companies/${companyId}`);
    const validSettings = {};
    if (typeof settings.exchangeRate === 'number') {
        validSettings.exchangeRate = settings.exchangeRate;
    }
    if (typeof settings.pettyCashInitial === 'number') {
        validSettings.pettyCashInitial = settings.pettyCashInitial;
    }
    if (typeof settings.name === 'string' && settings.name.length > 0) {
        validSettings.name = settings.name;
    }
    if (typeof settings.logoUrl === 'string') {
        validSettings.logoUrl = settings.logoUrl;
    }
    if (Object.keys(validSettings).length > 0) {
        await companyRef.update(validSettings);
    }
}
async function addUser(userData, adminUserId) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(adminUserId);
    if (userData.role !== 'admin' && userData.role !== 'employee') {
        throw new Error("Rol de usuario no válido.");
    }
    try {
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name
        });
        await auth.setCustomUserClaims(userRecord.uid, {
            role: userData.role,
            companyId
        });
        const newUserDocRef = db.doc(`users/${userRecord.uid}`);
        await newUserDocRef.set({
            uid: userRecord.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            companyId: companyId,
            createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp()
        });
        return {
            uid: userRecord.uid
        };
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este correo electrónico ya está registrado.');
        }
        console.error("Error creating user:", error);
        throw new Error('No se pudo crear el usuario. ' + error.message);
    }
}
async function updateUserRole(userIdToUpdate, newRole, currentAdminId) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const [companyId, { customClaims: adminClaims }] = await Promise.all([
        getCompanyIdForUser(currentAdminId),
        auth.getUser(currentAdminId)
    ]);
    if (newRole === 'primary-admin') {
        throw new Error("La transferencia de propiedad debe hacerse a través de la acción 'transferPrimaryAdmin'.");
    }
    const userToUpdateRef = db.doc(`users/${userIdToUpdate}`);
    const userDoc = await userToUpdateRef.get();
    if (!userDoc.exists || userDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario a modificar no pertenece a la misma empresa.");
    }
    const targetUserRole = userDoc.data()?.role;
    if (adminClaims?.role === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'primary-admin')) {
        throw new Error("Un administrador no puede modificar a otro administrador o al propietario.");
    }
    await auth.setCustomUserClaims(userIdToUpdate, {
        role: newRole,
        companyId
    });
    await userToUpdateRef.update({
        role: newRole
    });
}
async function transferPrimaryAdmin(targetUserId, currentAdminId) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const { customClaims: adminClaims } = await auth.getUser(currentAdminId);
    if (adminClaims?.role !== 'primary-admin') {
        throw new Error("Solo el propietario actual puede transferir la propiedad.");
    }
    const companyId = adminClaims.companyId;
    const targetUserRef = db.doc(`users/${targetUserId}`);
    const targetUserDoc = await targetUserRef.get();
    if (!targetUserDoc.exists || targetUserDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario objetivo no pertenece a la misma empresa.");
    }
    const batch = db.batch();
    const currentAdminUserRef = db.doc(`users/${currentAdminId}`);
    // Update custom claims
    await Promise.all([
        auth.setCustomUserClaims(targetUserId, {
            role: 'primary-admin',
            companyId
        }),
        auth.setCustomUserClaims(currentAdminId, {
            role: 'admin',
            companyId
        })
    ]);
    // Update user documents in Firestore
    batch.update(targetUserRef, {
        role: 'primary-admin'
    });
    batch.update(currentAdminUserRef, {
        role: 'admin'
    });
    await batch.commit();
}
async function deleteUser(userIdToDelete, currentAdminId) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(currentAdminId);
    const userToDeleteRef = db.doc(`users/${userIdToDelete}`);
    const userDoc = await userToDeleteRef.get();
    if (!userDoc.exists || userDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario a eliminar no pertenece a tu empresa.");
    }
    if (userDoc.data()?.role === 'primary-admin') {
        throw new Error("No se puede eliminar al propietario de la empresa.");
    }
    await auth.deleteUser(userIdToDelete);
    await userToDeleteRef.delete();
}
async function addCategory(categoryName, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoryCollection = db.collection(`companies/${companyId}/categories`);
    const existingCategoryQuery = await categoryCollection.where('name', '==', categoryName).limit(1).get();
    if (!existingCategoryQuery.empty) {
        return existingCategoryQuery.docs[0].id;
    }
    const newCategoryRef = await categoryCollection.add({
        name: categoryName
    });
    return newCategoryRef.id;
}
async function deleteCategory(categoryId, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoryRef = db.doc(`companies/${companyId}/categories/${categoryId}`);
    const productsRef = db.collection(`companies/${companyId}/products`);
    const productsQuery = productsRef.where('categoryId', '==', categoryId);
    const productsSnapshot = await productsQuery.get();
    const batch = db.batch();
    productsSnapshot.forEach((doc)=>{
        batch.update(doc.ref, {
            categoryId: ""
        });
    });
    batch.delete(categoryRef);
    await batch.commit();
}
async function addProduct(productData, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productCollection = db.collection(`companies/${companyId}/products`);
    await productCollection.add({
        ...productData,
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp()
    });
}
async function addMultipleProducts(productsData, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productCollection = db.collection(`companies/${companyId}/products`);
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 500;
    for(let i = 0; i < productsData.length; i += batchSize){
        const batch = db.batch();
        const chunk = productsData.slice(i, i + batchSize);
        for (const productData of chunk){
            try {
                const docRef = productCollection.doc();
                batch.set(docRef, {
                    ...productData,
                    createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp()
                });
                successCount++;
            } catch (e) {
                console.error("Error adding product to batch:", productData.name, e);
                errorCount++;
            }
        }
        await batch.commit();
    }
    return {
        successCount,
        errorCount
    };
}
async function updateProduct(productId, productData, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productRef = db.doc(`companies/${companyId}/products/${productId}`);
    await productRef.update(productData);
}
async function deleteProduct(productId, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productRef = db.doc(`companies/${companyId}/products/${productId}`);
    await productRef.delete();
}
async function addOrderDraft(title, items, totalCost, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const draftsCollection = db.collection(`companies/${companyId}/orderDrafts`);
    await draftsCollection.add({
        title,
        items,
        totalCost,
        status: 'draft',
        createdAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp()
    });
}
async function deleteOrderDraft(draftId, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const draftRef = db.doc(`companies/${companyId}/orderDrafts/${draftId}`);
    await draftRef.delete();
}
async function restockInventory(drafts, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const consolidatedItems = new Map();
    let totalCost = 0;
    drafts.forEach((draft)=>{
        totalCost += draft.totalCost;
        draft.items.forEach((item)=>{
            consolidatedItems.set(item.productId, (consolidatedItems.get(item.productId) || 0) + item.orderQuantity);
        });
    });
    const newOutflow = {
        date: new Date().toISOString(),
        amount: totalCost,
        currency: 'NIO',
        cashBox: 'general',
        reason: `Abastecimiento de inventario (${drafts.length} borrador/es)`,
        type: 'restock'
    };
    const outflowId = await db.runTransaction(async (transaction)=>{
        // --- READS ---
        const productRefs = Array.from(consolidatedItems.keys()).map((productId)=>db.doc(`companies/${companyId}/products/${productId}`));
        const productDocs = productRefs.length > 0 ? await transaction.getAll(...productRefs) : [];
        const productsToUpdate = [];
        for (const productDoc of productDocs){
            const orderQuantity = consolidatedItems.get(productDoc.id);
            if (productDoc.exists && orderQuantity) {
                const currentStock = productDoc.data()?.quantity || 0;
                const newStock = currentStock + orderQuantity;
                productsToUpdate.push({
                    ref: productDoc.ref,
                    newStock
                });
            }
        }
        // --- WRITES ---
        // 1. Create the cash outflow document
        const outflowRef = db.collection(`companies/${companyId}/cash_outflows`).doc();
        transaction.set(outflowRef, newOutflow);
        // 2. Update stock for all products
        productsToUpdate.forEach((p)=>{
            transaction.update(p.ref, {
                quantity: p.newStock
            });
        });
        // 3. Mark drafts as completed
        drafts.forEach((draft)=>{
            const draftRef = db.doc(`companies/${companyId}/orderDrafts/${draft.id}`);
            transaction.update(draftRef, {
                status: 'completed'
            });
        });
        return outflowRef.id;
    });
    return outflowId;
}
async function addSale(newSale, cart, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const saleId = await db.runTransaction(async (transaction)=>{
        // --- 1. READS ---
        const productRefs = cart.map((item)=>db.doc(`companies/${companyId}/products/${item.id}`));
        const productDocs = productRefs.length > 0 ? await transaction.getAll(...productRefs) : [];
        const productsToUpdate = [];
        for(let i = 0; i < productDocs.length; i++){
            const productDoc = productDocs[i];
            const cartItem = cart[i];
            if (!productDoc.exists) {
                throw new Error(`Producto con ID ${cartItem.id} no encontrado.`);
            }
            const currentStock = productDoc.data()?.quantity || 0;
            const newStock = currentStock - cartItem.quantityInCart;
            if (newStock < 0) {
                throw new Error(`Stock insuficiente para ${productDoc.data()?.name}.`);
            }
            productsToUpdate.push({
                ref: productDoc.ref,
                newStock
            });
        }
        // --- 2. WRITES ---
        const salesCollection = db.collection(`companies/${companyId}/sales`);
        const saleRef = salesCollection.doc();
        transaction.set(saleRef, newSale);
        productsToUpdate.forEach((p)=>{
            transaction.update(p.ref, {
                quantity: p.newStock
            });
        });
        return saleRef.id;
    });
    return saleId;
}
async function updateSaleAndAdjustStock(updatedSale, originalSale, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    await db.runTransaction(async (transaction)=>{
        const saleRef = db.doc(`companies/${companyId}/sales/${updatedSale.id}`);
        const productQuantityChanges = {};
        // Calculate deltas: Positive value means stock should increase (product returned)
        originalSale.items.forEach((item)=>{
            productQuantityChanges[item.productId] = (productQuantityChanges[item.productId] || 0) + item.quantity;
        });
        updatedSale.items.forEach((item)=>{
            productQuantityChanges[item.productId] = (productQuantityChanges[item.productId] || 0) - item.quantity;
        });
        // --- READS ---
        const productRefsToRead = Object.keys(productQuantityChanges).filter((productId)=>productQuantityChanges[productId] !== 0).map((productId)=>db.doc(`companies/${companyId}/products/${productId}`));
        const productDocs = productRefsToRead.length > 0 ? await transaction.getAll(...productRefsToRead) : [];
        // --- WRITES ---
        const updates = [];
        for (const productDoc of productDocs){
            if (!productDoc.exists) continue; // Skip if product somehow got deleted
            const productId = productDoc.id;
            const delta = productQuantityChanges[productId];
            const currentStock = productDoc.data()?.quantity || 0;
            const newStock = currentStock + delta;
            if (newStock < 0) {
                const productName = productDoc.data()?.name || productId;
                throw new Error(`No se puede completar la actualización. El stock de "${productName}" sería negativo.`);
            }
            updates.push({
                ref: productDoc.ref,
                newStock
            });
        }
        // Create refund outflow if necessary
        const refundAmount = originalSale.grandTotal - updatedSale.grandTotal;
        if (refundAmount > 0) {
            const outflowRef = db.collection(`companies/${companyId}/cash_outflows`).doc();
            transaction.set(outflowRef, {
                date: new Date().toISOString(),
                amount: refundAmount,
                currency: originalSale.paymentCurrency,
                cashBox: 'general',
                reason: `Ajuste/reembolso de Venta ID: ${originalSale.id.substring(0, 8)}...`,
                type: 'adjustment'
            });
        }
        // Update the sale document
        transaction.update(saleRef, {
            items: updatedSale.items,
            grandTotal: updatedSale.grandTotal,
            needsReview: false,
            reviewNotes: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].delete() // Remove notes after review
        });
        // Apply stock updates
        updates.forEach((update)=>{
            transaction.update(update.ref, {
                quantity: update.newStock
            });
        });
    });
}
async function markSaleForReview(saleId, notes, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const saleRef = db.doc(`companies/${companyId}/sales/${saleId}`);
    await saleRef.update({
        needsReview: true,
        reviewNotes: notes
    });
}
async function adjustStockForLoss(productId, lostQuantity, reason, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    await db.runTransaction(async (transaction)=>{
        const productRef = db.doc(`companies/${companyId}/products/${productId}`);
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists) {
            throw new Error("El producto que intentas ajustar no existe.");
        }
        const productData = productDoc.data();
        const currentStock = productData.quantity;
        const newStock = currentStock - lostQuantity;
        if (newStock < 0) {
            throw new Error(`La cantidad a dar de baja (${lostQuantity}) es mayor que el stock actual (${currentStock}).`);
        }
        const lossValue = productData.purchaseCost * lostQuantity;
        const outflowRef = db.collection(`companies/${companyId}/cash_outflows`).doc();
        transaction.set(outflowRef, {
            date: new Date().toISOString(),
            amount: lossValue,
            currency: 'NIO',
            cashBox: 'general',
            reason: `Pérdida de ${lostQuantity} ${productData.stockingUnit} de "${productData.name}": ${reason}`,
            type: 'loss'
        });
        transaction.update(productRef, {
            quantity: newStock
        });
    });
}
async function addCashOutflow(outflow, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const outflowsCollection = db.collection(`companies/${companyId}/cash_outflows`);
    const docRef = await outflowsCollection.add(outflow);
    return docRef.id;
}
async function addWithdrawal(withdrawalData, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const outflowsCollection = db.collection(`companies/${companyId}/cash_outflows`);
    const outflowToCreate = {
        ...withdrawalData,
        type: 'withdrawal'
    };
    const docRef = await outflowsCollection.add(outflowToCreate);
    return docRef.id;
}
async function addInflow(inflow, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const inflowsCollection = db.collection(`companies/${companyId}/inflows`);
    await inflowsCollection.add(inflow);
}
async function addCashTransfer(transfer, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const transfersCollection = db.collection(`companies/${companyId}/cash_transfers`);
    await transfersCollection.add(transfer);
}
async function updateReconciliationStatus(dateId, status, userId) {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconRef = db.doc(`companies/${companyId}/reconciliations/${dateId}`);
    await reconRef.set({
        status: status,
        updatedAt: __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2d$admin$2f$firestore__$5b$external$5d$__$28$firebase$2d$admin$2f$firestore$2c$__esm_import$29$__["FieldValue"].serverTimestamp()
    }, {
        merge: true
    });
}
async function setCompanySecurityCode(password, securityCode, userId) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const { customClaims, email } = await auth.getUser(userId);
    if (customClaims?.role !== 'primary-admin' || !email) {
        throw new Error("Solo el propietario puede configurar un código de seguridad.");
    }
    try {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"].currentUser) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signInWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"], email, password);
        }
        const userCredential = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EmailAuthProvider"].credential(email, password);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reauthenticateWithCredential"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"].currentUser, userCredential);
    } catch (e) {
        throw new Error("No se pudo reautenticar. La contraseña actual es incorrecta.");
    }
    const companyId = await getCompanyIdForUser(userId);
    const companyRef = db.doc(`companies/${companyId}`);
    const securityDocRef = db.doc(`companies/${companyId}/private/security`);
    await securityDocRef.set({
        code: securityCode
    });
    await companyRef.update({
        securityCodeSet: true
    });
}
async function initiateCompanyWipe(password, securityCode, userId) {
    const auth = getAdminAuthOrThrow();
    const { email } = await auth.getUser(userId);
    if (!email) {
        throw new Error("El usuario no tiene un email para reautenticar.");
    }
    try {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"].currentUser) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signInWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"], email, password);
        }
        const userCredential = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["EmailAuthProvider"].credential(email, password);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reauthenticateWithCredential"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"].currentUser, userCredential);
    } catch (e) {
        throw new Error("No se pudo reautenticar. La contraseña actual es incorrecta.");
    }
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const securityDocRef = db.doc(`companies/${companyId}/private/security`);
    const securityDoc = await securityDocRef.get();
    if (!securityDoc.exists || securityDoc.data()?.code !== securityCode) {
        throw new Error("El código de seguridad es incorrecto.");
    }
    const functions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFunctions"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["app"]);
    const wipeCompanyData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm2017$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["httpsCallable"])(functions, 'wipeCompanyData');
    try {
        const result = await wipeCompanyData();
        return result.data;
    } catch (error) {
        console.error("Error al invocar la función de borrado:", error);
        throw new Error(error.message || "Error desconocido al llamar a la función de borrado.");
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getCompanyIdForUser,
    isInitialSetupRequired,
    createInitialAdminUser,
    updateCompanySettings,
    addUser,
    updateUserRole,
    transferPrimaryAdmin,
    deleteUser,
    addCategory,
    deleteCategory,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    addOrderDraft,
    deleteOrderDraft,
    restockInventory,
    addSale,
    updateSaleAndAdjustStock,
    markSaleForReview,
    adjustStockForLoss,
    addCashOutflow,
    addWithdrawal,
    addInflow,
    addCashTransfer,
    updateReconciliationStatus,
    setCompanySecurityCode,
    initiateCompanyWipe
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCompanyIdForUser, "40a50b4c975703f0765316cfe18601634cc06249b3", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(isInitialSetupRequired, "003e55ce336b04d3a13975537d10e57747b5e9f2bb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createInitialAdminUser, "40b4177845e77e8779f45ba6afa1f228a6a569e41b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateCompanySettings, "60bc5cf0e782dfa5f5c2adc8ef24d9769df3047ee2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addUser, "606d00bf53eb3c874e402113c48bf71ca1136b581d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateUserRole, "70323c30dbcab97319ac1e929235bbb75e5a66711e", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(transferPrimaryAdmin, "60b8000a054ac48e3da8a0e61c79c165146ed5e1d9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteUser, "60998521e10008b5be4736c9baecdccf10f45ca335", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addCategory, "60bc756288ea91f392869242516f3561c27e364ac9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteCategory, "60d96209c3374915a470d98d53bbd12c85618fa2f5", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addProduct, "6016f397cd7b1af63a40a9524f5043744a2a7a83ae", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addMultipleProducts, "60fc2057ee55605250f429cf5a54781dfb5f72910a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateProduct, "701cf7b4050c596e5db93b8723c3249b67749eb446", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteProduct, "6070ff61111770630df4f38d3681dee87b4cc2c8eb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addOrderDraft, "78dc9e243b8de082427c204333953f96df345ef361", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteOrderDraft, "60c411047e876b0cdc479de887e18ef01bd4652d9d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(restockInventory, "609e042c915eb7cdbc4995b28d67702754a6c14ab2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addSale, "70b17520616514f10e95c5f024831ccbf0b3e3b2e6", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateSaleAndAdjustStock, "707d15a1e95d772d5612c575cb0d30b3df384fe478", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(markSaleForReview, "700197b074ce1edc73f5da1ee0524c7b1cfa96e4f7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adjustStockForLoss, "78b23efff676fa59d85fba62c1a7dacab3415d698a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addCashOutflow, "601d0ca6501ea0fde1bd25f0e8a7c52f83bf650c46", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addWithdrawal, "602bfd04158ac023b2535248905eba56303a1ee685", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addInflow, "6072045fcd1715096f3a15a725bfd9b731bdab6c02", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addCashTransfer, "60af76ae54149699aae0f1cd62ef0c549db3f7bcef", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateReconciliationStatus, "70367746f6be61e9677f725a550e09a604fe306922", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(setCompanySecurityCode, "708d1676e6444238073d11a9285f9f518027fed1be", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(initiateCompanyWipe, "70f7a0bcba774c5955d46ec1c548d36cade37a11e5", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/actions/setup.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions/setup.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/.next-internal/server/app/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/actions/setup.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "40a50b4c975703f0765316cfe18601634cc06249b3",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCompanyIdForUser"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$dashboard$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/dashboard/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/actions/setup.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions/setup.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$dashboard$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$dashboard$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2f$setup$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/dashboard/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/dashboard/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/dashboard/page.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/dashboard/page.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/dashboard/page.tsx <module evaluation>", "default");
}),
"[project]/src/app/dashboard/page.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/dashboard/page.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/dashboard/page.tsx", "default");
}),
"[project]/src/app/dashboard/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$dashboard$2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/dashboard/page.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$dashboard$2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/app/dashboard/page.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$dashboard$2f$page$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/dashboard/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/dashboard/page.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__923bebc9._.js.map