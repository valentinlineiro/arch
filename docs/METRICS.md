# ARCH Metrics
<!-- ARCH v0.6.0 | System Performance & Reliability -->

## Dashboard
| Metric | Last Month | Trend |
|--------|------------|-------|
| **Velocity** | 100% | ↑ |
| **P50 Cycle Time** | 4h | ↓ |
| **P90 Cycle Time** | 24h | - |
| **Avg Cost / Task** | $0.15 | ↓ |
| **REVIEW_FAIL %** | 4% | ↓ |
| **Drift Count** | 2 | ↓ |

## Historical Data
<!-- machine-readable-block -->
```json
{
  "last_updated": "2026-05-01",
  "summary": {
    "velocity": 1.0,
    "p50_cycle_time_hours": 4,
    "p90_cycle_time_hours": 24,
    "avg_cost_dollars": 0.15,
    "review_fail_rate": 0.04,
    "drift_count": 2
  },
  "tasks": [
    {
      "id": "TASK-156",
      "size": "S",
      "cycle_time_hours": 2,
      "cost": 0.05,
      "review_fail": false
    },
    {
      "id": "TASK-157",
      "size": "XS",
      "cycle_time_hours": 1,
      "cost": 0.02,
      "review_fail": false
    }
  ]
}
```

## Turns-per-Size
<!-- Expected ranges based on ARCH execution model. Flag [MURA] if actual avg > expected by >50%. -->
| Size | Expected Turns | Mura Threshold |
|------|---------------|----------------|
| XS   | 1–5           | >7             |
| S    | 5–15          | >22            |
| M    | 15–30         | >45            |
| L    | 30–60         | >90            |

## Sprint Template
<!-- Copy this block when closing a sprint. Fill in actuals. -->
```markdown
## Sprint: sprint/<slug>
- **Closed:** YYYY-MM-DD
- **Tasks completed:** N
- **P50 cycle time:** Xh
- **Avg cost / task:** $X.XX
- **REVIEW_FAIL rate:** X%
- **Turns-per-Size actuals:** XS=N, S=N, M=N, L=N
- **Mura flags:** [list TASK-IDs or "none"]
```

## Insights
- Autonomous loop efficiency is high.
- REVIEW_FAIL rate is below the 5% threshold for L3 Autonomy.
