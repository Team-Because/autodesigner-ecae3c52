import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * Architecture guardrail: UI code must not import the raw Supabase client.
 * All database access flows through `src/services/*` and `src/hooks/**`.
 * The allowlist below identifies files that have NOT yet been migrated —
 * remove entries as those pages/components adopt the DAL.
 */
const NOT_YET_MIGRATED = [
  "src/pages/Studio.tsx",
  "src/pages/BrandForm.tsx",
  "src/pages/History.tsx",
  "src/pages/Login.tsx",
  "src/pages/AdminBrands.tsx",
  "src/pages/AdminDashboard.tsx",
  "src/pages/AdminHistory.tsx",
  "src/pages/AdminLogs.tsx",
  "src/pages/AdminUsers.tsx",
  "src/components/DashboardLayout.tsx",
  "src/components/ActiveAccountBadge.tsx",
  "src/hooks/useActivityLog.ts",
  "src/hooks/useIsAdmin.ts",
  "src/lib/accountVault.ts",
];

const restrictedImportsRule = [
  "error",
  {
    paths: [
      {
        name: "@/integrations/supabase/client",
        message:
          "UI code must not import the Supabase client directly. Use a service in src/services/* or a hook in src/hooks/**. See .lovable/plan.md.",
      },
    ],
  },
];

export default tseslint.config(
  { ignores: ["dist", "supabase/functions/**", "extension/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Enforce DAL boundary in UI code.
  {
    files: ["src/pages/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedImportsRule,
    },
  },
  // Services, the auto-generated Supabase client, and the DAL itself are
  // allowed to import the client freely.
  {
    files: [
      "src/services/**/*.{ts,tsx}",
      "src/integrations/supabase/**/*.{ts,tsx}",
      "src/lib/db.ts",
      "src/hooks/useAuth.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Grandfather the not-yet-migrated files as warnings so the build stays
  // green while the migration completes incrementally.
  {
    files: NOT_YET_MIGRATED,
    rules: {
      "no-restricted-imports": ["warn", restrictedImportsRule[1]],
    },
  },
  // Tests may reach into anything.
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
