## TASK-158: Implement Ollama API Wrapper and Provider
**Meta:** P2 | M | READY | Focus:yes | 2-code-generation | local | cli/src/main/ts/infrastructure/llm/ollama-provider.ts, arch.config.json
**Depends:** none

### Acceptance Criteria
- [ ] Create `OllamaProvider` implementation of `LLMProvider` (or equivalent interface).
- [ ] Support `qwen2.5-coder:7b` and `qwen3:8b` models.
- [ ] Implement robust error handling for local Ollama service unavailability.
- [ ] Add configuration support in `arch.config.json` for Ollama endpoint and model selection.
- [ ] Verify basic connectivity and response parsing with a local Ollama instance (mocked if necessary for tests).

### Context
#### Problem
Dependencia total de LLMs en la nube implica costes y latencia. Se requiere integración local con Ollama.

#### Solution
Integrar Ollama como proveedor. El usuario especifica el uso de `qwen2.5-coder:7b` y `qwen3:8b`.

### Definition of Done
- [x] All ACs checked.
- [x] arch review passes.
