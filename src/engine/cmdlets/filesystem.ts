import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject } from '../psobject';
import { VirtualFileSystem } from '../vfs';

export const FilesystemCmdlets = (vfs: VirtualFileSystem): Record<string, CmdletDefinition> => ({
  'Get-Location': {
    name: 'Get-Location',
    aliases: ['pwd', 'gl'],
    synopsis: 'Gets information about the current working location.',
    description: 'Gets the current working directory path.',
    syntax: 'Get-Location',
    parameters: [],
    examples: ['Get-Location', 'pwd'],
    execute: (_input: any[], _args: CommandArgument[], _context: ExecutionContext) => {
      const cur = vfs.getCurrentPath();
      return [new PSObject({ Path: cur, ProviderPath: cur }, 'PathInfo')];
    }
  },

  'Set-Location': {
    name: 'Set-Location',
    aliases: ['cd', 'sl', 'chdir'],
    synopsis: 'Sets the current working location to a specified location.',
    description: 'Changes the current directory.',
    syntax: 'Set-Location [[-Path] <String>]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Target path.' }
    ],
    examples: ['Set-Location backup', 'cd C:\\Users\\student\\projects', 'cd ..'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let target = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') target = String(a.value);
      }

      if (!target) target = 'C:\\Users\\student';

      const ok = vfs.setCurrentPath(target);
      if (!ok) {
        context.writeOutput(`Set-Location: Cannot find path '${target}' because it does not exist.`, 'error');
      }
      return [];
    }
  },

  'Get-ChildItem': {
    name: 'Get-ChildItem',
    aliases: ['gci', 'ls', 'dir'],
    synopsis: 'Gets the files and folders in one or more specified locations.',
    description: 'Lists all items in a directory.',
    syntax: 'Get-ChildItem [[-Path] <String>] [-Filter <String>] [-Recurse] [-Force] [-File] [-Directory]',
    parameters: [
      { name: 'Path', type: 'String', required: false, positional: true, description: 'Path to list.' },
      { name: 'Filter', type: 'String', required: false, description: 'Filter pattern like *.log.' },
      { name: 'Recurse', type: 'Switch', required: false, description: 'List subdirectories recursively.' },
      { name: 'Force', type: 'Switch', required: false, description: 'Include hidden files.' },
      { name: 'File', type: 'Switch', required: false, description: 'Only files.' },
      { name: 'Directory', type: 'Switch', required: false, description: 'Only directories.' }
    ],
    examples: ['Get-ChildItem', 'ls -Force', 'Get-ChildItem -Recurse -Filter *.log', 'dir -File'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let targetPath = '';
      let filter = '';
      let recurse = false;
      let force = false;
      let fileOnly = false;
      let dirOnly = false;

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && typeof a.value === 'string') {
          if (a.value.includes('*') || a.value.includes('?')) filter = a.value;
          else targetPath = a.value;
        } else if (name === 'path') targetPath = String(a.value);
        else if (name === 'filter') filter = String(a.value);
        else if (name === 'recurse') recurse = true;
        else if (name === 'force') force = true;
        else if (name === 'file') fileOnly = true;
        else if (name === 'directory' || name === 'ad') dirOnly = true;
      }

      const files = vfs.listDirectory(targetPath, force, recurse);
      const results: PSObject[] = [];

      for (const f of files) {
        if (fileOnly && f.type !== 'file') continue;
        if (dirOnly && f.type !== 'directory') continue;

        if (filter) {
          const reg = new RegExp('^' + filter.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
          if (!reg.test(f.name)) continue;
        }

        const obj = new PSObject({
          Mode: f.type === 'directory' ? 'd----' : '-a---',
          LastWriteTime: '8/31/2026 10:00 AM',
          Length: f.size !== undefined ? f.size : '',
          Name: f.name
        }, f.type === 'directory' ? 'DirectoryInfo' : 'FileInfo');

        results.push(obj);
      }

      return results;
    }
  },

  'Get-Content': {
    name: 'Get-Content',
    aliases: ['gc', 'cat', 'type'],
    synopsis: 'Gets the contents of an item at the specified location.',
    description: 'Reads text files from the filesystem.',
    syntax: 'Get-Content [-Path] <String> [-TotalCount <Int>] [-Tail <Int>] [-Raw]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'File path.' },
      { name: 'TotalCount', type: 'Int', required: false, description: 'First N lines (head).' },
      { name: 'Tail', type: 'Int', required: false, description: 'Last N lines (tail).' },
      { name: 'Raw', type: 'Switch', required: false, description: 'Read as single multi-line string.' }
    ],
    examples: ['Get-Content welcome.txt', 'gc access.log -TotalCount 5', 'cat access.log -Tail 3', 'gc config.json -Raw'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let targetPath = '';
      let totalCount: number | undefined;
      let tail: number | undefined;
      let raw = false;

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && typeof a.value === 'string') targetPath = a.value;
        else if (name === 'path') targetPath = String(a.value);
        else if (name === 'totalcount' || name === 'head') totalCount = Number(a.value);
        else if (name === 'tail') tail = Number(a.value);
        else if (name === 'raw') raw = true;
      }

      if (!targetPath) {
        context.writeOutput('Get-Content: Cannot bind argument to parameter Path because it is empty.', 'error');
        return [];
      }

      const content = vfs.readFile(targetPath);
      if (content === null) {
        context.writeOutput(`Get-Content: Cannot find path '${targetPath}' because it does not exist.`, 'error');
        return [];
      }

      if (raw) {
        return [content];
      }

      let lines = content.split(/\r?\n/);
      if (totalCount !== undefined && totalCount >= 0) {
        lines = lines.slice(0, totalCount);
      }
      if (tail !== undefined && tail >= 0) {
        lines = lines.slice(-tail);
      }

      return lines;
    }
  },

  'Set-Content': {
    name: 'Set-Content',
    aliases: ['sc'],
    synopsis: 'Writes or replaces the content in an item with new content.',
    description: 'Overwrites file content.',
    syntax: 'Set-Content [-Path] <String> [-Value] <Object>',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'File path.' },
      { name: 'Value', type: 'Object', required: true, description: 'Text value.' }
    ],
    examples: ["Set-Content notes.txt 'Updated notes'"],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let targetPath = '';
      let value: any = '';

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && !targetPath) targetPath = String(a.value);
        else if (!name) value = a.value;
        else if (name === 'path') targetPath = String(a.value);
        else if (name === 'value') value = a.value;
      }

      if (input && input.length > 0 && !value) {
        value = input.join('\n');
      }

      if (!targetPath) {
        context.writeOutput('Set-Content: Path parameter required.', 'error');
        return [];
      }

      vfs.writeFile(targetPath, String(value));
      return [];
    }
  },

  'Add-Content': {
    name: 'Add-Content',
    aliases: ['ac'],
    synopsis: 'Appends content to the specified items.',
    description: 'Appends text to a file.',
    syntax: 'Add-Content [-Path] <String> [-Value] <Object>',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'File path.' },
      { name: 'Value', type: 'Object', required: true, description: 'Text value.' }
    ],
    examples: ["Add-Content notes.txt 'New bullet point'"],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let targetPath = '';
      let value: any = '';

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && !targetPath) targetPath = String(a.value);
        else if (!name) value = a.value;
        else if (name === 'path') targetPath = String(a.value);
        else if (name === 'value') value = a.value;
      }

      if (input && input.length > 0 && !value) value = input.join('\n');

      const existing = vfs.readFile(targetPath) || '';
      vfs.writeFile(targetPath, existing + (existing ? '\n' : '') + String(value));
      return [];
    }
  },

  'New-Item': {
    name: 'New-Item',
    aliases: ['ni', 'mkdir', 'md'],
    synopsis: 'Creates a new item (file or directory).',
    description: 'Creates new files and folders.',
    syntax: 'New-Item [-Path] <String> [-ItemType <String>] [-Value <String>]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Path or Name.' },
      { name: 'ItemType', type: 'String', required: false, description: 'File or Directory.' },
      { name: 'Value', type: 'String', required: false, description: 'Initial file content.' }
    ],
    examples: ["New-Item -ItemType Directory -Name 'backup'", "New-Item 'notes.txt'", "mkdir backup"],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let targetPath = '';
      let itemType = 'file';
      let value = '';

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && !targetPath) targetPath = String(a.value);
        else if (name === 'path' || name === 'name') targetPath = String(a.value);
        else if (name === 'itemtype' || name === 'type') itemType = String(a.value).toLowerCase();
        else if (name === 'value') value = String(a.value);
      }

      if (!targetPath) {
        context.writeOutput('New-Item: Path is required.', 'error');
        return [];
      }

      if (itemType === 'directory' || itemType === 'dir') {
        vfs.createDirectory(targetPath);
      } else {
        vfs.writeFile(targetPath, value);
      }

      return [new PSObject({
        Mode: itemType === 'directory' ? 'd----' : '-a---',
        LastWriteTime: '8/31/2026 10:00 AM',
        Length: value.length,
        Name: targetPath.split('\\').pop() || targetPath
      }, 'FileInfo')];
    }
  },

  'Remove-Item': {
    name: 'Remove-Item',
    aliases: ['rm', 'del', 'erase', 'rd', 'rmdir'],
    synopsis: 'Deletes the specified items.',
    description: 'Deletes files and directories.',
    syntax: 'Remove-Item [-Path] <String> [-Recurse] [-Force]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Path to delete.' }
    ],
    examples: ['Remove-Item notes.txt', 'rm *.tmp', 'del temp'],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const targets: string[] = [];

      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') {
          targets.push(String(a.value));
        }
      }

      if (input && input.length > 0) {
        for (const item of input) {
          if (item instanceof PSObject && item.getProperty('Name')) {
            targets.push(item.getProperty('Name'));
          } else if (typeof item === 'string') {
            targets.push(item);
          }
        }
      }

      if (targets.length === 0) {
        context.writeOutput('Remove-Item: Path parameter is required.', 'error');
        return [];
      }

      for (const t of targets) {
        vfs.deleteFile(t);
      }

      return [];
    }
  },

  'Copy-Item': {
    name: 'Copy-Item',
    aliases: ['cp', 'copy', 'cpi'],
    synopsis: 'Copies an item from one location to another.',
    description: 'Duplicates files and folders.',
    syntax: 'Copy-Item [-Path] <String> [-Destination] <String>',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Source.' },
      { name: 'Destination', type: 'String', required: true, positional: true, description: 'Destination.' }
    ],
    examples: ['Copy-Item config.json backup/', 'cp notes.txt notes_copy.txt'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let src = '';
      let dest = '';

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && !src) src = String(a.value);
        else if (!name && !dest) dest = String(a.value);
        else if (name === 'path') src = String(a.value);
        else if (name === 'destination' || name === 'dest') dest = String(a.value);
      }

      if (!src || !dest) {
        context.writeOutput('Copy-Item: Source Path and Destination are required.', 'error');
        return [];
      }

      const content = vfs.readFile(src);
      if (content !== null) {
        let destPath = dest;
        if (dest.endsWith('\\') || dest.endsWith('/') || dest.toLowerCase() === 'backup' || dest.toLowerCase() === 'backup\\') {
          const fileName = src.split('\\').pop()?.split('/').pop() || 'file';
          destPath = `C:\\Users\\student\\backup\\${fileName}`;
        }
        vfs.writeFile(destPath, content);
      }
      return [];
    }
  },

  'Test-Path': {
    name: 'Test-Path',
    aliases: ['tp'],
    synopsis: 'Determines whether all elements of a path exist.',
    description: 'Returns True if the path exists, False otherwise.',
    syntax: 'Test-Path [-Path] <String>',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Path to test.' }
    ],
    examples: ['Test-Path backup', 'Test-Path welcome.txt'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let target = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') target = String(a.value);
      }
      return [vfs.fileExists(target)];
    }
  },

  'Split-Path': {
    name: 'Split-Path',
    aliases: [],
    synopsis: 'Returns the specified part of a path.',
    description: 'Splits paths into parent or leaf names.',
    syntax: 'Split-Path [-Path] <String> [-Leaf] [-Parent]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Path to split.' },
      { name: 'Leaf', type: 'Switch', required: false, description: 'Return file/folder name only.' }
    ],
    examples: ['Split-Path C:\\Users\\student\\welcome.txt -Leaf', 'Split-Path C:\\Users\\student\\welcome.txt -Parent'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let target = '';
      let leaf = false;
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') target = String(a.value);
        if (a.name?.toLowerCase() === 'leaf') leaf = true;
      }

      if (leaf) {
        const parts = target.replace(/\//g, '\\').split('\\');
        return [parts.pop() || target];
      } else {
        const parts = target.replace(/\//g, '\\').split('\\');
        parts.pop();
        return [parts.join('\\')];
      }
    }
  },

  'Join-Path': {
    name: 'Join-Path',
    aliases: [],
    synopsis: 'Combines a path and one or more child paths into a single path.',
    description: 'Joins parent and child paths.',
    syntax: 'Join-Path [-Path] <String> [-ChildPath] <String>',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Parent path.' },
      { name: 'ChildPath', type: 'String', required: true, positional: true, description: 'Child path.' }
    ],
    examples: ["Join-Path 'C:\\Users' 'student'"],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let parent = '';
      let child = '';
      for (const a of args) {
        if (!a.name && !parent) parent = String(a.value);
        else if (!a.name && !child) child = String(a.value);
        else if (a.name?.toLowerCase() === 'path') parent = String(a.value);
        else if (a.name?.toLowerCase() === 'childpath') child = String(a.value);
      }
      const joined = `${parent.replace(/[\\/]$/, '')}\\${child.replace(/^[\\/]/, '')}`;
      return [joined];
    }
  },

  'Get-Item': {
    name: 'Get-Item',
    aliases: ['gi'],
    synopsis: 'Gets the item at the specified location.',
    description: 'Gets file or directory object.',
    syntax: 'Get-Item [-Path] <String>',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Item path.' }
    ],
    examples: ['Get-Item welcome.txt'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let target = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') target = String(a.value);
      }
      if (!target) target = '.';
      const content = vfs.readFile(target);
      if (content === null && !vfs.fileExists(target)) {
        context.writeOutput(`Get-Item: Cannot find path '${target}'.`, 'error');
        return [];
      }
      return [new PSObject({
        Mode: '-a---',
        LastWriteTime: '8/31/2026 10:00 AM',
        Length: content !== null ? content.length : 0,
        Name: target.split('\\').pop() || target
      }, 'FileInfo')];
    }
  },

  'Tee-Object': {
    name: 'Tee-Object',
    aliases: ['tee'],
    synopsis: 'Saves command output in a file and sends it down the pipeline.',
    description: 'Splits the pipeline stream into a file and stdout.',
    syntax: 'Tee-Object [-FilePath] <String> [-Append]',
    parameters: [
      { name: 'FilePath', type: 'String', required: true, positional: true, description: 'File path.' },
      { name: 'Append', type: 'Switch', required: false, description: 'Append content.' }
    ],
    examples: ['Get-Process | Tee-Object proc_backup.txt'],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let path = '';
      let append = false;
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'filepath' || a.name.toLowerCase() === 'file') path = String(a.value);
        if (a.name?.toLowerCase() === 'append') append = true;
      }
      if (path && input.length > 0) {
        const text = input.map(item => item instanceof PSObject ? item.toString() : String(item)).join('\n');
        const existing = append ? (vfs.readFile(path) || '') : '';
        vfs.writeFile(path, existing + (existing ? '\n' : '') + text);
      }
      return input;
    }
  },

  'Out-File': {
    name: 'Out-File',
    aliases: [],
    synopsis: 'Sends output to a file.',
    description: 'Writes pipeline output into a specified file.',
    syntax: 'Out-File [-FilePath] <String> [-Append]',
    parameters: [
      { name: 'FilePath', type: 'String', required: true, positional: true, description: 'Target file path.' },
      { name: 'Append', type: 'Switch', required: false, description: 'Append to file.' }
    ],
    examples: ['Get-Service | Out-File services.txt'],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let path = '';
      let append = false;
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'filepath' || a.name.toLowerCase() === 'path') path = String(a.value);
        if (a.name?.toLowerCase() === 'append') append = true;
      }
      if (path && input.length > 0) {
        const text = input.map(item => item instanceof PSObject ? item.toString() : String(item)).join('\n');
        const existing = append ? (vfs.readFile(path) || '') : '';
        vfs.writeFile(path, existing + (existing ? '\n' : '') + text);
      }
      return [];
    }
  }
});
