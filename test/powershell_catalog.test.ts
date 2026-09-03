import { VirtualFileSystem } from '../src/engine/vfs';
import { Executor } from '../src/engine/executor';
import { createDefaultState } from '../src/state/gameState';
import { ChallengesCatalog } from '../src/challenges/catalog';

async function testAllChallenges() {
  console.log('🧪 Running Comprehensive 45-Challenge PowerShell Test Suite...\n');
  const vfs = new VirtualFileSystem();
  const state = createDefaultState();
  const executor = new Executor(state, vfs);

  let passed = 0;
  let failed = 0;

  for (const ch of ChallengesCatalog) {
    const solution = ch.solutions[0];
    vfs.reset();
    try {
      const res = await executor.execute(solution);
      const isPassed = ch.verify(vfs, res.output, solution);
      if (isPassed) {
        console.log(`  ✓ Challenge #${ch.id} (${ch.slug}) verified with: ${solution}`);
        passed++;
      } else {
        console.error(`  ✗ Challenge #${ch.id} (${ch.slug}) FAILED with: ${solution}`);
        console.error(`    Output:`, res.output);
        failed++;
      }
    } catch (e: any) {
      console.error(`  ✗ Challenge #${ch.id} (${ch.slug}) EXCEPTION:`, e.message);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${ChallengesCatalog.length} challenges.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testAllChallenges();
