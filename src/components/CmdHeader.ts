import { SoundFX } from '../audio/soundFx';

export class CmdHeader {
  private container: HTMLElement;
  private sound: SoundFX;
  private solvedCount: number;
  private totalCount: number;
  private onOpenList: () => void;
  private onReset: () => void;
  private onToggleSound: () => boolean;

  constructor(
    container: HTMLElement,
    sound: SoundFX,
    solvedCount: number,
    totalCount: number,
    onOpenList: () => void,
    onReset: () => void,
    onToggleSound: () => boolean
  ) {
    this.container = container;
    this.sound = sound;
    this.solvedCount = solvedCount;
    this.totalCount = totalCount;
    this.onOpenList = onOpenList;
    this.onReset = onReset;
    this.onToggleSound = onToggleSound;

    this.render();
    this.attachEvents();
  }

  public update(solvedCount: number, totalCount: number): void {
    this.solvedCount = solvedCount;
    this.totalCount = totalCount;
    const countEl = this.container.querySelector('#header-solved-count');
    if (countEl) {
      countEl.textContent = `${this.solvedCount} / ${this.totalCount}`;
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <header class="cmd-header" role="banner">
        <div class="cmd-brand">
          <span class="ps-badge">PS</span>
          <span class="brand-title">CMD CHALLENGE</span>
        </div>

        <div class="cmd-header-right">
          <button class="cmd-hdr-btn" id="btn-open-catalog" title="Browse all challenges">
            <span>📋 Challenges</span>
            <span class="solved-pill" id="header-solved-count">${this.solvedCount} / ${this.totalCount}</span>
          </button>

          <button class="cmd-hdr-icon-btn" id="btn-toggle-sound" title="Toggle audio feedback" aria-label="Toggle Sound">
            <span id="sound-icon">🔊</span>
          </button>

          <button class="cmd-hdr-icon-btn" id="btn-reset-all" title="Reset all progress" aria-label="Reset Progress">
            <span>🔄</span>
          </button>
        </div>
      </header>
    `;
  }

  private attachEvents(): void {
    this.container.querySelector('#btn-open-catalog')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.onOpenList();
    });

    this.container.querySelector('#btn-reset-all')?.addEventListener('click', () => {
      if (confirm('Reset your challenge progress back to challenge 1?')) {
        this.sound.playKeyClick();
        this.onReset();
      }
    });

    this.container.querySelector('#btn-toggle-sound')?.addEventListener('click', () => {
      const enabled = this.onToggleSound();
      const icon = this.container.querySelector('#sound-icon');
      if (icon) icon.textContent = enabled ? '🔊' : '🔇';
    });
  }
}
