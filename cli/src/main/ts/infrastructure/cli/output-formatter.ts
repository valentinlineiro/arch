const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

export function ok(message: string): void {
  console.log(`\n  ${GREEN}✔${NC} ${message}`);
}

export function fail(message: string): void {
  console.log(`\n  ${RED}✖${NC} ${message}`);
}

export function warn(message: string): void {
  console.log(`  ${YELLOW}⚠${NC} ${message}`);
}

export function info(message: string): void {
  console.log(`  ${YELLOW}ℹ${NC} ${message}`);
}

export function arrow(message: string): void {
  console.log(`  ${GREEN}→${NC} ${message}`);
}

export function check(message: string): void {
  console.log(`  ${GREEN}✓${NC} ${message}`);
}

export function driftIcon(status: string): string {
  if (status === 'OK') return `${GREEN}✔${NC}`;
  if (status === 'FAIL') return `\x1b[31m✖\x1b[0m`;
  return `${YELLOW}⚠${NC}`;
}

export function header(label: string): void {
  console.log(`\n  ${GREEN}ARCH${NC} — ${label}`);
}
