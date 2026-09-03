import { GameState } from '../types';

export interface Challenge {
  id: number;
  title: string;
  category: 'Basics' | 'Pipeline' | 'Filtering' | 'Properties' | 'Math & Stats' | 'Security & Airlocks' | 'Automation';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  goalText: string;
  syntaxTip?: string;
  hints: string[];
  solutions: string[];
  verify: (state: GameState, output: any[], cmd: string) => boolean;
}

export const ChallengesData: Challenge[] = [
  {
    id: 1,
    title: 'Hello PowerShell',
    category: 'Basics',
    difficulty: 'Easy',
    description: 'Welcome to PowerShell Command Challenge! Discover all available station cmdlets in your session.',
    goalText: "Run the command to list all available cmdlets in your terminal session.",
    syntaxTip: 'PowerShell uses Verb-Noun naming convention (e.g. Get-Command)',
    hints: [
      "Use the built-in discovery cmdlet: Get-Command",
      "You can also use its alias: gcm"
    ],
    solutions: ['Get-Command', 'gcm'],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower === 'get-command' || lower === 'gcm' || lower.startsWith('get-command ') || lower.startsWith('gcm ');
    }
  },
  {
    id: 2,
    title: 'Read Documentation',
    category: 'Basics',
    difficulty: 'Easy',
    description: 'Learn how to use any cmdlet by viewing its documentation and parameter syntax.',
    goalText: "View the help documentation for the 'Get-StationModule' cmdlet.",
    syntaxTip: "Use 'Get-Help <Cmdlet-Name>' or 'help <Cmdlet-Name>'",
    hints: [
      "Type: Get-Help Get-StationModule",
      "Or use the alias: help Get-StationModule"
    ],
    solutions: ['Get-Help Get-StationModule', 'help Get-StationModule', 'man Get-StationModule'],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-help') || lower.includes('help') || lower.includes('man')) && lower.includes('get-stationmodule');
    }
  },
  {
    id: 3,
    title: 'Scan Station Systems',
    category: 'Basics',
    difficulty: 'Easy',
    description: 'Station Aegis-9 needs a diagnostic check. List all module records.',
    goalText: "Retrieve the full list of station modules.",
    hints: [
      "Run the station diagnostic cmdlet: Get-StationModule",
      "Alias: gsm"
    ],
    solutions: ['Get-StationModule', 'gsm'],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower === 'get-stationmodule' || lower === 'gsm' || lower.startsWith('get-stationmodule ');
    }
  },
  {
    id: 4,
    title: 'Inspect Object Structure',
    category: 'Properties',
    difficulty: 'Easy',
    description: 'In PowerShell, everything is an Object with properties. Inspect the properties and data types of station modules.',
    goalText: "Pipe the station modules into 'Get-Member' to discover their properties.",
    syntaxTip: "Use the pipeline (|) to send output into Get-Member",
    hints: [
      "Get-StationModule | Get-Member",
      "Or alias: gsm | gm"
    ],
    solutions: ['Get-StationModule | Get-Member', 'gsm | gm', 'Get-StationModule | gm'],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-stationmodule') || lower.includes('gsm')) && (lower.includes('get-member') || lower.includes('gm'));
    }
  },
  {
    id: 5,
    title: 'Filter Offline Modules',
    category: 'Filtering',
    difficulty: 'Easy',
    description: 'Filter the station stream so only modules with Status equal to "Offline" are returned.',
    goalText: "Filter modules where Status is 'Offline' using Where-Object.",
    syntaxTip: "Where-Object Status -eq 'Offline' or Where-Object {$_.Status -eq 'Offline'}",
    hints: [
      "Get-StationModule | Where-Object Status -eq 'Offline'",
      "You can also use the alias '?' for Where-Object: Get-StationModule | ? Status -eq 'Offline'"
    ],
    solutions: [
      "Get-StationModule | Where-Object Status -eq 'Offline'",
      "Get-StationModule | ? Status -eq 'Offline'",
      "gsm | ? Status -eq 'Offline'"
    ],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('where-object') || lower.includes('where') || lower.includes('?')) && lower.includes('offline');
    }
  },
  {
    id: 6,
    title: 'Pipeline Auto-Repair',
    category: 'Pipeline',
    difficulty: 'Medium',
    description: 'Stream all offline modules directly into Repair-System to fix them in one command.',
    goalText: "Find all offline modules and pipe them into Repair-System.",
    syntaxTip: "Chain Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System",
    hints: [
      "Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System",
      "Short form: gsm | ? Status -eq 'Offline' | Repair-System"
    ],
    solutions: [
      "Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System",
      "Get-StationModule | ? Status -eq 'Offline' | Repair-System"
    ],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('repair-system') && state.modules.every(m => m.status !== 'Offline');
    }
  },
  {
    id: 7,
    title: 'Select Specific Columns',
    category: 'Properties',
    difficulty: 'Easy',
    description: 'Reduce visual noise by selecting only the Name and PowerLevel properties.',
    goalText: "Select only the 'Name' and 'PowerLevel' properties from station modules.",
    syntaxTip: "Select-Object -Property Name, PowerLevel",
    hints: [
      "Get-StationModule | Select-Object -Property Name, PowerLevel",
      "Alias: gsm | select Name, PowerLevel"
    ],
    solutions: [
      "Get-StationModule | Select-Object -Property Name, PowerLevel",
      "Get-StationModule | select Name, PowerLevel"
    ],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('select-object') || lower.includes('select')) && lower.includes('name') && lower.includes('powerlevel');
    }
  },
  {
    id: 8,
    title: 'Limit First 3 Records',
    category: 'Filtering',
    difficulty: 'Easy',
    description: 'Grab only the first 3 modules from the station stream.',
    goalText: "Output only the first 3 station modules using Select-Object -First 3.",
    hints: [
      "Get-StationModule | Select-Object -First 3",
      "Alias: gsm | select -First 3"
    ],
    solutions: [
      "Get-StationModule | Select-Object -First 3",
      "Get-StationModule | select -First 3"
    ],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('select-object') || lower.includes('select')) && (lower.includes('-first 3') || lower.includes('-first3'));
    }
  },
  {
    id: 9,
    title: 'Sort by Power Consumption',
    category: 'Filtering',
    difficulty: 'Medium',
    description: 'Sort the modules from highest power consumption to lowest.',
    goalText: "Sort modules by PowerLevel in descending order.",
    syntaxTip: "Sort-Object -Property PowerLevel -Descending",
    hints: [
      "Get-StationModule | Sort-Object -Property PowerLevel -Descending",
      "Alias: gsm | sort PowerLevel -Descending"
    ],
    solutions: [
      "Get-StationModule | Sort-Object -Property PowerLevel -Descending",
      "Get-StationModule | sort PowerLevel -Descending"
    ],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('sort-object') || lower.includes('sort')) && lower.includes('powerlevel') && lower.includes('descending');
    }
  },
  {
    id: 10,
    title: 'Calculate Total Power Load',
    category: 'Math & Stats',
    difficulty: 'Medium',
    description: 'PowerShell can calculate sums and averages directly on object properties.',
    goalText: "Calculate the Sum and Average of PowerLevel across all modules.",
    syntaxTip: "Measure-Object -Property PowerLevel -Sum -Average",
    hints: [
      "Get-StationModule | Measure-Object -Property PowerLevel -Sum -Average",
      "Alias: gsm | measure PowerLevel -Sum -Average"
    ],
    solutions: [
      "Get-StationModule | Measure-Object -Property PowerLevel -Sum -Average",
      "Get-StationModule | measure PowerLevel -Sum -Average"
    ],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('measure-object') || lower.includes('measure')) && lower.includes('powerlevel') && (lower.includes('sum') || lower.includes('average'));
    }
  },
  {
    id: 11,
    title: 'Check Airlock Security',
    category: 'Security & Airlocks',
    difficulty: 'Easy',
    description: 'Atmospheric containment requires monitoring all airlock portals.',
    goalText: "Retrieve the status of all station airlocks.",
    hints: [
      "Run: Get-AirlockStatus",
      "Alias: gas"
    ],
    solutions: ['Get-AirlockStatus', 'gas'],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower === 'get-airlockstatus' || lower === 'gas' || lower.startsWith('get-airlockstatus ');
    }
  },
  {
    id: 12,
    title: 'Lock Contaminated Door',
    category: 'Security & Airlocks',
    difficulty: 'Medium',
    description: 'Airlock AL-03 in Sector Gamma has detected toxins! Seal the blast door.',
    goalText: "Lock airlock door 'AL-03' using Lock-Door.",
    syntaxTip: "Lock-Door -Id 'AL-03' or Lock-Door 'AL-03'",
    hints: [
      "Lock-Door 'AL-03'",
      "Lock-Door -Id 'AL-03'"
    ],
    solutions: ["Lock-Door 'AL-03'", "Lock-Door -Id 'AL-03'"],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const al = state.airlocks.find(a => a.id === 'AL-03');
      return lower.includes('lock-door') && (al ? al.isLocked : false);
    }
  },
  {
    id: 13,
    title: 'Purge Toxic Atmosphere',
    category: 'Security & Airlocks',
    difficulty: 'Medium',
    description: 'Flush atmospheric contaminants from Sector Gamma.',
    goalText: "Purge toxins in Sector Gamma using Purge-Contaminant.",
    syntaxTip: "Purge-Contaminant -Sector 'Gamma'",
    hints: [
      "Purge-Contaminant -Sector 'Gamma'",
      "Purge-Contaminant 'Gamma'"
    ],
    solutions: ["Purge-Contaminant -Sector 'Gamma'", "Purge-Contaminant 'Gamma'"],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const al = state.airlocks.find(a => a.id === 'AL-03');
      return lower.includes('purge-contaminant') && (al ? al.atmosphere === 'Normal' : true);
    }
  },
  {
    id: 14,
    title: 'Store Objects in Variables',
    category: 'Pipeline',
    difficulty: 'Medium',
    description: 'PowerShell variables start with $. Store the list of offline modules into a variable named $Tanks.',
    goalText: "Assign the filtered offline modules into variable $Tanks.",
    syntaxTip: "$Tanks = Get-StationModule | Where-Object Status -eq 'Offline'",
    hints: [
      "$Tanks = Get-StationModule | Where-Object Status -eq 'Offline'",
      "Or $Tanks = Get-StationModule"
    ],
    solutions: [
      "$Tanks = Get-StationModule | Where-Object Status -eq 'Offline'",
      "$Tanks = Get-StationModule"
    ],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.startsWith('$tanks') && lower.includes('=');
    }
  },
  {
    id: 15,
    title: 'Deploy Repair Drone',
    category: 'Automation',
    difficulty: 'Medium',
    description: 'Deploy maintenance drone DR-01 to reinforce Sector Alpha hull plates.',
    goalText: "Deploy drone 'DR-01' to Sector 'Alpha'.",
    syntaxTip: "Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'",
    hints: [
      "Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'",
      "Deploy-RepairDrone 'DR-01' 'Alpha'"
    ],
    solutions: ["Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'"],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const drone = state.drones.find(d => d.id === 'DR-01');
      return lower.includes('deploy-repairdrone') && drone?.status === 'Active';
    }
  },
  {
    id: 16,
    title: 'Reboot Long-Range Comms',
    category: 'Automation',
    difficulty: 'Easy',
    description: 'Re-align the high-gain subspace transceiver dish.',
    goalText: "Restart the station communications array.",
    hints: [
      "Run: Restart-CommsArray"
    ],
    solutions: ['Restart-CommsArray'],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const comms = state.modules.find(m => m.system === 'Communications');
      return lower.includes('restart-commsarray') && comms?.status === 'Online';
    }
  },
  {
    id: 17,
    title: 'Ignite Fusion Reactor',
    category: 'Automation',
    difficulty: 'Easy',
    description: 'Boot up the station primary fusion power generator.',
    goalText: "Ignite the power generator using Start-Generator.",
    hints: [
      "Run: Start-Generator"
    ],
    solutions: ['Start-Generator'],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('start-generator') && state.powerSurgeControlled;
    }
  },
  {
    id: 18,
    title: 'Reroute Core Power',
    category: 'Automation',
    difficulty: 'Medium',
    description: 'Direct 100% wattage to the Core sector defense grid.',
    goalText: "Set power routing for Sector 'Core' to 100 Watts.",
    syntaxTip: "Set-PowerRoute -Sector 'Core' -Watts 100",
    hints: [
      "Set-PowerRoute -Sector 'Core' -Watts 100"
    ],
    solutions: ["Set-PowerRoute -Sector 'Core' -Watts 100"],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      const coreMod = state.modules.find(m => m.sector === 'Core');
      return lower.includes('set-powerroute') && (coreMod ? coreMod.powerLevel >= 90 : false);
    }
  },
  {
    id: 19,
    title: 'Audit Error Logs',
    category: 'Security & Airlocks',
    difficulty: 'Medium',
    description: 'Inspect station security audit logs specifically for Error-level events.',
    goalText: "Filter security logs for events where Level is 'Error'.",
    syntaxTip: "Get-SecurityLog -Level 'Error'",
    hints: [
      "Get-SecurityLog -Level 'Error'",
      "Alias: gsl -Level 'Error'"
    ],
    solutions: ["Get-SecurityLog -Level 'Error'", "gsl -Level 'Error'"],
    verify: (_state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return (lower.includes('get-securitylog') || lower.includes('gsl')) && lower.includes('error');
    }
  },
  {
    id: 20,
    title: 'Broadcast SOS Beacon',
    category: 'Automation',
    difficulty: 'Medium',
    description: 'Transmit the emergency distress beacon on hydrogen line frequency 1420.405 MHz.',
    goalText: "Transmit the distress signal on frequency '1420.405 MHz'.",
    syntaxTip: "Send-DistressBeacon -Frequency '1420.405 MHz'",
    hints: [
      "Send-DistressBeacon -Frequency '1420.405 MHz'"
    ],
    solutions: ["Send-DistressBeacon -Frequency '1420.405 MHz'"],
    verify: (state, _output, cmd) => {
      const lower = cmd.toLowerCase().trim();
      return lower.includes('send-distressbeacon') && state.beaconTransmitted;
    }
  }
];
