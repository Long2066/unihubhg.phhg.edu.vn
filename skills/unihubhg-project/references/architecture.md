# Architecture Reference

## Stack

- Build: Vite 6 with `@vitejs/plugin-react`.
- UI: React 19, TypeScript, Tailwind CSS 4 via `@tailwindcss/vite`.
- Icons/animation: `lucide-react`, `motion`.
- Data/sync: Firebase 12 Firestore plus browser `localStorage`.
- Config: `firebase-applet-config.json`, `vite.config.ts`, `tsconfig.json`.

## Repository Map

- `index.html`: Vite HTML entry.
- `src/main.tsx`: React root, imports `App` and global CSS.
- `src/App.tsx`: application shell, role-based sidebar, notifications, profile dropdown, role-to-portal routing.
- `src/state.tsx`: `UniHubProvider`, shared state, localStorage hydration, Firestore seed/sync, score recalculation engine, all domain actions.
- `src/types.ts`: canonical TypeScript interfaces/enums.
- `src/data.ts`: seed period, users, criteria, students, organizations, activities, attendance, evidence, review states, results, daily attendance.
- `src/firebase.ts`: Firebase app/db/auth initialization and Firestore error helper.
- `src/index.css`: Tailwind import, fonts, global scroll/animation styles.
- `src/components/*.tsx`: role portal and shared logo/statistics components.
- `firestore.rules`: Firestore validators and collection access rules.
- `firebase-blueprint.json`: schema-ish entity/collection description.
- `security_spec.md`: intended security invariants and attack scenarios.

## Component Ownership

- `LoginScreen.tsx`: manual login and quick role login cards.
- `StudentPortal.tsx`: student home, score detail, activities, clubs, evidence upload, profile/history presentation.
- `OrganizerPortal.tsx`: organization member management, club join approvals, activity creation, announcements, attendance, CSV/HTML-XLS import/export.
- `TrainingPortal.tsx`: GPA import simulator, class import simulator, manual academic edits.
- `ClassPortal.tsx`: class monitor daily attendance reporting and class-level workflow.
- `AdviserPortal.tsx`: adviser/GVCN review, bulk approve, score overrides, evidence audit, feedback.
- `FacultyPortal.tsx`: faculty statistics, grade counts, locking/sign-off.
- `AdminPortal.tsx`: criteria configuration, period lock, system/admin panels, club/account CRUD, Word/PDF-ish regulation parsing/export.
- `ClassStatisticsBottom.tsx`: cross-role daily attendance statistics view reached by tab `GIAM_SAT_SI_SO`.
- `TnuLogo.tsx`: logo rendering with fallback.

## App Flow

1. `main.tsx` renders `<App />`.
2. `App` wraps everything in `<UniHubProvider>`.
3. If `currentUser` is null, render `LoginScreen`.
4. Once logged in, `AppContent` selects a portal by `currentUser.role`.
5. `activePortletTab` lives in `state.tsx`; the shell sidebar sets it and portals read it for sub-tab content.

## Role Tabs

- Student: `TRANG_CHU`, `DIEM`, `HOATDONG`, `CLB`, `MINHCHUNG`, `GIAM_SAT_SI_SO`.
- Organizer: `DS_THANHVIEN`, `TAO_HOATDONG`, `TAO_THONGBAO`, `QUANLY_DIEMDANH`, `GIAM_SAT_SI_SO`. `THEM_HUY_THANHVIEN` is handled inside `OrganizerPortal`.
- Training Dept: `IMPORT`, `IMPORT_CLASSES`, `LIST`, `GIAM_SAT_SI_SO`.
- Faculty: `STAT`, `LOCKS`, `GIAM_SAT_SI_SO`.
- Admin: `CONFIG`, `PERIOD`, `STATIONS`, `CLUBS`, `GIAM_SAT_SI_SO`.
- Class Monitor and Adviser: mainly `TRANG_CHU`, plus `GIAM_SAT_SI_SO`.

## Styling Notes

- The UI is dense operational dashboard UI, not a marketing site.
- Existing style uses small text, strong font weights, compact cards/panels, border colors, and many Tailwind utility classes.
- Continue using `lucide-react` icons.
- Avoid changing the app-wide shell unless the task is navigation, notifications, or role routing.
