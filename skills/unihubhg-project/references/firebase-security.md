# Firebase And Security Reference

## Firebase Client

`src/firebase.ts`:

- Imports config from `../firebase-applet-config.json`.
- Initializes Firebase app.
- Exports `db = getFirestore(app, firebaseConfig.firestoreDatabaseId)`.
- Exports `auth = getAuth()`.
- Provides `handleFirestoreError()` with diagnostic auth details.

## Firestore Collections

Synced in `src/state.tsx` and documented in `firebase-blueprint.json`:

- `users` -> `UserAccount`
- `students` -> `Student`
- `organizations` -> `Organization`
- `members` -> `OrganizationMember`
- `announcements` -> `ClubAnnouncement`
- `activities` -> `ExtracurricularActivity`
- `attendance` -> `ActivityAttendance`
- `evidence` -> `EvidenceSubmission`
- `results` -> `EvaluationResult`, document ID is `${studentId}_${periodId}`
- `dailyAttendance` -> `DailyAttendanceReport`

Local-only or partially synced state includes `criteria`, `period`, `classReviews`, `facultyReviews`, `feedbacks`, and `groupCriteria` unless additional sync code is added.

## Sync Pattern

For synced arrays, `src/state.tsx` generally follows:

1. Initialize React state from `src/data.ts`.
2. Hydrate from localStorage on startup.
3. Check/seed Firestore if `users` is empty.
4. Load non-empty Firestore collections into state/localStorage.
5. Save mutations through `saveToStorage()`, which writes localStorage then calls `saveToFirestore()`.

When adding a collection, update all steps. Missing any step causes state to reset, fail to persist, or fail to sync.

## Rules Summary

`firestore.rules`:

- Starts with a catch-all deny.
- Defines helpers such as `isSignedIn()`, `isVerifiedUser()`, `isValidId()`, and per-entity validators.
- Allows get/list/create/update/delete on each named collection if `isVerifiedUser()` and schema validators pass.

This is schema validation more than true role authorization. It does not currently enforce that:

- A student can only write their own evidence.
- A class monitor can only write their own class reports.
- An organizer can only manage their own organization.
- Locked results cannot be modified.
- Users cannot self-elevate role.

`security_spec.md` lists intended invariants and attack cases. Use it as the starting point for hardening.

## Hardening Checklist

- Bind `users/{userId}` to authenticated UID or verified custom claims.
- Create role helper functions based on user docs or custom claims.
- Enforce `targetId` ownership for student, class, organization, faculty, and admin workflows.
- Prevent mutation of immutable timestamps and locked statuses.
- Restrict list queries if PII exposure matters.
- Align client-side localStorage fallback with server-side restrictions; client checks are not security.
- Add rule tests for each item in `security_spec.md` when emulator tooling is introduced.
