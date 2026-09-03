import { LinuxVFS } from '../bash/vfs';

export interface OriginalChallenge {
  id: number;
  slug: string;
  title: string;
  description: string;
  learn: string;
  example: string;
  solutions: string[];
  verify: (vfs: LinuxVFS, stdout: string, cmd: string) => boolean;
}

export const CmdChallengesList: OriginalChallenge[] = [
  {
    id: 1,
    slug: 'hello_world',
    title: 'hello_world',
    description: 'Print "hello world" on the command line.',
    learn: `There are many ways to print text on the command line, one common way is with the 'echo' command. Try typing: echo "hello world"`,
    example: 'echo "hello world"',
    solutions: ['echo "hello world"', 'echo hello world', "echo 'hello world'"],
    verify: (_vfs, stdout) => stdout.trim().toLowerCase() === 'hello world'
  },
  {
    id: 2,
    slug: 'current_working_directory',
    title: 'current_working_directory',
    description: 'Print the current working directory.',
    learn: `The 'pwd' command stands for "print working directory". It will display the full pathname of the current working directory.`,
    example: 'pwd',
    solutions: ['pwd'],
    verify: (vfs, stdout) => stdout.trim() === vfs.getCwd()
  },
  {
    id: 3,
    slug: 'list_files',
    title: 'list_files',
    description: 'List all files in the current directory.',
    learn: `'ls' is short for "list" and is used to list files in your current working directory.`,
    example: 'ls',
    solutions: ['ls', 'ls -1', 'dir'],
    verify: (_vfs, stdout) => stdout.includes('access.log') && stdout.includes('split-me.txt')
  },
  {
    id: 4,
    slug: 'print_file_contents',
    title: 'print_file_contents',
    description: 'Print the contents of the file access.log.',
    learn: `The 'cat' command is used to concatenate and display file contents. Send: cat access.log`,
    example: 'cat access.log',
    solutions: ['cat access.log'],
    verify: (_vfs, stdout) => stdout.includes('GET /index.html') && stdout.includes('GET /profile')
  },
  {
    id: 5,
    slug: 'last_lines',
    title: 'last_lines',
    description: 'Print the last 5 lines of access.log.',
    learn: `'tail' displays the last part of files. By default it shows the last 10 lines. Use 'tail -n 5 access.log' or 'tail -5 access.log'.`,
    example: 'tail -n 5 access.log',
    solutions: ['tail -n 5 access.log', 'tail -5 access.log'],
    verify: (_vfs, stdout) => {
      const lines = stdout.trim().split('\n');
      return lines.length === 5 && stdout.includes('GET /profile');
    }
  },
  {
    id: 6,
    slug: 'find_string_in_a_file',
    title: 'find_string_in_a_file',
    description: 'Find all lines in access.log that contain the string "GET".',
    learn: `'grep' is the standard utility for searching plain-text data sets for lines matching a regular expression. Send: grep "GET" access.log`,
    example: 'grep "GET" access.log',
    solutions: ['grep "GET" access.log', 'grep GET access.log'],
    verify: (_vfs, stdout) => {
      const lines = stdout.trim().split('\n');
      return lines.length >= 5 && lines.every(l => l.includes('GET'));
    }
  },
  {
    id: 7,
    slug: 'search_for_files_containing_string',
    title: 'search_for_files_containing_string',
    description: 'Search for all files in the directory that contain the string "500".',
    learn: `Use 'grep -l' to list only the names of files with matching lines: grep -l "500" *`,
    example: 'grep -l "500" *',
    solutions: ['grep -l "500" *', 'grep -l 500 *'],
    verify: (_vfs, stdout) => stdout.includes('access.log') && stdout.includes('server.log')
  },
  {
    id: 8,
    slug: 'search_for_files_by_extension',
    title: 'search_for_files_by_extension',
    description: 'Search for files with name matching "access.log*".',
    learn: `You can use the 'find' command to search for files in a directory hierarchy: find -name "access.log*"`,
    example: 'find -name "access.log*"',
    solutions: ['find -name "access.log*"', 'ls access.log*'],
    verify: (_vfs, stdout) => stdout.includes('access.log')
  },
  {
    id: 9,
    slug: 'search_for_string_in_files_recursive',
    title: 'search_for_string_in_files_recursive',
    description: 'Search recursively for the string "500" in files.',
    learn: `Use 'grep -r' or 'grep -R' to recursively search subdirectories: grep -r "500" .`,
    example: 'grep -r "500" .',
    solutions: ['grep -r "500" .', 'grep -rn "500" *'],
    verify: (_vfs, stdout) => stdout.includes('500')
  },
  {
    id: 10,
    slug: 'extract_ip_addresses',
    title: 'extract_ip_addresses',
    description: 'Extract all IP addresses from access.log.',
    learn: `Use grep with -E (extended regex) and -o (only matching parts): grep -E -o '([0-9]{1,3}\\.){3}[0-9]{1,3}' access.log`,
    example: "grep -E -o '([0-9]{1,3}\\.){3}[0-9]{1,3}' access.log",
    solutions: [
      "grep -E -o '([0-9]{1,3}\\.){3}[0-9]{1,3}' access.log",
      "awk '{print $1}' access.log"
    ],
    verify: (_vfs, stdout) => {
      const lines = stdout.trim().split('\n');
      return lines.length >= 8 && lines.every(l => /^\d+\.\d+\.\d+\.\d+$/.test(l.trim()));
    }
  },
  {
    id: 11,
    slug: 'delete_files',
    title: 'delete_files',
    description: 'Delete all files in the current directory.',
    learn: `The 'rm' command removes files or directories. Use 'rm -rf *' to remove everything.`,
    example: 'rm -rf *',
    solutions: ['rm -rf *', 'rm *'],
    verify: (vfs) => vfs.listDir().filter(f => !f.name.startsWith('.')).length === 0
  },
  {
    id: 12,
    slug: 'count_files',
    title: 'count_files',
    description: 'Count the number of files in the current directory.',
    learn: `Combine 'ls' and 'wc -l' with a pipe: ls -1 | wc -l`,
    example: 'ls -1 | wc -l',
    solutions: ['ls -1 | wc -l', 'find . -type f | wc -l'],
    verify: (_vfs, stdout) => {
      const count = parseInt(stdout.trim(), 10);
      return count >= 5 && count <= 15;
    }
  },
  {
    id: 13,
    slug: 'simple_sort',
    title: 'simple_sort',
    description: 'Print the lines of access.log in sorted order.',
    learn: `The 'sort' command sorts lines of text files. Send: sort access.log`,
    example: 'sort access.log',
    solutions: ['sort access.log'],
    verify: (_vfs, stdout) => {
      const lines = stdout.trim().split('\n');
      return lines.length >= 5 && lines[0] <= lines[1];
    }
  },
  {
    id: 14,
    slug: 'count_string_in_line',
    title: 'count_string_in_line',
    description: 'Count how many times the string "GET" appears in access.log.',
    learn: `Use 'grep -c "GET" access.log' or pipe grep into 'wc -l'.`,
    example: 'grep -c "GET" access.log',
    solutions: ['grep -c "GET" access.log', 'grep "GET" access.log | wc -l'],
    verify: (_vfs, stdout) => stdout.trim() === '8'
  },
  {
    id: 15,
    slug: 'split_on_a_char',
    title: 'split_on_a_char',
    description: 'The file split-me.txt contains fields separated by ";". Print each field on a new line.',
    learn: `The 'tr' command translates or deletes characters: cat split-me.txt | tr ';' '\\n'`,
    example: "cat split-me.txt | tr ';' '\\n'",
    solutions: ["cat split-me.txt | tr ';' '\\n'", "tr ';' '\\n' < split-me.txt"],
    verify: (_vfs, stdout) => {
      const lines = stdout.trim().split('\n');
      return lines.length === 8 && lines.includes('apple') && lines.includes('banana');
    }
  },
  {
    id: 16,
    slug: 'print_number_sequence',
    title: 'print_number_sequence',
    description: 'Print numbers 1 to 100 on a single line separated by spaces.',
    learn: `You can use bash brace expansion 'echo {1..100}' or 'seq -s " " 1 100'.`,
    example: 'echo {1..100}',
    solutions: ['echo {1..100}', "seq -s ' ' 1 100"],
    verify: (_vfs, stdout) => {
      const parts = stdout.trim().split(/\s+/);
      return parts.length === 100 && parts[0] === '1' && parts[99] === '100';
    }
  },
  {
    id: 17,
    slug: 'remove_files_with_extension',
    title: 'remove_files_with_extension',
    description: 'Remove all files with the ".doc" extension.',
    learn: `Use wildcard matching with rm: rm *.doc`,
    example: 'rm *.doc',
    solutions: ['rm *.doc', 'find . -name "*.doc" -delete'],
    verify: (vfs) => vfs.listDir().every(f => !f.name.endsWith('.doc'))
  },
  {
    id: 18,
    slug: 'replace_text_in_files',
    title: 'replace_text_in_files',
    description: 'Replace the string "challenges are difficult" with an empty string in all .txt files.',
    learn: `The 'sed' stream editor performs text substitutions: sed -i "s/challenges are difficult//g" *.txt`,
    example: 'sed -i "s/challenges are difficult//g" *.txt',
    solutions: ['sed -i "s/challenges are difficult//g" *.txt'],
    verify: (vfs) => {
      const c1 = vfs.readFile('/home/cmdchallenge/intro.txt') || '';
      const c2 = vfs.readFile('/home/cmdchallenge/chapter1.txt') || '';
      return !c1.includes('challenges are difficult') && !c2.includes('challenges are difficult');
    }
  },
  {
    id: 19,
    slug: 'sum_all_numbers',
    title: 'sum_all_numbers',
    description: 'Sum all numbers in the file sum-me.txt.',
    learn: `Use 'awk' to accumulate column 1: awk '{sum+=$1} END{print sum}' sum-me.txt`,
    example: "awk '{sum+=$1} END{print sum}' sum-me.txt",
    solutions: ["awk '{sum+=$1} END{print sum}' sum-me.txt"],
    verify: (_vfs, stdout) => stdout.trim() === '970'
  },
  {
    id: 20,
    slug: 'just_the_file',
    title: 'just_the_file',
    description: 'Print only the filename without the path for /home/cmdchallenge/access.log.',
    learn: `The 'basename' command strips directory information from filenames: basename /home/cmdchallenge/access.log`,
    example: 'basename /home/cmdchallenge/access.log',
    solutions: ['basename /home/cmdchallenge/access.log'],
    verify: (_vfs, stdout) => stdout.trim() === 'access.log'
  }
];
