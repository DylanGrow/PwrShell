import { GameState, StationModule, StationAirlock, StationLog, RepairDrone } from '../types';

const STORAGE_KEY = 'starship_sysadmin_state_v1';

export function createDefaultState(): GameState {
  const modules: StationModule[] = [
    { id: 'MOD-O2-01', name: 'Primary Oxygen Scrubber', system: 'LifeSupport', status: 'Offline', powerLevel: 0, temperature: 18, integrity: 45, sector: 'Alpha' },
    { id: 'MOD-O2-02', name: 'Secondary Oxygen Generator', system: 'LifeSupport', status: 'Offline', powerLevel: 0, temperature: 17, integrity: 60, sector: 'Beta' },
    { id: 'MOD-O2-03', name: 'Cryo-Life Pod Airflow', system: 'LifeSupport', status: 'Online', powerLevel: 75, temperature: 21, integrity: 95, sector: 'Alpha' },
    { id: 'MOD-PWR-01', name: 'Main Fusion Generator Core', system: 'Power', status: 'Standby', powerLevel: 25, temperature: 310, integrity: 80, sector: 'Core' },
    { id: 'MOD-PWR-02', name: 'Auxiliary Solar Inverter', system: 'Power', status: 'Online', powerLevel: 60, temperature: 35, integrity: 90, sector: 'Alpha' },
    { id: 'MOD-PWR-03', name: 'Plasma Heat Sink', system: 'Power', status: 'Offline', powerLevel: 0, temperature: 520, integrity: 30, sector: 'Core' },
    { id: 'MOD-COM-01', name: 'Subspace Dish Receiver', system: 'Communications', status: 'Offline', powerLevel: 10, temperature: 15, integrity: 70, sector: 'Command' },
    { id: 'MOD-DEF-01', name: 'Magnetic Deflector Shield', system: 'Defense', status: 'Standby', powerLevel: 15, temperature: 24, integrity: 85, sector: 'Core' },
    { id: 'MOD-SCI-01', name: 'Bio-Containment Vault', system: 'Science', status: 'Warning', powerLevel: 45, temperature: 19, integrity: 50, sector: 'Gamma' }
  ];

  const airlocks: StationAirlock[] = [
    { id: 'AL-01', location: 'Alpha Cargo Hangar', isLocked: false, pressure: 101.3, atmosphere: 'Normal' },
    { id: 'AL-02', location: 'Beta Habitation Ring', isLocked: false, pressure: 101.3, atmosphere: 'Normal' },
    { id: 'AL-03', location: 'Gamma Bio-Research Bay', isLocked: false, pressure: 94.2, atmosphere: 'Contaminated' },
    { id: 'AL-04', location: 'Core Maintenance Conduit', isLocked: true, pressure: 101.3, atmosphere: 'Normal' }
  ];

  const logs: StationLog[] = [
    { timestamp: '2026-08-22 07:15:02', eventId: 1001, level: 'Security', source: 'CoreSensor', message: 'Cosmic electromagnetic surge detected across grid.' },
    { timestamp: '2026-08-22 07:15:04', eventId: 2042, level: 'Error', source: 'LifeSupport', message: 'Oxygen scrubbers MOD-O2-01 and MOD-O2-02 tripped offline.' },
    { timestamp: '2026-08-22 07:15:08', eventId: 3091, level: 'Warning', source: 'BioVault', message: 'Aerosol pressure differential in Sector Gamma AL-03.' },
    { timestamp: '2026-08-22 07:15:15', eventId: 4005, level: 'Info', source: 'AI_HELIOS', message: 'Emergency failsafe terminal activated. Awaiting technician.' }
  ];

  const drones: RepairDrone[] = [
    { id: 'DR-01', status: 'Docked', battery: 100, currentTask: 'Standby in Hangar Bay 1', assignedSector: 'Alpha' },
    { id: 'DR-02', status: 'Docked', battery: 95, currentTask: 'Standby in Hangar Bay 2', assignedSector: 'Beta' },
    { id: 'DR-03', status: 'Docked', battery: 80, currentTask: 'Standby in Hangar Bay 3', assignedSector: 'Core' }
  ];

  return {
    currentChapter: 1,
    completedChapters: [],
    modules,
    airlocks,
    logs,
    drones,
    oxygenLevel: 45,
    reactorTemp: 520,
    shieldIntegrity: 15,
    powerSurgeControlled: false,
    beaconTransmitted: false,
    soundEnabled: true,
    crtEffectEnabled: true,
    badges: []
  };
}

export class GameStateManager {
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  public getState(): GameState {
    return this.state;
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify(): void {
    this.saveState();
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public setChapter(chapterId: number): void {
    this.state.currentChapter = chapterId;
    this.notify();
  }

  public markChapterComplete(chapterId: number): void {
    if (!this.state.completedChapters.includes(chapterId)) {
      this.state.completedChapters.push(chapterId);
    }
    this.checkBadges();
    this.notify();
  }

  public unlockBadge(badgeId: string): void {
    if (!this.state.badges.includes(badgeId)) {
      this.state.badges.push(badgeId);
      this.notify();
    }
  }

  public toggleSound(): boolean {
    this.state.soundEnabled = !this.state.soundEnabled;
    this.notify();
    return this.state.soundEnabled;
  }

  public toggleCRT(): boolean {
    this.state.crtEffectEnabled = !this.state.crtEffectEnabled;
    this.notify();
    return this.state.crtEffectEnabled;
  }

  public resetGame(): void {
    this.state = createDefaultState();
    localStorage.removeItem(STORAGE_KEY);
    this.notify();
  }

  private checkBadges(): void {
    if (this.state.completedChapters.includes(1)) this.unlockBadge('first_command');
    if (this.state.completedChapters.includes(2)) this.unlockBadge('object_scanner');
    if (this.state.completedChapters.includes(3)) this.unlockBadge('pipeline_master');
    if (this.state.completedChapters.includes(4)) this.unlockBadge('data_detective');
    if (this.state.completedChapters.includes(6)) this.unlockBadge('quarantine_officer');
    if (this.state.completedChapters.includes(8)) this.unlockBadge('station_savior');
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore
    }
  }

  private loadState(): GameState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...createDefaultState(), ...parsed };
      }
    } catch {
      // Fallback
    }
    return createDefaultState();
  }
}
