import { Lexer } from '../src/engine/lexer';
import { Parser } from '../src/engine/parser';
import { Executor } from '../src/engine/executor';
import { VirtualFileSystem } from '../src/engine/vfs';
import { createDefaultState } from '../src/state/gameState';
import { ChallengesCatalog } from '../src/challenges/catalog';

async function runTests() {
  console.log('🧪 Starting PowerShell Command Challenge Engine Tests...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${testName}`);
    }
  }

  const state = createDefaultState();
  const vfs = new VirtualFileSystem();
  const executor = new Executor(state, vfs);

  // 1. Lexer & Parser
  const tokens = new Lexer("Get-ChildItem -Recurse | Where-Object Length -gt 1000").tokenize();
  assert(tokens.length === 7, 'Lexer tokenizes command and parameters correctly');

  const ast: any = Parser.parse("Get-ChildItem -Recurse | Where-Object Length -gt 1000");
  assert(ast !== null && ast.type === 'Pipeline', 'Parser creates Pipeline AST');

  // 2. Challenge #1: Hello World
  const ch1 = ChallengesCatalog[0];
  const res1 = await executor.execute("Write-Output 'hello world'");
  assert(ch1.verify(vfs, res1.output, "Write-Output 'hello world'"), 'Challenge #1 (hello_world) verified');

  // 3. Challenge #2: Current Working Directory
  const ch2 = ChallengesCatalog[1];
  const res2 = await executor.execute('Get-Location');
  assert(ch2.verify(vfs, res2.output, 'Get-Location'), 'Challenge #2 (current_working_directory) verified');

  // 4. Challenge #3: List Files
  const ch3 = ChallengesCatalog[2];
  const res3 = await executor.execute('Get-ChildItem');
  assert(ch3.verify(vfs, res3.output, 'Get-ChildItem'), 'Challenge #3 (list_files) verified');

  // 5. Challenge #5: Print File Contents
  const ch5 = ChallengesCatalog[4];
  const res5 = await executor.execute('Get-Content welcome.txt');
  assert(ch5.verify(vfs, res5.output, 'Get-Content welcome.txt'), 'Challenge #5 (print_file_contents) verified');

  // 6. Challenge #6: First 5 lines
  const ch6 = ChallengesCatalog[5];
  const res6 = await executor.execute('Get-Content access.log -TotalCount 5');
  assert(ch6.verify(vfs, res6.output, 'Get-Content access.log -TotalCount 5'), 'Challenge #6 (first_5_lines) verified');

  // 7. Challenge #9: Select-String 404
  const ch9 = ChallengesCatalog[8];
  const res9 = await executor.execute("Select-String -Path access.log -Pattern '404'");
  assert(ch9.verify(vfs, res9.output, "Select-String -Path access.log -Pattern '404'"), 'Challenge #9 (search_404_errors) verified');

  // 8. Challenge #10: Filter Processes CPU
  const ch10 = ChallengesCatalog[9];
  const res10 = await executor.execute('Get-Process | Where-Object CPU -gt 50');
  assert(ch10.verify(vfs, res10.output, 'Get-Process | Where-Object CPU -gt 50'), 'Challenge #10 (filter_processes_cpu) verified');

  // 9. Challenge #14: Import CSV & Filter Department
  const ch14 = ChallengesCatalog[13];
  const res14 = await executor.execute("Import-Csv employees.csv | Where-Object Department -eq 'Engineering'");
  assert(ch14.verify(vfs, res14.output, "Import-Csv employees.csv | Where-Object Department -eq 'Engineering'"), 'Challenge #14 (import_csv_engineering) verified');

  // 10. Challenge #16: Measure Salary Average
  const ch16 = ChallengesCatalog[15];
  const res16 = await executor.execute('Import-Csv employees.csv | Measure-Object -Property Salary -Average');
  assert(ch16.verify(vfs, res16.output, 'Import-Csv employees.csv | Measure-Object -Property Salary -Average'), 'Challenge #16 (calculate_average_salary) verified');

  // 11. Challenge #21: Parse JSON
  const ch21 = ChallengesCatalog[20];
  const res21 = await executor.execute('Get-Content config.json | ConvertFrom-Json');
  assert(ch21.verify(vfs, res21.output, 'Get-Content config.json | ConvertFrom-Json'), 'Challenge #21 (parse_json_port) verified');

  // 12. Challenge #23: Copy Item to Backup
  const ch23 = ChallengesCatalog[22];
  const res23 = await executor.execute('Copy-Item config.json backup\\');
  assert(ch23.verify(vfs, res23.output, 'Copy-Item config.json backup\\'), 'Challenge #23 (copy_file_backup) verified');

  // 13. Challenge #26: Test-Path
  const ch26 = ChallengesCatalog[25];
  const res26 = await executor.execute('Test-Path backup');
  assert(ch26.verify(vfs, res26.output, 'Test-Path backup'), 'Challenge #26 (test_path_exists) verified');

  // 14. Challenge #27: Split-Path
  const ch27 = ChallengesCatalog[26];
  const res27 = await executor.execute("Split-Path 'C:\\Users\\student\\welcome.txt' -Leaf");
  assert(ch27.verify(vfs, res27.output, "Split-Path 'C:\\Users\\student\\welcome.txt' -Leaf"), 'Challenge #27 (split_path_leaf) verified');

  // 15. Challenge #28: Join-Path
  const ch28 = ChallengesCatalog[27];
  const res28 = await executor.execute("Join-Path 'C:\\Users' 'student\\projects'");
  assert(ch28.verify(vfs, res28.output, "Join-Path 'C:\\Users' 'student\\projects'"), 'Challenge #28 (join_paths) verified');

  // 16. Challenge #29: Range Sum
  const ch29 = ChallengesCatalog[28];
  const res29 = await executor.execute('1..100 | Measure-Object -Sum');
  assert(ch29.verify(vfs, res29.output, '1..100 | Measure-Object -Sum'), 'Challenge #29 (number_range_sum) verified');

  // 17. Challenge #34: Count Running Services
  const ch34 = ChallengesCatalog[33];
  const res34 = await executor.execute("Get-Service | Where-Object Status -eq 'Running' | Measure-Object");
  assert(ch34.verify(vfs, res34.output, "Get-Service | Where-Object Status -eq 'Running' | Measure-Object"), 'Challenge #34 (count_running_services) verified');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
