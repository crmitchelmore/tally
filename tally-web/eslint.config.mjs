import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Accessibility rules (jsx-a11y plugin is included in next/core-web-vitals)
  {
    rules: {
      // Critical a11y rules (errors)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "error",
      
      // Important a11y rules (warnings for now)
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/html-has-lang": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
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
