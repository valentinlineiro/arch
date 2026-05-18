# ARCH

**Autonomous Routing and Context Hierarchy**

A Git-native operational protocol for human+AI collaborative work.

## Install

```bash
npm install -g @valentinlineiro/arch
```

## Usage

```bash
arch task capture "<intent>"        # create a task (deterministic)
arch task capture "<intent>" --draft  # LLM-assisted draft
arch task start TASK-XXX            # mark in progress
arch task done TASK-XXX             # archive as done

arch review                         # structural validation + drift check
arch review --push                  # push to remote after passing review

arch govern                         # enforcement tick (archive DONE, assign focus)
arch govern reflect                 # THINK mode: surface Kaizen, detect drift

arch memory ask "<question>"        # corpus search across archive + ADRs
arch memory causal                  # record and query causal relations

arch version                        # show version
arch task --help                    # full subcommand list
```

## Set up a governed repository

```bash
arch init
```

Scaffolds `docs/`, `arch.config.json`, `AGENTS.md`, and git hooks in the current directory.

## Upgrade

```bash
npm install -g @valentinlineiro/arch@latest
```

## Requirements

- Node.js >= 20
- Git

## What ARCH is not

A chat UI, a Jira replacement, a second brain, or an autonomous agent system. If a proposed use case doesn't require a git repo and a set of tasks to execute, it's outside ARCH.

## License

MIT
