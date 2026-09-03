export interface LinuxFile {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  size?: number;
  permissions?: string;
}

export class LinuxVFS {
  private files: Map<string, LinuxFile> = new Map();
  private cwd: string = '/home/cmdchallenge';

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.files.clear();
    this.cwd = '/home/cmdchallenge';

    // Standard directories
    this.mkdir('/home');
    this.mkdir('/home/cmdchallenge');
    this.mkdir('/home/cmdchallenge/backup');
    this.mkdir('/home/cmdchallenge/documents');
    this.mkdir('/home/cmdchallenge/scripts');

    // 1. access.log
    this.writeFile('/home/cmdchallenge/access.log',
`192.168.1.10 - - [24/Aug/2026:10:00:01 +0000] "GET /index.html HTTP/1.1" 200 1024
192.168.1.12 - - [24/Aug/2026:10:00:15 +0000] "POST /api/login HTTP/1.1" 200 450
10.0.0.5 - - [24/Aug/2026:10:01:22 +0000] "GET /secret.pdf HTTP/1.1" 404 220
192.168.1.10 - - [24/Aug/2026:10:02:05 +0000] "GET /app.js HTTP/1.1" 200 34500
172.16.0.4 - - [24/Aug/2026:10:03:40 +0000] "GET /admin HTTP/1.1" 403 180
192.168.1.15 - - [24/Aug/2026:10:04:10 +0000] "GET /images/logo.png HTTP/1.1" 200 8900
10.0.0.5 - - [24/Aug/2026:10:05:00 +0000] "POST /api/upload HTTP/1.1" 500 310
192.168.1.10 - - [24/Aug/2026:10:06:12 +0000] "GET /dashboard HTTP/1.1" 200 4200
10.0.0.8 - - [24/Aug/2026:10:07:30 +0000] "GET /missing HTTP/1.1" 404 220
192.168.1.12 - - [24/Aug/2026:10:08:45 +0000] "GET /profile HTTP/1.1" 200 1560`);

    // 2. split-me.txt (for split_on_a_char challenge)
    this.writeFile('/home/cmdchallenge/split-me.txt', 'apple;banana;cherry;date;elderberry;fig;grape;honeydew');

    // 3. sum-me.txt (for sum_all_numbers challenge)
    this.writeFile('/home/cmdchallenge/sum-me.txt', '12\n45\n78\n23\n90\n150\n67\n89\n104\n312');

    // 4. .doc files (for remove_files_with_extension challenge)
    this.writeFile('/home/cmdchallenge/quarterly_report.doc', 'Q3 Financial Overview');
    this.writeFile('/home/cmdchallenge/meeting_notes.doc', 'Action items for deployment');
    this.writeFile('/home/cmdchallenge/project_specs.doc', 'Specifications v2.1');

    // 5. Text files with phrase (for replace_text_in_files challenge)
    this.writeFile('/home/cmdchallenge/intro.txt', 'challenges are difficult but they make you stronger');
    this.writeFile('/home/cmdchallenge/chapter1.txt', 'Learning the shell: challenges are difficult in the beginning');

    // 6. Additional sample files
    this.writeFile('/home/cmdchallenge/server.log', '2026-09-02 12:00:01 [INFO] Server started\n2026-09-02 12:01:40 [ERROR] 500 Internal error\n2026-09-02 12:02:11 [INFO] Connected');
    this.writeFile('/home/cmdchallenge/documents/readme.md', '# Documentation\nWelcome to cmdchallenge');
    this.writeFile('/home/cmdchallenge/scripts/deploy.sh', '#!/bin/bash\necho "Deploying..."');
  }

  public getCwd(): string {
    return this.cwd;
  }

  public setCwd(path: string): boolean {
    const resolved = this.resolvePath(path);
    const entry = this.files.get(resolved);
    if (entry && entry.type === 'directory') {
      this.cwd = resolved;
      return true;
    }
    return false;
  }

  public resolvePath(target: string): string {
    const clean = target.trim();
    if (clean.startsWith('/')) {
      return this.normalizePath(clean);
    }
    return this.normalizePath(`${this.cwd}/${clean}`);
  }

  private normalizePath(raw: string): string {
    const parts = raw.split('/').filter(p => p.length > 0);
    const stack: string[] = [];

    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(p);
      }
    }

    return '/' + stack.join('/');
  }

  public mkdir(path: string): void {
    const resolved = this.resolvePath(path);
    this.files.set(resolved, {
      name: resolved.split('/').pop() || '',
      type: 'directory',
      permissions: 'drwxr-xr-x'
    });
  }

  public writeFile(path: string, content: string): void {
    const resolved = this.resolvePath(path);
    this.files.set(resolved, {
      name: resolved.split('/').pop() || '',
      type: 'file',
      content: content,
      size: content.length,
      permissions: '-rw-r--r--'
    });
  }

  public readFile(path: string): string | null {
    const resolved = this.resolvePath(path);
    const entry = this.files.get(resolved);
    if (entry && entry.type === 'file') {
      return entry.content ?? '';
    }
    return null;
  }

  public fileExists(path: string): boolean {
    const resolved = this.resolvePath(path);
    return this.files.has(resolved);
  }

  public deleteFile(path: string): boolean {
    const resolved = this.resolvePath(path);
    return this.files.delete(resolved);
  }

  public listDir(dirPath?: string): LinuxFile[] {
    const base = dirPath ? this.resolvePath(dirPath) : this.cwd;
    const results: LinuxFile[] = [];

    for (const [key, file] of this.files.entries()) {
      if (key === base) continue;
      const parent = key.substring(0, key.lastIndexOf('/')) || '/';
      if (parent === base) {
        results.push(file);
      }
    }

    return results;
  }

  public getAllFilesRecursive(dirPath?: string): { path: string; file: LinuxFile }[] {
    const base = dirPath ? this.resolvePath(dirPath) : this.cwd;
    const results: { path: string; file: LinuxFile }[] = [];

    for (const [key, file] of this.files.entries()) {
      if (key !== base && key.startsWith(base === '/' ? '/' : base + '/')) {
        results.push({ path: key, file });
      }
    }

    return results;
  }
}
