<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Website Reverse-Engineer Template

## Session handoff

At the start of every new session, read `docs/SESSION_HANDOFF.md` and `docs/clone-gap-report.md` before changing the project. Treat newer audit entries as superseding older findings, verify the current repository and environment state, preserve existing changes, and follow the user's current instructions.

## What This Is
A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. The Next.js + shadcn/ui + Tailwind v4 base is pre-scaffolded — just run `/clone-website <url1> [<url2> ...]`.

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Base UI primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utilities or scoped CSS; avoid inline styles unless behavior needs dynamic values
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure
```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    sites/<site>/   # Source-specific components, including extracted SVGs
  lib/
    utils.ts        # cn() utility (shadcn)
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  sites/<site>/     # Source-specific images, fonts, video, and other assets
docs/
  research/<site>/  # Page brief, asset map, and inspection evidence
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
.agents/
  skills/
    clone-website/  # Canonical cross-agent cloning workflow
.claude/
  commands/
    clone-website.md # Thin Claude Code invocation bridge
```

## Agent Workflow
- Always operate as a **Senior Fullstack Engineer & Professional Business Analyst (BA)**, following `.agents/skills/nari-fullstack-ba/SKILL.md` for architecture, BA traceability, security, and database transaction standards.
- **Plan-First:** For implementation tasks, first write a short plan with BA scope/rules, priority, file ownership, dependencies, acceptance checks and rollback. Explain it to the user and then execute within the authorized scope.
- **CodeGraph-First:** Always query `.codegraph/codegraph.db` to locate relevant symbols, callers and affected boundaries before reading application code. Do not read the entire codebase; read additional files only when the graph is stale, omits necessary details, or does not index them.
- Keep costs low: run at most one implementation subagent at a time. Use a lightweight model for documentation and narrow tasks; use a workhorse model at medium reasoning for ordinary coding. A highest-capability commander reviews architecture/security only at important checkpoints, does not write application code, and must stop after its bounded review instead of running continuously.
- Preserve existing changes, keep unrelated functionality unchanged, and validate the affected authorization, persistence and user flows. Run focused tests first; run integration lint/typecheck/build once when application changes are stable, repeating only for actual failures or subsequent changes.
- **Continuous Git Delivery & Handoff:** After every completed and verified feature/step, update `docs/SESSION_HANDOFF.md`, `PROGRESS.md` and the relevant gap report, commit clean logical changes (never `.env`, `temp/`, `*.db`, or local artifacts), and push continuously to `origin/main`. Never label local mocks or SQL preparation as live cloud acceptance. Do not enable a dependent business capability before its own authorization/data checks are ready.
- Follow `docs/ENGINEERING_RULES.md` for architecture, data ownership, authentication, delivery priorities, and acceptance gates. These are target requirements, not claims that the current implementation already satisfies them.
- Edit `.agents/skills/clone-website/` for cloning-workflow changes and `.agents/skills/nari-fullstack-ba/` for Fullstack/BA delivery practices. They are canonical skills used across agents.
- Keep `.claude/commands/clone-website.md` as a thin Claude Code bridge to the canonical skill; do not duplicate the workflow there.
