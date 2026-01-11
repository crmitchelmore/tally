import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright outputs
    "test-results/**",
    "playwright-report/**",
    // Convex generated files
    "convex/_generated/**",
  ]),
  // Custom rules
  {
    rules: {
      // Prevent imports from legacy directory
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/legacy/*", "../legacy/*", "../../legacy/*"],
              message: "Imports from legacy/ are not allowed. The legacy code is deprecated.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
