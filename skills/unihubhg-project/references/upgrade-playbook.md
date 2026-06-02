# Upgrade Playbook

## Before Editing

- Run `rg --files` and inspect relevant source files instead of assuming generated code shape.
- Check whether the task is UI-only, state/action, data model, Firestore, or scoring.
- Read the exact portal file before touching shared state.
- Be careful with user-visible Vietnamese labels and role names.

## Safe Implementation Order

For feature work:

1. Update `src/types.ts` if any shape changes.
2. Update `src/data.ts` seeds if demos or defaults are needed.
3. Update `src/state.tsx` state/action/persistence.
4. Update role portal UI in `src/components`.
5. Update `src/App.tsx` only for shell navigation, notifications, profile, or role routing.
6. Update `firestore.rules` and `firebase-blueprint.json` if Firestore schema changes.
7. Run TypeScript/build validation.

## Common Tasks

### Add a new role

- Add enum value and labels in `src/types.ts`.
- Add seed user in `src/data.ts`.
- Add sidebar label/tabs and `renderPortal()` branch in `src/App.tsx`.
- Create or adapt a portal component.
- Add default active tab behavior in `src/state.tsx`.
- Update Firestore `isValidUser()` role validation if it becomes stricter.

### Add a new portal tab

- Add tab object in `src/App.tsx` `getSidebarTabs()`.
- Add tab union and branch in the relevant portal.
- Use `setActivePortletTab()` to navigate.
- Avoid local-only tab state if the shell sidebar must stay in sync.

### Add real Excel import

- Decide whether to add a dependency such as `xlsx` or parse CSV/HTML only.
- Keep import transformation pure: file -> typed rows -> preview -> commit action.
- Validate required fields and duplicate IDs before calling state actions.
- Keep existing simulator buttons if they are useful demos, unless asked to replace them.

### Productionize auth/security

- Replace local account matching with Firebase Auth or a verified auth bridge.
- Stop storing plaintext `password` in `UserAccount`.
- Add role/target checks in both UI and Firestore rules.
- Decide how localStorage fallback behaves in production.

### Refactor large portal files

- Extract only cohesive repeated UI or pure helpers.
- Do not split a file just to reduce size during an unrelated feature.
- Keep prop types explicit and avoid widening to `any`.
- Prefer extracting subcomponents next to the portal first before building new folders.

## Validation Commands

```bash
npm install
npm run lint
npm run build
npm run dev
```

If `node_modules` is absent, install dependencies before lint/build because `tsc` is provided by local dev dependencies.

If `npm run lint` fails due pre-existing generated-code issues, report exact errors and separate them from new-change risk.

## Red Flags

- Updating `src/types.ts` without updating Firestore rules/schema docs.
- Mutating `results` manually but forgetting the recalculation effect may overwrite it.
- Adding a localStorage key without including reset/hydrate/persist behavior.
- Using `activePortletTab` values that are not listed in `src/App.tsx`.
- Assuming `criteriaId` always equals a category ID. Activity criteria can use rule IDs like `TC3.1`.
- Treating client-side checks as security.
