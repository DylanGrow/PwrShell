import { CmdChallenge } from '../challenges/catalog';
import { SoundFX } from '../audio/soundFx';

export class ChallengeCarousel {
  private container: HTMLElement;
  private challenges: CmdChallenge[];
  private currentId: number;
  private solvedIds: Set<number>;
  private sound: SoundFX;
  private onSelect: (id: number) => void;

  constructor(
    container: HTMLElement,
    challenges: CmdChallenge[],
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
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    const active = this.container.querySelector('.carousel-item.active') as HTMLElement;
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  private render(): void {
    const itemsHtml = this.challenges.map((c) => {
      const isCurrent = c.id === this.currentId;
      const isSolved = this.solvedIds.has(c.id);

      let classes = 'carousel-item';
      if (isCurrent) classes += ' active';
      if (isSolved) classes += ' solved';

      return `
        <button class="${classes}" data-id="${c.id}" title="${c.id}. ${c.title} (${c.category})">
          ${isSolved ? '<span class="item-check">✓</span>' : ''}
          <span class="item-slug">${c.slug}</span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="cmd-carousel-wrap">
        <button class="carousel-arrow left" id="btn-prev-carousel" ${this.currentId === 1 ? 'disabled' : ''} title="Previous Challenge (Ctrl+Left)">
          ◀
        </button>

        <div class="carousel-track-container" id="carousel-track">
          <div class="carousel-track">
            ${itemsHtml}
          </div>
        </div>

        <button class="carousel-arrow right" id="btn-next-carousel" ${this.currentId === this.challenges.length ? 'disabled' : ''} title="Next Challenge (Ctrl+Right)">
          ▶
        </button>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelector('#btn-prev-carousel')?.addEventListener('click', () => {
      if (this.currentId > 1) {
        this.sound.playKeyClick();
        this.onSelect(this.currentId - 1);
      }
    });

    this.container.querySelector('#btn-next-carousel')?.addEventListener('click', () => {
      if (this.currentId < this.challenges.length) {
        this.sound.playKeyClick();
        this.onSelect(this.currentId + 1);
      }
    });

    this.container.querySelectorAll('.carousel-item').forEach(btn => {
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
