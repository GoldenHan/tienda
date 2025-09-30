
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp, getApps } = require("firebase-admin/app");

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

/**
 * Recursively deletes a collection and all its subcollections.
 * @param {FirebaseFirestore.CollectionReference} collectionRef The collection to delete.
 * @param {number} batchSize The number of documents to delete in each batch.
 * @returns {Promise<void>}
 */
async function deleteCollection(collectionRef, batchSize) {
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

/**
 * Deletes a batch of documents from a query.
 * @param {FirebaseFirestore.Query} query The query to delete.
 * @param {Function} resolve The promise resolve function.
 * @returns {Promise<void>}
 */
async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

exports.wipeCompanyData = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "El usuario no está autenticado.");
  }

  // 1. Verify user is primary-admin
  const userRecord = await auth.getUser(uid);
  const claims = userRecord.customClaims || {};
  const companyId = claims.companyId;

  if (claims.role !== "primary-admin" || !companyId) {
    throw new HttpsError(
      "permission-denied",
      "Solo el propietario de la empresa puede realizar esta acción."
    );
  }

  // 2. Define all subcollections to be deleted
  const subcollections = [
    "categories",
    "products",
    "sales",
    "cash_outflows",
    "inflows",
    "cash_transfers",
    "reconciliations",
    "orderDrafts",
  ];

  try {
    // 3. Delete all subcollections
    for (const subcollection of subcollections) {
      const collectionRef = db.collection(`companies/${companyId}/${subcollection}`);
      await deleteCollection(collectionRef, 50);
    }
    
    // 4. Delete the security code document
    const securityDocRef = db.doc(`companies/${companyId}/private/security`);
    await securityDocRef.delete().catch(() => {}); // Ignore error if it doesn't exist

    // 5. Reset the company document itself (but don't delete it)
    const companyDocRef = db.doc(`companies/${companyId}`);
    await companyDocRef.update({
        pettyCashInitial: 0,
        exchangeRate: 36.5,
        logoUrl: "",
        securityCodeSet: false,
    });
    
    // 6. Delete all other users of the company
    const usersQuery = db.collection('users').where('companyId', '==', companyId);
    const usersSnapshot = await usersQuery.get();
    
    const usersToDelete = [];
    usersSnapshot.forEach(doc => {
      if (doc.id !== uid) { // Don't delete the owner
        usersToDelete.push(doc.id);
      }
    });

    if (usersToDelete.length > 0) {
      await auth.deleteUsers(usersToDelete);
      const userDeleteBatch = db.batch();
      usersToDelete.forEach(userId => {
        userDeleteBatch.delete(db.doc(`users/${userId}`));
      });
      await userDeleteBatch.commit();
    }

    return { success: true, message: "Datos de la empresa eliminados con éxito." };

  } catch (error) {
    console.error("Error al eliminar los datos de la empresa:", error);
    throw new HttpsError(
      "internal",
      "Ocurrió un error durante la eliminación de datos."
    );
  }
});
