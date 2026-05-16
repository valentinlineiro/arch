# IDEA: OpenClaw integration — mobile bridge for ARCH

**Created:** 2026-05-06
**Source:** Human — `idea:` DO mode submission
**Status:** REJECTED

## Problem

ARCH requires a terminal session to run any command (`arch review`, `arch loop`, task management). There is no way to check system status, receive drift alerts, or promote IDEAs from a mobile device.

## Proposed Solution

Use OpenClaw (https://openclaw.ai/) as a thin mobile-to-terminal bridge:

1. **Notification channel** — OpenClaw polls `arch review` on a schedule and forwards violations to the user's configured messaging app (WhatsApp, Telegram, Signal).
2. **Status queries** — user sends a message like "arch status" and OpenClaw shells out to `arch review` / `arch next`, returning the output.
3. **Trigger bridge** — user can fire `arch loop --dry-run` or promote an IDEA by messaging from phone.

OpenClaw's skill system allows custom shell-command plugins; ARCH commands map cleanly as skills.

## Source

Discussion — user inquiry about OpenClaw + ARCH synergy (2026-05-06).

---

**Promoted by:**
**Promoted on:**

## Decision
REJECT: Product decision outside protocol scope. Not a protocol concern.
