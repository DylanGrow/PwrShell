import { SoundFX } from '../audio/soundFx';

export class SandboxPanel {
  private container: HTMLElement;
  private sound: SoundFX;
  private onTriggerCrisis?: (crisisName: string) => void;
  private onRunCommand?: (cmd: string) => void;

  constructor(
    container: HTMLElement,
    sound: SoundFX,
    onTriggerCrisis?: (crisisName: string) => void,
    onRunCommand?: (cmd: string) => void
  ) {
    this.container = container;
    this.sound = sound;
    this.onTriggerCrisis = onTriggerCrisis;
    this.onRunCommand = onRunCommand;
    this.render();
    this.attachEvents();
  }

  public show(): void {
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="sandbox-card">
        <div class="sandbox-header">
          <div class="sandbox-title">
            <span>🧪 STATION SIMULATION LABORATORY</span>
          </div>
          <span class="sandbox-badge">FREE PLAY & AUTOMATION PRACTICE</span>
        </div>

        <p class="sandbox-desc">
          Inject simulated station emergencies below, then practice writing your own PowerShell pipelines to diagnose and automate station recovery!
        </p>

        <div class="crisis-grid">
          <button class="crisis-btn" data-crisis="solar_pulse">
            <span class="crisis-icon">⚡</span>
            <div class="crisis-text">
              <strong>Inject Solar Pulse</strong>
              <span>Trips oxygen scrubbers & spikes core heat</span>
            </div>
          </button>

          <button class="crisis-btn" data-crisis="bio_breach">
            <span class="crisis-icon">☣️</span>
            <div class="crisis-text">
              <strong>Bio-Vault Rupture</strong>
              <span>Contaminates airlocks in Sector Gamma</span>
            </div>
          </button>

          <button class="crisis-btn" data-crisis="power_drain">
            <span class="crisis-icon">🔋</span>
            <div class="crisis-text">
              <strong>Power Grid Drain</strong>
              <span>Drops all system wattages to 10%</span>
            </div>
          </button>
        </div>

        <div class="sandbox-recipes">
          <div class="recipes-label">TRY THESE AUTOMATION ONE-LINERS:</div>
          <div class="recipe-chips">
            <button class="recipe-btn" data-cmd="Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System">
              🛠️ Repair All Offline Systems
            </button>
            <button class="recipe-btn" data-cmd="Get-AirlockStatus | Where-Object Atmosphere -eq 'Contaminated' | Lock-Door">
              🔒 Quarantine Contaminated Airlocks
            </button>
            <button class="recipe-btn" data-cmd="Get-StationModule | Sort-Object -Property PowerLevel -Descending | Select-Object -Property Name, PowerLevel, Sector">
              📊 Rank High Power Consumers
            </button>
            <button class="recipe-btn" data-cmd="Set-PowerRoute -Sector 'Core' -Watts 100; Start-Generator">
              ⚡ Full Reactor Surge Ignition
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelectorAll('.crisis-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const crisis = (e.currentTarget as HTMLElement).getAttribute('data-crisis');
        if (crisis && this.onTriggerCrisis) {
          this.sound.playError();
          this.onTriggerCrisis(crisis);
        }
      });
    });

    this.container.querySelectorAll('.recipe-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
        if (cmd && this.onRunCommand) {
          this.sound.playKeyClick();
          this.onRunCommand(cmd);
        }
      });
    });
  }
}
