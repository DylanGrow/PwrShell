import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject, wrapToPSObject } from '../psobject';

export const StationCmdlets: Record<string, CmdletDefinition> = {
  'Get-StationModule': {
    name: 'Get-StationModule',
    aliases: ['gsm', 'Get-Modules'],
    synopsis: 'Retrieves diagnostic status of orbital station modules.',
    description: 'Lists all life support, reactor, communications, and defense modules aboard the Aegis-9 station, including power levels, status, temperature, and sectors.',
    syntax: 'Get-StationModule [[-Sector] <String>] [-Status <String>]',
    parameters: [
      { name: 'Sector', type: 'String', required: false, positional: true, description: 'Filter by sector (Alpha, Beta, Gamma, Core, Command).' },
      { name: 'Status', type: 'String', required: false, description: 'Filter by status (Online, Offline, Critical, Warning, Standby).' }
    ],
    examples: [
      'Get-StationModule',
      "Get-StationModule -Sector Alpha",
      "Get-StationModule | Where-Object Status -eq 'Offline'"
    ],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let sectorFilter = '';
      let statusFilter = '';

      for (const a of args) {
        if (a.name?.toLowerCase() === 'sector') sectorFilter = String(a.value).toLowerCase();
        else if (a.name?.toLowerCase() === 'status') statusFilter = String(a.value).toLowerCase();
        else if (!a.name && typeof a.value === 'string' && !a.isParameterName) {
          sectorFilter = a.value.toLowerCase();
        }
      }

      let modules = context.state.modules;

      if (sectorFilter) {
        modules = modules.filter(m => m.sector.toLowerCase() === sectorFilter);
      }
      if (statusFilter) {
        modules = modules.filter(m => m.status.toLowerCase() === statusFilter);
      }

      return modules.map(m => new PSObject({
        Id: m.id,
        Name: m.name,
        System: m.system,
        Status: m.status,
        PowerLevel: m.powerLevel,
        Temperature: m.temperature,
        Integrity: m.integrity,
        Sector: m.sector
      }, 'StationModule'));
    }
  },

  'Repair-System': {
    name: 'Repair-System',
    aliases: ['repair', 'Fix-System'],
    synopsis: 'Repairs and recalibrates damaged station systems.',
    description: 'Executes automated diagnostic and repair sequences on specified modules or piped module objects.',
    syntax: 'Repair-System [-Id] <String> | [-InputObject <PSObject>]',
    parameters: [
      { name: 'Id', type: 'String', required: false, positional: true, description: 'The unique ID or Name of the system to repair.' }
    ],
    examples: [
      "Repair-System -Id 'MOD-O2-01'",
      "Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System"
    ],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const targets: string[] = [];

      // Accept from pipeline
      if (input && input.length > 0) {
        for (const item of input) {
          const ps = wrapToPSObject(item);
          const id = ps.getProperty('Id') || ps.getProperty('Name');
          if (id) targets.push(String(id));
        }
      }

      // Accept from arguments
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'id' || a.name.toLowerCase() === 'name') {
          if (typeof a.value === 'string') targets.push(a.value);
        }
      }

      if (targets.length === 0) {
        context.writeOutput('Repair-System: Missing system identifier. Provide -Id or pipe modules into Repair-System.', 'error');
        return [];
      }

      const results: PSObject[] = [];

      for (const target of targets) {
        const mod = context.state.modules.find(
          m => m.id.toLowerCase() === target.toLowerCase() || m.name.toLowerCase() === target.toLowerCase()
        );

        if (mod) {
          mod.status = 'Online';
          mod.integrity = 100;
          mod.powerLevel = Math.max(mod.powerLevel, 75);
          mod.temperature = 22; // normal room temp

          results.push(new PSObject({
            Id: mod.id,
            Name: mod.name,
            Status: 'Online',
            Result: 'Success: Calibrated and Online',
            Integrity: 100
          }, 'RepairResult'));
        } else {
          results.push(new PSObject({
            Id: target,
            Name: 'Unknown',
            Status: 'Failed',
            Result: 'Error: Module not found on station grid',
            Integrity: 0
          }, 'RepairResult'));
        }
      }

      // Recalculate oxygen and station metrics
      updateStationVitals(context.state);

      return results;
    }
  },

  'Start-Generator': {
    name: 'Start-Generator',
    aliases: ['Power-On'],
    synopsis: 'Engages auxiliary and core fusion power generators.',
    description: 'Initializes magnetic confinement field and ignites reactor plasma turbines.',
    syntax: 'Start-Generator [[-CoreId] <String>]',
    parameters: [
      { name: 'CoreId', type: 'String', required: false, positional: true, description: 'The generator core to start.' }
    ],
    examples: ['Start-Generator', "Start-Generator -CoreId 'GEN-01'"],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      const gen = context.state.modules.find(m => m.system === 'Power' || m.id.includes('GEN') || m.id.includes('PWR'));
      if (gen) {
        gen.status = 'Online';
        gen.powerLevel = 100;
        gen.integrity = 100;
        context.state.powerSurgeControlled = true;
      }
      updateStationVitals(context.state);

      context.writeOutput('Generator turbine ignited: Output stabilized at 100%. Main power grid restored.', 'success');
      return [
        new PSObject({
          System: 'Fusion Generator',
          Status: 'Online',
          GridLoad: '42.8 kW',
          Efficiency: '99.4%'
        }, 'PowerStatus')
      ];
    }
  },

  'Stop-Generator': {
    name: 'Stop-Generator',
    synopsis: 'Performs controlled shutdown of station generator units.',
    description: 'Ramps down magnetic confinement field to safe standby.',
    syntax: 'Stop-Generator',
    parameters: [],
    examples: ['Stop-Generator'],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      context.writeOutput('Warning: Main generator switched to Standby mode.', 'warning');
      return [];
    }
  },

  'Set-PowerRoute': {
    name: 'Set-PowerRoute',
    synopsis: 'Directs energy distribution to specific station sectors.',
    description: 'Allocates wattage between Life Support, Defense Shields, Comms, and Engines.',
    syntax: 'Set-PowerRoute -Sector <String> -Watts <Int>',
    parameters: [
      { name: 'Sector', type: 'String', required: true, description: 'Sector name (Alpha, Beta, Gamma, Core, Command).' },
      { name: 'Watts', type: 'Int', required: true, description: 'Wattage level (0-100).' }
    ],
    examples: [
      "Set-PowerRoute -Sector 'Core' -Watts 90",
      "Set-PowerRoute -Sector 'Alpha' -Watts 100"
    ],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let targetSector = '';
      let watts = 0;

      for (const a of args) {
        if (a.name?.toLowerCase() === 'sector') targetSector = String(a.value);
        else if (a.name?.toLowerCase() === 'watts' || a.name?.toLowerCase() === 'power') watts = Number(a.value);
        else if (!a.name) {
          if (!targetSector) targetSector = String(a.value);
          else watts = Number(a.value);
        }
      }

      if (!targetSector) {
        context.writeOutput('Set-PowerRoute: Target sector required (Alpha, Beta, Gamma, Core, Command).', 'error');
        return [];
      }

      const mods = context.state.modules.filter(m => m.sector.toLowerCase() === targetSector.toLowerCase());
      for (const m of mods) {
        m.powerLevel = Math.min(100, Math.max(0, watts));
        if (m.powerLevel > 20 && m.status === 'Offline') {
          m.status = 'Online';
        }
      }

      updateStationVitals(context.state);

      context.writeOutput(`Power routing updated: Sector [${targetSector}] power set to ${watts}%.`, 'success');
      return [
        new PSObject({
          Sector: targetSector,
          AllocatedPower: `${watts}%`,
          ActiveModules: mods.length,
          Status: 'Rerouted'
        }, 'PowerRouteResult')
      ];
    }
  },

  'Get-AirlockStatus': {
    name: 'Get-AirlockStatus',
    aliases: ['gas', 'Get-Airlocks'],
    synopsis: 'Checks airlock seals, cabin pressure, and atmospheric composition.',
    description: 'Retrieves pressure telemetry and security lock states across all station bulkheads.',
    syntax: 'Get-AirlockStatus [[-Location] <String>]',
    parameters: [
      { name: 'Location', type: 'String', required: false, positional: true, description: 'Filter airlocks by location.' }
    ],
    examples: ['Get-AirlockStatus', "Get-AirlockStatus -Location 'Sector-Gamma'"],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      return context.state.airlocks.map(a => new PSObject({
        Id: a.id,
        Location: a.location,
        IsLocked: a.isLocked,
        Pressure: `${a.pressure} kPa`,
        Atmosphere: a.atmosphere
      }, 'AirlockStatus'));
    }
  },

  'Lock-Door': {
    name: 'Lock-Door',
    aliases: ['Lock-Airlock'],
    synopsis: 'Engages magnetic blast seals on station airlocks.',
    description: 'Locks specified doors and seals bulkheads to quarantine hazards.',
    syntax: 'Lock-Door [-Id] <String>',
    parameters: [
      { name: 'Id', type: 'String', required: true, positional: true, description: 'Airlock ID (e.g., AL-01).' }
    ],
    examples: ["Lock-Door 'AL-03'", "Get-AirlockStatus | Where-Object Atmosphere -eq 'Contaminated' | Lock-Door"],
    execute: (input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const targets: string[] = [];
      if (input && input.length > 0) {
        for (const item of input) {
          const ps = wrapToPSObject(item);
          const id = ps.getProperty('Id');
          if (id) targets.push(String(id));
        }
      }
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'id') targets.push(String(a.value));
      }

      const results: PSObject[] = [];
      for (const t of targets) {
        const airlock = context.state.airlocks.find(a => a.id.toLowerCase() === t.toLowerCase());
        if (airlock) {
          airlock.isLocked = true;
          results.push(new PSObject({
            Id: airlock.id,
            Location: airlock.location,
            IsLocked: true,
            Status: 'Blast Seals Engaged'
          }, 'LockResult'));
        }
      }
      return results;
    }
  },

  'Unlock-Door': {
    name: 'Unlock-Door',
    aliases: ['Unlock-Airlock'],
    synopsis: 'Disengages magnetic blast seals on station airlocks.',
    description: 'Unlocks specified airlocks when pressure and atmospheric toxicity are within safe thresholds.',
    syntax: 'Unlock-Door [-Id] <String>',
    parameters: [
      { name: 'Id', type: 'String', required: true, positional: true, description: 'Airlock ID (e.g., AL-01).' }
    ],
    examples: ["Unlock-Door 'AL-01'"],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      const id = args[0]?.value ? String(args[0].value) : '';
      const airlock = context.state.airlocks.find(a => a.id.toLowerCase() === id.toLowerCase());
      if (airlock) {
        airlock.isLocked = false;
        return [
          new PSObject({
            Id: airlock.id,
            Location: airlock.location,
            IsLocked: false,
            Status: 'Unlocked'
          }, 'LockResult')
        ];
      }
      context.writeOutput(`Airlock '${id}' not found.`, 'error');
      return [];
    }
  },

  'Get-LifeSupport': {
    name: 'Get-LifeSupport',
    aliases: ['gls'],
    synopsis: 'Returns real-time oxygen, carbon scrubber, and temperature readouts.',
    description: 'Queries central environmental control telemetry.',
    syntax: 'Get-LifeSupport',
    parameters: [],
    examples: ['Get-LifeSupport'],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      return [
        new PSObject({
          OxygenLevel: `${context.state.oxygenLevel}%`,
          CarbonDioxide: '0.04%',
          InternalPressure: '101.3 kPa',
          CoreTemperature: `${context.state.reactorTemp}°C`,
          Status: context.state.oxygenLevel > 70 ? 'Nominal' : 'Critical'
        }, 'LifeSupportTelemetry')
      ];
    }
  },

  'Purge-Contaminant': {
    name: 'Purge-Contaminant',
    synopsis: 'Vents toxic chemical or atmospheric contaminants from designated compartments.',
    description: 'Flushes scrubbers with high-pressure nitrogen to eliminate hazardous bio-vapors.',
    syntax: 'Purge-Contaminant -Sector <String>',
    parameters: [
      { name: 'Sector', type: 'String', required: true, description: 'Sector name to decontaminate.' }
    ],
    examples: ["Purge-Contaminant -Sector 'Gamma'"],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let sec = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'sector') sec = String(a.value);
      }

      for (const al of context.state.airlocks) {
        if (al.location.toLowerCase().includes(sec.toLowerCase())) {
          al.atmosphere = 'Normal';
        }
      }

      context.writeOutput(`Decontamination scrubbers engaged in Sector [${sec}]. Atmosphere restored to Normal.`, 'success');
      return [
        new PSObject({
          Sector: sec,
          Atmosphere: 'Normal',
          ToxicityIndex: '0.00 ppm'
        }, 'PurgeResult')
      ];
    }
  },

  'Restart-CommsArray': {
    name: 'Restart-CommsArray',
    synopsis: 'Reboots the deep space long-range subspace transceiver.',
    description: 'Power-cycles the dish receiver and synchronizes quantum entanglement links with Earth Command.',
    syntax: 'Restart-CommsArray [-Force]',
    parameters: [
      { name: 'Force', type: 'Switch', required: false, description: 'Bypasses standard safety delay.' }
    ],
    examples: ['Restart-CommsArray', 'Restart-CommsArray -Force'],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      const comms = context.state.modules.find(m => m.system === 'Communications');
      if (comms) {
        comms.status = 'Online';
        comms.powerLevel = 100;
        comms.integrity = 100;
      }
      context.writeOutput('Subspace Transceiver synchronized. Frequency locked with Lunar Station Relay.', 'success');
      return [
        new PSObject({
          ArrayName: 'Subspace Dish Alpha',
          Status: 'Online',
          SignalStrength: '98%',
          Bandwidth: '10 Gbps'
        }, 'CommsInfo')
      ];
    }
  },

  'Deploy-RepairDrone': {
    name: 'Deploy-RepairDrone',
    synopsis: 'Dispatches automated maintenance drones to target sectors.',
    description: 'Launches drone units from bay hangars to perform external hull welds and component replacements.',
    syntax: 'Deploy-RepairDrone -Id <String> -Sector <String>',
    parameters: [
      { name: 'Id', type: 'String', required: true, description: 'Drone ID (DR-01, DR-02).' },
      { name: 'Sector', type: 'String', required: true, description: 'Destination sector.' }
    ],
    examples: ["Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'"],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let droneId = '';
      let targetSector = '';

      for (const a of args) {
        if (a.name?.toLowerCase() === 'id') droneId = String(a.value);
        else if (a.name?.toLowerCase() === 'sector') targetSector = String(a.value);
        else if (!a.name) {
          if (!droneId) droneId = String(a.value);
          else targetSector = String(a.value);
        }
      }

      const drone = context.state.drones.find(d => d.id.toLowerCase() === droneId.toLowerCase());
      if (drone) {
        drone.status = 'Active';
        drone.assignedSector = targetSector;
        drone.currentTask = `Welding Hull Integrity in Sector ${targetSector}`;

        context.writeOutput(`Drone [${drone.id}] deployed to Sector [${targetSector}].`, 'success');
        return [
          new PSObject({
            Id: drone.id,
            Status: 'Active',
            AssignedSector: targetSector,
            Task: drone.currentTask,
            Battery: `${drone.battery}%`
          }, 'DroneStatus')
        ];
      }

      context.writeOutput(`Drone '${droneId}' not found. Available drones: DR-01, DR-02, DR-03.`, 'error');
      return [];
    }
  },

  'Get-SecurityLog': {
    name: 'Get-SecurityLog',
    aliases: ['gsl', 'Get-Events'],
    synopsis: 'Retrieves audit logs and security events recorded by station sensors.',
    description: 'Fetches timestamped alerts, hardware failures, and network intrusion logs.',
    syntax: 'Get-SecurityLog [[-Level] <String>] [-Newest <Int>]',
    parameters: [
      { name: 'Level', type: 'String', required: false, positional: true, description: 'Filter by Error, Warning, Security, or Info.' },
      { name: 'Newest', type: 'Int', required: false, description: 'Limit to the newest N events.' }
    ],
    examples: [
      'Get-SecurityLog',
      "Get-SecurityLog -Level 'Security'",
      "Get-SecurityLog | Where-Object Level -eq 'Error'"
    ],
    execute: (_input: any[], args: CommandArgument[], context: ExecutionContext) => {
      let levelFilter = '';
      let newest = 0;

      for (const a of args) {
        if (a.name?.toLowerCase() === 'level') levelFilter = String(a.value).toLowerCase();
        else if (a.name?.toLowerCase() === 'newest') newest = Number(a.value);
        else if (!a.name && typeof a.value === 'string' && !a.isParameterName) {
          levelFilter = a.value.toLowerCase();
        }
      }

      let logs = context.state.logs;
      if (levelFilter) {
        logs = logs.filter(l => l.level.toLowerCase() === levelFilter);
      }
      if (newest > 0) {
        logs = logs.slice(-newest);
      }

      return logs.map(l => new PSObject({
        Timestamp: l.timestamp,
        EventId: l.eventId,
        Level: l.level,
        Source: l.source,
        Message: l.message
      }, 'StationSecurityLog'));
    }
  },

  'Send-DistressBeacon': {
    name: 'Send-DistressBeacon',
    synopsis: 'Broadcasts emergency SOS transmission across interstellar channels.',
    description: 'Transmits telemetry coordinates and status packet to emergency rescue cruisers.',
    syntax: 'Send-DistressBeacon [-Frequency] <String>',
    parameters: [
      { name: 'Frequency', type: 'String', required: true, positional: true, description: 'Emergency transmission channel frequency (e.g., 1420.405 MHz).' }
    ],
    examples: ["Send-DistressBeacon -Frequency '1420.405 MHz'"],
    execute: (_input: any[], _args: CommandArgument[], context: ExecutionContext) => {
      context.state.beaconTransmitted = true;
      context.writeOutput('🚨 EMERGENCY BEACON BROADCASTED: Rescue Fleet Dispatch received packet.', 'success');
      return [
        new PSObject({
          Transmission: 'SOS-AEGIS-9',
          Channel: 'Emergency Interstellar Relay',
          Status: 'Acknowledged',
          ETA_Cruiser: '2 Hours 14 Minutes'
        }, 'BeaconResult')
      ];
    }
  },

  'Test-Connection': {
    name: 'Test-Connection',
    aliases: ['ping'],
    synopsis: 'Sends ICMP echo packets to test connectivity with station nodes.',
    description: 'Checks latency and packet response from life support pods, drone hangars, and sub-processors.',
    syntax: 'Test-Connection [-TargetName] <String>',
    parameters: [
      { name: 'TargetName', type: 'String', required: true, positional: true, description: 'Node name or IP address.' }
    ],
    examples: ["Test-Connection 'CoreRouter'", "ping 'LifeSupport'"],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      const target = args[0]?.value ? String(args[0].value) : '127.0.0.1';
      return [
        new PSObject({
          Destination: target,
          IPv4Address: '10.0.4.12',
          Bytes: 32,
          Time: '0.42 ms',
          Status: 'Success'
        }, 'PingReply')
      ];
    }
  }
};

function updateStationVitals(state: any): void {
  // Compute overall oxygen based on life support modules
  const o2Modules = state.modules.filter((m: any) => m.system === 'LifeSupport');
  const onlineO2 = o2Modules.filter((m: any) => m.status === 'Online');
  if (o2Modules.length > 0) {
    state.oxygenLevel = Math.min(100, Math.round((onlineO2.length / o2Modules.length) * 100));
  }

  // Compute reactor temp
  const powerModules = state.modules.filter((m: any) => m.system === 'Power');
  const onlinePower = powerModules.filter((m: any) => m.status === 'Online');
  if (onlinePower.length > 0) {
    state.reactorTemp = 240; // stable operating temperature
  } else {
    state.reactorTemp = 580; // overheating warning
  }
}
