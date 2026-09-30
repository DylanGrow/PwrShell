import { VirtualFileSystem } from '../engine/vfs';
import { PSObject } from '../engine/psobject';

export interface CmdChallenge {
  id: number;
  slug: string;
  title: string;
  category: 'Basics' | 'Filesystem' | 'Text & Search' | 'Pipelines' | 'Objects & JSON' | 'Processes & Admin';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prompt: string;
  syntaxTip?: string;
  hints: string[];
  solutions: string[];
  verify: (vfs: VirtualFileSystem, output: any[], cmd: string) => boolean;
}

export const ChallengesCatalog: CmdChallenge[] = [
  {
    id: 1,
    slug: 'hello_world',
    title: 'Hello World',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Print 'hello world' to standard output.",
    syntaxTip: "Write-Output 'hello world' or 'hello world' or echo 'hello world'",
    hints: [
      "Use the Write-Output cmdlet: Write-Output 'hello world'",
      "Or simply quote the string: 'hello world'",
      "Or use the alias echo: echo 'hello world'"
    ],
    solutions: ["Write-Output 'hello world'", "'hello world'", 'echo "hello world"'],
    verify: (_vfs, output, _cmd) => {
      if (!output || output.length === 0) return false;
      const str = String(output[0]).toLowerCase().trim();
      return str === 'hello world';
    }
  },
  {
    id: 2,
    slug: 'current_working_directory',
    title: 'Current Working Directory',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Print the current working directory path.",
    syntaxTip: "Get-Location or pwd or gl",
    hints: [
      "Run: Get-Location",
      "Or use the Unix/PowerShell alias: pwd"
    ],
    solutions: ['Get-Location', 'pwd', 'gl', '$PWD.Path'],
    verify: (vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      if (lower.includes('get-location') || lower === 'pwd' || lower === 'gl' || lower.includes('$pwd')) {
        return true;
      }
      if (output && output.length > 0) {
        const item = output[0];
        const path = item instanceof PSObject ? item.getProperty('Path') : String(item);
        return String(path).toLowerCase().includes('student') || String(path).toLowerCase() === vfs.getCurrentPath().toLowerCase();
      }
      return false;
    }
  },
  {
    id: 3,
    slug: 'list_files',
    title: 'List Files',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "List all files and directories in the current working directory.",
    syntaxTip: "Get-ChildItem or dir or ls or gci",
    hints: [
      "Run: Get-ChildItem",
      "Or use alias: dir or ls"
    ],
    solutions: ['Get-ChildItem', 'dir', 'ls', 'gci'],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower === 'get-childitem' || lower === 'dir' || lower === 'ls' || lower === 'gci' || (output && output.length >= 4);
    }
  },
  {
    id: 4,
    slug: 'list_hidden_files',
    title: 'List Hidden Files',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "List all files including hidden files in the current directory.",
    syntaxTip: "Get-ChildItem -Force or ls -Force or dir -Force",
    hints: [
      "Pass the -Force switch to Get-ChildItem: Get-ChildItem -Force",
      "Or alias: ls -Force"
    ],
    solutions: ['Get-ChildItem -Force', 'ls -Force', 'dir -Force', 'gci -Force'],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-childitem') || lower.includes('ls') || lower.includes('dir') || lower.includes('gci')) && lower.includes('-force');
    }
  },
  {
    id: 5,
    slug: 'print_file_contents',
    title: 'Print File Contents',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Print the contents of the file 'welcome.txt'.",
    syntaxTip: "Get-Content welcome.txt or cat welcome.txt or gc welcome.txt",
    hints: [
      "Use Get-Content: Get-Content welcome.txt",
      "Or alias: gc welcome.txt or cat welcome.txt"
    ],
    solutions: ['Get-Content welcome.txt', 'gc welcome.txt', 'cat welcome.txt', 'type welcome.txt'],
    verify: (_vfs, output, _cmd) => {
      if (!output || output.length === 0) return false;
      const combined = output.join(' ').toLowerCase();
      return combined.includes('welcome') && combined.includes('powershell');
    }
  },
  {
    id: 6,
    slug: 'first_5_lines',
    title: 'First 5 Lines',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Print only the first 5 lines of 'access.log'.",
    syntaxTip: "Get-Content access.log -TotalCount 5 or gc access.log | select -First 5",
    hints: [
      "Use the -TotalCount parameter: Get-Content access.log -TotalCount 5",
      "Or pipe to Select-Object: gc access.log | select -First 5"
    ],
    solutions: [
      'Get-Content access.log -TotalCount 5',
      'gc access.log | select -First 5',
      'cat access.log -TotalCount 5'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const has5 = lower.includes('5');
      return has5 && (output.length === 5 || lower.includes('totalcount 5') || lower.includes('-first 5'));
    }
  },
  {
    id: 7,
    slug: 'last_3_lines',
    title: 'Last 3 Lines',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Print the last 3 lines of 'access.log'.",
    syntaxTip: "Get-Content access.log -Tail 3 or gc access.log | select -Last 3",
    hints: [
      "Use the -Tail parameter: Get-Content access.log -Tail 3",
      "Or pipe into select -Last 3: gc access.log | select -Last 3"
    ],
    solutions: [
      'Get-Content access.log -Tail 3',
      'gc access.log | select -Last 3',
      'cat access.log -Tail 3'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const has3 = lower.includes('3');
      return has3 && (output.length === 3 || lower.includes('-tail 3') || lower.includes('-last 3'));
    }
  },
  {
    id: 8,
    slug: 'count_lines',
    title: 'Count Lines in File',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Count the total number of lines in 'access.log'.",
    syntaxTip: "Get-Content access.log | Measure-Object -Line or (Get-Content access.log).Count",
    hints: [
      "Get-Content access.log | Measure-Object -Line",
      "Or array count: (Get-Content access.log).Count"
    ],
    solutions: [
      'Get-Content access.log | Measure-Object -Line',
      '(Get-Content access.log).Count',
      'gc access.log | measure -Line'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      if (lower.includes('measure') && lower.includes('line')) return true;
      if (lower.includes('.count')) return true;
      if (output && output.length > 0) {
        const item = output[0];
        if (item instanceof PSObject && (item.getProperty('Lines') === 10 || item.getProperty('Count') === 10)) return true;
        if (item === 10 || item === '10') return true;
      }
      return false;
    }
  },
  {
    id: 9,
    slug: 'search_404_errors',
    title: 'Search Text with Select-String',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Find all lines in 'access.log' containing HTTP status code '404'.",
    syntaxTip: "Select-String -Path access.log -Pattern '404' or gc access.log | sls '404'",
    hints: [
      "Select-String -Path access.log -Pattern '404'",
      "Or pipe into sls: Get-Content access.log | sls '404'"
    ],
    solutions: [
      "Select-String -Path access.log -Pattern '404'",
      "Get-Content access.log | sls '404'",
      "gc access.log | Select-String '404'"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('select-string') || lower.includes('sls') || lower.includes('grep')) && lower.includes('404') && (output.length >= 2);
    }
  },
  {
    id: 10,
    slug: 'filter_processes_cpu',
    title: 'Filter Processes by CPU',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "List all running processes with CPU usage greater than 50.",
    syntaxTip: "Get-Process | Where-Object CPU -gt 50 or ps | ? CPU -gt 50",
    hints: [
      "Pipe Get-Process to Where-Object: Get-Process | Where-Object CPU -gt 50",
      "Short alias: ps | ? CPU -gt 50"
    ],
    solutions: [
      'Get-Process | Where-Object CPU -gt 50',
      'ps | ? CPU -gt 50',
      'gps | ? CPU -gt 50'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const hasWhere = lower.includes('where-object') || lower.includes('where') || lower.includes('?');
      return hasWhere && lower.includes('cpu') && lower.includes('50') && (output.length >= 2);
    }
  },
  {
    id: 11,
    slug: 'sort_processes_memory',
    title: 'Sort Processes by Memory',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "Sort all running processes by WorkingSet64 memory usage in descending order.",
    syntaxTip: "Get-Process | Sort-Object WorkingSet64 -Descending",
    hints: [
      "Get-Process | Sort-Object WorkingSet64 -Descending",
      "Or alias: ps | sort WorkingSet64 -Descending"
    ],
    solutions: [
      'Get-Process | Sort-Object WorkingSet64 -Descending',
      'ps | sort WorkingSet64 -Descending',
      'Get-Process | sort WorkingSet64 -Desc'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const hasSort = lower.includes('sort-object') || lower.includes('sort');
      return hasSort && lower.includes('workingset') && lower.includes('desc') && (output.length >= 4);
    }
  },
  {
    id: 12,
    slug: 'top_3_memory_consumers',
    title: 'Top 3 Memory Consumers',
    category: 'Pipelines',
    difficulty: 'Hard',
    prompt: "Get the top 3 processes consuming the most memory.",
    syntaxTip: "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 3",
    hints: [
      "Chain Sort-Object and Select-Object: Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 3",
      "Short form: ps | sort WorkingSet64 -Desc | select -First 3"
    ],
    solutions: [
      'Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 3',
      'ps | sort WorkingSet64 -Desc | select -First 3'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('sort') && lower.includes('select') && (lower.includes('-first 3') || lower.includes('-first3')) && (output.length === 3);
    }
  },
  {
    id: 13,
    slug: 'select_process_columns',
    title: 'Select Process Columns',
    category: 'Pipelines',
    difficulty: 'Easy',
    prompt: "Select only the 'ProcessName' and 'Id' properties of all processes.",
    syntaxTip: "Get-Process | Select-Object ProcessName, Id",
    hints: [
      "Get-Process | Select-Object ProcessName, Id",
      "Alias: ps | select ProcessName, Id"
    ],
    solutions: [
      'Get-Process | Select-Object ProcessName, Id',
      'ps | select ProcessName, Id',
      'gps | select ProcessName, Id'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('select') && lower.includes('processname') && lower.includes('id') && (output.length >= 4);
    }
  },
  {
    id: 14,
    slug: 'import_csv_engineering',
    title: 'Import CSV & Filter by Department',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Import 'employees.csv' and find all employees working in the 'Engineering' department.",
    syntaxTip: "Import-Csv employees.csv | Where-Object Department -eq 'Engineering'",
    hints: [
      "Import-Csv employees.csv | Where-Object Department -eq 'Engineering'",
      "Alias: ipcsv employees.csv | ? Department -eq 'Engineering'"
    ],
    solutions: [
      "Import-Csv employees.csv | Where-Object Department -eq 'Engineering'",
      "ipcsv employees.csv | ? Department -eq 'Engineering'"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && lower.includes('engineering') && (output.length === 4);
    }
  },
  {
    id: 15,
    slug: 'sort_employees_salary',
    title: 'Sort Employees by Salary',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Import 'employees.csv' and sort all employees by Salary in descending order.",
    syntaxTip: "Import-Csv employees.csv | Sort-Object Salary -Descending",
    hints: [
      "Import-Csv employees.csv | Sort-Object Salary -Descending",
      "Alias: ipcsv employees.csv | sort Salary -Descending"
    ],
    solutions: [
      'Import-Csv employees.csv | Sort-Object Salary -Descending',
      'ipcsv employees.csv | sort Salary -Descending'
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && lower.includes('salary') && lower.includes('desc');
    }
  },
  {
    id: 16,
    slug: 'calculate_average_salary',
    title: 'Calculate Average Salary',
    category: 'Objects & JSON',
    difficulty: 'Hard',
    prompt: "Calculate the average salary of all employees in 'employees.csv' using Measure-Object.",
    syntaxTip: "Import-Csv employees.csv | Measure-Object -Property Salary -Average",
    hints: [
      "Import-Csv employees.csv | Measure-Object -Property Salary -Average",
      "Alias: ipcsv employees.csv | measure Salary -Average"
    ],
    solutions: [
      'Import-Csv employees.csv | Measure-Object -Property Salary -Average',
      'ipcsv employees.csv | measure Salary -Average'
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && lower.includes('measure') && lower.includes('salary') && lower.includes('average');
    }
  },
  {
    id: 17,
    slug: 'extract_unique_departments',
    title: 'Unique Department Names',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Extract the unique list of department names from 'employees.csv'.",
    syntaxTip: "Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique",
    hints: [
      "Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique",
      "Or: (Import-Csv employees.csv).Department | select -Unique"
    ],
    solutions: [
      'Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique',
      'Import-Csv employees.csv | select Department -Unique'
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && lower.includes('department') && lower.includes('unique');
    }
  },
  {
    id: 18,
    slug: 'group_employees_by_dept',
    title: 'Group Employees by Department',
    category: 'Objects & JSON',
    difficulty: 'Hard',
    prompt: "Group all employees in 'employees.csv' by Department.",
    syntaxTip: "Import-Csv employees.csv | Group-Object Department",
    hints: [
      "Import-Csv employees.csv | Group-Object Department",
      "Alias: ipcsv employees.csv | group Department"
    ],
    solutions: [
      'Import-Csv employees.csv | Group-Object Department',
      'ipcsv employees.csv | group Department'
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && (lower.includes('group-object') || lower.includes('group')) && lower.includes('department');
    }
  },
  {
    id: 19,
    slug: 'filter_stopped_services',
    title: 'Find Stopped Services',
    category: 'Processes & Admin',
    difficulty: 'Easy',
    prompt: "List all services with Status equal to 'Stopped'.",
    syntaxTip: "Get-Service | Where-Object Status -eq 'Stopped' or gsv | ? Status -eq 'Stopped'",
    hints: [
      "Get-Service | Where-Object Status -eq 'Stopped'",
      "Or parameter form: Get-Service -Status 'Stopped'"
    ],
    solutions: [
      "Get-Service | Where-Object Status -eq 'Stopped'",
      "gsv | ? Status -eq 'Stopped'",
      "Get-Service -Status 'Stopped'"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-service') || lower.includes('gsv')) && lower.includes('stopped') && (output.length >= 2);
    }
  },
  {
    id: 20,
    slug: 'store_in_variable',
    title: 'Assign Pipeline to Variable',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Store the list of stopped services into a variable named '$stopped'.",
    syntaxTip: "$stopped = Get-Service | Where-Object Status -eq 'Stopped'",
    hints: [
      "$stopped = Get-Service | Where-Object Status -eq 'Stopped'",
      "Or $stopped = Get-Service"
    ],
    solutions: [
      "$stopped = Get-Service | Where-Object Status -eq 'Stopped'",
      "$stopped = Get-Service"
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.startsWith('$stopped') && lower.includes('=') && (lower.includes('get-service') || lower.includes('gsv'));
    }
  },
  {
    id: 21,
    slug: 'parse_json_port',
    title: 'Parse JSON Property',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Parse 'config.json' and extract the 'server.port' value.",
    syntaxTip: "(Get-Content config.json | ConvertFrom-Json).server.port",
    hints: [
      "(Get-Content config.json | ConvertFrom-Json).server.port",
      "Or: Get-Content config.json | ConvertFrom-Json"
    ],
    solutions: [
      'Get-Content config.json | ConvertFrom-Json',
      '(Get-Content config.json | ConvertFrom-Json).server.port'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('convertfrom-json') && (output.includes(8080) || output.includes('8080') || output.length > 0);
    }
  },
  {
    id: 22,
    slug: 'uppercase_names',
    title: 'Transform Strings with ForEach-Object',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Read 'names.txt' and convert all names to uppercase using ForEach-Object.",
    syntaxTip: "Get-Content names.txt | ForEach-Object { $_.ToUpper() }",
    hints: [
      "Get-Content names.txt | ForEach-Object { $_.ToUpper() }",
      "Alias: gc names.txt | % { $_.ToUpper() }"
    ],
    solutions: [
      'Get-Content names.txt | ForEach-Object { $_.ToUpper() }',
      'gc names.txt | % { $_.ToUpper() }'
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('foreach-object') || lower.includes('foreach') || lower.includes('%')) && lower.includes('toupper');
    }
  },
  {
    id: 23,
    slug: 'copy_file_backup',
    title: 'Copy File to Backup',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Copy the file 'config.json' into the 'backup' directory.",
    syntaxTip: "Copy-Item config.json backup\\ or cp config.json backup",
    hints: [
      "Copy-Item config.json backup",
      "Alias: cp config.json backup\\"
    ],
    solutions: [
      'Copy-Item config.json backup',
      'cp config.json backup'
    ],
    verify: (vfs, _output, _cmd) => {
      return vfs.fileExists('C:\\Users\\student\\backup\\config.json');
    }
  },
  {
    id: 24,
    slug: 'remove_tmp_files',
    title: 'Remove Temporary Files',
    category: 'Filesystem',
    difficulty: 'Medium',
    prompt: "Delete all files ending with '.tmp' in the 'temp' folder.",
    syntaxTip: "Remove-Item temp\\*.tmp or rm temp\\*.tmp",
    hints: [
      "Remove-Item temp\\*.tmp",
      "Alias: rm temp\\*.tmp"
    ],
    solutions: [
      'Remove-Item temp\\*.tmp',
      'rm temp\\*.tmp',
      'del temp\\*.tmp'
    ],
    verify: (vfs, _output, _cmd) => {
      return !vfs.fileExists('C:\\Users\\student\\temp\\cache_01.tmp') && !vfs.fileExists('C:\\Users\\student\\temp\\cache_02.tmp');
    }
  },
  {
    id: 25,
    slug: 'get_date_formatted',
    title: 'Format Date String',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Output the current date in 'yyyy-MM-dd' format.",
    syntaxTip: "Get-Date -Format 'yyyy-MM-dd'",
    hints: [
      "Get-Date -Format 'yyyy-MM-dd'",
      "Get-Date -Format yyyy-MM-dd"
    ],
    solutions: [
      "Get-Date -Format 'yyyy-MM-dd'",
      'Get-Date -Format "yyyy-MM-dd"'
    ],
    verify: (_vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('get-date') && lower.includes('yyyy-mm-dd');
    }
  },
  {
    id: 26,
    slug: 'test_path_exists',
    title: 'Test Path Existence',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Check whether the directory 'backup' exists using Test-Path.",
    syntaxTip: "Test-Path backup or Test-Path .\\backup",
    hints: [
      "Test-Path backup",
      "Alias: tp backup"
    ],
    solutions: [
      'Test-Path backup',
      'Test-Path .\\backup',
      'tp backup'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('test-path') || lower.includes('tp')) && lower.includes('backup') && (output.includes(true) || output.includes('True'));
    }
  },
  {
    id: 27,
    slug: 'split_path_leaf',
    title: 'Extract File Name from Path',
    category: 'Filesystem',
    difficulty: 'Medium',
    prompt: "Extract just the file name (leaf) from 'C:\\Users\\student\\welcome.txt' using Split-Path.",
    syntaxTip: "Split-Path 'C:\\Users\\student\\welcome.txt' -Leaf",
    hints: [
      "Split-Path 'C:\\Users\\student\\welcome.txt' -Leaf"
    ],
    solutions: [
      "Split-Path 'C:\\Users\\student\\welcome.txt' -Leaf",
      'Split-Path C:\\Users\\student\\welcome.txt -Leaf'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('split-path') && lower.includes('-leaf') && output.some(o => String(o).toLowerCase().includes('welcome.txt'));
    }
  },
  {
    id: 28,
    slug: 'join_paths',
    title: 'Combine Paths with Join-Path',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Join 'C:\\Users' and 'student\\projects' into a single valid path.",
    syntaxTip: "Join-Path 'C:\\Users' 'student\\projects'",
    hints: [
      "Join-Path 'C:\\Users' 'student\\projects'"
    ],
    solutions: [
      "Join-Path 'C:\\Users' 'student\\projects'",
      'Join-Path C:\\Users student\\projects'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('join-path') && output.some(o => String(o).toLowerCase().includes('c:\\users\\student\\projects'));
    }
  },
  {
    id: 29,
    slug: 'number_range_sum',
    title: 'Sum a Range of Numbers',
    category: 'Pipelines',
    difficulty: 'Medium',
    prompt: "Generate a sequence of numbers from 1 to 100 and calculate the sum using Measure-Object.",
    syntaxTip: "1..100 | Measure-Object -Sum",
    hints: [
      "Use range operator (..): 1..100 | Measure-Object -Sum",
      "Alias: 1..100 | measure -Sum"
    ],
    solutions: [
      '1..100 | Measure-Object -Sum',
      '1..100 | measure -Sum'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('1..100') && (lower.includes('measure') || lower.includes('sum')) && (output.some(o => (o instanceof PSObject && o.getProperty('Sum') === 5050) || o === 5050 || String(o).includes('5050')));
    }
  },
  {
    id: 30,
    slug: 'filter_senior_employees',
    title: 'Filter Senior Employees',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Import 'employees.csv' and find all employees with 5 or more YearsExperience.",
    syntaxTip: "Import-Csv employees.csv | Where-Object YearsExperience -ge 5",
    hints: [
      "Import-Csv employees.csv | Where-Object YearsExperience -ge 5",
      "Alias: ipcsv employees.csv | ? YearsExperience -ge 5"
    ],
    solutions: [
      'Import-Csv employees.csv | Where-Object YearsExperience -ge 5',
      'ipcsv employees.csv | ? YearsExperience -ge 5'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && lower.includes('yearsexperience') && (lower.includes('-ge 5') || lower.includes('-gt 4')) && output.length >= 4;
    }
  },
  {
    id: 31,
    slug: 'top_paid_employee',
    title: 'Find Highest Paid Employee',
    category: 'Pipelines',
    difficulty: 'Hard',
    prompt: "Find the single highest paid employee from 'employees.csv'.",
    syntaxTip: "Import-Csv employees.csv | Sort-Object Salary -Descending | Select-Object -First 1",
    hints: [
      "Chain Sort-Object and Select-Object: Import-Csv employees.csv | Sort-Object Salary -Descending | Select-Object -First 1",
      "Alias: ipcsv employees.csv | sort Salary -Desc | select -First 1"
    ],
    solutions: [
      'Import-Csv employees.csv | Sort-Object Salary -Descending | Select-Object -First 1',
      'ipcsv employees.csv | sort Salary -Desc | select -First 1'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('import-csv') || lower.includes('ipcsv')) && lower.includes('sort') && lower.includes('salary') && lower.includes('-first 1') && output.length === 1;
    }
  },
  {
    id: 32,
    slug: 'group_files_by_mode',
    title: 'Group Items by Mode',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Group all items in the current directory by their 'Mode' property.",
    syntaxTip: "Get-ChildItem | Group-Object Mode",
    hints: [
      "Get-ChildItem | Group-Object Mode",
      "Alias: dir | group Mode"
    ],
    solutions: [
      'Get-ChildItem | Group-Object Mode',
      'dir | group Mode',
      'ls | group Mode'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-childitem') || lower.includes('dir') || lower.includes('ls')) && (lower.includes('group-object') || lower.includes('group')) && lower.includes('mode') && output.length >= 2;
    }
  },
  {
    id: 33,
    slug: 'create_sample_script',
    title: 'Create and Write Script File',
    category: 'Filesystem',
    difficulty: 'Medium',
    prompt: "Create a new file 'hello.ps1' with the content 'Write-Host \"Hello PowerShell\"'.",
    syntaxTip: "Set-Content -Path hello.ps1 -Value 'Write-Host \"Hello PowerShell\"'",
    hints: [
      "Set-Content hello.ps1 'Write-Host \"Hello PowerShell\"'",
      "Or New-Item: New-Item hello.ps1 -Value 'Write-Host \"Hello PowerShell\"'"
    ],
    solutions: [
      "Set-Content hello.ps1 'Write-Host \"Hello PowerShell\"'",
      "New-Item hello.ps1 -Value 'Write-Host \"Hello PowerShell\"'",
      "sc hello.ps1 'Write-Host \"Hello PowerShell\"'"
    ],
    verify: (vfs, _output, _cmd) => {
      return vfs.fileExists('C:\\Users\\student\\hello.ps1');
    }
  },
  {
    id: 34,
    slug: 'count_running_services',
    title: 'Count Running Services',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "Count how many services currently have the Status 'Running'.",
    syntaxTip: "(Get-Service | Where-Object Status -eq 'Running').Count or Get-Service -Status 'Running' | Measure-Object",
    hints: [
      "Get-Service | Where-Object Status -eq 'Running' | Measure-Object",
      "Or array count: (Get-Service | ? Status -eq 'Running').Count"
    ],
    solutions: [
      "Get-Service | Where-Object Status -eq 'Running' | Measure-Object",
      "Get-Service -Status 'Running' | Measure-Object",
      "(Get-Service | ? Status -eq 'Running').Count"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-service') || lower.includes('gsv')) && lower.includes('running') && (lower.includes('measure') || lower.includes('.count') || output.some(o => (o instanceof PSObject && o.getProperty('Count') === 5) || o === 5));
    }
  },
  {
    id: 35,
    slug: 'export_engineering_list',
    title: 'Export Filtered Data to CSV',
    category: 'Objects & JSON',
    difficulty: 'Hard',
    prompt: "Export all 'Engineering' employees from 'employees.csv' into 'engineers.csv'.",
    syntaxTip: "Import-Csv employees.csv | Where-Object Department -eq 'Engineering' | Export-Csv engineers.csv",
    hints: [
      "Import-Csv employees.csv | Where-Object Department -eq 'Engineering' | Export-Csv engineers.csv",
      "Alias: ipcsv employees.csv | ? Department -eq 'Engineering' | epcsv engineers.csv"
    ],
    solutions: [
      "Import-Csv employees.csv | Where-Object Department -eq 'Engineering' | Export-Csv engineers.csv",
      "ipcsv employees.csv | ? Department -eq 'Engineering' | epcsv engineers.csv"
    ],
    verify: (vfs, _output, _cmd) => {
      return vfs.fileExists('C:\\Users\\student\\engineers.csv') || vfs.fileExists('C:\\Users\\Dylan\\engineers.csv');
    }
  },
  {
    id: 36,
    slug: 'get_system_date',
    title: 'Display System Date & Time',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Display the current system date and time using Get-Date.",
    syntaxTip: "Get-Date",
    hints: [
      "Type: Get-Date",
      "PowerShell returns a real DateTime object with Year, Month, Day, and Time."
    ],
    solutions: ['Get-Date'],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('get-date') && output.length > 0;
    }
  },
  {
    id: 37,
    slug: 'format_custom_date',
    title: 'Format Date String',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Format the current date in 'yyyy-MM-dd' format using Get-Date.",
    syntaxTip: "Get-Date -Format 'yyyy-MM-dd'",
    hints: [
      "Use the -Format parameter: Get-Date -Format 'yyyy-MM-dd'"
    ],
    solutions: [
      "Get-Date -Format 'yyyy-MM-dd'",
      'Get-Date -Format "yyyy-MM-dd"'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('get-date') && output.some(o => /^\d{4}-\d{2}-\d{2}$/.test(String(o).trim()));
    }
  },
  {
    id: 38,
    slug: 'generate_random_number',
    title: 'Generate Random Integer',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Generate a random integer between 1 and 100 using Get-Random.",
    syntaxTip: "Get-Random -Minimum 1 -Maximum 101",
    hints: [
      "Get-Random -Minimum 1 -Maximum 101",
      "In PowerShell, Maximum is exclusive, so use 101 to include 100."
    ],
    solutions: [
      'Get-Random -Minimum 1 -Maximum 101',
      'Get-Random -Minimum 1 -Maximum 100',
      'Get-Random -Maximum 100'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('get-random') && output.length > 0 && typeof output[0] === 'number';
    }
  },
  {
    id: 39,
    slug: 'calculate_total_salary_sum',
    title: 'Calculate Total Salary Sum',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Calculate the total combined salary sum of all employees in 'employees.csv'.",
    syntaxTip: "Import-Csv employees.csv | Measure-Object -Property Salary -Sum",
    hints: [
      "Import-Csv employees.csv | Measure-Object -Property Salary -Sum",
      "Alias: ipcsv employees.csv | measure Salary -Sum"
    ],
    solutions: [
      'Import-Csv employees.csv | Measure-Object -Property Salary -Sum',
      'ipcsv employees.csv | measure Salary -Sum',
      'Import-Csv employees.csv | measure Salary -Sum'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.some(o => (o instanceof PSObject && (Number(o.getProperty('Sum')) === 685000)) || o === 685000);
    }
  },
  {
    id: 40,
    slug: 'select_unique_departments',
    title: 'Unique Department List',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Extract a unique list of department names from 'employees.csv'.",
    syntaxTip: "Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique",
    hints: [
      "Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique",
      "Or using property: Import-Csv employees.csv | Select-Object Department -Unique"
    ],
    solutions: [
      'Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique',
      'Import-Csv employees.csv | Select-Object Department -Unique',
      'ipcsv employees.csv | select -ExpandProperty Department -Unique'
    ],
    verify: (_vfs, output, _cmd) => {
      const depts = output.map(o => (o instanceof PSObject ? o.getProperty('Department') : o)).filter(Boolean);
      return depts.length >= 4 && depts.includes('Engineering') && depts.includes('Marketing');
    }
  },
  {
    id: 41,
    slug: 'filter_high_memory_processes',
    title: 'Filter High Memory Processes',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "Find all processes with WorkingSet64 memory greater than 100,000,000 bytes (100MB).",
    syntaxTip: "Get-Process | Where-Object WorkingSet64 -gt 100000000",
    hints: [
      "Get-Process | Where-Object WorkingSet64 -gt 100000000",
      "Alias: ps | ? WorkingSet64 -gt 100000000"
    ],
    solutions: [
      'Get-Process | Where-Object WorkingSet64 -gt 100000000',
      'ps | ? WorkingSet64 -gt 100000000',
      'Get-Process | ? WorkingSet64 -gt 100MB'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.length >= 3 && output.every(p => p instanceof PSObject && Number(p.getProperty('WorkingSet64')) > 100000000);
    }
  },
  {
    id: 42,
    slug: 'measure_log_file_lines',
    title: 'Count Lines with Measure-Object',
    category: 'Text & Search',
    difficulty: 'Easy',
    prompt: "Count the total number of lines in 'access.log' using Measure-Object.",
    syntaxTip: "Get-Content access.log | Measure-Object -Line",
    hints: [
      "Get-Content access.log | Measure-Object -Line",
      "Alias: gc access.log | measure -Line"
    ],
    solutions: [
      'Get-Content access.log | Measure-Object -Line',
      'gc access.log | measure -Line',
      'Get-Content access.log | measure -Line'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.some(o => (o instanceof PSObject && (o.getProperty('Lines') === 10 || o.getProperty('Count') === 10)) || o === 10);
    }
  },
  {
    id: 43,
    slug: 'regex_search_ip_addresses',
    title: 'Search Subnet IP Addresses',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Search 'access.log' for all log entries from the 192.168.* network using Select-String.",
    syntaxTip: "Select-String -Path access.log -Pattern '192\\.168\\.'",
    hints: [
      "Select-String -Path access.log -Pattern '192\\.168\\.'",
      "Alias: sls access.log -Pattern '192\\.168\\.'"
    ],
    solutions: [
      "Select-String -Path access.log -Pattern '192\\.168\\.'",
      "Select-String -Path access.log -Pattern '192.168.'",
      "sls access.log -Pattern '192\\.168\\.'"
    ],
    verify: (_vfs, output, _cmd) => {
      return output.length >= 4 && output.every(o => {
        const line = o instanceof PSObject ? String(o.getProperty('Line')) : String(o);
        return line.includes('192.168.');
      });
    }
  },
  {
    id: 44,
    slug: 'top_cpu_processes',
    title: 'Top 3 CPU Processes',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "List the top 3 processes consuming the most CPU in descending order.",
    syntaxTip: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 3",
    hints: [
      "Get-Process | Sort-Object CPU -Descending | Select-Object -First 3",
      "Alias: ps | sort CPU -Descending | select -First 3"
    ],
    solutions: [
      'Get-Process | Sort-Object CPU -Descending | Select-Object -First 3',
      'ps | sort CPU -Descending | select -First 3'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.length === 3 && output[0] instanceof PSObject && Number(output[0].getProperty('CPU')) >= Number(output[1].getProperty('CPU'));
    }
  },
  {
    id: 45,
    slug: 'dylan_welcome_greeting',
    title: 'Personalized Greeting for Dylan',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Print the personalized greeting for Dylan: 'Hello Dylan Grow, welcome to PowerShell!'.",
    syntaxTip: "Write-Output 'Hello Dylan Grow, welcome to PowerShell!'",
    hints: [
      "Write-Output 'Hello Dylan Grow, welcome to PowerShell!'",
      "Or simply quote the string: 'Hello Dylan Grow, welcome to PowerShell!'"
    ],
    solutions: [
      "'Hello Dylan Grow, welcome to PowerShell!'",
      "Write-Output 'Hello Dylan Grow, welcome to PowerShell!'",
      'echo "Hello Dylan Grow, welcome to PowerShell!"'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.some(o => String(o).toLowerCase().trim().includes('dylan grow'));
    }
  },
  {
    id: 46,
    slug: 'tee_pipeline_output',
    title: 'Split Stream with Tee-Object',
    category: 'Pipelines',
    difficulty: 'Medium',
    prompt: "Save process info to 'procs.txt' while still displaying it using Tee-Object.",
    syntaxTip: "Get-Process | Tee-Object procs.txt",
    hints: [
      "Tee-Object writes to file and sends items down the pipeline: Get-Process | Tee-Object procs.txt",
      "Alias: ps | tee procs.txt"
    ],
    solutions: [
      'Get-Process | Tee-Object procs.txt',
      'ps | tee procs.txt',
      'Get-Process | Tee-Object -FilePath procs.txt'
    ],
    verify: (vfs, _output, _cmd) => {
      return vfs.fileExists('C:\\Users\\Dylan\\procs.txt') || vfs.fileExists('C:\\Users\\student\\procs.txt');
    }
  },
  {
    id: 47,
    slug: 'out_file_redirect',
    title: 'Write Output with Out-File',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Output the list of services into 'services_list.txt' using Out-File.",
    syntaxTip: "Get-Service | Out-File services_list.txt",
    hints: [
      "Get-Service | Out-File services_list.txt",
      "Alias: gsv | Out-File services_list.txt"
    ],
    solutions: [
      'Get-Service | Out-File services_list.txt',
      'gsv | Out-File services_list.txt',
      'Get-Service | Out-File -FilePath services_list.txt'
    ],
    verify: (vfs, _output, _cmd) => {
      return vfs.fileExists('C:\\Users\\Dylan\\services_list.txt') || vfs.fileExists('C:\\Users\\student\\services_list.txt');
    }
  },
  {
    id: 48,
    slug: 'compare_number_arrays',
    title: 'Compare Arrays with Compare-Object',
    category: 'Pipelines',
    difficulty: 'Medium',
    prompt: "Compare two collections (1,2,3) and (2,3,4) using Compare-Object.",
    syntaxTip: "Compare-Object (1..3) (2..4)",
    hints: [
      "Compare-Object (1..3) (2..4)",
      "Alias: diff (1..3) (2..4)"
    ],
    solutions: [
      'Compare-Object (1..3) (2..4)',
      'diff (1..3) (2..4)',
      'Compare-Object -ReferenceObject (1,2,3) -DifferenceObject (2,3,4)'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.length >= 2 && output.some(o => o instanceof PSObject && (o.getProperty('SideIndicator') === '<=' || o.getProperty('SideIndicator') === '=>'));
    }
  },
  {
    id: 49,
    slug: 'inspect_ps_version',
    title: 'Query PowerShell Version Variable',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Query the automatic variable $PSVersionTable to inspect the PowerShell version.",
    syntaxTip: "$PSVersionTable.PSVersion or $PSVersionTable",
    hints: [
      "Inspect the variable: $PSVersionTable",
      "Or extract property: $PSVersionTable.PSVersion"
    ],
    solutions: [
      '$PSVersionTable.PSVersion',
      '$PSVersionTable',
      '($PSVersionTable).PSVersion'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('$psversiontable') && (output.some(o => String(o).includes('7.4') || (o instanceof PSObject && o.getProperty('PSVersion') === '7.4.2')));
    }
  },
  {
    id: 50,
    slug: 'get_command_noun_filter',
    title: 'Find Cmdlets with Get-Command',
    category: 'Basics',
    difficulty: 'Medium',
    prompt: "Find all available cmdlets with the Noun 'Process' using Get-Command.",
    syntaxTip: "Get-Command -Noun Process",
    hints: [
      "Use the -Noun parameter: Get-Command -Noun Process",
      "Alias: gcm -Noun Process"
    ],
    solutions: [
      'Get-Command -Noun Process',
      'gcm -Noun Process'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-command') || lower.includes('gcm')) && lower.includes('process') && output.some(o => o instanceof PSObject && o.getProperty('Name') === 'Get-Process');
    }
  },
  {
    id: 51,
    slug: 'filter_csv_regex_pattern',
    title: 'Regex Matching with Where-Object',
    category: 'Objects & JSON',
    difficulty: 'Hard',
    prompt: "Find all employees in 'employees.csv' whose Name starts with 'A' or 'B' using Where-Object -match.",
    syntaxTip: "Import-Csv employees.csv | Where-Object Name -match '^[AB]'",
    hints: [
      "Import-Csv employees.csv | Where-Object Name -match '^[AB]'",
      "Alias: ipcsv employees.csv | ? Name -match '^[AB]'"
    ],
    solutions: [
      "Import-Csv employees.csv | Where-Object Name -match '^[AB]'",
      "ipcsv employees.csv | ? Name -match '^[AB]'"
    ],
    verify: (_vfs, output, _cmd) => {
      return output.length >= 2 && output.every(o => o instanceof PSObject && /^[AB]/i.test(String(o.getProperty('Name'))));
    }
  },
  {
    id: 52,
    slug: 'sort_and_select_last',
    title: 'Find Lowest Value with Sort-Object',
    category: 'Pipelines',
    difficulty: 'Easy',
    prompt: "Find the employee with the lowest salary in 'employees.csv' using Sort-Object and Select-Object -First 1.",
    syntaxTip: "Import-Csv employees.csv | Sort-Object Salary | Select-Object -First 1",
    hints: [
      "Import-Csv employees.csv | Sort-Object Salary | Select-Object -First 1",
      "Alias: ipcsv employees.csv | sort Salary | select -First 1"
    ],
    solutions: [
      'Import-Csv employees.csv | Sort-Object Salary | Select-Object -First 1',
      'ipcsv employees.csv | sort Salary | select -First 1'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.length === 1 && output.some(o => o instanceof PSObject && (o.getProperty('Name') === 'Fiona Gallagher' || String(o.getProperty('Salary')) === '55000'));
    }
  },
  {
    id: 53,
    slug: 'group_services_by_status',
    title: 'Group Services by Status',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "Group all system services by their Status property using Group-Object.",
    syntaxTip: "Get-Service | Group-Object Status",
    hints: [
      "Get-Service | Group-Object Status",
      "Alias: gsv | group Status"
    ],
    solutions: [
      'Get-Service | Group-Object Status',
      'gsv | group Status'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-service') || lower.includes('gsv')) && (lower.includes('group-object') || lower.includes('group')) && output.length >= 2;
    }
  },
  {
    id: 54,
    slug: 'test_path_wildcard',
    title: 'Wildcard Path Verification',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Test if any '.log' files exist in the current directory using Test-Path.",
    syntaxTip: "Test-Path *.log",
    hints: [
      "Run: Test-Path *.log",
      "Or check access.log: Test-Path access.log"
    ],
    solutions: [
      'Test-Path *.log',
      'Test-Path access.log'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.some(o => o === true || String(o).toLowerCase() === 'true');
    }
  },
  {
    id: 55,
    slug: 'dylan_mastery_certification',
    title: 'Dylan Grow Mastery Certification',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Generate Dylan's official certificate one-liner: 'Dylan Grow is a certified PowerShell Master!'.",
    syntaxTip: "Write-Output 'Dylan Grow is a certified PowerShell Master!'",
    hints: [
      "'Dylan Grow is a certified PowerShell Master!'",
      "Write-Output 'Dylan Grow is a certified PowerShell Master!'"
    ],
    solutions: [
      "'Dylan Grow is a certified PowerShell Master!'",
      "Write-Output 'Dylan Grow is a certified PowerShell Master!'",
      'echo "Dylan Grow is a certified PowerShell Master!"'
    ],
    verify: (_vfs, output, _cmd) => {
      return output.some(o => String(o).toLowerCase().includes('dylan grow') && String(o).toLowerCase().includes('master'));
    }
  },
  {
    id: 56,
    slug: 'rename_file',
    title: 'Rename a File',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Rename 'notes.txt' to 'notes_backup.txt' using Rename-Item.",
    syntaxTip: "Rename-Item notes.txt notes_backup.txt",
    hints: [
      "Run: Rename-Item notes.txt notes_backup.txt",
      "Aliases: ren notes.txt notes_backup.txt",
      "Use -Path and -NewName: Rename-Item -Path notes.txt -NewName notes_backup.txt"
    ],
    solutions: [
      'Rename-Item notes.txt notes_backup.txt',
      'Rename-Item -Path notes.txt -NewName notes_backup.txt',
      'ren notes.txt notes_backup.txt'
    ],
    verify: (vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      if (!(lower.includes('rename-item') || lower.startsWith('ren '))) return false;
      return vfs.fileExists('notes_backup.txt') && !vfs.fileExists('notes.txt');
    }
  },
  {
    id: 57,
    slug: 'move_file_to_backup',
    title: 'Move File to Backup',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Move 'config.json' into the 'backup' folder using Move-Item.",
    syntaxTip: "Move-Item config.json backup/",
    hints: [
      "Run: Move-Item config.json backup/",
      "Or: mv config.json backup/",
      "Or specify full: Move-Item -Path config.json -Destination backup/"
    ],
    solutions: [
      'Move-Item config.json backup/',
      'Move-Item -Path config.json -Destination backup/',
      'mv config.json backup/'
    ],
    verify: (vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      if (!(lower.includes('move-item') || lower.startsWith('mv '))) return false;
      return vfs.fileExists('backup\\config.json') || vfs.fileExists('backup/config.json');
    }
  },
  {
    id: 58,
    slug: 'format_table_output',
    title: 'Format Output as Table',
    category: 'Processes & Admin',
    difficulty: 'Easy',
    prompt: "List all processes formatted as a table showing only Name and CPU columns.",
    syntaxTip: "Get-Process | Format-Table Name, CPU",
    hints: [
      "Run: Get-Process | Format-Table Name, CPU",
      "Or use alias: ps | ft Name, CPU",
      "Format-Table is aliased to 'ft'"
    ],
    solutions: [
      'Get-Process | Format-Table Name, CPU',
      'Get-Process | ft Name, CPU',
      'ps | Format-Table Name, CPU',
      'ps | ft Name, CPU'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-process') || lower.includes(' ps') || lower.startsWith('ps')) &&
             (lower.includes('format-table') || lower.includes(' ft ') || lower.endsWith(' ft')) &&
             output.length > 0;
    }
  },
  {
    id: 59,
    slug: 'list_all_aliases',
    title: 'List All Aliases',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Display all available PowerShell aliases in the current session.",
    syntaxTip: "Get-Alias",
    hints: [
      "Run: Get-Alias",
      "Or use the alias for Get-Alias: gal",
      "Pipe to select for just Name + Definition: Get-Alias | select Name, Definition"
    ],
    solutions: [
      'Get-Alias',
      'gal',
      'Get-Alias | select Name, Definition'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-alias') || lower === 'gal' || lower.startsWith('gal ')) && output.length > 5;
    }
  },
  {
    id: 60,
    slug: 'inspect_object_members',
    title: 'Inspect Object Properties',
    category: 'Objects & JSON',
    difficulty: 'Easy',
    prompt: "Use Get-Member (gm) to inspect the properties of Get-Process output.",
    syntaxTip: "Get-Process | Get-Member",
    hints: [
      "Run: Get-Process | Get-Member",
      "Or alias: ps | gm",
      "Get-Member shows all properties and methods on objects"
    ],
    solutions: [
      'Get-Process | Get-Member',
      'Get-Process | gm',
      'ps | Get-Member',
      'ps | gm'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-member') || lower.includes(' gm')) && output.length > 2;
    }
  },
  {
    id: 61,
    slug: 'append_content',
    title: 'Append Text to File',
    category: 'Filesystem',
    difficulty: 'Easy',
    prompt: "Append the text 'PowerShell is awesome' to notes.txt without overwriting it.",
    syntaxTip: "Add-Content notes.txt 'PowerShell is awesome'",
    hints: [
      "Use Add-Content: Add-Content notes.txt 'PowerShell is awesome'",
      "Or alias: ac notes.txt 'PowerShell is awesome'",
      "Add-Content appends — it does not overwrite like Set-Content"
    ],
    solutions: [
      "Add-Content notes.txt 'PowerShell is awesome'",
      "Add-Content -Path notes.txt -Value 'PowerShell is awesome'",
      "ac notes.txt 'PowerShell is awesome'"
    ],
    verify: (vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      if (!(lower.includes('add-content') || lower.startsWith('ac '))) return false;
      const content = vfs.readFile('notes.txt');
      return content !== null && content.toLowerCase().includes('powershell is awesome');
    }
  },
  {
    id: 62,
    slug: 'set_variable',
    title: 'Store Value in Variable',
    category: 'Basics',
    difficulty: 'Easy',
    prompt: "Create a variable called 'Score' with the value 100, then output it.",
    syntaxTip: "$Score = 100; $Score",
    hints: [
      "Assign: $Score = 100",
      "Then output: $Score",
      "Or in one line: $Score = 100; $Score"
    ],
    solutions: [
      '$Score = 100; $Score',
      'Set-Variable -Name Score -Value 100; $Score',
      '$Score = 100\n$Score'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('$score') || lower.includes('set-variable')) &&
             output.some(o => String(o) === '100' || Number(o) === 100);
    }
  },
  {
    id: 63,
    slug: 'foreach_loop',
    title: 'ForEach-Object Loop',
    category: 'Pipelines',
    difficulty: 'Medium',
    prompt: "Use ForEach-Object to print each line of names.txt in uppercase.",
    syntaxTip: "Get-Content names.txt | ForEach-Object { $_.ToUpper() }",
    hints: [
      "Read the file: Get-Content names.txt",
      "Pipe to ForEach-Object (alias: %): | ForEach-Object { $_.ToUpper() }",
      "Or shorter: gc names.txt | % { $_.ToUpper() }"
    ],
    solutions: [
      'Get-Content names.txt | ForEach-Object { $_.ToUpper() }',
      'gc names.txt | ForEach-Object { $_.ToUpper() }',
      "Get-Content names.txt | % { $_.ToUpper() }",
      "gc names.txt | % { $_.ToUpper() }"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-content') || lower.startsWith('gc ')) &&
             (lower.includes('foreach-object') || lower.includes('% {') || lower.includes('%{')) &&
             lower.includes('toupper') &&
             output.length > 0 &&
             output.some(o => String(o) === String(o).toUpperCase() && String(o).length > 2);
    }
  },
  {
    id: 64,
    slug: 'convert_to_json',
    title: 'Export Objects to JSON',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Convert the top 2 processes (by name) to JSON format using ConvertTo-Json.",
    syntaxTip: "Get-Process | Select-Object -First 2 | ConvertTo-Json",
    hints: [
      "Get processes: Get-Process",
      "Select first 2: | Select-Object -First 2  (or | select -First 2)",
      "Convert: | ConvertTo-Json"
    ],
    solutions: [
      'Get-Process | Select-Object -First 2 | ConvertTo-Json',
      'Get-Process | select -First 2 | ConvertTo-Json',
      'ps | select -First 2 | ConvertTo-Json'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-process') || lower.startsWith('ps')) &&
             lower.includes('convertto-json') &&
             output.length > 0 &&
             typeof output[0] === 'string' &&
             (output[0].includes('[') || output[0].includes('{'));
    }
  },
  {
    id: 65,
    slug: 'get_stopped_services',
    title: 'Find Stopped Services',
    category: 'Processes & Admin',
    difficulty: 'Easy',
    prompt: "List only the services that are currently Stopped using Where-Object.",
    syntaxTip: "Get-Service | Where-Object Status -eq 'Stopped'",
    hints: [
      "Run: Get-Service | Where-Object Status -eq 'Stopped'",
      "Or shorthand: gsv | ? Status -eq 'Stopped'",
      "'-eq' means 'equals' in PowerShell comparisons"
    ],
    solutions: [
      "Get-Service | Where-Object Status -eq 'Stopped'",
      "Get-Service | ? Status -eq 'Stopped'",
      "gsv | Where-Object Status -eq 'Stopped'",
      "gsv | ? Status -eq 'Stopped'"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-service') || lower.includes('gsv')) &&
             (lower.includes('where-object') || lower.includes('? ') || lower.includes(' ?')) &&
             lower.includes('stopped') &&
             output.length > 0 &&
             output.length < 6 &&
             output.every(o => o instanceof PSObject && String(o.getProperty('Status')) === 'Stopped');
    }
  },
  {
    id: 66,
    slug: 'count_file_lines',
    title: 'Count Lines in a File',
    category: 'Text & Search',
    difficulty: 'Easy',
    prompt: "Count how many lines are in access.log using Measure-Object.",
    syntaxTip: "Get-Content access.log | Measure-Object -Line",
    hints: [
      "Read the file: Get-Content access.log",
      "Count lines: | Measure-Object -Line",
      "Or use alias: gc access.log | measure -Line"
    ],
    solutions: [
      'Get-Content access.log | Measure-Object -Line',
      'Get-Content access.log | Measure-Object',
      'gc access.log | Measure-Object -Line',
      'gc access.log | measure -Line'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-content') || lower.startsWith('gc ')) &&
             lower.includes('access.log') &&
             (lower.includes('measure-object') || lower.includes('measure')) &&
             output.length > 0 &&
             output.some(o => o instanceof PSObject && Number(o.getProperty('Lines')) > 0);
    }
  },
  {
    id: 67,
    slug: 'top_memory_processes',
    title: 'Top 3 Memory Consumers',
    category: 'Processes & Admin',
    difficulty: 'Medium',
    prompt: "Find the top 3 processes consuming the most memory (WorkingSet64), sorted descending.",
    syntaxTip: "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 3",
    hints: [
      "Get processes: Get-Process",
      "Sort by memory: | Sort-Object WorkingSet64 -Descending",
      "Take top 3: | Select-Object -First 3"
    ],
    solutions: [
      'Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 3',
      'Get-Process | Sort-Object WorkingSet64 -Descending | select -First 3',
      'ps | sort WorkingSet64 -Descending | select -First 3',
      'ps | Sort-Object WorkingSet64 -Descending | Select-Object -First 3'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-process') || lower.startsWith('ps')) &&
             lower.includes('workingset64') &&
             (lower.includes('sort-object') || lower.includes('sort ')) &&
             lower.includes('descending') &&
             output.length === 3;
    }
  },
  {
    id: 68,
    slug: 'unique_departments',
    title: 'List Unique Departments',
    category: 'Objects & JSON',
    difficulty: 'Medium',
    prompt: "Import employees.csv and list all unique department names using Select-Object -Unique.",
    syntaxTip: "Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique",
    hints: [
      "Import: Import-Csv employees.csv",
      "Extract + deduplicate: | Select-Object -ExpandProperty Department -Unique",
      "Or: | select -ExpandProperty Department -Unique"
    ],
    solutions: [
      'Import-Csv employees.csv | Select-Object -ExpandProperty Department -Unique',
      'Import-Csv employees.csv | select -ExpandProperty Department -Unique',
      'ipcsv employees.csv | Select-Object -ExpandProperty Department -Unique'
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('employees.csv') &&
             lower.includes('department') &&
             lower.includes('unique') &&
             output.length >= 4 && output.length <= 6;
    }
  },
  {
    id: 69,
    slug: 'search_log_pattern',
    title: 'Search Log for 404 Errors',
    category: 'Text & Search',
    difficulty: 'Medium',
    prompt: "Search access.log for all lines containing '404' using Select-String.",
    syntaxTip: "Select-String -Pattern '404' -Path access.log",
    hints: [
      "Run: Select-String '404' access.log",
      "Or with named params: Select-String -Pattern '404' -Path access.log",
      "Alias: sls '404' access.log"
    ],
    solutions: [
      "Select-String -Pattern '404' -Path access.log",
      "Select-String '404' access.log",
      "sls '404' access.log",
      "Get-Content access.log | Select-String '404'"
    ],
    verify: (_vfs, output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('select-string') || lower.startsWith('sls ')) &&
             lower.includes('404') &&
             lower.includes('access.log') &&
             output.length > 0;
    }
  },
  {
    id: 70,
    slug: 'export_engineers_csv',
    title: 'Export Engineering Team to CSV',
    category: 'Objects & JSON',
    difficulty: 'Hard',
    prompt: "From employees.csv, filter only Engineering department employees and export to 'engineers.csv'.",
    syntaxTip: "Import-Csv employees.csv | Where-Object Department -eq 'Engineering' | Export-Csv engineers.csv -NoTypeInformation",
    hints: [
      "Import: Import-Csv employees.csv",
      "Filter: | Where-Object Department -eq 'Engineering'",
      "Export: | Export-Csv engineers.csv -NoTypeInformation"
    ],
    solutions: [
      "Import-Csv employees.csv | Where-Object Department -eq 'Engineering' | Export-Csv engineers.csv -NoTypeInformation",
      "Import-Csv employees.csv | ? Department -eq 'Engineering' | Export-Csv engineers.csv -NoTypeInformation",
      "ipcsv employees.csv | ? Department -eq 'Engineering' | epcsv engineers.csv -NoTypeInformation"
    ],
    verify: (vfs, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('employees.csv') &&
             (lower.includes('where-object') || lower.includes('? ')) &&
             lower.includes('engineering') &&
             (lower.includes('export-csv') || lower.includes('epcsv')) &&
             lower.includes('engineers.csv') &&
             vfs.fileExists('engineers.csv');
    }
  }
];
