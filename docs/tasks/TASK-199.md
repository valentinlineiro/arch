## TASK-199: Implement Universal LLM Bridge (OpenAI-standard) for CLIs and Native REST
**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | local | arch.config.json
**Depends:** TASK-191

### Context
ARCH currently manages multiple integration patterns (CLI templates, subprocesses, specific API logic). Standardizing on the OpenAI API format allows us to unify all interactions through a polymorphic bridge, preserving the cost benefits of local CLIs while gaining the metadata and performance of native REST.

### Acceptance Criteria
- [x] Implement `LLMProvider` interface in `cli/src/main/ts/domain/services/llm-provider.ts` following the OpenAI `/v1/chat/completions` standard
- [x] Implement `BridgeProvider` (Sidecar/Embedded) that wraps local CLIs (**Claude**, **Gemini**, **Codex**, **Opencode**) and parses terminal output into structured OpenAI JSON
- [x] Integrate usage metadata capture (tokens, latency) into the bridge parsers
- [x] Implement `NativeProvider` as a pass-through for **Ollama** and direct provider keys
- [x] Update `arch.config.json` schema to support the new `providers` registry and task routing
- [x] Update `ExecCommand` and `LoopEngine` to use the unified provider interface
- [x] Subsume OpenRouter and legacy `clis` templates into the new provider registry
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Hansei
The implementation was already present in the repository but the task remained in READY status, possibly due to a previous execution failure or omission. I have verified the implementation against all ACs and confirmed that the full test suite passes, including new provider-specific tests.
