import { GameState } from '../types';
import { BadgesList } from '../missions/data';

export class BadgesModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.attachEvents();
  }

  public open(state: GameState): void {
    this.update(state);
    this.container.querySelector('#badges-backdrop')?.classList.remove('hidden');
  }

  public close(): void {
    this.container.querySelector('#badges-backdrop')?.classList.add('hidden');
  }

  public update(state: GameState): void {
    const listEl = this.container.querySelector('#badges-grid');
    if (!listEl) return;

    const unlockedCount = state.badges.length;
    const countEl = this.container.querySelector('#unlocked-count') as HTMLElement | null;
    if (countEl) countEl.innerText = `${unlockedCount} / ${BadgesList.length} UNLOCKED`;

    listEl.innerHTML = BadgesList.map(b => {
      const isUnlocked = state.badges.includes(b.id);
      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-info">
            <div class="badge-title">${b.title}</div>
            <div class="badge-desc">${b.description}</div>
            <div class="badge-status">${isUnlocked ? '✓ Acquired' : '🔒 Locked'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="modal-backdrop hidden" id="badges-backdrop" role="dialog" aria-modal="true" aria-label="Achievements Showcase">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">
              <span>🏆 TECHNICIAN ACHIEVEMENTS</span>
              <span class="badge-counter" id="unlocked-count">0 / 6 UNLOCKED</span>
            </div>
            <button class="modal-close-btn" id="btn-close-badges" aria-label="Close Achievements">✕</button>
          </div>
          <div class="modal-body">
            <div class="badges-grid" id="badges-grid">
              <!-- Dynamically rendered -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelector('#btn-close-badges')?.addEventListener('click', () => {
      this.close();
    });

    this.container.querySelector('#badges-backdrop')?.addEventListener('click', (e: Event) => {
      if ((e.target as HTMLElement).id === 'badges-backdrop') {
        this.close();
      }
    });
  }
}
