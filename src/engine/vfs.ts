export interface VFSFile {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  size?: number;
  lastModified?: Date;
  hidden?: boolean;
}

export class VirtualFileSystem {
  private files: Map<string, VFSFile> = new Map();
  private currentPath: string = 'C:\\Users\\student';

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.files.clear();
    this.currentPath = 'C:\\Users\\Dylan';

    // Root and home directories
    this.createDirectory('C:');
    this.createDirectory('C:\\Users');
    this.createDirectory('C:\\Users\\Dylan');
    this.createDirectory('C:\\Users\\Dylan\\backup');
    this.createDirectory('C:\\Users\\Dylan\\projects');
    this.createDirectory('C:\\Users\\Dylan\\scripts');
    this.createDirectory('C:\\Users\\Dylan\\temp');

    // Compatibility mirror
    this.createDirectory('C:\\Users\\student');
    this.createDirectory('C:\\Users\\student\\backup');
    this.createDirectory('C:\\Users\\student\\projects');
    this.createDirectory('C:\\Users\\student\\scripts');
    this.createDirectory('C:\\Users\\student\\temp');

    // Preloaded Files for Dylan Grow & student
    const preload = (base: string) => {
      this.writeFile(`${base}\\welcome.txt`, 'Welcome Dylan Grow to PowerShell Command Challenge!\nLearn real-world PowerShell cmdlets, pipelines, and object scripting.\nEngineered with Antigravity.');
      this.writeFile(`${base}\\notes.txt`, 'Meeting notes:\n- Review server logs\n- Deploy backup routine\n- Audit admin accounts\n- Upgrade PowerShell to 7.4');
      this.writeFile(`${base}\\.hidden_credentials.txt`, 'API_KEY=ps_secret_998877\nDB_PASS=correct_horse_battery', true);
      this.writeFile(`${base}\\access.log`, 
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

      this.writeFile(`${base}\\employees.csv`,
`Id,Name,Department,Salary,YearsExperience
101,Alice Johnson,Engineering,95000,6
102,Bob Smith,Marketing,62000,3
103,Charlie Brown,Engineering,110000,8
104,Diana Prince,Security,88000,5
105,Evan Wright,Engineering,78000,2
106,Fiona Gallagher,HumanResources,55000,4
107,George Clark,Operations,72000,5
108,Hannah Abbott,Engineering,125000,10`);

      this.writeFile(`${base}\\config.json`,
`{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "name": "production_db",
    "poolSize": 25,
    "timeout": 30
  },
  "features": {
    "metricsEnabled": true,
    "debugMode": false
  }
}`);

      this.writeFile(`${base}\\names.txt`, 'john doe\njane smith\nalexander the great\nbruce wayne\nclark kent');
      this.writeFile(`${base}\\temp\\cache_01.tmp`, 'cache_data_01');
      this.writeFile(`${base}\\temp\\cache_02.tmp`, 'cache_data_02');
      this.writeFile(`${base}\\temp\\temp_dump.log`, 'Temporary dump');
      this.writeFile(`${base}\\scripts\\deploy.ps1`, 'Write-Output "Deploying application to production..."');
      this.writeFile(`${base}\\scripts\\backup.ps1`, 'Write-Output "Starting full system backup..."');
      this.writeFile(`${base}\\scripts\\dylan_profile.ps1`, 'Write-Host "Dylan Grow\'s PowerShell Environment Ready!"');
    };

    preload('C:\\Users\\Dylan');
    preload('C:\\Users\\student');
  }

  public getCurrentPath(): string {
    return this.currentPath;
  }

  public setCurrentPath(path: string): boolean {
    const resolved = this.resolvePath(path);
    const entry = this.files.get(resolved.toLowerCase());
    if (entry && entry.type === 'directory') {
      this.currentPath = resolved;
      return true;
    }
    return false;
  }

  public resolvePath(target: string): string {
    let clean = target.trim().replace(/\//g, '\\');

    if (/^[A-Za-z]:/.test(clean)) {
      return this.normalizePath(clean);
    }

    if (clean === '.') return this.currentPath;
    if (clean === '..') {
      const parts = this.currentPath.split('\\');
      if (parts.length > 1) parts.pop();
      return parts.join('\\') || 'C:';
    }

    if (clean.startsWith('\\')) {
      const drive = this.currentPath.substring(0, 2);
      return this.normalizePath(drive + clean);
    }

    return this.normalizePath(`${this.currentPath}\\${clean}`);
  }

  private normalizePath(raw: string): string {
    const parts = raw.split('\\').filter(p => p.length > 0);
    const stack: string[] = [];

    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        if (stack.length > 1) stack.pop();
      } else {
        stack.push(p);
      }
    }

    return stack.join('\\');
  }

  public createDirectory(path: string): void {
    const resolved = this.resolvePath(path);
    this.files.set(resolved.toLowerCase(), {
      name: resolved.split('\\').pop() || resolved,
      type: 'directory',
      lastModified: new Date()
    });
  }

  public writeFile(path: string, content: string, hidden = false): void {
    const resolved = this.resolvePath(path);
    this.files.set(resolved.toLowerCase(), {
      name: resolved.split('\\').pop() || resolved,
      type: 'file',
      content: content,
      size: content.length,
      lastModified: new Date(),
      hidden: hidden
    });
  }

  public readFile(path: string): string | null {
    const resolved = this.resolvePath(path);
    let file = this.files.get(resolved.toLowerCase());
    if (!file) {
      if (resolved.toLowerCase().includes('c:\\users\\student')) {
        file = this.files.get(resolved.toLowerCase().replace('c:\\users\\student', 'c:\\users\\dylan'));
      } else if (resolved.toLowerCase().includes('c:\\users\\dylan')) {
        file = this.files.get(resolved.toLowerCase().replace('c:\\users\\dylan', 'c:\\users\\student'));
      }
    }
    if (file && file.type === 'file') {
      return file.content ?? '';
    }
    return null;
  }

  public fileExists(path: string): boolean {
    if (path.includes('*') || path.includes('?')) {
      const parentDir = path.includes('\\') ? path.substring(0, path.lastIndexOf('\\')) : '.';
      const pattern = path.includes('\\') ? path.substring(path.lastIndexOf('\\') + 1) : path;
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
      const resolvedParent = this.resolvePath(parentDir).toLowerCase();
      for (const [key, file] of Array.from(this.files.entries())) {
        const fileParent = key.substring(0, key.lastIndexOf('\\'));
        if ((fileParent === resolvedParent || fileParent === resolvedParent.replace('dylan', 'student') || fileParent === resolvedParent.replace('student', 'dylan')) && regex.test(file.name)) {
          return true;
        }
      }
      return false;
    }

    const resolved = this.resolvePath(path);
    if (this.files.has(resolved.toLowerCase())) return true;
    if (resolved.toLowerCase().includes('c:\\users\\student')) {
      return this.files.has(resolved.toLowerCase().replace('c:\\users\\student', 'c:\\users\\dylan'));
    }
    if (resolved.toLowerCase().includes('c:\\users\\dylan')) {
      return this.files.has(resolved.toLowerCase().replace('c:\\users\\dylan', 'c:\\users\\student'));
    }
    return false;
  }

  public deleteFile(path: string): boolean {
    if (path.includes('*') || path.includes('?')) {
      const parentDir = path.includes('\\') ? path.substring(0, path.lastIndexOf('\\')) : '.';
      const pattern = path.includes('\\') ? path.substring(path.lastIndexOf('\\') + 1) : path;
      const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
      const resolvedParent = this.resolvePath(parentDir).toLowerCase();
      
      let anyDeleted = false;
      for (const [key, file] of Array.from(this.files.entries())) {
        const fileParent = key.substring(0, key.lastIndexOf('\\'));
        if ((fileParent === resolvedParent || fileParent === resolvedParent.replace('dylan', 'student') || fileParent === resolvedParent.replace('student', 'dylan')) && regex.test(file.name)) {
          this.files.delete(key);
          anyDeleted = true;
        }
      }
      return anyDeleted;
    }

    const resolved = this.resolvePath(path);
    const del1 = this.files.delete(resolved.toLowerCase());
    const del2 = this.files.delete(resolved.toLowerCase().replace('dylan', 'student'));
    const del3 = this.files.delete(resolved.toLowerCase().replace('student', 'dylan'));
    return del1 || del2 || del3;
  }

  public listDirectory(dirPath?: string, includeHidden = false, recurse = false): VFSFile[] {
    const base = dirPath ? this.resolvePath(dirPath) : this.currentPath;
    const baseLower = base.toLowerCase();
    const results: VFSFile[] = [];

    for (const [key, file] of this.files.entries()) {
      if (key === baseLower) continue;

      if (recurse) {
        if (key.startsWith(baseLower + '\\')) {
          if (!file.hidden || includeHidden) {
            results.push(file);
          }
        }
      } else {
        const parent = key.substring(0, key.lastIndexOf('\\'));
        if (parent === baseLower) {
          if (!file.hidden || includeHidden) {
            results.push(file);
          }
        }
      }
    }

    return results;
  }

  public getTree(): { path: string; name: string; type: 'file' | 'directory'; size?: number; hidden?: boolean }[] {
    const list: { path: string; name: string; type: 'file' | 'directory'; size?: number; hidden?: boolean }[] = [];
    for (const [key, f] of this.files.entries()) {
      if (key.startsWith('c:\\users\\student')) {
        list.push({
          path: key,
          name: f.name,
          type: f.type,
          size: f.size,
          hidden: f.hidden
        });
      }
    }
    return list.sort((a, b) => a.path.localeCompare(b.path));
  }
}
