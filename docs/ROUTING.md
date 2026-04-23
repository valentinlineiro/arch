# ROUTING.md
<!-- Read during planning to assign CLI to each task -->
<!-- ~300 tokens | Read once per sprint planning session -->

## Decision tree

```
Is the task primarily about reasoning, trade-offs, or architecture?
  YES → Claude Code / Claude Opus (for strategy)

Does the task require reading more than 20 files simultaneously?
  YES → Gemini CLI (1M token context)

Is it standard code with a known pattern (CRUD, endpoints, tests)?
  YES → Is git-awareness critical?
          YES → Aider
          NO  → Codex CLI or Codestral

Is it repetitive, automatable, low judgment required?
  YES → Local model (Ollama + Qwen2.5-Coder or DeepSeek-Coder)

Is it research, synthesis, or information gathering?
  YES → Perplexity API or Gemini (search grounding)

Is it writing (docs, proposals, reports, ADRs)?
  YES → Claude

Is it a strategic decision (trade-offs, sprint planning, retro)?
  YES → Claude Opus or o3
```

---

## Class reference

| Class | Name | Default CLI | Cost tier |
|-------|------|-------------|-----------|
| 1-code-reasoning | Architecture, debugging, ADRs | Claude Code | High |
| 2-code-generation | Boilerplate, CRUD, tests | Codex / Codestral | Medium |
| 3-code-context | Cross-repo, large refactors | Gemini CLI | Low (free tier) |
| 4-code-repetitive | Scripts, automation, transforms | Aider + local | Near-zero |
| 5-research | Specs, market, technical docs | Perplexity / Gemini | Low |
| 6-writing | Docs, proposals, reports | Claude | Medium |
| 7-operations | ETL, integrations, data pipelines | Local + n8n | Near-zero |
| 8-strategy | Trade-offs, planning, retros | Claude Opus / o3 | High |

---

## Cost optimization rules

```
HIGH volume + LOW complexity  →  Local model or free tier
LOW volume + HIGH complexity  →  Claude Opus / o3
HIGH volume + HIGH complexity →  Decompose the task first (design problem, not CLI problem)

Batch API (OpenAI):  50% discount for non-realtime processing
Gemini free tier:    Resets daily — schedule context-heavy tasks at day start
Prompt caching:      Enable for any task reusing the same system context
```

---

## CLI installation reference

| CLI | Install | Config file |
|-----|---------|-------------|
| Claude Code | `npm install -g @anthropic-ai/claude-code` | `CLAUDE.md` → symlink to `AGENTS.md` |
| Gemini CLI | `npm install -g @google/gemini-cli` | `GEMINI.md` → symlink to `AGENTS.md` |
| Codex CLI | `npm install -g @openai/codex` | `AGENTS.md` |
| Aider | `pip install aider-chat` | `AGENTS.md` |
| Ollama | `brew install ollama` | Prompt inline |

Symlink setup:
```bash
ln -s docs/AGENTS.md AGENTS.md
ln -s docs/AGENTS.md CLAUDE.md
ln -s docs/AGENTS.md GEMINI.md
```
