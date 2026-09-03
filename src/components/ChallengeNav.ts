import { Challenge } from '../challenges/data';
import { SoundFX } from '../audio/soundFx';

export class ChallengeNav {
  private container: HTMLElement;
  private challenges: Challenge[];
  private currentId: number;
  private solvedIds: Set<number>;
  private sound: SoundFX;
  private onSelect: (id: number) => void;

  constructor(
    container: HTMLElement,
    challenges: Challenge[],
    currentId: number,
    solvedIds: Set<number>,
    sound: SoundFX,
    onSelect: (id: number) => void
  ) {
    this.container = container;
    this.challenges = challenges;
    this.currentId = currentId;
    this.solvedIds = solvedIds;
    this.sound = sound;
    this.onSelect = onSelect;

    this.render();
    this.attachEvents();
  }

  public update(currentId: number, solvedIds: Set<number>): void {
    this.currentId = currentId;
    this.solvedIds = solvedIds;
    this.render();
    this.attachEvents();
  }

  private render(): void {
    const solvedCount = this.solvedIds.size;
    const totalCount = this.challenges.length;
    const percent = Math.round((solvedCount / totalCount) * 100);

    const pillsHtml = this.challenges.map((c) => {
      const isCurrent = c.id === this.currentId;
      const isSolved = this.solvedIds.has(c.id);

      let classes = 'ch-nav-pill';
      if (isCurrent) classes += ' current';
      if (isSolved) classes += ' solved';

      return `
        <button class="${classes}" data-id="${c.id}" title="${c.id}. ${c.title} (${c.category})">
          ${isSolved ? '<span class="pill-check">✓</span>' : ''}
          <span class="pill-num">${c.id}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="cmd-nav-bar" role="navigation" aria-label="Challenge selection">
        <div class="nav-controls-row">
          <div class="nav-btn-group">
            <button class="nav-arrow-btn" id="btn-prev-ch" ${this.currentId === 1 ? 'disabled' : ''} title="Previous Challenge (Ctrl+Left)">
              ◀ Prev
            </button>
            <button class="nav-arrow-btn" id="btn-next-ch" ${this.currentId === totalCount ? 'disabled' : ''} title="Next Challenge (Ctrl+Right)">
              Next ▶
            </button>
          </div>

          <div class="nav-progress-badge">
            <span class="progress-trophy">🏆</span>
            <span class="progress-text"><strong>${solvedCount}</strong> of <strong>${totalCount}</strong> Solved (${percent}%)</span>
          </div>
        </div>

        <div class="ch-pills-scroll-wrap">
          <div class="ch-pills-strip">
            ${pillsHtml}
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelector('#btn-prev-ch')?.addEventListener('click', () => {
      if (this.currentId > 1) {
        this.sound.playKeyClick();
        this.onSelect(this.currentId - 1);
      }
    });

    this.container.querySelector('#btn-next-ch')?.addEventListener('click', () => {
      if (this.currentId < this.challenges.length) {
        this.sound.playKeyClick();
        this.onSelect(this.currentId + 1);
      }
    });

    this.container.querySelectorAll('.ch-nav-pill').forEach((btn) => {
      btn.addEventListener('click', (e: Event) => {
        const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
        if (id) {
          this.sound.playKeyClick();
          this.onSelect(id);
        }
      });
    });
  }
}
