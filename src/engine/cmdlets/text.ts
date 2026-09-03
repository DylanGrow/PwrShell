import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject, wrapToPSObject } from '../psobject';
import { VirtualFileSystem } from '../vfs';

export const TextCmdlets = (vfs: VirtualFileSystem): Record<string, CmdletDefinition> => ({
  'Select-String': {
    name: 'Select-String',
    aliases: ['sls', 'grep'],
    synopsis: 'Finds text in strings and files.',
    description: 'Searches for text patterns in lines or files.',
    syntax: 'Select-String [-Pattern] <String> [[-Path] <String>] [-SimpleMatch] [-CaseSensitive]',
    parameters: [
      { name: 'Pattern', type: 'String', required: true, positional: true, description: 'Regex or text pattern.' },
      { name: 'Path', type: 'String', required: false, positional: true, description: 'File path.' },
      { name: 'SimpleMatch', type: 'Switch', required: false, description: 'Literal search.' }
    ],
    examples: ["Select-String -Path access.log -Pattern '404'", "Get-Content access.log | sls '404'"],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let pattern = '';
      let path = '';
      let simpleMatch = false;

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && !pattern) pattern = String(a.value);
        else if (!name && !path) path = String(a.value);
        else if (name === 'pattern') pattern = String(a.value);
        else if (name === 'path') path = String(a.value);
        else if (name === 'simplematch') simpleMatch = true;
      }

      let lines: string[] = [];
      if (path) {
        const content = vfs.readFile(path);
        if (content !== null) lines = content.split(/\r?\n/);
        else {
          context.writeOutput(`Select-String: Cannot find file '${path}'.`, 'error');
          return [];
        }
      } else if (input && input.length > 0) {
        lines = input.map(i => typeof i === 'string' ? i : (i instanceof PSObject ? i.toString() : String(i)));
      }

      if (!pattern) {
        context.writeOutput('Select-String: Pattern parameter is required.', 'error');
        return [];
      }

      const results: PSObject[] = [];
      const regex = simpleMatch
        ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        : new RegExp(pattern, 'i');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (regex.test(line)) {
          results.push(new PSObject({
            Path: path || 'stdin',
            LineNumber: i + 1,
            Line: line
          }, 'MatchInfo'));
        }
      }

      return results;
    }
  },

  'Where-Object': {
    name: 'Where-Object',
    aliases: ['where', '?'],
    synopsis: 'Selects objects from a collection based on their property values.',
    description: 'Filters pipeline objects using conditions.',
    syntax: 'Where-Object [-Property] <String> [[-Operator] <String>] [[-Value] <Object>]',
    parameters: [
      { name: 'Property', type: 'String', required: true, positional: true, description: 'Property name.' },
      { name: 'Value', type: 'Object', required: false, positional: true, description: 'Comparison target.' }
    ],
    examples: [
      "Get-Process | Where-Object CPU -gt 50",
      "Get-ChildItem | ? Length -gt 1000",
      "Import-Csv employees.csv | ? Department -eq 'Engineering'"
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let propName = '';
      let operator = '-eq';
      let targetVal: any = null;

      for (const a of args) {
        if (a.name === 'Operator' && a.value && typeof a.value === 'object') {
          operator = a.value.op;
          targetVal = a.value.operand;
        } else if (a.name && ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'like', 'match', 'contains'].includes(a.name.replace(/^-/, ''))) {
          operator = '-' + a.name.replace(/^-/, '');
          targetVal = a.value;
        } else if (!a.name && !propName) {
          propName = String(a.value);
        } else if (!a.name && targetVal === null) {
          targetVal = a.value;
        }
      }

      return input.filter((item) => {
        const psObj = wrapToPSObject(item);
        const val = psObj.getProperty(propName);
        return evaluateCondition(val, operator, targetVal);
      });
    }
  },

  'Select-Object': {
    name: 'Select-Object',
    aliases: ['select'],
    synopsis: 'Selects objects or object properties.',
    description: 'Selects specified properties or limits pipeline output.',
    syntax: 'Select-Object [[-Property] <String[]>] [-First <Int>] [-Last <Int>] [-Unique] [-ExpandProperty <String>]',
    parameters: [
      { name: 'Property', type: 'String[]', required: false, positional: true, description: 'Properties to select.' },
      { name: 'First', type: 'Int', required: false, description: 'First N objects.' },
      { name: 'Last', type: 'Int', required: false, description: 'Last N objects.' },
      { name: 'Unique', type: 'Switch', required: false, description: 'Distinct values.' },
      { name: 'ExpandProperty', type: 'String', required: false, description: 'Unwrap property.' }
    ],
    examples: [
      'Get-Process | Select-Object ProcessName, Id',
      'Get-Content access.log | select -First 5',
      'Import-Csv employees.csv | select -ExpandProperty Department -Unique'
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let selectedProps: string[] = [];
      let first: number | undefined;
      let last: number | undefined;
      let unique = false;
      let expandProp = '';

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && typeof a.value === 'string') {
          selectedProps = a.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (name === 'property') {
          selectedProps = String(a.value).split(',').map(s => s.trim());
        } else if (name === 'first') first = Number(a.value);
        else if (name === 'last') last = Number(a.value);
        else if (name === 'unique') unique = true;
        else if (name === 'expandproperty' || name === 'expand') expandProp = String(a.value);
      }

      let stream = [...input];

      if (first !== undefined && first >= 0) stream = stream.slice(0, first);
      if (last !== undefined && last >= 0) stream = stream.slice(-last);

      if (expandProp) {
        const extracted = stream.map(item => wrapToPSObject(item).getProperty(expandProp));
        return unique ? Array.from(new Set(extracted)) : extracted;
      }

      if (selectedProps.length > 0) {
        stream = stream.map(item => {
          const psObj = wrapToPSObject(item);
          const newObj = new PSObject();
          for (const p of selectedProps) {
            newObj.setProperty(p, psObj.getProperty(p));
          }
          return newObj;
        });
      }

      if (unique) {
        const seen = new Set<string>();
        stream = stream.filter(item => {
          const key = JSON.stringify(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      return stream;
    }
  },

  'Sort-Object': {
    name: 'Sort-Object',
    aliases: ['sort'],
    synopsis: 'Sorts objects by property values.',
    description: 'Orders pipeline objects ascending or descending.',
    syntax: 'Sort-Object [[-Property] <String>] [-Descending] [-Unique]',
    parameters: [
      { name: 'Property', type: 'String', required: false, positional: true, description: 'Property to sort by.' },
      { name: 'Descending', type: 'Switch', required: false, description: 'Descending order.' },
      { name: 'Unique', type: 'Switch', required: false, description: 'Remove duplicates.' }
    ],
    examples: [
      'Get-Process | Sort-Object WorkingSet64 -Descending',
      'Import-Csv employees.csv | sort Salary -Descending'
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let prop = '';
      let descending = false;
      let unique = false;

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && typeof a.value === 'string') prop = a.value;
        else if (name === 'property') prop = String(a.value);
        else if (name === 'descending' || name === 'desc') descending = true;
        else if (name === 'unique') unique = true;
      }

      const stream = [...input];
      stream.sort((a, b) => {
        let valA = prop ? wrapToPSObject(a).getProperty(prop) : a;
        let valB = prop ? wrapToPSObject(b).getProperty(prop) : b;

        if (typeof valA === 'string' && !isNaN(Number(valA))) valA = Number(valA);
        if (typeof valB === 'string' && !isNaN(Number(valB))) valB = Number(valB);

        if (valA < valB) return descending ? 1 : -1;
        if (valA > valB) return descending ? -1 : 1;
        return 0;
      });

      if (unique) {
        const seen = new Set<string>();
        return stream.filter(item => {
          const val = prop ? wrapToPSObject(item).getProperty(prop) : item;
          const k = String(val);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }

      return stream;
    }
  },

  'Measure-Object': {
    name: 'Measure-Object',
    aliases: ['measure'],
    synopsis: 'Calculates the numeric properties of objects, and the characters, words, and lines in string objects.',
    description: 'Computes count, sum, average, min, max, or line count.',
    syntax: 'Measure-Object [[-Property] <String>] [-Sum] [-Average] [-Maximum] [-Minimum] [-Line] [-Word] [-Character]',
    parameters: [
      { name: 'Property', type: 'String', required: false, positional: true, description: 'Property to measure.' },
      { name: 'Sum', type: 'Switch', required: false, description: 'Compute sum.' },
      { name: 'Average', type: 'Switch', required: false, description: 'Compute average.' },
      { name: 'Line', type: 'Switch', required: false, description: 'Count lines.' }
    ],
    examples: [
      'Get-Process | Measure-Object -Property WorkingSet64 -Sum',
      'Get-Content access.log | Measure-Object -Line',
      'Import-Csv employees.csv | measure Salary -Average'
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let prop = '';
      let doSum = false;
      let doAvg = false;
      let doMin = false;
      let doMax = false;
      let doLine = false;

      for (const a of args) {
        const name = a.name?.toLowerCase();
        if (!name && typeof a.value === 'string') prop = a.value;
        else if (name === 'property') prop = String(a.value);
        else if (name === 'sum') doSum = true;
        else if (name === 'average' || name === 'avg') doAvg = true;
        else if (name === 'minimum' || name === 'min') doMin = true;
        else if (name === 'maximum' || name === 'max') doMax = true;
        else if (name === 'line' || name === 'lines') doLine = true;
      }

      const count = input ? input.length : 0;
      const res = new PSObject({ Count: count }, 'GenericMeasureInfo');

      if (doLine) {
        res.setProperty('Lines', count);
        return [res];
      }

      if (input && input.length > 0) {
        const nums = input
          .map(item => {
            if (prop) return Number(wrapToPSObject(item).getProperty(prop));
            return Number(item);
          })
          .filter(n => !isNaN(n));

        if (nums.length > 0) {
          const sum = nums.reduce((a, b) => a + b, 0);
          const avg = sum / nums.length;
          const min = Math.min(...nums);
          const max = Math.max(...nums);

          if (prop) res.setProperty('Property', prop);
          if (doSum) res.setProperty('Sum', sum);
          if (doAvg) res.setProperty('Average', Math.round(avg * 100) / 100);
          if (doMin) res.setProperty('Minimum', min);
          if (doMax) res.setProperty('Maximum', max);
        }
      }

      return [res];
    }
  },

  'Group-Object': {
    name: 'Group-Object',
    aliases: ['group'],
    synopsis: 'Groups objects that contain the same value for specified properties.',
    description: 'Groups pipeline objects by property.',
    syntax: 'Group-Object [[-Property] <String>]',
    parameters: [
      { name: 'Property', type: 'String', required: true, positional: true, description: 'Property to group by.' }
    ],
    examples: ['Import-Csv employees.csv | Group-Object Department'],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let prop = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'property') prop = String(a.value);
      }

      if (!prop) {
        context.writeOutput('Group-Object: Property parameter is required.', 'error');
        return [];
      }

      const groups = new Map<string, any[]>();
      for (const item of input) {
        const val = String(wrapToPSObject(item).getProperty(prop) || 'Unknown');
        if (!groups.has(val)) groups.set(val, []);
        groups.get(val)!.push(item);
      }

      const results: PSObject[] = [];
      for (const [key, items] of groups.entries()) {
        results.push(new PSObject({
          Count: items.length,
          Name: key,
          Group: items
        }, 'GroupInfo'));
      }

      return results;
    }
  },

  'ForEach-Object': {
    name: 'ForEach-Object',
    aliases: ['foreach', '%'],
    synopsis: 'Performs an operation against each item in a collection of input objects.',
    description: 'Iterates through pipeline stream.',
    syntax: 'ForEach-Object [-Process] <ScriptBlock>',
    parameters: [
      { name: 'Process', type: 'ScriptBlock', required: true, positional: true, description: 'Operation to perform.' }
    ],
    examples: ["Get-Content names.txt | ForEach-Object { $_.ToUpper() }"],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let script = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'process') script = String(a.value);
      }

      return input.map((item) => {
        const str = typeof item === 'string' ? item : (item instanceof PSObject ? item.toString() : String(item));
        if (script.toLowerCase().includes('toupper')) {
          return str.toUpperCase();
        }
        if (script.toLowerCase().includes('tolower')) {
          return str.toLowerCase();
        }
        return item;
      });
    }
  },

  'Compare-Object': {
    name: 'Compare-Object',
    aliases: ['diff', 'compare'],
    synopsis: 'Compares two sets of objects.',
    description: 'Displays the differences between a reference set and a difference set.',
    syntax: 'Compare-Object [-ReferenceObject] <Array> [-DifferenceObject] <Array>',
    parameters: [
      { name: 'ReferenceObject', type: 'Array', required: true, positional: true, description: 'Reference objects.' },
      { name: 'DifferenceObject', type: 'Array', required: true, positional: true, description: 'Difference objects.' }
    ],
    examples: ['Compare-Object (1..3) (2..4)', 'diff (1..3) (2..4)'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let ref: any[] = [];
      let diff: any[] = [];

      const parseVal = (v: any): any[] => {
        if (Array.isArray(v)) return v;
        const str = String(v).trim().replace(/[()]/g, '');
        const rangeMatch = str.match(/^(\d+)\.\.(\d+)$/);
        if (rangeMatch) {
          const s = parseInt(rangeMatch[1], 10);
          const e = parseInt(rangeMatch[2], 10);
          const arr: number[] = [];
          for (let i = s; i <= e; i++) arr.push(i);
          return arr;
        }
        if (str.includes(',')) return str.split(',').map(s => isNaN(Number(s.trim())) ? s.trim() : Number(s.trim()));
        return [v];
      };

      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'referenceobject') {
          ref = parseVal(a.value);
        } else if (a.name.toLowerCase() === 'differenceobject') {
          diff = parseVal(a.value);
        }
      }

      const results: PSObject[] = [];
      for (const r of ref) {
        if (!diff.includes(r)) {
          results.push(new PSObject({ InputObject: r, SideIndicator: '<=' }, 'CustomCompareInfo'));
        }
      }
      for (const d of diff) {
        if (!ref.includes(d)) {
          results.push(new PSObject({ InputObject: d, SideIndicator: '=>' }, 'CustomCompareInfo'));
        }
      }
      return results;
    }
  }
});

function evaluateCondition(left: any, op: string, right: any): boolean {
  if (left === undefined || left === null) left = '';
  if (right === undefined || right === null) right = '';

  const numLeft = Number(left);
  const numRight = Number(right);
  const isNumeric = !isNaN(numLeft) && !isNaN(numRight) && String(left).trim() !== '' && String(right).trim() !== '';

  const cleanOp = op.toLowerCase().replace(/^-/, '');

  switch (cleanOp) {
    case 'eq':
      return isNumeric ? numLeft === numRight : String(left).toLowerCase() === String(right).toLowerCase();
    case 'ne':
      return isNumeric ? numLeft !== numRight : String(left).toLowerCase() !== String(right).toLowerCase();
    case 'gt':
      return isNumeric ? numLeft > numRight : String(left) > String(right);
    case 'ge':
      return isNumeric ? numLeft >= numRight : String(left) >= String(right);
    case 'lt':
      return isNumeric ? numLeft < numRight : String(left) < String(right);
    case 'le':
      return isNumeric ? numLeft <= numRight : String(left) <= String(right);
    case 'like':
      const regLike = new RegExp('^' + String(right).replace(/\*/g, '.*') + '$', 'i');
      return regLike.test(String(left));
    case 'match':
      const regMatch = new RegExp(String(right), 'i');
      return regMatch.test(String(left));
    case 'contains':
      return String(left).toLowerCase().includes(String(right).toLowerCase());
    default:
      return String(left).toLowerCase() === String(right).toLowerCase();
  }
}
