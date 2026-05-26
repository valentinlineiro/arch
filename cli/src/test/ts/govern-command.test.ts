import { test } from 'node:test';
import assert from 'node:assert';
import { GovernCommand } from '../../main/ts/application/commands/govern-command.js';
import { MockFileSystem, MockTaskRepository, MockGitRepository } from './mocks/index.js';

test('GovernCommand fails when context index rebuild fails', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ governance: { conductEveryN: 3 }, contextRules: {} });
  
  const git = new MockGitRepository();
  git.lastCommitMessage = 'FAIL_HISTORY'; // Triggers the error in our new MockGitRepository

  const command = new GovernCommand(
    new MockTaskRepository(),
    git,
    fs,
  );

  await assert.rejects(
    () => command.execute(['--no-analyze']),
    /failed to rebuild context index during govern/,
  );
});
