# ADR-005: Non-Docker Sandbox Strategy

## Status
PROPOSED

## Context
Executing Acceptance Criteria (ACs) that involve shell commands or scripts poses a security risk. While Docker was initially considered, it is deemed too heavy and potentially non-portable for certain environments (e.g., WSL without Docker Desktop, or lightweight CI runners). We need a strategy to execute code safely without the overhead of full containerization.

## Decision
We will implement a multi-layered, non-Docker sandbox strategy:
1. **Node.js Isolation:** Use `node:vm` (native) or `isolate-vm` (if higher isolation is required) for executing JavaScript-based logic.
2. **Command Allowlist:** Only permit a hardcoded list of safe commands (`test`, `grep`, `jq`, `node`, `git status`).
3. **Filesystem Guard:** Restrict write access to `/tmp` or a designated ephemeral directory.
4. **Timeouts:** Enforce a strict 30s timeout for all sandbox executions.
5. **Privilege Escalation Gate:** Any AC requiring network access or external writes must be explicitly tagged `privileged:yes` and requires manual human approval via the INBOX.

## Consequences
- **Positive:** Lower resource usage, faster execution, improved portability across local environments.
- **Negative:** Slightly higher implementation complexity compared to a standard Docker wrapper; less absolute isolation than a full container (though sufficient for the current threat model of "unintended side effects").
