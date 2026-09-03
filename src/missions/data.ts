import { MissionChapter, GameState, Badge } from '../types';

export const BadgesList: Badge[] = [
  {
    id: 'first_command',
    title: 'Hello PowerShell',
    description: 'Executed your first PowerShell cmdlet.',
    icon: '⚡',
    unlocked: false
  },
  {
    id: 'object_scanner',
    title: 'Object Whisperer',
    description: 'Used Get-Member to inspect underlying object properties.',
    icon: '🔍',
    unlocked: false
  },
  {
    id: 'pipeline_master',
    title: 'Pipe Mechanic',
    description: 'Chained commands together using the object pipeline (|).',
    icon: '🔧',
    unlocked: false
  },
  {
    id: 'data_detective',
    title: 'Data Detective',
    description: 'Filtered, projected, and sorted station telemetry.',
    icon: '📊',
    unlocked: false
  },
  {
    id: 'quarantine_officer',
    title: 'Quarantine Officer',
    description: 'Successfully sealed compromised airlocks and purged toxins.',
    icon: '🛡️',
    unlocked: false
  },
  {
    id: 'station_savior',
    title: 'Station Savior',
    description: 'Defended Aegis-9 from the solar flare and broadcasted SOS.',
    icon: '🌟',
    unlocked: false
  }
];

export const MissionChapters: MissionChapter[] = [
  {
    id: 1,
    title: 'Waking Up',
    subtitle: 'Discovery & The Verb-Noun Rule',
    briefing: 'A power surge has knocked out the station grid and reset the AI console to emergency recovery mode. Start by discovering what cmdlets are available.',
    heliosIntro: "Technician! My subroutines are booting back up. In PowerShell, every command follows a friendly 'Verb-Noun' pattern like Get-Command or Get-Help. Let's test our console.",
    heliosSuccess: "Terminal link verified! Notice how intuitive Verb-Noun names are: 'Get' for finding things, 'Start' for booting, 'Repair' for fixing.",
    conceptsTaught: [
      'PowerShell Verb-Noun syntax (e.g. Get-Command, Get-Help)',
      'Discovering commands with Get-Command',
      'Getting documentation with Get-Help',
      'Clearing the screen with Clear-Host (cls)'
    ],
    suggestedCmdlets: ['Get-Command', 'Get-Help', 'Clear-Host'],
    hints: [
      "Run the command discovery tool to see what commands exist in the terminal.",
      "Type 'Get-Command' and press Enter, then try 'Get-Help Get-StationModule'.",
      "Get-Command"
    ],
    objectives: [
      {
        id: 'c1_obj1',
        description: 'Discover available cmdlets using Get-Command',
        syntaxHint: 'Get-Command',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower === 'get-command' || lower === 'gcm' || lower.startsWith('get-command ');
        }
      },
      {
        id: 'c1_obj2',
        description: 'Read the documentation for station modules using Get-Help',
        syntaxHint: 'Get-Help Get-StationModule',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (
            lower.includes('get-help') ||
            lower.startsWith('help ') ||
            lower.startsWith('man ')
          );
        }
      }
    ]
  },
  {
    id: 2,
    title: 'The Object Scanner',
    subtitle: 'Objects vs Flat Text & Get-Member',
    briefing: "Unlike older text shells that just print raw text, PowerShell commands output rich 'Objects' with distinct, queryable properties.",
    heliosIntro: "Welcome to the magic of PowerShell! When you run Get-StationModule, you don't get a dumb text block. You get real objects with properties like Name, Status, PowerLevel, and Sector. Let's inspect them with Get-Member!",
    heliosSuccess: "Outstanding! See those properties? In PowerShell, you never need to write brittle text-scraping regexes because you have direct access to structured properties.",
    conceptsTaught: [
      'Objects and Properties vs plain text',
      'The Get-Member (gm) object scanner',
      'Inspecting object data fields (Status, PowerLevel, Sector)'
    ],
    suggestedCmdlets: ['Get-StationModule', 'Get-Member'],
    hints: [
      "First run Get-StationModule to see all modules. Then pipe the result into Get-Member to see its inner properties.",
      "Use the pipe symbol (|) to send the output of Get-StationModule into Get-Member.",
      "Get-StationModule | Get-Member"
    ],
    objectives: [
      {
        id: 'c2_obj1',
        description: 'Retrieve station module diagnostics with Get-StationModule',
        syntaxHint: 'Get-StationModule',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower === 'get-stationmodule' || lower === 'gsm' || lower.startsWith('get-stationmodule ');
        }
      },
      {
        id: 'c2_obj2',
        description: 'Inspect the properties of station objects using Get-Member',
        syntaxHint: 'Get-StationModule | Get-Member',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower.includes('|') && (lower.includes('get-member') || lower.includes('gm'));
        }
      }
    ]
  },
  {
    id: 3,
    title: 'The Object Pipeline',
    subtitle: 'Where-Object & Chaining Actions',
    briefing: 'Several critical modules are reported Offline. Use the pipeline to filter for offline modules and automatically trigger repairs.',
    heliosIntro: "Emergency alert: Multiple life support pods and heat sinks are offline! Use 'Where-Object' to isolate only the systems with Status equal to 'Offline', then pipe them straight into 'Repair-System'.",
    heliosSuccess: "Repairs complete! Look at the station schematic—the life support modules are glowing green again!",
    conceptsTaught: [
      'The Pipe operator (|) passing live objects',
      'Where-Object filtering with comparison operators (-eq, -ne, -gt)',
      'Chaining query results directly into action cmdlets'
    ],
    suggestedCmdlets: ['Get-StationModule', 'Where-Object', 'Repair-System'],
    hints: [
      "Filter the modules with Where-Object Status -eq 'Offline'. Then pipe (|) the result into Repair-System.",
      "Combine three commands: Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System",
      "Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System"
    ],
    objectives: [
      {
        id: 'c3_obj1',
        description: "Filter offline modules using Where-Object Status -eq 'Offline'",
        syntaxHint: "Get-StationModule | Where-Object Status -eq 'Offline'",
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (
            lower.includes('get-stationmodule') &&
            (lower.includes('where-object') || lower.includes('where') || lower.includes('?')) &&
            lower.includes('offline')
          );
        }
      },
      {
        id: 'c3_obj2',
        description: 'Pipe the offline modules into Repair-System to restore them',
        syntaxHint: "Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          const hasRepaired = state.modules.some(m => m.status === 'Online' && m.integrity === 100);
          return lower.includes('repair-system') && hasRepaired;
        }
      }
    ]
  },
  {
    id: 4,
    title: 'Data Projection & Sorting',
    subtitle: 'Select-Object & Sort-Object',
    briefing: 'We need to analyze power consumption across the station to identify high-drain systems before rebooting the core.',
    heliosIntro: "Good sysadmins know how to slice and sort data. Let's use 'Select-Object' to choose only the columns we care about, and 'Sort-Object' to rank systems by power drain.",
    heliosSuccess: "Telemetry formatted perfectly! You can clearly see which systems are drawing the most wattage.",
    conceptsTaught: [
      'Projecting specific properties with Select-Object -Property',
      'Selecting the first N items with -First',
      'Sorting data with Sort-Object -Property ... -Descending'
    ],
    suggestedCmdlets: ['Select-Object', 'Sort-Object', 'Get-StationModule'],
    hints: [
      "Use Select-Object -Property Name, Status, PowerLevel to see clean columns.",
      "Pipe into Sort-Object -Property PowerLevel -Descending to find the biggest power consumers.",
      "Get-StationModule | Sort-Object -Property PowerLevel -Descending"
    ],
    objectives: [
      {
        id: 'c4_obj1',
        description: 'Project specific columns using Select-Object -Property Name, Status, PowerLevel',
        syntaxHint: 'Get-StationModule | Select-Object -Property Name, Status, PowerLevel',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (
            (lower.includes('select-object') || lower.includes('select')) &&
            lower.includes('name') &&
            lower.includes('powerlevel')
          );
        }
      },
      {
        id: 'c4_obj2',
        description: 'Sort modules in descending order by PowerLevel',
        syntaxHint: 'Get-StationModule | Sort-Object -Property PowerLevel -Descending',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (
            (lower.includes('sort-object') || lower.includes('sort')) &&
            lower.includes('powerlevel') &&
            lower.includes('desc')
          );
        }
      }
    ]
  },
  {
    id: 5,
    title: 'Telemetry & Calculations',
    subtitle: 'Measure-Object & Statistical Math',
    briefing: 'Before igniting the main plasma turbine, we must calculate the station-wide power average and total load.',
    heliosIntro: "PowerShell makes math effortless. With 'Measure-Object', you can calculate averages, sums, minimums, and maximums across hundreds of objects in one line!",
    heliosSuccess: "Calculations logged! Station environmental systems and load averages are within safe ignition parameters.",
    conceptsTaught: [
      'Measure-Object with -Sum and -Average switches',
      'Extracting mathematical statistics from object properties',
      'Environmental diagnostics with Get-LifeSupport'
    ],
    suggestedCmdlets: ['Measure-Object', 'Get-LifeSupport'],
    hints: [
      "Pipe Get-StationModule into Measure-Object with -Property PowerLevel and -Average.",
      "Add -Sum to calculate total grid wattage as well.",
      "Get-StationModule | Measure-Object -Property PowerLevel -Average -Sum"
    ],
    objectives: [
      {
        id: 'c5_obj1',
        description: 'Calculate average and sum of PowerLevel using Measure-Object',
        syntaxHint: 'Get-StationModule | Measure-Object -Property PowerLevel -Average -Sum',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (
            (lower.includes('measure-object') || lower.includes('measure')) &&
            lower.includes('powerlevel') &&
            (lower.includes('average') || lower.includes('sum'))
          );
        }
      },
      {
        id: 'c5_obj2',
        description: 'Query environmental life support status using Get-LifeSupport',
        syntaxHint: 'Get-LifeSupport',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower === 'get-lifesupport' || lower === 'gls' || lower.startsWith('get-lifesupport ');
        }
      }
    ]
  },
  {
    id: 6,
    title: 'Quarantine & Variables',
    subtitle: 'Variables ($) & Airlock Protocols',
    briefing: 'A ruptured specimen tube in Sector Gamma released airborne toxins! Inspect the airlocks, seal the contaminated area, and flush the scrubbers.',
    heliosIntro: "Hazard alert! Atmospheric toxins detected in Sector Gamma. Check airlock statuses with 'Get-AirlockStatus', seal the blast doors, and store the target sector in a variable like '$Target = \"Gamma\"' before purging.",
    heliosSuccess: "Sector Gamma purged and sanitized! Airlock seals held firm and the atmosphere is back to 100% breathable air.",
    conceptsTaught: [
      'Creating and referencing $variables in PowerShell',
      'Inspecting and locking airlock security bulkheads',
      'Executing parameterized actions (Purge-Contaminant -Sector ...)'
    ],
    suggestedCmdlets: ['Get-AirlockStatus', 'Lock-Door', 'Purge-Contaminant'],
    hints: [
      "Check airlocks with Get-AirlockStatus. Lock the contaminated airlock AL-03 with Lock-Door 'AL-03'.",
      "Purge the sector using Purge-Contaminant -Sector 'Gamma'.",
      "Purge-Contaminant -Sector 'Gamma'"
    ],
    objectives: [
      {
        id: 'c6_obj1',
        description: 'Check airlock seals with Get-AirlockStatus',
        syntaxHint: 'Get-AirlockStatus',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower.includes('get-airlockstatus') || lower.includes('gas');
        }
      },
      {
        id: 'c6_obj2',
        description: "Seal contaminated airlock with Lock-Door 'AL-03'",
        syntaxHint: "Lock-Door 'AL-03'",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          const al = state.airlocks.find(a => a.id === 'AL-03');
          return lower.includes('lock-door') && (al ? al.isLocked : false);
        }
      },
      {
        id: 'c6_obj3',
        description: "Flush toxins using Purge-Contaminant -Sector 'Gamma'",
        syntaxHint: "Purge-Contaminant -Sector 'Gamma'",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          const al = state.airlocks.find(a => a.id === 'AL-03');
          return lower.includes('purge-contaminant') && (al ? al.atmosphere === 'Normal' : true);
        }
      }
    ]
  },
  {
    id: 7,
    title: 'Automated Drones & Subspace Comms',
    subtitle: 'Fleet Automation & Communications',
    briefing: 'External hull micrometeoroid strikes require maintenance drone deployment and deep-space comms alignment.',
    heliosIntro: "We have automated maintenance drones standing by in the hangar bay. Let's deploy DR-01 to Sector Alpha for hull reinforcement and reboot our long-range subspace dish.",
    heliosSuccess: "Drone deployed and long-range communications synchronized! Earth Command is online.",
    conceptsTaught: [
      'Parameter binding with multiple arguments (-Id, -Sector)',
      'Automated service restarts (Restart-CommsArray)',
      'Real-time drone dispatching'
    ],
    suggestedCmdlets: ['Deploy-RepairDrone', 'Restart-CommsArray'],
    hints: [
      "Deploy drone DR-01 using: Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'",
      "Reboot the communications dish using: Restart-CommsArray",
      "Restart-CommsArray"
    ],
    objectives: [
      {
        id: 'c7_obj1',
        description: "Deploy drone DR-01 to Sector Alpha using Deploy-RepairDrone",
        syntaxHint: "Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          const drone = state.drones.find(d => d.id === 'DR-01');
          return lower.includes('deploy-repairdrone') && drone?.status === 'Active';
        }
      },
      {
        id: 'c7_obj2',
        description: 'Reboot the subspace transceiver with Restart-CommsArray',
        syntaxHint: 'Restart-CommsArray',
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          const comms = state.modules.find(m => m.system === 'Communications');
          return lower.includes('restart-commsarray') && comms?.status === 'Online';
        }
      }
    ]
  },
  {
    id: 8,
    title: 'Boss Mission: Solar Flare Defense',
    subtitle: 'Mastery Challenge',
    briefing: 'A coronal mass ejection from the nearby star is about to impact Aegis-9! Combine all your PowerShell skills: power up the generators, route maximum energy to shields, and transmit an emergency SOS.',
    heliosIntro: "SOLAR FLARE INCOMING! This is what we trained for, Technician! Start the main generator, route full wattage to Core defenses, and broadcast the distress beacon on 1420.405 MHz!",
    heliosSuccess: "SHIELDS DEFLECTED THE FLARE! The station is safe, telemetry is nominal, and rescue fleet signals confirm contact! You have officially graduated as an Aegis Master SysAdmin!",
    conceptsTaught: [
      'Full pipeline synthesis (Filtering, Action chaining, Parameterization)',
      'Core generator initialization (Start-Generator)',
      'Energy routing & Distress beacon dispatch'
    ],
    suggestedCmdlets: ['Start-Generator', 'Set-PowerRoute', 'Send-DistressBeacon'],
    hints: [
      "1. Run Start-Generator to ignite the main core.",
      "2. Run Set-PowerRoute -Sector 'Core' -Watts 100 to maximize shields.",
      "3. Run Send-DistressBeacon -Frequency '1420.405 MHz' to transmit the SOS signal."
    ],
    objectives: [
      {
        id: 'c8_obj1',
        description: 'Ignite main fusion power generator using Start-Generator',
        syntaxHint: 'Start-Generator',
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower.includes('start-generator') && state.powerSurgeControlled;
        }
      },
      {
        id: 'c8_obj2',
        description: "Route 100% power to Core defense shields using Set-PowerRoute",
        syntaxHint: "Set-PowerRoute -Sector 'Core' -Watts 100",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          const coreMod = state.modules.find(m => m.sector === 'Core');
          return lower.includes('set-powerroute') && (coreMod ? coreMod.powerLevel >= 90 : false);
        }
      },
      {
        id: 'c8_obj3',
        description: "Broadcast emergency SOS using Send-DistressBeacon -Frequency '1420.405 MHz'",
        syntaxHint: "Send-DistressBeacon -Frequency '1420.405 MHz'",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower.includes('send-distressbeacon') && state.beaconTransmitted;
        }
      }
    ]
  },
  {
    id: 9,
    title: 'Automated Incident Sweeper',
    subtitle: 'Compound Pipelines & Data Auditing',
    briefing: 'Cosmic micro-fractures have affected multiple sectors. Perform a full automated diagnostic sweep, filter by low integrity, and execute pipeline recovery.',
    heliosIntro: "Technician, let's test your advanced one-liner automation! Inspect security audit logs with 'Get-SecurityLog', filter for Errors, and execute a full station recovery sweep.",
    heliosSuccess: "Incredible automation! All audit alerts cleared and station health is fully restored.",
    conceptsTaught: [
      'Security event filtering (Get-SecurityLog -Level Error)',
      'Compound pipeline filtering and multi-criteria conditions',
      'End-to-end station recovery automation'
    ],
    suggestedCmdlets: ['Get-SecurityLog', 'Where-Object', 'Repair-System'],
    hints: [
      "Query error events using: Get-SecurityLog -Level 'Error'",
      "Sweep and repair all non-online modules in one line.",
      "Get-SecurityLog -Level 'Error'"
    ],
    objectives: [
      {
        id: 'c9_obj1',
        description: "Filter security logs for Errors using Get-SecurityLog -Level 'Error'",
        syntaxHint: "Get-SecurityLog -Level 'Error'",
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (lower.includes('get-securitylog') || lower.includes('gsl')) && lower.includes('error');
        }
      },
      {
        id: 'c9_obj2',
        description: "Perform automated repair sweep on all offline modules",
        syntaxHint: "Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System",
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower.includes('repair-system') && state.modules.every(m => m.status !== 'Offline');
        }
      }
    ]
  },
  {
    id: 10,
    title: 'Fleet Admiral Challenge',
    subtitle: 'Master Graduation Simulation',
    briefing: 'Final graduation trial: stabilize all sectors, ensure all airlocks are secure, and verify 100% station operational readiness.',
    heliosIntro: "This is your final trial, Technician! Demonstrate mastery over PowerShell object pipelines, telemetry measurement, and system routing. Achieve 100% station readiness to earn the Grand Admiral badge!",
    heliosSuccess: "🌟 CONGRATULATIONS! You have mastered PowerShell objects, pipelines, cmdlets, and automation scripting aboard Aegis-9. You are officially certified as a Fleet Chief SysAdmin!",
    conceptsTaught: [
      'Full PowerShell core mastery',
      'Systematic operational diagnostic routine',
      'Multi-stage pipeline coordination'
    ],
    suggestedCmdlets: ['Get-StationModule', 'Measure-Object', 'Get-LifeSupport'],
    hints: [
      "1. Measure total station power load with Measure-Object.",
      "2. Verify environmental status with Get-LifeSupport.",
      "Get-StationModule | Measure-Object -Property PowerLevel -Sum"
    ],
    objectives: [
      {
        id: 'c10_obj1',
        description: 'Calculate total station power consumption using Measure-Object -Sum',
        syntaxHint: 'Get-StationModule | Measure-Object -Property PowerLevel -Sum',
        completed: false,
        verify: (_state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return lower.includes('measure-object') && lower.includes('sum');
        }
      },
      {
        id: 'c10_obj2',
        description: 'Verify 100% environmental nominal status with Get-LifeSupport',
        syntaxHint: 'Get-LifeSupport',
        completed: false,
        verify: (state: GameState, _output: any[], cmd: string) => {
          const lower = cmd.toLowerCase().trim();
          return (lower.includes('get-lifesupport') || lower.includes('gls')) && state.oxygenLevel >= 90;
        }
      }
    ]
  }
];
