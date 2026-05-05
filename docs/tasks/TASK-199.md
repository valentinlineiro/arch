## TASK-199: Implement Universal LLM Bridge (OpenAI-standard) for CLIs and Native REST
**Meta:** P1 | M | READY | Focus:yes | 2-code-generation | local | arch.config.json
**Depends:** TASK-191

### Context
ARCH currently manages multiple integration patterns (CLI templates, subprocesses, specific API logic). Standardizing on the OpenAI API format allows us to unify all interactions through a polymorphic bridge, preserving the cost benefits of local CLIs while gaining the metadata and performance of native REST.

### Acceptance Criteria
- [ ] Implement `LLMProvider` interface in `cli/src/main/ts/domain/services/llm-provider.ts` following the OpenAI `/v1/chat/completions` standard
- [ ] Implement `BridgeProvider` (Sidecar/Embedded) that wraps local CLIs (**Claude**, **Gemini**, **Codex**, **Opencode**) and parses terminal output into structured OpenAI JSON
- [ ] Integrate usage metadata capture (tokens, latency) into the bridge parsers
- [ ] Implement `NativeProvider` as a pass-through for **Ollama** and direct provider keys
- [ ] Update `arch.config.json` schema to support the new `providers` registry and task routing
- [ ] Update `ExecCommand` and `LoopEngine` to use the unified provider interface
- [ ] Subsume OpenRouter and legacy `clis` templates into the new provider registry
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
- [ ] `npm test` passes in `cli/`.
