import { ChallengesCatalog } from '../challenges/catalog';
import { SoundFX } from '../audio/soundFx';

export class ChallengeCatalogModal {
  private container: HTMLElement;
  private sound: SoundFX;
  private onSelect: (id: number) => void;

  constructor(container: HTMLElement, sound: SoundFX, onSelect: (id: number) => void) {
    this.container = container;
    this.sound = sound;
    this.onSelect = onSelect;
  }

  public open(currentId: number, solvedIds: Set<number>): void {
    this.sound.playKeyClick();

    // Group challenges by category
    const categories = ['Basics', 'Filesystem', 'Text & Search', 'Pipelines', 'Objects & JSON', 'Processes & Admin'];

    let contentHtml = '';
    for (const cat of categories) {
      const items = ChallengesCatalog.filter(c => c.category === cat);
      if (items.length === 0) continue;

      const itemsHtml = items.map(c => {
        const isCurrent = c.id === currentId;
        const isSolved = solvedIds.has(c.id);

        let cls = 'catalog-item-btn';
        if (isCurrent) cls += ' current';
        if (isSolved) cls += ' solved';

        return `
          <button class="${cls}" data-id="${c.id}">
            <span class="cat-item-left">
              <span class="cat-num">#${c.id}</span>
              <span class="cat-slug">${c.slug}</span>
            </span>
            <span class="cat-status">${isSolved ? '✓ Solved' : '○'}</span>
          </button>
        `;
      }).join('');

      contentHtml += `
        <div class="catalog-section">
          <div class="catalog-sec-title">${cat}</div>
          <div class="catalog-grid">${itemsHtml}</div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="cmd-modal-backdrop animate-fade-in" id="catalog-backdrop">
        <div class="cmd-modal-card" role="dialog" aria-modal="true" aria-label="Challenge Catalog">
          <div class="cmd-modal-header">
            <div class="modal-title-group">
              <span class="ps-badge">PS</span>
              <strong>ALL CHALLENGES</strong>
              <span class="modal-count-badge">${solvedIds.size} / ${ChallengesCatalog.length} Solved</span>
            </div>
            <button class="cmd-modal-close" id="btn-close-catalog" aria-label="Close">✕</button>
          </div>

          <div class="cmd-modal-body">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private close(): void {
    this.sound.playKeyClick();
    this.container.innerHTML = '';
  }

  private attachEvents(): void {
    this.container.querySelector('#btn-close-catalog')?.addEventListener('click', () => {
      this.close();
    });

    this.container.querySelector('#catalog-backdrop')?.addEventListener('click', (e: Event) => {
      if (e.target === e.currentTarget) {
        this.close();
      }
    });

    this.container.querySelectorAll('.catalog-item-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
        if (id) {
          this.close();
          this.onSelect(id);
        }
      });
    });
  }
}
