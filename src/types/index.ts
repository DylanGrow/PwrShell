export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'VARIABLE'
  | 'PARAMETER'
  | 'PIPE'
  | 'COMPARISON'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'SEMICOLON'
  | 'COMMA'
  | 'AT'
  | 'HASH'
  | 'SCRIPTBLOCK'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
  start: number;
  end: number;
}

export type ASTNode =
  | PipelineNode
  | CommandNode
  | AssignmentNode
  | ExpressionNode
  | ScriptBlockNode;

export interface CommandArgument {
  name?: string; // e.g. "Property" for -Property
  value: any;
  isParameterName?: boolean;
}

export interface CommandNode {
  type: 'Command';
  name: string;
  arguments: CommandArgument[];
}

export interface PipelineNode {
  type: 'Pipeline';
  commands: CommandNode[];
}

export interface AssignmentNode {
  type: 'Assignment';
  variable: string;
  expression: ASTNode;
}

export interface ExpressionNode {
  type: 'Expression';
  value: any;
}

export interface ScriptBlockNode {
  type: 'ScriptBlock';
  body: string;
}

export interface PSProperty {
  name: string;
  value: any;
  typeName?: string;
}

export interface PSMethod {
  name: string;
  execute: (...args: any[]) => any;
  definition: string;
}

export interface PSObjectDefinition {
  typeName: string;
  properties: Record<string, any>;
  methods?: Record<string, (...args: any[]) => any>;
}

export interface CmdletParameterDoc {
  name: string;
  type: string;
  required: boolean;
  positional?: boolean;
  description: string;
}

export interface CmdletDefinition {
  name: string;
  aliases?: string[];
  synopsis: string;
  description: string;
  syntax: string;
  parameters: CmdletParameterDoc[];
  examples: string[];
  execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => Promise<any[]> | any[];
}

export interface ExecutionContext {
  variables: Map<string, any>;
  state: GameState;
  writeOutput: (text: string, type?: 'info' | 'success' | 'warning' | 'error' | 'table') => void;
  clearHost: () => void;
}

export interface StationModule {
  id: string;
  name: string;
  system: string;
  status: 'Online' | 'Offline' | 'Critical' | 'Warning' | 'Standby';
  powerLevel: number; // 0 to 100
  temperature: number; // in Celsius
  isQuarantined?: boolean;
  integrity: number; // 0 to 100
  sector: 'Alpha' | 'Beta' | 'Gamma' | 'Core' | 'Command';
}

export interface StationAirlock {
  id: string;
  location: string;
  isLocked: boolean;
  pressure: number; // kPa
  atmosphere: 'Normal' | 'Depressurized' | 'Contaminated';
}

export interface StationLog {
  timestamp: string;
  level: 'Info' | 'Warning' | 'Error' | 'Security';
  source: string;
  message: string;
  eventId: number;
}

export interface RepairDrone {
  id: string;
  status: 'Docked' | 'Deploying' | 'Active' | 'Returning';
  battery: number;
  currentTask: string;
  assignedSector: string;
}

export interface GameState {
  currentChapter: number;
  completedChapters: number[];
  modules: StationModule[];
  airlocks: StationAirlock[];
  logs: StationLog[];
  drones: RepairDrone[];
  oxygenLevel: number;
  reactorTemp: number;
  shieldIntegrity: number;
  powerSurgeControlled: boolean;
  beaconTransmitted: boolean;
  soundEnabled: boolean;
  crtEffectEnabled: boolean;
  badges: string[];
}

export interface MissionObjective {
  id: string;
  description: string;
  syntaxHint?: string;
  completed: boolean;
  verify: (state: GameState, lastOutput: any[], lastCommandText: string) => boolean;
}

export interface MissionChapter {
  id: number;
  title: string;
  subtitle: string;
  briefing: string;
  heliosIntro: string;
  heliosSuccess: string;
  conceptsTaught: string[];
  suggestedCmdlets: string[];
  hints: [string, string, string]; // [Conceptual, Syntax Template, Exact Solution]
  objectives: MissionObjective[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
