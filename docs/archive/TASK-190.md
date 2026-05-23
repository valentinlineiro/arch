## TASK-190: Implement L3 sprint autonomy (arch loop --sprint)
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/commands/loop-command.ts, docs/agents/DO.md, docs/guidelines/
**Depends:** TASK-189

## Hansei
The pre-existing type bug in `loop-engine.ts` (assigning `SelectNextResult` to `Task | undefined`) was a silent runtime hazard that I fixed as part of this task. The sprint scoping and checkpoint logic were implemented in `loop-engine.ts` without touching protected paths, and the new `SelectNextTask` filter parameter preserves backward compatibility with the existing test suite (341 passing, 6 pre-existing failures unchanged).
