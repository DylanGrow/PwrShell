import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject, wrapToPSObject } from '../psobject';

export const PipelineCmdlets: Record<string, CmdletDefinition> = {
  'Where-Object': {
    name: 'Where-Object',
    aliases: ['where', '?'],
    synopsis: 'Selects objects from a collection based on their property values.',
    description: 'Filters objects passing through the pipeline using conditions (e.g., -eq, -gt, -like). Only objects that match the criteria continue down the pipeline.',
    syntax: 'Where-Object [-Property] <String> [[-Operator] <String>] [[-Value] <Object>]',
    parameters: [
      { name: 'Property', type: 'String', required: true, positional: true, description: 'The property name to test.' },
      { name: 'Value', type: 'Object', required: false, description: 'The value to compare against.' },
      { name: 'FilterScript', type: 'ScriptBlock', required: false, description: 'A script block condition (e.g., { $_.Status -eq "Offline" }).' }
    ],
    examples: [
      "Get-StationModule | Where-Object Status -eq 'Offline'",
      "Get-StationModule | ? PowerLevel -gt 50",
      "Get-StationModule | where { $_.Sector -eq 'Alpha' }"
    ],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      // Check if we have a ScriptBlock argument
      const sbArg = args.find(a => typeof a.value === 'string' && a.value.includes('$_'));
      if (sbArg) {
        return evaluateScriptBlockFilter(input, sbArg.value, context);
      }

      // Simplified syntax: Where-Object Property -eq Value or Where-Object -Property Name -eq Value
      let targetProp = '';
      let operator = 'eq';
      let targetVal: any = null;

      for (let i = 0; i < args.length; i++) {
        const a = args[i];

        if (a.name?.toLowerCase() === 'property') {
          targetProp = String(a.value);
        } else if (a.name === 'Operator' && typeof a.value === 'object' && a.value !== null) {
          operator = a.value.op;
          targetVal = a.value.operand;
        } else if (a.isParameterName && ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'like', 'notlike', 'match', 'contains'].includes(a.name?.toLowerCase() || '')) {
          operator = a.name!.toLowerCase();
          targetVal = a.value;
        } else if (!a.name) {
          if (!targetProp) {
            targetProp = String(a.value);
          } else if (targetVal === null) {
            targetVal = a.value;
          }
        }
      }

      // Resolve variables in targetVal if needed
      if (targetVal && typeof targetVal === 'object' && targetVal.isVariable) {
        targetVal = context.variables.get(targetVal.name);
      }

      return input.filter(item => {
        const psObj = wrapToPSObject(item);
        const actualVal = psObj.getProperty(targetProp);
        return compareValues(actualVal, operator, targetVal);
      });
    }
  },

  'Select-Object': {
    name: 'Select-Object',
    aliases: ['select'],
    synopsis: 'Selects specified properties of an object or set of objects.',
    description: 'Projects specific properties to create new custom objects, or extracts the first/last N objects from a stream.',
    syntax: 'Select-Object [[-Property] <String[]>] [-First <Int>] [-Last <Int>] [-Unique] [-ExpandProperty <String>]',
    parameters: [
      { name: 'Property', type: 'String[]', required: false, positional: true, description: 'Comma-separated list of properties to keep.' },
      { name: 'First', type: 'Int', required: false, description: 'Select only the first N items.' },
      { name: 'Last', type: 'Int', required: false, description: 'Select only the last N items.' },
      { name: 'Unique', type: 'Switch', required: false, description: 'Removes duplicate objects.' },
      { name: 'ExpandProperty', type: 'String', required: false, description: 'Extracts and unwraps the raw value of a single property.' }
    ],
    examples: [
      'Get-StationModule | Select-Object -Property Name, Status, PowerLevel',
      'Get-StationModule | select -First 3',
      'Get-StationModule | select -ExpandProperty Name'
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let propList: string[] = [];
      let firstCount: number | null = null;
      let lastCount: number | null = null;
      let expandProp: string | null = null;
      let unique = false;

      for (const a of args) {
        const nameLower = a.name?.toLowerCase();
        if (nameLower === 'property' || (!a.name && typeof a.value === 'string' && !a.isParameterName)) {
          const raw = String(a.value);
          const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
          propList.push(...parts);
        } else if (nameLower === 'first') {
          firstCount = Number(a.value);
        } else if (nameLower === 'last') {
          lastCount = Number(a.value);
        } else if (nameLower === 'expandproperty' || nameLower === 'expand') {
          expandProp = String(a.value);
        } else if (nameLower === 'unique') {
          unique = true;
        }
      }

      let workingSet = [...input];

      // Handle First / Last
      if (firstCount !== null && !isNaN(firstCount)) {
        workingSet = workingSet.slice(0, firstCount);
      }
      if (lastCount !== null && !isNaN(lastCount)) {
        workingSet = workingSet.slice(Math.max(0, workingSet.length - lastCount));
      }

      // Handle ExpandProperty
      if (expandProp) {
        return workingSet.map(item => {
          const psObj = wrapToPSObject(item);
          return psObj.getProperty(expandProp!);
        }).filter(v => v !== undefined);
      }

      // Handle Property projection
      if (propList.length > 0) {
        workingSet = workingSet.map(item => {
          const psObj = wrapToPSObject(item);
          const newObj = new PSObject({}, 'Selected.' + (psObj.typeNames[0] || 'PSCustomObject'));
          for (const p of propList) {
            newObj.setProperty(p, psObj.getProperty(p));
          }
          return newObj;
        });
      }

      // Handle Unique
      if (unique) {
        const seen = new Set<string>();
        workingSet = workingSet.filter(item => {
          const key = JSON.stringify(item instanceof PSObject ? item.toPlainObject() : item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      return workingSet;
    }
  },

  'Sort-Object': {
    name: 'Sort-Object',
    aliases: ['sort'],
    synopsis: 'Sorts objects by property values.',
    description: 'Sorts pipeline objects in ascending or descending order based on specified property values.',
    syntax: 'Sort-Object [[-Property] <String>] [-Descending]',
    parameters: [
      { name: 'Property', type: 'String', required: false, positional: true, description: 'The property to sort by.' },
      { name: 'Descending', type: 'Switch', required: false, description: 'Sorts in descending order (highest first).' }
    ],
    examples: [
      'Get-StationModule | Sort-Object -Property PowerLevel -Descending',
      'Get-StationModule | sort Status'
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let sortProp = '';
      let descending = false;

      for (const a of args) {
        if (a.name?.toLowerCase() === 'property' || (!a.name && typeof a.value === 'string' && !a.isParameterName)) {
          sortProp = String(a.value);
        } else if (a.name?.toLowerCase() === 'descending' || (a.isParameterName && a.name?.toLowerCase() === 'descending')) {
          descending = true;
        }
      }

      const sorted = [...input].sort((a, b) => {
        const psA = wrapToPSObject(a);
        const psB = wrapToPSObject(b);

        const valA = sortProp ? psA.getProperty(sortProp) : a;
        const valB = sortProp ? psB.getProperty(sortProp) : b;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return valA - valB;
        }
        return String(valA || '').localeCompare(String(valB || ''), undefined, { numeric: true });
      });

      if (descending) {
        sorted.reverse();
      }

      return sorted;
    }
  },

  'Measure-Object': {
    name: 'Measure-Object',
    aliases: ['measure'],
    synopsis: 'Calculates the numeric properties of objects, and the characters, words, and lines in string objects.',
    description: 'Performs statistical calculations (Sum, Average, Min, Max, Count) on object properties across the pipeline.',
    syntax: 'Measure-Object [[-Property] <String>] [-Sum] [-Average] [-Maximum] [-Minimum]',
    parameters: [
      { name: 'Property', type: 'String', required: false, positional: true, description: 'The property to measure.' },
      { name: 'Sum', type: 'Switch', required: false, description: 'Calculates the sum of property values.' },
      { name: 'Average', type: 'Switch', required: false, description: 'Calculates the average of property values.' },
      { name: 'Maximum', type: 'Switch', required: false, description: 'Finds the maximum property value.' },
      { name: 'Minimum', type: 'Switch', required: false, description: 'Finds the minimum property value.' }
    ],
    examples: [
      'Get-StationModule | Measure-Object -Property PowerLevel -Average -Sum',
      'Get-StationModule | measure PowerLevel -Average'
    ],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let targetProp = '';
      let doSum = false;
      let doAvg = false;
      let doMax = false;
      let doMin = false;

      for (const a of args) {
        const lower = a.name?.toLowerCase();
        if (lower === 'property' || (!a.name && typeof a.value === 'string' && !a.isParameterName)) {
          targetProp = String(a.value);
        } else if (lower === 'sum' || a.name === 'Sum') doSum = true;
        else if (lower === 'average' || lower === 'avg' || a.name === 'Average') doAvg = true;
        else if (lower === 'maximum' || lower === 'max' || a.name === 'Maximum') doMax = true;
        else if (lower === 'minimum' || lower === 'min' || a.name === 'Minimum') doMin = true;
      }

      const count = input ? input.length : 0;
      const values: number[] = [];

      if (input && targetProp) {
        for (const item of input) {
          const psObj = wrapToPSObject(item);
          const v = Number(psObj.getProperty(targetProp));
          if (!isNaN(v)) {
            values.push(v);
          }
        }
      }

      const sum = values.reduce((acc, cur) => acc + cur, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      const max = values.length > 0 ? Math.max(...values) : null;
      const min = values.length > 0 ? Math.min(...values) : null;

      const measureResult: Record<string, any> = {
        Count: count
      };

      if (doAvg) measureResult.Average = Number(avg.toFixed(2));
      if (doSum) measureResult.Sum = sum;
      if (doMax) measureResult.Maximum = max;
      if (doMin) measureResult.Minimum = min;
      if (targetProp) measureResult.Property = targetProp;

      return [new PSObject(measureResult, 'GenericMeasureInfo')];
    }
  },

  'ForEach-Object': {
    name: 'ForEach-Object',
    aliases: ['foreach', '%'],
    synopsis: 'Performs an operation against each item in a collection of input objects.',
    description: 'Iterates through each object piped into it and executes a script block or command with $_ representing the current item.',
    syntax: 'ForEach-Object [-Process] <ScriptBlock>',
    parameters: [
      { name: 'Process', type: 'ScriptBlock', required: true, positional: true, description: 'Operation to perform on each object.' }
    ],
    examples: [
      'Get-StationModule | ForEach-Object { Repair-System -Id $_.Id }',
      'Get-StationModule | % { $_.Name }'
    ],
    execute: async (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      let script = '';
      for (const a of args) {
        if (typeof a.value === 'string') script = a.value;
      }

      const results: any[] = [];
      const executor = (context as any).executor;

      for (const item of input) {
        // Set $_ in variable scope
        context.variables.set('_', item);
        context.variables.set('PSItem', item);

        if (script && executor) {
          // Replace $_.Property with evaluated value if simple
          let interpolated = script.replace(/\$_\.([a-zA-Z0-9_]+)/g, (_m, p) => {
            const psObj = wrapToPSObject(item);
            return `'${psObj.getProperty(p)}'`;
          });
          interpolated = interpolated.replace(/\$_/g, `'${wrapToPSObject(item).toString()}'`);

          const res = await executor.execute(interpolated);
          if (res && res.output) {
            results.push(...res.output);
          }
        } else {
          results.push(item);
        }
      }

      return results;
    }
  }
};

function compareValues(actual: any, operator: string, expected: any): boolean {
  if (actual === undefined || actual === null) return expected === null || expected === undefined;

  const strActual = String(actual).toLowerCase();
  const strExpected = String(expected).toLowerCase();

  switch (operator.toLowerCase()) {
    case 'eq':
      if (typeof actual === 'number' && !isNaN(Number(expected))) {
        return actual === Number(expected);
      }
      if (typeof actual === 'boolean') {
        return actual === (expected === true || expected === 'true');
      }
      return strActual === strExpected;
    case 'ne':
      return !compareValues(actual, 'eq', expected);
    case 'gt':
      return Number(actual) > Number(expected);
    case 'ge':
      return Number(actual) >= Number(expected);
    case 'lt':
      return Number(actual) < Number(expected);
    case 'le':
      return Number(actual) <= Number(expected);
    case 'like':
      // Wildcard * matching
      const regexStr = '^' + strExpected.replace(/\*/g, '.*') + '$';
      return new RegExp(regexStr).test(strActual);
    case 'notlike':
      return !compareValues(actual, 'like', expected);
    case 'match':
      return new RegExp(strExpected).test(strActual);
    case 'contains':
      if (Array.isArray(actual)) {
        return actual.some(x => String(x).toLowerCase() === strExpected);
      }
      return strActual.includes(strExpected);
    default:
      return strActual === strExpected;
  }
}

function evaluateScriptBlockFilter(input: any[], script: string, _context: ExecutionContext): any[] {
  // Parse simple expressions like $_.Status -eq 'Offline'
  const match = script.match(/\$_\.([a-zA-Z0-9_]+)\s+-([a-zA-Z]+)\s+['"]?([^'"}]+)['"]?/i);
  if (match) {
    const [, prop, op, val] = match;
    return input.filter(item => {
      const psObj = wrapToPSObject(item);
      const actualVal = psObj.getProperty(prop);
      return compareValues(actualVal, op, val.trim());
    });
  }
  return input;
}
