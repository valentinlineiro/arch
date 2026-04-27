# IDEA: Unify all tools into a single Angular project
**Created:** 2026-04-27
**Source:** Human request via DO mode
**Status:** DRAFT

## Proposal
Migrate all current single-file HTML tools (`arch-assistant.html`, `arch-initializr.html`, `arch-viewer.html`, `ONBOARDING.html`) into a single, cohesive Angular project. This will improve maintainability, component reuse (e.g., navigation, styling, GitHub API integration), and developer experience.

## Gaps
- **Project Structure:** Should the Angular project live in a new `ui/` directory or replace the `docs/` flat files? (GitHub Pages deployment needs consideration).
- **Styling:** Migrating the custom dark-mode CSS to Angular components (possibly using SCSS or Tailwind if requested, though Vanilla CSS is currently preferred).
- **GitHub API Service:** Create a unified Angular service to handle anonymous and OAuth-based requests to the GitHub API.
- **Routing:** Use Angular Router to navigate between the Initializr, Viewer, Assistant, and Onboarding sections.
- **Legacy Support:** Do we keep the single-file versions as fallbacks?

## Decision
[TBD]
