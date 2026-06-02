---
name: unihubhg-project
description: Understand, maintain, and upgrade the UniHubHG student conduct management project. Use when Codex needs to inspect or modify this Vite React TypeScript Firebase app, add role-based portal features, change scoring rules, edit seed data, improve Firestore/localStorage sync, update UI flows for students/clubs/classes/faculty/admin, or prepare safe implementation and validation steps for UniHubHG.
---

# UniHubHG Project

## Purpose

Use this skill as the project onboarding and upgrade guide for UniHubHG, a role-based student conduct evaluation SPA for Phan hieu Dai hoc Thai Nguyen tai Ha Giang.

The app is a Vite + React + TypeScript frontend with Tailwind CSS, Firebase/Firestore sync, localStorage fallback, mock seed data, and separate portals for Student, Organizer, Training Dept, Class Monitor, Adviser, Faculty, and Admin.

## First Moves

1. Start at the repository root that contains `package.json`, `src/`, `firestore.rules`, and `firebase-applet-config.json`.
2. Read only the reference file needed for the task:
   - For file layout and component ownership, read `references/architecture.md`.
   - For entities, roles, score calculation, and workflows, read `references/data-and-workflows.md`.
   - For Firebase collections and rules, read `references/firebase-security.md`.
   - For implementation checklists and risky refactors, read `references/upgrade-playbook.md`.
3. Inspect the live source around the feature before editing. The largest files are generated-style TSX and can contain repeated UI blocks.
4. Prefer narrow edits in the portal component plus `src/state.tsx` action/type updates. Avoid broad rewrites unless the user asks.
5. Validate with `npm run lint` for TypeScript and `npm run build` for production build. If building UI, run `npm run dev` and inspect `http://localhost:3000`.

## Project Rules

- Keep domain terms and UI labels in Vietnamese when they already exist.
- Add or change shared data shapes in `src/types.ts` first, then update `src/data.ts`, `src/state.tsx`, Firestore persistence, and any portal UI.
- Use `useUniHub()` from `src/state.tsx` as the single shared app state API.
- Use `activePortletTab`/`setActivePortletTab` for role portal tabs because the shell sidebar in `src/App.tsx` and inner portals share that state.
- When adding persistent state, wire all three places: React state initialization, localStorage load/save key, and Firestore load/save/seed if it should sync remotely.
- When changing score logic, update the recalculation `useEffect` in `src/state.tsx`, the result type, and any visible breakdown/log rendering in the relevant portal.
- Treat Firestore rules as currently permissive for signed-in/verified users; tighten rules carefully if production security is requested.
- Do not assume real Excel parsing for every import flow. Some flows are simulators or client-side CSV/HTML parsers.

## Main Workflows

### Add a portal feature

1. Identify the role and tab in `src/App.tsx` sidebar mapping.
2. Open the portal in `src/components/*Portal.tsx`.
3. If new shared behavior is needed, add an action to `UniHubContextType` and provider return in `src/state.tsx`.
4. Update types and seed data only if the feature needs new stored fields.
5. Keep UI consistent: compact dashboard panels, Tailwind utility classes, `lucide-react` icons, Vietnamese copy.

### Add a data entity or collection

1. Add the TypeScript interface in `src/types.ts`.
2. Add seed data in `src/data.ts` if demo data is needed.
3. Add state, localStorage hydrate, Firestore load/save/seed, and provider exports in `src/state.tsx`.
4. Add validation in `firestore.rules` and schema documentation in `firebase-blueprint.json`.
5. Add UI in the role portal that owns the workflow.

### Change scoring or conduct rules

1. Read `references/data-and-workflows.md`.
2. Update `PointCriteria` seed/config when changing rule labels or default point values.
3. Update the recalculation engine in `src/state.tsx`.
4. Preserve `EvaluationResult.logs` traceability: every score effect should explain criteria, points, reason, source, and timestamp.
5. Verify affected role screens: Student score detail, Class/Adviser approval, Faculty/Admin statistics.

### Harden Firebase/Auth

1. Read `references/firebase-security.md`.
2. Decide whether the task is schema validation, role authorization, identity binding, or locked-state protection.
3. Update Firestore rules and mirror any client assumptions in `src/state.tsx`.
4. Use emulator-style tests if available; otherwise document manual attack cases from `security_spec.md`.

## Validation

Run these from the project root:

```bash
npm install
npm run lint
npm run build
npm run dev
```

Known caveats to mention if validation fails:

- If `node_modules` is absent, `npm run lint` fails because local `tsc` is unavailable.
- `npm run clean` uses Unix `rm -rf`, which is not portable on Windows PowerShell.
- The repository may not be initialized as a Git repo.
- Some code was generated by AI Studio and may contain large TSX files with inline mock behavior.
