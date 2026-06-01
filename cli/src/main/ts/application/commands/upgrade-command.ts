import { spawnSync } from 'node:child_process';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class UpgradeCommand {
  constructor(private currentVersion: string = '0.0.0') {}

  async execute(args: string[]): Promise<number> {
    const isProtocol = args.includes('--protocol');

    if (isProtocol) {
      return this.upgradeProtocol();
    }

    return this.upgradeCli();
  }

  private async upgradeCli(): Promise<number> {
    fmt.log('\n  \x1b[32mARCH\x1b[0m — arch upgrade\n');

    // Check latest version from npm
    const checkResult = spawnSync('npm', ['view', 'arch-cli', 'version'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });

    if (checkResult.status !== 0) {
      fmt.log('  \x1b[33m⚠\x1b[0m Could not check npm for latest version — are you online?');
      fmt.log('  To upgrade manually: npm install -g arch-cli\n');
      return 1;
    }

    const latest = checkResult.stdout.trim();
    const current = this.currentVersion;

    if (latest === current) {
      fmt.log(`  \x1b[32m✔\x1b[0m Already on latest version (${current})\n`);
      return 0;
    }

    fmt.log(`  Current: ${current}`);
    fmt.log(`  Latest:  ${latest}`);
    fmt.log('\n  Upgrading...\n');

    const installResult = spawnSync('npm', ['install', '-g', 'arch-cli'], {
      stdio: 'inherit',
      timeout: 120000,
    });

    if (installResult.status !== 0) {
      fmt.log('\n  \x1b[31m✖\x1b[0m Upgrade failed. Try: npm install -g arch-cli\n');
      return 1;
    }

    fmt.log(`\n  \x1b[32m✔\x1b[0m Upgraded to ${latest}\n`);
    return 0;
  }

  private upgradeProtocol(): number {
    fmt.log('\n  \x1b[32mARCH\x1b[0m — arch upgrade --protocol\n');
    fmt.log('  Checks for protocol-level changes between ARCH versions:');
    fmt.log('  — new required fields in task format (TASK-FORMAT.md)');
    fmt.log('  — new ADRs enforced by arch review');
    fmt.log('  — deprecated Hansei categories\n');
    fmt.log('  \x1b[33m⚠\x1b[0m Protocol diffing is not yet automated.');
    fmt.log('  See docs/PROTOCOL-UPGRADES.md for the manual process.');
    fmt.log('  See ADR-033 for the upgrade policy.\n');
    return 0;
  }
}
