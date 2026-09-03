import { CmdletDefinition, CommandArgument, ExecutionContext } from '../../types';
import { PSObject } from '../psobject';

export const SystemCmdlets: Record<string, CmdletDefinition> = {
  'Get-Process': {
    name: 'Get-Process',
    aliases: ['ps', 'gps'],
    synopsis: 'Gets the processes that are running on the local computer.',
    description: 'Lists all system processes with CPU, Memory, and ProcessName.',
    syntax: 'Get-Process [[-Name] <String>] [-Id <Int>]',
    parameters: [
      { name: 'Name', type: 'String', required: false, positional: true, description: 'Process name.' },
      { name: 'Id', type: 'Int', required: false, description: 'Process ID.' }
    ],
    examples: ['Get-Process', 'ps | ? CPU -gt 50', 'Get-Process | sort WorkingSet64 -Descending | select -First 3'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let filter = '';
      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'name') filter = String(a.value).toLowerCase();
      }

      const processes = [
        { Id: 1044, ProcessName: 'pwsh', Handles: 420, NPM: 35, PM: 64200, WS: 84500, WorkingSet64: 84500000, CPU: 12.4, SI: 1 },
        { Id: 2812, ProcessName: 'code', Handles: 1120, NPM: 68, PM: 142000, WS: 215000, WorkingSet64: 215000000, CPU: 82.6, SI: 1 },
        { Id: 3490, ProcessName: 'node', Handles: 580, NPM: 42, PM: 98000, WS: 132000, WorkingSet64: 132000000, CPU: 45.1, SI: 1 },
        { Id: 4120, ProcessName: 'chrome', Handles: 1650, NPM: 95, PM: 285000, WS: 410000, WorkingSet64: 410000000, CPU: 65.3, SI: 1 },
        { Id: 5900, ProcessName: 'explorer', Handles: 980, NPM: 55, PM: 78000, WS: 96000, WorkingSet64: 96000000, CPU: 4.8, SI: 1 },
        { Id: 6412, ProcessName: 'svchost', Handles: 310, NPM: 18, PM: 24000, WS: 32000, WorkingSet64: 32000000, CPU: 1.2, SI: 0 },
        { Id: 7820, ProcessName: 'docker', Handles: 720, NPM: 48, PM: 110000, WS: 165000, WorkingSet64: 165000000, CPU: 38.7, SI: 1 },
        { Id: 8940, ProcessName: 'postgres', Handles: 440, NPM: 32, PM: 85000, WS: 115000, WorkingSet64: 115000000, CPU: 9.5, SI: 0 }
      ];

      const results: PSObject[] = [];
      for (const p of processes) {
        if (filter && !p.ProcessName.toLowerCase().includes(filter)) continue;
        results.push(new PSObject(p, 'Process'));
      }

      return results;
    }
  },

  'Get-Service': {
    name: 'Get-Service',
    aliases: ['gsv'],
    synopsis: 'Gets the services on a local or remote computer.',
    description: 'Lists Windows background services and their statuses.',
    syntax: 'Get-Service [[-Name] <String>] [-Status <String>]',
    parameters: [
      { name: 'Name', type: 'String', required: false, positional: true, description: 'Service name.' },
      { name: 'Status', type: 'String', required: false, description: 'Running or Stopped.' }
    ],
    examples: ['Get-Service', 'gsv | ? Status -eq "Stopped"'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      let filter = '';
      let statusFilter = '';

      for (const a of args) {
        if (!a.name || a.name.toLowerCase() === 'name') filter = String(a.value).toLowerCase();
        if (a.name?.toLowerCase() === 'status') statusFilter = String(a.value).toLowerCase();
      }

      const services = [
        { Status: 'Running', Name: 'wuauserv', DisplayName: 'Windows Update' },
        { Status: 'Running', Name: 'WinDefend', DisplayName: 'Microsoft Defender Antivirus Service' },
        { Status: 'Stopped', Name: 'Spooler', DisplayName: 'Print Spooler' },
        { Status: 'Running', Name: 'EventLog', DisplayName: 'Windows Event Log' },
        { Status: 'Stopped', Name: 'Fax', DisplayName: 'Fax Service' },
        { Status: 'Running', Name: 'Dhcp', DisplayName: 'DHCP Client' },
        { Status: 'Stopped', Name: 'RemoteRegistry', DisplayName: 'Remote Registry' },
        { Status: 'Running', Name: 'Docker', DisplayName: 'Docker Desktop Service' }
      ];

      const results: PSObject[] = [];
      for (const s of services) {
        if (filter && !s.Name.toLowerCase().includes(filter) && !s.DisplayName.toLowerCase().includes(filter)) continue;
        if (statusFilter && s.Status.toLowerCase() !== statusFilter) continue;
        results.push(new PSObject(s, 'ServiceController'));
      }

      return results;
    }
  },

  'Get-Date': {
    name: 'Get-Date',
    aliases: [],
    synopsis: 'Gets the current date and time.',
    description: 'Outputs current date/time object.',
    syntax: 'Get-Date [-Format <String>]',
    parameters: [
      { name: 'Format', type: 'String', required: false, description: 'Custom date format.' }
    ],
    examples: ['Get-Date', 'Get-Date -Format "yyyy-MM-dd"'],
    execute: (_input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      const d = new Date();
      let format = '';
      for (const a of args) {
        if (a.name?.toLowerCase() === 'format') format = String(a.value);
      }

      if (format === 'yyyy-MM-dd') {
        return [d.toISOString().split('T')[0]];
      }

      return [new PSObject({
        DateTime: d.toLocaleString(),
        Year: d.getFullYear(),
        Month: d.getMonth() + 1,
        Day: d.getDate(),
        DayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
      }, 'DateTime')];
    }
  },

  'Get-Random': {
    name: 'Get-Random',
    aliases: [],
    synopsis: 'Gets a random number, or selects objects randomly from a collection.',
    description: 'Generates random integers.',
    syntax: 'Get-Random [-Minimum <Int>] [-Maximum <Int>]',
    parameters: [
      { name: 'Minimum', type: 'Int', required: false, description: 'Min value.' },
      { name: 'Maximum', type: 'Int', required: false, description: 'Max value.' }
    ],
    examples: ['Get-Random -Minimum 1 -Maximum 100'],
    execute: (input: any[], args: CommandArgument[], _context: ExecutionContext) => {
      if (input && input.length > 0) {
        const rand = input[Math.floor(Math.random() * input.length)];
        return [rand];
      }

      let min = 0;
      let max = 100;
      for (const a of args) {
        if (a.name?.toLowerCase() === 'minimum' || a.name?.toLowerCase() === 'min') min = Number(a.value);
        if (a.name?.toLowerCase() === 'maximum' || a.name?.toLowerCase() === 'max') max = Number(a.value);
      }

      const val = Math.floor(Math.random() * (max - min)) + min;
      return [val];
    }
  }
};
