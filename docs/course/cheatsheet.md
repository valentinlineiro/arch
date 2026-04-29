# Operating Cheatsheet

The essential commands for a human operating an ARCH repository.

| Goal | Command |
|------|---------|
| **Check Health** | `arch review` |
| **Manage Backlog** | `arch think` |
| **Pick Next Task** | `arch next` |
| **Start a Task** | `arch task start TASK-XXX` |
| **Finish a Task** | `arch task done TASK-XXX` |
| **Add an Idea** | `arch do "idea: <description>"` |
| **Check Inbox** | `arch inbox` |
| **Rank Backlog** | `arch rank` |

## Pro-Tips
*   **Safety First:** Always run `arch review` before and after major changes.
*   **Inbox is Truth:** Check `docs/INBOX.md` daily for human-agent coordination.
*   **Focus is Intent:** If you want an agent to work on something specific, set `Focus:yes` manually in the task file.
