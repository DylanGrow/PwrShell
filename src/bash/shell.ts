import { LinuxVFS } from './vfs';

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class BashShell {
  private vfs: LinuxVFS;

  constructor(vfs: LinuxVFS) {
    this.vfs = vfs;
  }

  public getVFS(): LinuxVFS {
    return this.vfs;
  }

  public execute(commandLine: string): ShellResult {
    const trimmed = commandLine.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // Handle semicolon separated commands
    if (trimmed.includes(';') && !trimmed.includes("';'") && !trimmed.includes('";"')) {
      const parts = trimmed.split(';').map(p => p.trim()).filter(p => p.length > 0);
      let combinedStdout = '';
      let lastResult: ShellResult = { stdout: '', stderr: '', exitCode: 0 };
      for (const p of parts) {
        lastResult = this.executePipeline(p);
        if (lastResult.stdout) {
          combinedStdout += (combinedStdout ? '\n' : '') + lastResult.stdout;
        }
        if (lastResult.exitCode !== 0) {
          return { stdout: combinedStdout, stderr: lastResult.stderr, exitCode: lastResult.exitCode };
        }
      }
      return { stdout: combinedStdout, stderr: '', exitCode: 0 };
    }

    return this.executePipeline(trimmed);
  }

  private executePipeline(pipelineStr: string): ShellResult {
    // Split by pipe '|', unless inside quotes
    const stages = this.splitPipes(pipelineStr);
    let currentInput = '';

    for (let i = 0; i < stages.length; i++) {
      const stageStr = stages[i].trim();
      const res = this.executeSingle(stageStr, currentInput);
      if (res.exitCode !== 0) {
        return res;
      }
      currentInput = res.stdout;
    }

    return { stdout: currentInput, stderr: '', exitCode: 0 };
  }

  private splitPipes(cmd: string): string[] {
    const stages: string[] = [];
    let cur = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < cmd.length; i++) {
      const ch = cmd[i];
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        cur += ch;
      } else if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        cur += ch;
      } else if (ch === '|' && !inSingle && !inDouble) {
        stages.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim().length > 0) stages.push(cur);
    return stages;
  }

  private executeSingle(cmdStr: string, stdin: string): ShellResult {
    // Check for output redirection > or >>
    let redirectFile = '';
    let append = false;
    let cleanCmd = cmdStr;

    if (cmdStr.includes('>>')) {
      const idx = cmdStr.indexOf('>>');
      redirectFile = cmdStr.substring(idx + 2).trim();
      cleanCmd = cmdStr.substring(0, idx).trim();
      append = true;
    } else if (cmdStr.includes('>')) {
      const idx = cmdStr.indexOf('>');
      redirectFile = cmdStr.substring(idx + 1).trim();
      cleanCmd = cmdStr.substring(0, idx).trim();
    }

    // Parse tokens respecting quotes
    const tokens = this.parseTokens(cleanCmd);
    if (tokens.length === 0) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // Expand brace patterns like {1..100}
    const expandedTokens = this.expandTokens(tokens);
    const cmd = expandedTokens[0];
    const args = expandedTokens.slice(1);

    const result = this.runCommand(cmd, args, stdin);

    if (redirectFile) {
      const targetPath = this.vfs.resolvePath(redirectFile);
      const existing = append ? (this.vfs.readFile(targetPath) || '') : '';
      const newContent = existing + (existing ? '\n' : '') + result.stdout;
      this.vfs.writeFile(targetPath, newContent);
      return { stdout: '', stderr: result.stderr, exitCode: result.exitCode };
    }

    return result;
  }

  private expandTokens(tokens: string[]): string[] {
    const res: string[] = [];
    for (const t of tokens) {
      // Check for {start..end}
      const match = t.match(/^\{(\d+)\.\.(\d+)\}$/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        for (let i = start; i <= end; i++) {
          res.push(String(i));
        }
      } else if (t.includes('*') || t.includes('?')) {
        // Wildcard globbing
        const matches = this.expandGlob(t);
        if (matches.length > 0) {
          res.push(...matches);
        } else {
          res.push(t);
        }
      } else {
        res.push(t);
      }
    }
    return res;
  }

  private expandGlob(pattern: string): string[] {
    const files = this.vfs.listDir();
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return files.filter(f => regex.test(f.name)).map(f => f.name);
  }

  private parseTokens(input: string): string[] {
    const tokens: string[] = [];
    let cur = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];

      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
      } else if (/\s/.test(ch) && !inSingle && !inDouble) {
        if (cur.length > 0) {
          tokens.push(cur);
          cur = '';
        }
      } else {
        cur += ch;
      }
    }
    if (cur.length > 0) tokens.push(cur);
    return tokens;
  }

  private runCommand(cmd: string, args: string[], stdin: string): ShellResult {
    switch (cmd.toLowerCase()) {
      case 'echo': {
        const text = args.join(' ');
        return { stdout: text, stderr: '', exitCode: 0 };
      }

      case 'printf': {
        const fmt = args[0] || '';
        const unescaped = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        return { stdout: unescaped, stderr: '', exitCode: 0 };
      }

      case 'pwd': {
        return { stdout: this.vfs.getCwd(), stderr: '', exitCode: 0 };
      }

      case 'cd': {
        const dest = args[0] || '/home/cmdchallenge';
        const ok = this.vfs.setCwd(dest);
        if (!ok) {
          return { stdout: '', stderr: `cd: ${dest}: No such file or directory`, exitCode: 1 };
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'ls': {
        const files = this.vfs.listDir();
        let listOne = false;
        let showAll = false;
        const targets: string[] = [];

        for (const a of args) {
          if (a.startsWith('-')) {
            if (a.includes('1')) listOne = true;
            if (a.includes('a')) showAll = true;
          } else {
            targets.push(a);
          }
        }

        let filtered = files;
        if (targets.length > 0) {
          filtered = files.filter(f => targets.includes(f.name));
        }

        if (!showAll) {
          filtered = filtered.filter(f => !f.name.startsWith('.'));
        }

        const names = filtered.map(f => f.name);
        const sep = listOne ? '\n' : '  ';
        return { stdout: names.join(sep), stderr: '', exitCode: 0 };
      }

      case 'cat': {
        let text = '';
        if (args.length === 0) {
          text = stdin;
        } else {
          const contents: string[] = [];
          for (const a of args) {
            const c = this.vfs.readFile(a);
            if (c !== null) contents.push(c);
            else return { stdout: '', stderr: `cat: ${a}: No such file or directory`, exitCode: 1 };
          }
          text = contents.join('\n');
        }
        return { stdout: text, stderr: '', exitCode: 0 };
      }

      case 'head': {
        let count = 10;
        let file = '';
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === '-n' && args[i + 1]) {
            count = parseInt(args[i + 1], 10);
            i++;
          } else if (a.startsWith('-') && /^\d+$/.test(a.substring(1))) {
            count = parseInt(a.substring(1), 10);
          } else if (!a.startsWith('-')) {
            file = a;
          }
        }

        let content = stdin;
        if (file) {
          const c = this.vfs.readFile(file);
          if (c !== null) content = c;
          else return { stdout: '', stderr: `head: cannot open '${file}'`, exitCode: 1 };
        }

        const lines = content.split('\n').slice(0, count);
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
      }

      case 'tail': {
        let count = 10;
        let file = '';
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === '-n' && args[i + 1]) {
            count = parseInt(args[i + 1], 10);
            i++;
          } else if (a.startsWith('-') && /^\d+$/.test(a.substring(1))) {
            count = parseInt(a.substring(1), 10);
          } else if (!a.startsWith('-')) {
            file = a;
          }
        }

        let content = stdin;
        if (file) {
          const c = this.vfs.readFile(file);
          if (c !== null) content = c;
          else return { stdout: '', stderr: `tail: cannot open '${file}'`, exitCode: 1 };
        }

        const lines = content.split('\n').slice(-count);
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
      }

      case 'grep': {
        let pattern = '';
        let file = '';
        let countOnly = false;
        let listOnly = false;
        let onlyMatching = false;
        let ignoreCase = false;
        let recursive = false;

        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === '-c') countOnly = true;
          else if (a === '-l') listOnly = true;
          else if (a === '-o') onlyMatching = true;
          else if (a === '-i') ignoreCase = true;
          else if (a === '-E') { /* Extended regex flag */ }
          else if (a === '-r' || a === '-R') recursive = true;
          else if (a.startsWith('-') && a.length > 1) {
            if (a.includes('c')) countOnly = true;
            if (a.includes('l')) listOnly = true;
            if (a.includes('o')) onlyMatching = true;
            if (a.includes('i')) ignoreCase = true;
            if (a.includes('r')) recursive = true;
          } else if (!pattern) {
            pattern = a;
          } else if (!file) {
            file = a;
          }
        }

        if (!pattern) return { stdout: '', stderr: 'grep: missing pattern', exitCode: 1 };

        let flags = ignoreCase ? 'i' : '';
        if (onlyMatching) flags += 'g';
        const regex = new RegExp(pattern, flags);

        if (recursive || listOnly) {
          const all = this.vfs.getAllFilesRecursive();
          if (listOnly) {
            const matchingFiles: string[] = [];
            for (const item of all) {
              if (item.file.type === 'file' && item.file.content && regex.test(item.file.content)) {
                matchingFiles.push(item.file.name);
              }
            }
            return { stdout: Array.from(new Set(matchingFiles)).join('\n'), stderr: '', exitCode: 0 };
          }
          if (recursive) {
            const matchedOutput: string[] = [];
            for (const item of all) {
              if (item.file.type === 'file' && item.file.content) {
                const fLines = item.file.content.split('\n');
                for (const l of fLines) {
                  if (regex.test(l)) {
                    matchedOutput.push(`${item.file.name}:${l}`);
                  }
                }
              }
            }
            return { stdout: matchedOutput.join('\n'), stderr: '', exitCode: 0 };
          }
        }

        let lines: string[] = [];
        if (file && file !== '*') {
          const c = this.vfs.readFile(file);
          if (c !== null) lines = c.split('\n');
          else return { stdout: '', stderr: `grep: ${file}: No such file or directory`, exitCode: 1 };
        } else {
          lines = stdin.split('\n');
        }

        if (countOnly) {
          const count = lines.filter(l => regex.test(l)).length;
          return { stdout: String(count), stderr: '', exitCode: 0 };
        }

        if (onlyMatching) {
          const extracted: string[] = [];
          for (const l of lines) {
            const matches = l.match(new RegExp(pattern, flags));
            if (matches) extracted.push(...matches);
          }
          return { stdout: extracted.join('\n'), stderr: '', exitCode: 0 };
        }

        const matchedLines = lines.filter(l => regex.test(l));
        return { stdout: matchedLines.join('\n'), stderr: '', exitCode: 0 };
      }

      case 'find': {
        let namePattern = '';
        let deleteAction = false;
        let typeFile = false;

        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === '-name' && args[i + 1]) {
            namePattern = args[i + 1].replace(/['"]/g, '');
            i++;
          } else if (a === '-delete') {
            deleteAction = true;
          } else if (a === '-type' && args[i + 1] === 'f') {
            typeFile = true;
            i++;
          }
        }

        const all = this.vfs.getAllFilesRecursive();
        const results: string[] = [];

        for (const item of all) {
          if (typeFile && item.file.type !== 'file') continue;
          if (namePattern) {
            const regex = new RegExp('^' + namePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
            if (regex.test(item.file.name)) {
              results.push(item.file.name);
              if (deleteAction) {
                this.vfs.deleteFile(item.path);
              }
            }
          } else {
            results.push(item.file.name);
          }
        }

        return { stdout: results.join('\n'), stderr: '', exitCode: 0 };
      }

      case 'sort': {
        let content = stdin;
        if (args.length > 0 && !args[0].startsWith('-')) {
          const c = this.vfs.readFile(args[0]);
          if (c !== null) content = c;
        }

        const lines = content.split('\n');
        lines.sort();
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
      }

      case 'wc': {
        let countLines = false;
        let content = stdin;
        for (const a of args) {
          if (a === '-l') countLines = true;
          else if (!a.startsWith('-')) {
            const c = this.vfs.readFile(a);
            if (c !== null) content = c;
          }
        }

        const lines = content.split('\n').filter(l => l.length > 0);
        if (countLines) {
          return { stdout: String(lines.length), stderr: '', exitCode: 0 };
        }
        return { stdout: `${lines.length} lines`, stderr: '', exitCode: 0 };
      }

      case 'tr': {
        let fromChar = args[0] || '';
        let toChar = args[1] || '';

        fromChar = fromChar.replace(/^['"]|['"]$/g, '');
        toChar = toChar.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');

        const out = stdin.split(fromChar).join(toChar);
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      case 'sed': {
        let script = '';
        const files: string[] = [];
        for (const a of args) {
          if (a === '-i') continue;
          if (a.startsWith('s/')) script = a;
          else files.push(a);
        }

        if (script.startsWith('s/')) {
          const parts = script.split('/');
          const findStr = parts[1];
          const replStr = parts[2];

          if (files.length > 0) {
            for (const f of files) {
              const c = this.vfs.readFile(f);
              if (c !== null) {
                const updated = c.split(findStr).join(replStr);
                this.vfs.writeFile(f, updated);
              }
            }
            return { stdout: '', stderr: '', exitCode: 0 };
          } else {
            return { stdout: stdin.split(findStr).join(replStr), stderr: '', exitCode: 0 };
          }
        }

        return { stdout: stdin, stderr: '', exitCode: 0 };
      }

      case 'awk': {
        const script = args.find(a => !a.endsWith('.txt')) || '';
        const file = args.find(a => a.endsWith('.txt')) || '';

        let content = stdin;
        if (file) {
          const c = this.vfs.readFile(file);
          if (c !== null) content = c;
        }

        const lines = content.split('\n').filter(l => l.trim().length > 0);

        // {sum+=$1} END{print sum}
        if (script.includes('sum')) {
          let sum = 0;
          for (const l of lines) {
            const num = parseFloat(l.trim().split(/\s+/)[0]);
            if (!isNaN(num)) sum += num;
          }
          return { stdout: String(sum), stderr: '', exitCode: 0 };
        }

        // {print $1}
        if (script.includes('$1')) {
          const col = lines.map(l => l.split(/\s+/)[0]);
          return { stdout: col.join('\n'), stderr: '', exitCode: 0 };
        }

        return { stdout: content, stderr: '', exitCode: 0 };
      }

      case 'rm': {
        for (const a of args) {
          if (a.startsWith('-')) continue;
          if (a === '*' || a === './*' || a === '.*') {
            const files = this.vfs.listDir();
            for (const f of files) {
              this.vfs.deleteFile(f.name);
            }
          } else {
            this.vfs.deleteFile(a);
          }
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'seq': {
        let sep = '\n';
        let start = 1;
        let end = 1;

        for (let i = 0; i < args.length; i++) {
          if (args[i] === '-s' && args[i + 1]) {
            sep = args[i + 1].replace(/^['"]|['"]$/g, '');
            i++;
          } else if (/^\d+$/.test(args[i])) {
            if (args.length - i >= 2) {
              start = parseInt(args[i], 10);
              end = parseInt(args[i + 1], 10);
              break;
            } else {
              end = parseInt(args[i], 10);
            }
          }
        }

        const nums: number[] = [];
        for (let n = start; n <= end; n++) nums.push(n);
        return { stdout: nums.join(sep), stderr: '', exitCode: 0 };
      }

      case 'basename': {
        const path = args[0] || '';
        const name = path.split('/').pop() || path;
        return { stdout: name, stderr: '', exitCode: 0 };
      }

      case 'touch': {
        for (const a of args) {
          this.vfs.writeFile(a, '');
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'mkdir': {
        for (const a of args) {
          if (!a.startsWith('-')) this.vfs.mkdir(a);
        }
        return { stdout: '', stderr: '', exitCode: 0 };
      }

      case 'clear': {
        return { stdout: '__CLEAR__', stderr: '', exitCode: 0 };
      }

      default:
        return {
          stdout: '',
          stderr: `bash: ${cmd}: command not found`,
          exitCode: 127
        };
    }
  }
}
