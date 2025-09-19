const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Sets a custom user claim (`role`) on a user's auth token whenever their
 * corresponding document in the `/users/{userId}` collection is created or updated.
 */
exports.setUserRoleOnClaim = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const { userId } = context.params;
    const userData = change.after.exists ? change.after.data() : null;

    // If the user document was deleted or doesn't have a role, do nothing.
    if (!userData || !userData.role) {
      functions.logger.log(`No role found for user ${userId}. Claims not set.`);
      return null;
    }

    const role = userData.role;

    try {
      // Get the user's current custom claims
      const { customClaims } = await admin.auth().getUser(userId);

      // If the role in Firestore is the same as the one in the token, no need to update.
      if (customClaims && customClaims.role === role) {
        functions.logger.log(
          `Role for user ${userId} is already set to '${role}'. No update needed.`
        );
        return null;
      }

      // Set the custom claim. This will overwrite existing claims.
      await admin.auth().setCustomUserClaims(userId, { role: role });
      functions.logger.log(
        `Successfully set custom claim 'role: ${role}' for user ${userId}.`
      );
      return { result: `Role ${role} set for user ${userId}.` };
    } catch (error) {
      functions.logger.error(
        `Error setting custom claim for user ${userId}:`,
        error
      );
      return null;
    }
  });
