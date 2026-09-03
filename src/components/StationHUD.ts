import { GameState } from '../types';

export class StationHUD {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public update(state: GameState): void {
    const o2Val = state.oxygenLevel;
    const tempVal = state.reactorTemp;
    const isOnline = o2Val >= 90;

    // Status pill
    const statusPill = this.container.querySelector('#hud-overall-status') as HTMLElement;
    if (statusPill) {
      if (isOnline) {
        statusPill.className = 'status-pill status-green';
        statusPill.innerHTML = '<span class="status-dot green"></span> All Systems Operational';
      } else {
        statusPill.className = 'status-pill status-red';
        statusPill.innerHTML = '<span class="status-dot red"></span> Emergency Mode: Repairs Needed';
      }
    }

    // Oxygen meter
    const o2Bar = this.container.querySelector('#hud-o2-bar') as HTMLElement;
    const o2Text = this.container.querySelector('#hud-o2-text') as HTMLElement;
    if (o2Bar && o2Text) {
      o2Bar.style.width = `${o2Val}%`;
      o2Bar.className = `mini-bar-fill ${o2Val > 70 ? 'fill-green' : o2Val > 30 ? 'fill-yellow' : 'fill-red'}`;
      o2Text.innerText = `${o2Val}%`;
    }

    // Core Temp meter
    const tempBar = this.container.querySelector('#hud-temp-bar') as HTMLElement;
    const tempText = this.container.querySelector('#hud-temp-text') as HTMLElement;
    if (tempBar && tempText) {
      const tempPercent = Math.min(100, (tempVal / 600) * 100);
      tempBar.style.width = `${tempPercent}%`;
      tempBar.className = `mini-bar-fill ${tempVal < 300 ? 'fill-green' : 'fill-red'}`;
      tempText.innerText = `${tempVal}°C`;
    }

    // Update schematic visual nodes
    const o2Module1 = state.modules.find(m => m.id === 'MOD-O2-01');
    const o2Module2 = state.modules.find(m => m.id === 'MOD-O2-02');
    const pwrCore = state.modules.find(m => m.id === 'MOD-PWR-01');
    const commsDish = state.modules.find(m => m.system === 'Communications');

    this.setSvgNodeStatus('#svg-node-o2-1', o2Module1?.status === 'Online');
    this.setSvgNodeStatus('#svg-node-o2-2', o2Module2?.status === 'Online');
    this.setSvgNodeStatus('#svg-node-core', pwrCore?.status === 'Online' || state.powerSurgeControlled);
    this.setSvgNodeStatus('#svg-node-comms', commsDish?.status === 'Online');

    // Summary text
    const summaryList = this.container.querySelector('#hud-quick-summary') as HTMLElement;
    if (summaryList) {
      const offlineMods = state.modules.filter(m => m.status === 'Offline');
      if (offlineMods.length > 0) {
        summaryList.innerHTML = `
          <div class="alert-summary">
            ⚠️ <strong>${offlineMods.length} systems offline</strong> — Run PowerShell commands below to restore station vitals.
          </div>
        `;
      } else {
        summaryList.innerHTML = `
          <div class="success-summary">
            ✅ <strong>All 9 station systems nominal!</strong> Atmosphere breathable and power grid stabilized.
          </div>
        `;
      }
    }
  }

  private setSvgNodeStatus(selector: string, isOnline: boolean): void {
    const el = this.container.querySelector(selector) as SVGElement | null;
    if (el) {
      if (isOnline) {
        el.setAttribute('fill', '#10b981');
        el.setAttribute('stroke', '#34d399');
      } else {
        el.setAttribute('fill', '#ef4444');
        el.setAttribute('stroke', '#f87171');
      }
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="station-mini-bar" role="region" aria-label="Station Status Overview">
        <div class="mini-bar-header">
          <div class="station-id">
            <span class="station-icon">🛰️</span>
            <strong>AEGIS-9 ORBITAL STATION</strong>
          </div>
          <div id="hud-overall-status" class="status-pill status-red">
            <span class="status-dot red"></span> Emergency Mode: Repairs Needed
          </div>
        </div>

        <!-- Visual Station SVG Schematic -->
        <div class="station-schematic-wrap">
          <svg viewBox="0 0 400 120" class="station-svg" aria-label="Orbital station interactive schematic">
            <defs>
              <linearGradient id="coreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.3" />
              </linearGradient>
            </defs>

            <!-- Orbit Ring -->
            <ellipse cx="200" cy="60" rx="180" ry="40" fill="none" stroke="rgba(59, 130, 246, 0.15)" stroke-width="2" stroke-dasharray="6,4" />

            <!-- Solar Wing Left -->
            <rect x="30" y="48" width="50" height="24" rx="3" fill="rgba(0, 240, 255, 0.1)" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.5" />
            <line x1="42" y1="48" x2="42" y2="72" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1" />
            <line x1="55" y1="48" x2="55" y2="72" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1" />
            <line x1="68" y1="48" x2="68" y2="72" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1" />

            <!-- Solar Wing Right -->
            <rect x="320" y="48" width="50" height="24" rx="3" fill="rgba(0, 240, 255, 0.1)" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.5" />
            <line x1="332" y1="48" x2="332" y2="72" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1" />
            <line x1="345" y1="48" x2="345" y2="72" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1" />
            <line x1="358" y1="48" x2="358" y2="72" stroke="rgba(0, 240, 255, 0.3)" stroke-width="1" />

            <!-- Connecting Trusses -->
            <line x1="80" y1="60" x2="160" y2="60" stroke="rgba(255, 255, 255, 0.3)" stroke-width="3" />
            <line x1="240" y1="60" x2="320" y2="60" stroke="rgba(255, 255, 255, 0.3)" stroke-width="3" />

            <!-- Sector Alpha: Oxygen Scrubber Pod 1 -->
            <circle id="svg-node-o2-1" cx="130" cy="35" r="9" fill="#ef4444" stroke="#f87171" stroke-width="2" />
            <text x="130" y="20" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="monospace">O2-Alpha</text>

            <!-- Sector Beta: Oxygen Scrubber Pod 2 -->
            <circle id="svg-node-o2-2" cx="130" cy="85" r="9" fill="#ef4444" stroke="#f87171" stroke-width="2" />
            <text x="130" y="105" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="monospace">O2-Beta</text>

            <!-- Main Central Hub / Reactor Core -->
            <rect x="170" y="35" width="60" height="50" rx="8" fill="url(#coreGlow)" stroke="#00f0ff" stroke-width="2" />
            <circle id="svg-node-core" cx="200" cy="60" r="12" fill="#ef4444" stroke="#f87171" stroke-width="2" />
            <text x="200" y="30" text-anchor="middle" fill="#00f0ff" font-size="10" font-weight="bold" font-family="sans-serif">CORE</text>

            <!-- Comms Dish Top Right -->
            <circle id="svg-node-comms" cx="270" cy="35" r="9" fill="#ef4444" stroke="#f87171" stroke-width="2" />
            <text x="270" y="20" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="monospace">Comms</text>

            <!-- Defense Shield Node Bottom Right -->
            <circle cx="270" cy="85" r="9" fill="#3b82f6" stroke="#60a5fa" stroke-width="2" />
            <text x="270" y="105" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="monospace">Shields</text>
          </svg>
        </div>

        <div class="mini-meters-row">
          <div class="mini-meter">
            <div class="meter-info">
              <span>Oxygen Life Support</span>
              <strong id="hud-o2-text">45%</strong>
            </div>
            <div class="meter-track">
              <div id="hud-o2-bar" class="mini-bar-fill fill-yellow" style="width: 45%"></div>
            </div>
          </div>

          <div class="mini-meter">
            <div class="meter-info">
              <span>Core Reactor Heat</span>
              <strong id="hud-temp-text">520°C</strong>
            </div>
            <div class="meter-track">
              <div id="hud-temp-bar" class="mini-bar-fill fill-red" style="width: 86%"></div>
            </div>
          </div>
        </div>

        <div id="hud-quick-summary"></div>
      </div>
    `;
  }
}
