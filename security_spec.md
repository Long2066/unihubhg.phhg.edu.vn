# Security Specification for UniHub Rèn Luyện (Firebase Firestore Security)

## 1. Data Invariants
- **Authentication**: All writes must originate from authenticated users (`request.auth.uid != null`).
- **Identity Integrity**: A student can only submit extracurricular evidence or edit resources belonging to their own user record (`studentId == request.auth.uid` or linked `targetId`).
- **Status Locking**: Once an evaluation score state transitions to `LOCKED`, no further edits can be made by general users.
- **Roles Isolation**: Users cannot modify their own system profile `role` or link themselves to higher roles without authorized privilege.

## 2. The "Dirty Dozen" Spoof/Payload Scenarios (TDD Attacks Rejected)

1. **Self-Elevated Role Escalation**: A student attempts to write `role: "ADMIN"` or change roles to `TRAINING_DEPT`.
2. **Identity Spoofing**: Student SV01 tries to create an evidence submission with `studentId: "SV02"`.
3. **Invalid ID Injection**: A malicious client writes a document with a non-alphanumeric randomized path variable length exceeding 256 bytes to deplete space or trigger overflow.
4. **Mutating Immutable Timestamps**: Modifying `createdAt` during an update block.
5. **Terminal State Sabotage**: Changing evaluation status from `LOCKED` back to `AUTO`.
6. **Bypassing Activity Bounds**: Attempting to register for an activity with a modified criteria ID or inflated manual points.
7. **Phantom Bulk Attendance Injection**: Non-Club organization user trying to approve attendance for a student.
8. **Malicious Score Update Overwrite**: Non-adviser accounts rewriting a student's `adviserNotes` or altering grades.
9. **Spamming Sĩ Số Reports**: Creating a daily attendance report for another class that is not under their `targetId` jurisdiction.
10. **Shadow Key Attacks**: Injecting custom phantom keys in documents to bypass schema checks.
11. **Altering Verified Attendance Logs**: Changing verified status of an activity without organizer authority.
12. **Blanket Query Scraping**: Running open listings to fetch PII emails/profiles or other classes.

## 3. Test Runner Invariant Checks
All test requests containing simulated payloads for any of the above situations will be strictly mapped and rejected by rule validations.
