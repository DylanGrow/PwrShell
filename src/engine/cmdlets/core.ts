import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject, wrapToPSObject } from '../psobject';
import { Formatters } from '../formatters';

export const CoreCmdlets: Record<string, CmdletDefinition> = {
  'Get-Command': {
    name: 'Get-Command',
    aliases: ['gcm'],
    synopsis: 'Lists all available PowerShell cmdlets and tools.',
    description: 'Lists all available cmdlets, functions, and aliases in your current terminal session.',
    syntax: 'Get-Command [[-Noun] <String>] [[-Verb] <String>]',
    parameters: [
      { name: 'Noun', type: 'String', required: false, description: 'Filter commands by noun.' },
      { name: 'Verb', type: 'String', required: false, description: 'Filter commands by verb.' }
    ],
    examples: ['Get-Command', 'Get-Command -Noun StationModule', 'gcm -Verb Get'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const allCmdlets = (context as any).allCmdlets as Map<string, CmdletDefinition>;
      const results: PSObject[] = [];

      let nounFilter = '';
      let verbFilter = '';

      for (const arg of args) {
        if (arg.name?.toLowerCase() === 'noun') nounFilter = String(arg.value).toLowerCase();
        if (arg.name?.toLowerCase() === 'verb') verbFilter = String(arg.value).toLowerCase();
        if (!arg.name && typeof arg.value === 'string') {
          nounFilter = arg.value.toLowerCase();
        }
      }

      if (allCmdlets) {
        for (const [name, def] of allCmdlets.entries()) {
          const parts = name.split('-');
          const verb = parts[0] || '';
          const noun = parts[1] || '';

          if (nounFilter && !noun.toLowerCase().includes(nounFilter) && !name.toLowerCase().includes(nounFilter)) {
            continue;
          }
          if (verbFilter && !verb.toLowerCase().includes(verbFilter)) {
            continue;
          }

          const obj = new PSObject({
            Name: def.name,
            Action: def.synopsis
          }, 'CmdletInfo');
          results.push(obj);
        }
      }

      return results;
    }
  },

  'Get-Help': {
    name: 'Get-Help',
    aliases: ['help', 'man'],
    synopsis: 'Displays user guide and practical examples for any cmdlet.',
    description: 'Provides detailed documentation, parameters, syntax diagrams, and real-world examples for any cmdlet.',
    syntax: 'Get-Help [-Name] <String>',
    parameters: [
      { name: 'Name', type: 'String', required: true, positional: true, description: 'The name of the cmdlet to get help for.' }
    ],
    examples: ['Get-Help Get-StationModule', 'help Where-Object', 'man Select-Object'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const allCmdlets = (context as any).allCmdlets as Map<string, CmdletDefinition>;
      let targetName = '';

      for (const arg of args) {
        if (arg.name?.toLowerCase() === 'name') targetName = String(arg.value);
        else if (!arg.name && typeof arg.value === 'string') targetName = arg.value;
      }

      if (!targetName) {
        const helpHtml = `
          <div class="doc-card">
            <div class="doc-header">
              <span class="doc-icon">📖</span>
              <strong>PowerShell Verb-Noun Rule</strong>
            </div>
            <p class="doc-body">
              Every PowerShell command pairs an <strong>Action Verb</strong> with a <strong>Target Noun</strong>:<br/>
              • <code>Get-StationModule</code> (Get = find/inspect, StationModule = station systems)<br/>
              • <code>Repair-System</code> (Repair = fix/restore, System = target system)<br/>
              • <code>Start-Generator</code> (Start = boot/activate, Generator = power reactor)
            </p>
            <div class="doc-hint">Run <code>Get-Help &lt;Cmdlet-Name&gt;</code> to learn about any specific tool.</div>
          </div>
        `;
        context.writeOutput(helpHtml, 'table');
        return [];
      }

      let targetCmdlet: CmdletDefinition | undefined;
      for (const [name, def] of allCmdlets.entries()) {
        if (name.toLowerCase() === targetName.toLowerCase() || def.aliases?.some(a => a.toLowerCase() === targetName.toLowerCase())) {
          targetCmdlet = def;
          break;
        }
      }

      if (!targetCmdlet) {
        context.writeOutput(`Help topic not found for '${targetName}'. Run 'Get-Command' to see available tools.`, 'error');
        return [];
      }

      const examplesHtml = targetCmdlet.examples
        .map(ex => `<div class="doc-code-row"><code>${Formatters.escapeHtml(ex)}</code></div>`)
        .join('');

      const docHtml = `
        <div class="doc-card">
          <div class="doc-header">
            <span class="doc-tag">CMDLET GUIDE</span>
            <span class="doc-title">${Formatters.escapeHtml(targetCmdlet.name)}</span>
          </div>
          <div class="doc-synopsis">${Formatters.escapeHtml(targetCmdlet.synopsis)}</div>
          
          <div class="doc-section">
            <div class="doc-label">SYNTAX:</div>
            <div class="doc-syntax-box"><code>${Formatters.escapeHtml(targetCmdlet.syntax)}</code></div>
          </div>

          <div class="doc-section">
            <div class="doc-label">EXAMPLES:</div>
            <div class="doc-examples-box">${examplesHtml}</div>
          </div>
        </div>
      `;

      context.writeOutput(docHtml, 'table');
      return [];
    }
  },

  'Get-Member': {
    name: 'Get-Member',
    aliases: ['gm'],
    synopsis: 'Inspects the properties and data fields of objects.',
    description: 'Reveals all properties attached to incoming objects.',
    syntax: 'Get-Member [-InputObject <Object>]',
    parameters: [],
    examples: ['Get-StationModule | Get-Member', '$Tanks | gm'],
    execute: (input: any[], _args: CommandArgument[], _context: ExecutionContext) => {
      if (!input || input.length === 0) return [];

      const sample = wrapToPSObject(input[0]);
      const members: PSObject[] = [];

      for (const prop of sample.getProperties()) {
        members.push(new PSObject({
          Property: prop.name,
          DataType: prop.typeName || 'String'
        }, 'MemberInfo'));
      }

      return members;
    }
  },

  'Clear-Host': {
    name: 'Clear-Host',
    aliases: ['cls', 'clear'],
    synopsis: 'Clears the terminal screen.',
    description: 'Removes all previous command outputs.',
    syntax: 'Clear-Host',
    parameters: [],
    examples: ['Clear-Host', 'cls'],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      context.clearHost();
      return [];
    }
  },

  'Write-Output': {
    name: 'Write-Output',
    aliases: ['echo', 'write'],
    synopsis: 'Outputs text or objects to the terminal.',
    description: 'Emits values into the pipeline.',
    syntax: 'Write-Output [-InputObject] <Object[]>',
    parameters: [
      { name: 'InputObject', type: 'Object[]', required: true, positional: true, description: 'Text to output.' }
    ],
    examples: ["Write-Output 'System online'"],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      return args.map(a => a.value);
    }
  },

  'Get-Variable': {
    name: 'Get-Variable',
    aliases: ['gv'],
    synopsis: 'Gets stored variables in memory.',
    description: 'Retrieves all user-defined and system variables.',
    syntax: 'Get-Variable [[-Name] <String>]',
    parameters: [],
    examples: ['Get-Variable'],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const results: PSObject[] = [];
      let filter = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'name') filter = String(a.value).toLowerCase();
      }

      for (const [name, val] of context.variables.entries()) {
        if (filter && !name.toLowerCase().includes(filter)) continue;
        results.push(new PSObject({
          Name: `$${name}`,
          Value: typeof val === 'object' && val !== null ? (val instanceof PSObject ? val.toString() : '[Object]') : String(val)
        }, 'PSVariable'));
      }
      return results;
    }
  },

  'Set-Variable': {
    name: 'Set-Variable',
    aliases: ['sv', 'set'],
    synopsis: 'Sets the value of a variable.',
    description: 'Assigns a new value or object to a named variable.',
    syntax: 'Set-Variable [-Name] <String> [-Value] <Object>',
    parameters: [
      { name: 'Name', type: 'String', required: true, description: 'The name of the variable.' },
      { name: 'Value', type: 'Object', required: true, description: 'The value to store.' }
    ],
    examples: ["Set-Variable -Name ShieldPower -Value 100"],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let varName = '';
      let varValue: any = null;

      for (const a of args) {
        if (a.name?.toLowerCase() === 'name') varName = String(a.value);
        else if (a.name?.toLowerCase() === 'value') varValue = a.value;
        else if (!a.name) {
          if (!varName) varName = String(a.value);
          else varValue = a.value;
        }
      }

      if (varName) {
        context.variables.set(varName.replace(/^\$/, ''), varValue);
      }
      return [];
    }
  }
};
