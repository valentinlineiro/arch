# idea: Queryable archive format

- **Class:** 7-operations
- **Size:** S
- **Status:** draft

## Problem

Archive grows over time, making it hard for agents to query and avoid duplication. Current format is not optimized for agent consumption.

## Proposed Solution

Create compressed archive format:

1. Add compact JSON index of archived tasks/ideas
2. Include status, rejection reason, key metadata
3. Make it queryable via simple grep or JSON tools

## Source

Internal discussion — user feedback

---

**Promoted by:** human
**Promoted on:**