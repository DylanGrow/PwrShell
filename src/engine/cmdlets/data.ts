import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject, wrapToPSObject } from '../psobject';
import { VirtualFileSystem } from '../vfs';

export const DataCmdlets = (vfs: VirtualFileSystem): Record<string, CmdletDefinition> => ({
  'Import-Csv': {
    name: 'Import-Csv',
    aliases: ['ipcsv'],
    synopsis: 'Creates table-like custom objects from the items in a CSV file.',
    description: 'Parses CSV data into dynamic PowerShell objects with typed properties.',
    syntax: 'Import-Csv [-Path] <String> [-Delimiter <String>]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Path to CSV file.' }
    ],
    examples: ['Import-Csv employees.csv', 'ipcsv employees.csv | ? Department -eq "Engineering"'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let targetPath = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') targetPath = String(a.value);
      }

      if (!targetPath) {
        context.writeOutput('Import-Csv: Path is required.', 'error');
        return [];
      }

      const content = vfs.readFile(targetPath);
      if (content === null) {
        context.writeOutput(`Import-Csv: Cannot find file '${targetPath}'.`, 'error');
        return [];
      }

      const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) return [];

      const headers = lines[0].split(',').map(h => h.trim());
      const results: PSObject[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim());
        const obj = new PSObject({}, 'PSCustomObject');
        for (let j = 0; j < headers.length; j++) {
          const colName = headers[j];
          let val: any = row[j] ?? '';
          if (!isNaN(Number(val)) && val !== '') val = Number(val);
          obj.setProperty(colName, val);
        }
        results.push(obj);
      }

      return results;
    }
  },

  'Export-Csv': {
    name: 'Export-Csv',
    aliases: ['epcsv'],
    synopsis: 'Converts objects into a series of comma-separated value (CSV) strings and saves the strings to a file.',
    description: 'Exports pipeline objects to CSV format.',
    syntax: 'Export-Csv [-Path] <String> [-NoTypeInformation]',
    parameters: [
      { name: 'Path', type: 'String', required: true, positional: true, description: 'Target file.' }
    ],
    examples: ['Get-Process | Export-Csv processes.csv -NoTypeInformation'],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let targetPath = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'path') targetPath = String(a.value);
      }

      if (!targetPath) {
        context.writeOutput('Export-Csv: Path is required.', 'error');
        return [];
      }

      const first = wrapToPSObject(input[0]);
      const headers = first.getProperties().map(p => p.name);

      let csvText = headers.join(',') + '\n';
      for (const item of input) {
        const psObj = wrapToPSObject(item);
        const row = headers.map(h => {
          const val = psObj.getProperty(h);
          return val !== undefined ? String(val) : '';
        });
        csvText += row.join(',') + '\n';
      }

      vfs.writeFile(targetPath, csvText);
      return [];
    }
  },

  'ConvertFrom-Json': {
    name: 'ConvertFrom-Json',
    aliases: [],
    synopsis: 'Converts a JSON-formatted string to a custom object or hash table.',
    description: 'Deserializes JSON strings into PowerShell objects.',
    syntax: 'ConvertFrom-Json [-InputObject] <String>',
    parameters: [
      { name: 'InputObject', type: 'String', required: true, positional: true, description: 'JSON text.' }
    ],
    examples: ['Get-Content config.json | ConvertFrom-Json'],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let rawJson = '';
      if (input && input.length > 0) {
        rawJson = input.join('\n');
      } else {
        for (const a of args) {
          if (!a.name || a.name.toLowerCase() === 'inputobject') rawJson = String(a.value);
        }
      }

      if (!rawJson) return [];

      try {
        const parsed = JSON.parse(rawJson);
        return [wrapToPSObject(parsed)];
      } catch (err: any) {
        context.writeOutput(`ConvertFrom-Json: Invalid JSON format (${err.message}).`, 'error');
        return [];
      }
    }
  },

  'ConvertTo-Json': {
    name: 'ConvertTo-Json',
    aliases: [],
    synopsis: 'Converts an object to a JSON-formatted string.',
    description: 'Serializes objects into JSON format.',
    syntax: 'ConvertTo-Json [-InputObject] <Object>',
    parameters: [
      { name: 'InputObject', type: 'Object', required: true, positional: true, description: 'Object to convert.' }
    ],
    examples: ['Get-Process | select -First 2 | ConvertTo-Json'],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      const target = (input && input.length > 0) ? input : args.map(a => a.value);
      const jsonStr = JSON.stringify(target, null, 2);
      return [jsonStr];
    }
  }
});
