import { MissionChapter, GameState } from '../types';
import { MissionChapters } from '../missions/data';
import { SoundFX } from '../audio/soundFx';

export class MissionPanel {
  private container: HTMLElement;
  private sound: SoundFX;
  private currentChapter: MissionChapter;
  private onChapterSelect?: (chapterId: number) => void;
  private onRunCommand?: (cmd: string) => void;

  constructor(
    container: HTMLElement,
    sound: SoundFX,
    initialChapterId = 1,
    onChapterSelect?: (chapterId: number) => void,
    onRunCommand?: (cmd: string) => void
  ) {
    this.container = container;
    this.sound = sound;
    this.onChapterSelect = onChapterSelect;
    this.onRunCommand = onRunCommand;

    this.currentChapter = MissionChapters.find(c => c.id === initialChapterId) || MissionChapters[0];
    this.render();
    this.attachEvents();
  }

  public setChapter(chapterId: number): void {
    const chap = MissionChapters.find(c => c.id === chapterId);
    if (chap) {
      this.currentChapter = chap;
      this.render();
      this.attachEvents();
    }
  }

  public update(state: GameState): void {
    const isCompleted = state.completedChapters.includes(this.currentChapter.id);

    // Update objectives checklist
    const listEl = this.container.querySelector('#objectives-list');
    if (listEl) {
      listEl.innerHTML = this.currentChapter.objectives.map((obj, i) => {
        const done = obj.completed;
        return `
          <div class="objective-card ${done ? 'done' : 'active'}">
            <div class="obj-step-num">${done ? '✓' : `Step ${i + 1}`}</div>
            <div class="obj-main">
              <div class="obj-title">${obj.description}</div>
              ${obj.syntaxHint && !done ? `
                <div class="obj-action-row">
                  <span class="type-hint">Type below or click:</span>
                  <button class="btn-quick-run" data-cmd="${obj.syntaxHint}">
                    ▶ Run <code>${obj.syntaxHint}</code>
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Attach click events on quick-run buttons
      listEl.querySelectorAll('.btn-quick-run').forEach(btn => {
        btn.addEventListener('click', (e: Event) => {
          const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
          if (cmd && this.onRunCommand) {
            this.sound.playKeyClick();
            this.onRunCommand(cmd);
          }
        });
      });
    }

    // Success banner
    const banner = this.container.querySelector('#mission-success-banner');
    if (banner) {
      if (isCompleted) {
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="clean-mission-card">
        <!-- Top Navigation -->
        <div class="mission-top-bar">
          <div class="chapter-badge">
            CHAPTER ${this.currentChapter.id} of ${MissionChapters.length}
          </div>
          <div class="chapter-nav-group">
            <button class="btn-nav" id="btn-prev-chapter" ${this.currentChapter.id === 1 ? 'disabled' : ''} aria-label="Previous Chapter">◀ Prev</button>
            <select class="chapter-select" id="chapter-select" aria-label="Select Mission">
              ${MissionChapters.map(c => `
                <option value="${c.id}" ${c.id === this.currentChapter.id ? 'selected' : ''}>
                  Ch ${c.id}: ${c.title}
                </option>
              `).join('')}
            </select>
            <button class="btn-nav" id="btn-next-chapter-nav" ${this.currentChapter.id === MissionChapters.length ? 'disabled' : ''} aria-label="Next Chapter">Next ▶</button>
          </div>
        </div>

        <!-- HELIOS AI Speech -->
        <div class="helios-speech-box">
          <div class="helios-avatar">🤖</div>
          <div class="helios-bubble">
            <div class="helios-sender">HELIOS (STATION ASSISTANT)</div>
            <div class="helios-speech-text">${this.currentChapter.heliosIntro}</div>
          </div>
        </div>

        <!-- Mission Goal -->
        <div class="mission-header-text">
          <h2 class="mission-heading">${this.currentChapter.title}</h2>
          <p class="mission-sub">${this.currentChapter.subtitle}</p>
        </div>

        <!-- Step-by-Step Objectives with 1-Click Run -->
        <div class="objectives-container" id="objectives-list">
          <!-- Dynamically populated in update() -->
        </div>

        <!-- Mission Completed Banner -->
        <div class="mission-success-banner hidden" id="mission-success-banner">
          <div class="success-icon">🎉</div>
          <div class="success-body">
            <strong>CHAPTER ${this.currentChapter.id} COMPLETED!</strong>
            <p>${this.currentChapter.heliosSuccess}</p>
          </div>
          ${this.currentChapter.id < MissionChapters.length ? `
            <button class="btn-advance" id="btn-advance-chapter">Advance to Chapter ${this.currentChapter.id + 1} ▶</button>
          ` : `
            <div class="all-done-badge">🌟 YOU COMPLETED ALL MISSIONS!</div>
          `}
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    // Chapter dropdown
    this.container.querySelector('#chapter-select')?.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      const chId = Number(target.value);
      if (this.onChapterSelect) {
        this.onChapterSelect(chId);
      }
    });

    // Prev / Next
    this.container.querySelector('#btn-prev-chapter')?.addEventListener('click', () => {
      if (this.currentChapter.id > 1 && this.onChapterSelect) {
        this.onChapterSelect(this.currentChapter.id - 1);
      }
    });

    this.container.querySelector('#btn-next-chapter-nav')?.addEventListener('click', () => {
      if (this.currentChapter.id < MissionChapters.length && this.onChapterSelect) {
        this.onChapterSelect(this.currentChapter.id + 1);
      }
    });

    this.container.querySelector('#btn-advance-chapter')?.addEventListener('click', () => {
      if (this.currentChapter.id < MissionChapters.length && this.onChapterSelect) {
        this.onChapterSelect(this.currentChapter.id + 1);
      }
    });
  }
}
