# Data And Workflow Reference

## Core Types

Defined in `src/types.ts`:

- `UserRole`: `STUDENT`, `ORGANIZER`, `TRAINING_DEPT`, `CLASS_MONITOR`, `ADVISER`, `FACULTY`, `ADMIN`.
- `UserAccount`: login/profile with `role` and optional `targetId`.
- `Student`: student roster, class/faculty, GPA/credits/learning status.
- `Organization`: CLB/DOAN/HOI metadata.
- `OrganizationMember`: club membership, role, status, optional custom registration/profile fields.
- `ExtracurricularActivity`: activity/event with criteria, points, date, registration, status.
- `ActivityAttendance`: registration/attendance verification with role `MEM`, `BTC`, or `SUPPORTER`.
- `EvidenceSubmission`: student external proof request.
- `ClassReviewState`, `FacultyReviewState`: approval/lock workflow states.
- `EvaluationResult`: computed scoring output and trace logs.
- `DailyAttendanceReport`, `ScoreFeedback`, `GroupEvaluationCriteria`, `ClubAnnouncement`.

## Seed Data

`src/data.ts` provides the demo baseline:

- `SEED_PERIOD`: current period `HOCKY_2_2025_2026`.
- `SEED_USERS`: one account for each role.
- `SEED_CRITERIA`: TC1-TC5 scoring categories and rule IDs.
- `SEED_STUDENTS`: default roster.
- `SEED_ORGANIZATIONS`: sample CLB/Doan organizations.
- `SEED_MEMBERS`, `SEED_ACTIVITIES`, `SEED_ATTENDANCE`, `SEED_EVIDENCE`.
- `SEED_CLASS_REVIEW`, `SEED_FACULTY_REVIEW`, `SEED_RESULTS`, `SEED_DAILY_ATTENDANCE`.

When adding demo functionality, keep seed IDs stable and readable: `ACT_*`, `AT_*`, `EV_*`, `U_*`, etc.

## Shared State

`src/state.tsx` owns all state and actions through `useUniHub()`:

- Hydrates from localStorage keys such as `unihub_students`, `unihub_results`, `unihub_announcements`.
- Seeds/syncs Firestore collections when possible.
- Provides mutation actions to portal components.
- Recomputes `results` whenever students, members, activities, attendance, evidence, approvals, period, criteria, or daily attendance change.

Important actions:

- Student: `registerForActivity`, `submitEvidence`, `joinOrganizationRequest`, `updateStudentProfile`.
- Organizer: `createActivity`, `updateActivityStatus`, `approveMemberRequest`, `rejectMemberRequest`, `assignMemberRole`, `updateAttendance`, `addBulkAttendance`, `createAnnouncement`, member CRUD/import.
- Training: `importAcademicData`, `toggleLearningDataLock`, `importNewClassesExcel`.
- Class/Adviser/Faculty/Admin: approval, locking, feedback, manual score adjustment, criteria updates, period updates, club/account CRUD.

## Scoring Engine

The live engine is the large recalculation `useEffect` in `src/state.tsx`.

Categories:

- TC1 study points, max 20: GPA bands and learning warnings.
- TC2 discipline points, base max 25: low GPA/manual warning/tardiness/daily unexcused absence deductions.
- TC3 extracurricular points, max 30: active club membership plus verified event attendance.
- TC4 community points, max 15: approved evidence and class duty.
- TC5 achievement points, max 10: class monitor or organization leader bonuses.

Grade thresholds:

- `>= 90`: `XUẤT SẮC`
- `>= 80`: `TỐT`
- `>= 70`: `KHÁ`
- `>= 50`: `TRUNG BÌNH`
- `>= 30`: `YẾU`
- otherwise: `KÉM`

Approval status:

- `LOCKED` if faculty is locked.
- `APPROVED_ADVISER` if class review has adviser approval.
- `APPROVED_CLASS` if class representative approved.
- otherwise `AUTO`.

Traceability:

- Every score change should write an `EvaluationResult.logs` item with `criteriaId`, `points`, `reason`, `source`, and `timestamp`.
- Portal displays rely on logs for audit explanations. Do not remove logs while refactoring.

## Workflow Ownership

- Student registers for activities and submits evidence; results are read from `results`.
- Organizer manages club members, announcements, activities, and attendance.
- Training Dept changes GPA/credits/learning status and imports class rosters.
- Class Monitor reports daily attendance and can approve class score state.
- Adviser reviews class results, applies adjustments, approves, and sends feedback.
- Faculty summarizes/locks faculty data and approves class lists.
- Admin configures criteria, period state, clubs/accounts, and regulation import/export.

## Known Mock/Prototype Areas

- Login is local account matching, not full Firebase Auth enforcement.
- Some import flows are simulated rather than true binary `.xlsx` parsing.
- `StudentPortal` has hard-coded historical semester data for prior-term display.
- Some score rules have hard-coded student IDs for demo behavior; remove these when productionizing.
