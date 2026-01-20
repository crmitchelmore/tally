# Tally User Journey Features

Cucumber/Gherkin feature files documenting key user journeys for Tally.

## Structure

| File | Description |
|------|-------------|
| `step-definitions.md` | Reusable step patterns and abstractions |
| `01-new-user-onboarding.feature` | First-time web user experience |
| `02-offline-user-experience.feature` | Offline-first flow (all platforms) |
| `03-challenge-management.feature` | Creating and managing challenges |
| `04-entry-logging.feature` | Adding entries (basic + detailed) |
| `05-community-features.feature` | Public challenges and following |
| `06-user-registration.feature` | Converting to registered user |
| `07-data-portability.feature` | Export/import functionality |

## Conventions

- **Background** sections define common setup
- **Scenario Outline** with Examples for parameterized tests
- **@tags** for filtering: `@web`, `@ios`, `@android`, `@offline`, `@smoke`
- Steps use domain language from DESIGN-PHILOSOPHY.md
