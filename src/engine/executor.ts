import { ASTNode, CmdletDefinition, ExecutionContext, GameState, PipelineNode, AssignmentNode } from '../types';
import { Parser } from './parser';
import { PSObject, wrapToPSObject } from './psobject';
import { Formatters, FormattedOutput } from './formatters';
import { CoreCmdlets } from './cmdlets/core';
import { FilesystemCmdlets } from './cmdlets/filesystem';
import { TextCmdlets } from './cmdlets/text';
import { DataCmdlets } from './cmdlets/data';
import { SystemCmdlets } from './cmdlets/system';
import { VirtualFileSystem } from './vfs';
import { Diagnoser, DiagnosticAdvice } from './diagnoser';

export interface PipelineStageInfo {
  name: string;
  inCount: number;
  outCount: number;
  type: 'source' | 'filter' | 'action' | 'measure' | 'select' | 'sort';
}

export interface ExecutionResult {
  success: boolean;
  output: any[];
  formattedHtml?: string;
  rawText?: string;
  error?: string;
  diagnosticAdvice?: DiagnosticAdvice;
  pipelineStages?: PipelineStageInfo[];
}

export class Executor {
  private cmdlets: Map<string, CmdletDefinition> = new Map();
  private aliases: Map<string, string> = new Map();
  private variables: Map<string, any> = new Map();
  private state: GameState;
  private vfs: VirtualFileSystem;
  private onOutput?: (text: string, type: 'info' | 'success' | 'warning' | 'error' | 'table') => void;
  private onClear?: () => void;

  constructor(
    state: GameState,
    vfs?: VirtualFileSystem,
    onOutput?: (text: string, type: 'info' | 'success' | 'warning' | 'error' | 'table') => void,
    onClear?: () => void
  ) {
    this.state = state;
    this.vfs = vfs || new VirtualFileSystem();
    this.onOutput = onOutput;
    this.onClear = onClear;

    this.registerAllCmdlets();
    this.initializeDefaultVariables();
  }

  public getVFS(): VirtualFileSystem {
    return this.vfs;
  }

  private registerAllCmdlets(): void {
    const fs = FilesystemCmdlets(this.vfs);
    const txt = TextCmdlets(this.vfs);
    const dt = DataCmdlets(this.vfs);
    const all = { ...CoreCmdlets, ...fs, ...txt, ...dt, ...SystemCmdlets };

    for (const [name, def] of Object.entries(all)) {
      this.cmdlets.set(name.toLowerCase(), def);
      if (def.aliases) {
        for (const a of def.aliases) {
          this.aliases.set(a.toLowerCase(), name.toLowerCase());
        }
      }
    }
  }

  private initializeDefaultVariables(): void {
    this.variables.set('true', true);
    this.variables.set('false', false);
    this.variables.set('null', null);
    this.variables.set('PWD', new PSObject({ Path: this.vfs.getCurrentPath(), ProviderPath: this.vfs.getCurrentPath() }, 'PathInfo'));
    this.variables.set('PSVersionTable', new PSObject({
      PSVersion: '7.4.2',
      PSEdition: 'Core',
      Platform: 'Browser-Wasm',
      OS: 'Microsoft Windows 11'
    }, 'PSVersionTable'));
  }

  public async execute(rawInput: string): Promise<ExecutionResult> {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { success: true, output: [] };
    }

    // Support multiple commands separated by semicolon
    if (trimmed.includes(';') && !trimmed.includes('{')) {
      const parts = trimmed.split(';').map(p => p.trim()).filter(p => p.length > 0);
      let lastResult: ExecutionResult = { success: true, output: [] };
      for (const part of parts) {
        lastResult = await this.executeSingle(part);
        if (!lastResult.success) return lastResult;
      }
      return lastResult;
    }

    return await this.executeSingle(trimmed);
  }

  private async executeSingle(rawInput: string): Promise<ExecutionResult> {
    let ast: ASTNode | null = null;
    try {
      ast = Parser.parse(rawInput);
    } catch (err: any) {
      const advice = Diagnoser.diagnose(rawInput, err?.message || '', this.getAvailableCmdletNames());
      return {
        success: false,
        output: [],
        error: `Syntax Error: ${err?.message || 'Invalid PowerShell expression'}`,
        diagnosticAdvice: advice
      };
    }

    if (!ast) {
      return { success: true, output: [] };
    }

    if (ast.type === 'Assignment') {
      const assign = ast as AssignmentNode;
      const expr: PipelineNode = assign.expression.type === 'Pipeline'
        ? (assign.expression as PipelineNode)
        : { type: 'Pipeline', commands: [assign.expression as any] };

      const subResult = await this.evaluatePipeline(expr, rawInput);
      if (!subResult.success) return subResult;

      const val = subResult.output.length === 1 ? subResult.output[0] : subResult.output;
      this.variables.set(assign.variable.replace(/^\$/, ''), val);

      return {
        success: true,
        output: subResult.output,
        formattedHtml: subResult.formattedHtml,
        rawText: subResult.rawText
      };
    }

    if (ast.type === 'Pipeline') {
      return await this.evaluatePipeline(ast as PipelineNode, rawInput);
    }

    return { success: true, output: [] };
  }

  private async evaluatePipeline(pipeline: PipelineNode, rawInput: string): Promise<ExecutionResult> {
    let currentStream: any[] = [];

    const context: ExecutionContext = {
      variables: this.variables,
      state: this.state,
      writeOutput: (text, type = 'info') => {
        if (this.onOutput) this.onOutput(text, type);
      },
      clearHost: () => {
        if (this.onClear) this.onClear();
      }
    };
    (context as any).allCmdlets = this.cmdlets;
    (context as any).executor = this;

    const stages: PipelineStageInfo[] = [];

    for (let i = 0; i < pipeline.commands.length; i++) {
      const cmdNode = pipeline.commands[i];
      const inCount = currentStream.length;
      // Check if command is a range expression (e.g. 1..100 | ...)
      const rangeMatch = cmdNode.name.match(/^(\d+)\.\.(\d+)$/);
      if (rangeMatch) {
        const startNum = parseInt(rangeMatch[1], 10);
        const endNum = parseInt(rangeMatch[2], 10);
        const rangeArr: number[] = [];
        if (startNum <= endNum) {
          for (let n = startNum; n <= endNum; n++) rangeArr.push(n);
        } else {
          for (let n = startNum; n >= endNum; n--) rangeArr.push(n);
        }
        currentStream = rangeArr;
        stages.push({
          name: cmdNode.name,
          inCount: 0,
          outCount: currentStream.length,
          type: 'source'
        });
        continue;
      }

      // Check if command is a variable reference (e.g. $stopped | ... or $PSVersionTable.PSVersion)
      if (cmdNode.name.startsWith('$')) {
        const rawVar = cmdNode.name.substring(1);
        let val: any;
        if (rawVar.includes('.')) {
          const parts = rawVar.split('.');
          const baseName = parts[0];
          val = this.variables.get(baseName);
          for (let pIdx = 1; pIdx < parts.length; pIdx++) {
            const prop = parts[pIdx];
            if (val instanceof PSObject) {
              val = val.getProperty(prop);
            } else if (val && typeof val === 'object') {
              val = val[prop];
            } else {
              val = undefined;
            }
          }
        } else {
          val = this.variables.get(rawVar);
        }
        currentStream = Array.isArray(val) ? val : (val !== undefined ? [val] : []);
        stages.push({
          name: cmdNode.name,
          inCount: 0,
          outCount: currentStream.length,
          type: 'source'
        });
        continue;
      }

      const cmdDef = this.getCmdlet(cmdNode.name);

      if (!cmdDef) {
        if (i === 0 && cmdNode.arguments.length === 0) {
          let literalVal: any = cmdNode.name;
          if (!isNaN(Number(cmdNode.name)) && cmdNode.name.trim() !== '') {
            literalVal = Number(cmdNode.name);
          } else if (cmdNode.name.toLowerCase() === 'true') {
            literalVal = true;
          } else if (cmdNode.name.toLowerCase() === 'false') {
            literalVal = false;
          }
          currentStream = [literalVal];
          stages.push({
            name: cmdNode.name,
            inCount: 0,
            outCount: 1,
            type: 'source'
          });
          continue;
        }

        const advice = Diagnoser.diagnose(rawInput, `The term '${cmdNode.name}' is not recognized as the name of a cmdlet.`, this.getAvailableCmdletNames());
        return {
          success: false,
          output: [],
          error: `The term '${cmdNode.name}' is not recognized as the name of a cmdlet, function, or script file. Check spelling and try again.`,
          diagnosticAdvice: advice
        };
      }

      const resolvedArgs = cmdNode.arguments.map(arg => {
        if (arg.value && typeof arg.value === 'object' && arg.value.isVariable) {
          const varVal = this.variables.get(arg.value.name);
          return { ...arg, value: varVal };
        }
        return arg;
      });

      const lowerName = cmdDef.name.toLowerCase();
      let stageType: 'source' | 'filter' | 'action' | 'measure' | 'select' | 'sort' = 'source';
      if (lowerName.includes('where')) stageType = 'filter';
      else if (lowerName.includes('select')) stageType = 'select';
      else if (lowerName.includes('sort')) stageType = 'sort';
      else if (lowerName.includes('measure') || lowerName.includes('group')) stageType = 'measure';

      try {
        const output = await cmdDef.execute(currentStream, resolvedArgs, context);
        currentStream = Array.isArray(output) ? output : (output !== undefined ? [output] : []);
        stages.push({
          name: cmdDef.name,
          inCount: inCount,
          outCount: currentStream.length,
          type: stageType
        });
      } catch (err: any) {
        return {
          success: false,
          output: [],
          error: `Error executing '${cmdDef.name}': ${err?.message || err}`,
          diagnosticAdvice: Diagnoser.diagnose(rawInput, err?.message || '', this.getAvailableCmdletNames())
        };
      }
    }

    // Format output if stream is not empty
    let formatted: FormattedOutput | undefined;
    if (currentStream.length > 0) {
      const first = currentStream[0];
      const isPlainObject = typeof first === 'object' && first !== null;
      const isPrimitive = typeof first === 'string' || typeof first === 'number' || typeof first === 'boolean';

      if (isPrimitive) {
        const text = currentStream.join('\n');
        formatted = {
          html: `<div class="ps-raw-text">${text}</div>`,
          rawText: text
        };
      } else if (isPlainObject) {
        const psObj = wrapToPSObject(first);
        const propCount = psObj.getProperties().length;
        if (propCount > 6) {
          formatted = Formatters.formatList(currentStream);
        } else {
          formatted = Formatters.formatTable(currentStream);
        }
      }
    }

    return {
      success: true,
      output: currentStream,
      formattedHtml: formatted?.html,
      rawText: formatted?.rawText,
      pipelineStages: stages
    };
  }

  public getCmdlet(name: string): CmdletDefinition | undefined {
    const lower = name.toLowerCase();
    const resolvedName = this.aliases.get(lower) || lower;
    return this.cmdlets.get(resolvedName);
  }

  public getAvailableCmdletNames(): string[] {
    const names = Array.from(this.cmdlets.values()).map(c => c.name);
    const aliasNames = Array.from(this.aliases.keys());
    return Array.from(new Set([...names, ...aliasNames]));
  }
}
