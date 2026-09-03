import { LinuxVFS } from '../src/bash/vfs';
import { BashShell } from '../src/bash/shell';
import { CmdChallengesList } from '../src/challenges/cmdChallenges';

function runTests() {
  console.log('🧪 Starting Exact CMD Challenge Tests...\n');
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

  const vfs = new LinuxVFS();
  const shell = new BashShell(vfs);

  // 1. hello_world
  const ch1 = CmdChallengesList[0];
  let res = shell.execute('echo "hello world"');
  assert(ch1.verify(vfs, res.stdout, 'echo "hello world"'), 'Challenge #1 (hello_world)');

  // 2. current_working_directory
  const ch2 = CmdChallengesList[1];
  res = shell.execute('pwd');
  assert(ch2.verify(vfs, res.stdout, 'pwd'), 'Challenge #2 (current_working_directory)');

  // 3. list_files
  const ch3 = CmdChallengesList[2];
  res = shell.execute('ls');
  assert(ch3.verify(vfs, res.stdout, 'ls'), 'Challenge #3 (list_files)');

  // 4. print_file_contents
  const ch4 = CmdChallengesList[3];
  res = shell.execute('cat access.log');
  assert(ch4.verify(vfs, res.stdout, 'cat access.log'), 'Challenge #4 (print_file_contents)');

  // 5. last_lines
  const ch5 = CmdChallengesList[4];
  res = shell.execute('tail -n 5 access.log');
  assert(ch5.verify(vfs, res.stdout, 'tail -n 5 access.log'), 'Challenge #5 (last_lines)');

  // 6. find_string_in_a_file
  const ch6 = CmdChallengesList[5];
  res = shell.execute('grep "GET" access.log');
  assert(ch6.verify(vfs, res.stdout, 'grep "GET" access.log'), 'Challenge #6 (find_string_in_a_file)');

  // 7. search_for_files_containing_string
  const ch7 = CmdChallengesList[6];
  res = shell.execute('grep -l "500" *');
  assert(ch7.verify(vfs, res.stdout, 'grep -l "500" *'), 'Challenge #7 (search_for_files_containing_string)');

  // 8. search_for_files_by_extension
  const ch8 = CmdChallengesList[7];
  res = shell.execute('find -name "access.log*"');
  assert(ch8.verify(vfs, res.stdout, 'find -name "access.log*"'), 'Challenge #8 (search_for_files_by_extension)');

  // 9. search_for_string_in_files_recursive
  const ch9 = CmdChallengesList[8];
  res = shell.execute('grep -r "500" .');
  assert(ch9.verify(vfs, res.stdout, 'grep -r "500" .'), 'Challenge #9 (search_for_string_in_files_recursive)');

  // 10. extract_ip_addresses
  const ch10 = CmdChallengesList[9];
  res = shell.execute("grep -E -o '([0-9]{1,3}\\.){3}[0-9]{1,3}' access.log");
  assert(ch10.verify(vfs, res.stdout, "grep -E -o '([0-9]{1,3}\\.){3}[0-9]{1,3}' access.log"), 'Challenge #10 (extract_ip_addresses)');

  // 11. count_files
  const ch12 = CmdChallengesList[11];
  res = shell.execute('ls -1 | wc -l');
  assert(ch12.verify(vfs, res.stdout, 'ls -1 | wc -l'), 'Challenge #12 (count_files)');

  // 12. simple_sort
  const ch13 = CmdChallengesList[12];
  res = shell.execute('sort access.log');
  assert(ch13.verify(vfs, res.stdout, 'sort access.log'), 'Challenge #13 (simple_sort)');

  // 13. count_string_in_line
  const ch14 = CmdChallengesList[13];
  res = shell.execute('grep -c "GET" access.log');
  assert(ch14.verify(vfs, res.stdout, 'grep -c "GET" access.log'), 'Challenge #14 (count_string_in_line)');

  // 14. split_on_a_char
  const ch15 = CmdChallengesList[14];
  res = shell.execute("cat split-me.txt | tr ';' '\\n'");
  assert(ch15.verify(vfs, res.stdout, "cat split-me.txt | tr ';' '\\n'"), 'Challenge #15 (split_on_a_char)');

  // 15. print_number_sequence
  const ch16 = CmdChallengesList[15];
  res = shell.execute('echo {1..100}');
  assert(ch16.verify(vfs, res.stdout, 'echo {1..100}'), 'Challenge #16 (print_number_sequence)');

  // 16. remove_files_with_extension
  const ch17 = CmdChallengesList[16];
  shell.execute('rm *.doc');
  assert(ch17.verify(vfs, '', 'rm *.doc'), 'Challenge #17 (remove_files_with_extension)');

  // 17. replace_text_in_files
  const ch18 = CmdChallengesList[17];
  shell.execute('sed -i "s/challenges are difficult//g" *.txt');
  assert(ch18.verify(vfs, '', 'sed -i "s/challenges are difficult//g" *.txt'), 'Challenge #18 (replace_text_in_files)');

  // 18. sum_all_numbers
  const ch19 = CmdChallengesList[18];
  res = shell.execute("awk '{sum+=$1} END{print sum}' sum-me.txt");
  assert(ch19.verify(vfs, res.stdout, "awk '{sum+=$1} END{print sum}' sum-me.txt"), 'Challenge #19 (sum_all_numbers)');

  // 19. just_the_file
  const ch20 = CmdChallengesList[19];
  res = shell.execute('basename /home/cmdchallenge/access.log');
  assert(ch20.verify(vfs, res.stdout, 'basename /home/cmdchallenge/access.log'), 'Challenge #20 (just_the_file)');

  // 20. delete_files
  const ch11 = CmdChallengesList[10];
  shell.execute('rm -rf *');
  assert(ch11.verify(vfs, '', 'rm -rf *'), 'Challenge #11 (delete_files)');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
