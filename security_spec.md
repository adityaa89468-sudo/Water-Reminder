# Security Specification - Water Reminder

## 1. Data Invariants
- A User profile must be owned by the authenticated user (`uid` match).
- `daily_goal` must be a positive integer.
- `weight` must be a positive number.
- `streak` and `level` must be non-negative.
- `total_liters` must be non-negative.
- An IntakeLog must include a `user_id` matching the parent path and the authenticated user.
- `amount` in IntakeLog must be positive.
- `timestamp` must be correctly formatted.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing:** Create user profile with `firebase_uid` different from `request.auth.uid`.
2. **Path Injection:** Attempt to access `users/admin_user_id/logs/some_log`.
3. **Ghost Field:** Update user profile with `isAdmin: true` field.
4. **Invalid Type:** Set `daily_goal` to a string "3000".
5. **Resource Exhaustion:** Use a 2MB string as a `name`.
6. **Negative Water:** Log an intake of `-500` ml.
7. **Future Log:** Log an intake with a timestamp in the year 2099.
8. **Owner Hijack:** Update another user's profile information.
9. **Level Hack:** Directly update `level` to 999 without proportional `total_liters`.
10. **Orphaned Log:** Create a log for a user ID that doesn't exist.
11. **Immutability Breach:** Attempt to change `createdAt` on an existing profile.
12. **Status Bypass:** Set `streak` manually to 100 on creation.

## 3. Test Runner (Draft)
The `firestore.rules.test.ts` will verify these denials using the Firebase Rules Testing library.
