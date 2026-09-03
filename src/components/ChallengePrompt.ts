import { Challenge } from '../challenges/data';
import { SoundFX } from '../audio/soundFx';

export class ChallengePrompt {
  private container: HTMLElement;
  private challenge: Challenge;
  private isSolved: boolean;
  private sound: SoundFX;
  private onRunCommand: (cmd: string) => void;
  private onNextChallenge?: () => void;

  private showHint: boolean = false;
  private showSolution: boolean = false;

  constructor(
    container: HTMLElement,
    challenge: Challenge,
    isSolved: boolean,
    sound: SoundFX,
    onRunCommand: (cmd: string) => void,
    onNextChallenge?: () => void
  ) {
    this.container = container;
    this.challenge = challenge;
    this.isSolved = isSolved;
    this.sound = sound;
    this.onRunCommand = onRunCommand;
    this.onNextChallenge = onNextChallenge;

    this.render();
    this.attachEvents();
  }

  public update(challenge: Challenge, isSolved: boolean): void {
    this.challenge = challenge;
    this.isSolved = isSolved;
    this.showHint = false;
    this.showSolution = false;
    this.render();
    this.attachEvents();
  }

  private render(): void {
    const c = this.challenge;

    const diffBadge = c.difficulty === 'Easy'
      ? '<span class="diff-chip chip-easy">Easy</span>'
      : c.difficulty === 'Medium'
      ? '<span class="diff-chip chip-med">Medium</span>'
      : '<span class="diff-chip chip-hard">Hard</span>';

    const hintsHtml = c.hints.map((h, i) => `
      <div class="hint-item">
        <span class="hint-bullet">💡 Hint ${i + 1}:</span>
        <span>${h}</span>
      </div>
    `).join('');

    const solutionsHtml = c.solutions.map(s => `
      <div class="solution-item">
        <code>${this.escapeHtml(s)}</code>
        <button class="btn-copy-solution" data-cmd="${this.escapeHtml(s)}">Run ▶</button>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="cmd-challenge-card ${this.isSolved ? 'solved-card' : ''}">
        <div class="challenge-meta-row">
          <div class="challenge-title-group">
            <span class="challenge-num-tag">#${c.id}</span>
            <h2 class="challenge-title">${c.title}</h2>
          </div>
          <div class="challenge-tags">
            <span class="category-chip">${c.category}</span>
            ${diffBadge}
            ${this.isSolved ? '<span class="solved-chip">✔ Solved</span>' : ''}
          </div>
        </div>

        <div class="challenge-goal-box">
          <p class="challenge-goal-text">${c.goalText}</p>
          ${c.syntaxTip ? `<div class="challenge-syntax-tip"><span>Tip:</span> ${c.syntaxTip}</div>` : ''}
        </div>

        <!-- Success Banner -->
        ${this.isSolved ? `
          <div class="challenge-success-alert animate-pop">
            <div class="success-alert-left">
              <span class="success-icon">🎉</span>
              <div>
                <strong>CORRECT! Challenge Solved!</strong>
                <div class="success-sub">Press <kbd>Enter</kbd> or click next to continue.</div>
              </div>
            </div>
            ${this.onNextChallenge ? `
              <button class="btn-next-challenge" id="btn-success-next">
                Next Challenge ➔
              </button>
            ` : ''}
          </div>
        ` : ''}

        <!-- Interactive Drawer Controls (Hints, Solutions, Run) -->
        <div class="challenge-actions-bar">
          <div class="left-actions">
            <button class="btn-toggle-drawer ${this.showHint ? 'active' : ''}" id="btn-toggle-hint">
              💡 Hint ${c.hints.length > 0 ? `(${c.hints.length})` : ''}
            </button>
            <button class="btn-toggle-drawer ${this.showSolution ? 'active' : ''}" id="btn-toggle-solution">
              ✨ Solution
            </button>
          </div>

          ${c.solutions.length > 0 && !this.isSolved ? `
            <button class="btn-quick-test" data-cmd="${this.escapeHtml(c.solutions[0])}">
              ▶ Test Solution: <code>${this.escapeHtml(c.solutions[0])}</code>
            </button>
          ` : ''}
        </div>

        <!-- Hint Drawer -->
        ${this.showHint ? `
          <div class="drawer-panel hint-drawer animate-slide-down">
            <div class="drawer-header">HELPFUL HINTS</div>
            <div class="drawer-content">${hintsHtml}</div>
          </div>
        ` : ''}

        <!-- Solution Drawer -->
        ${this.showSolution ? `
          <div class="drawer-panel solution-drawer animate-slide-down">
            <div class="drawer-header">WORKING SOLUTIONS</div>
            <div class="drawer-content">${solutionsHtml}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private attachEvents(): void {
    // Hint toggle
    this.container.querySelector('#btn-toggle-hint')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.showHint = !this.showHint;
      this.showSolution = false;
      this.render();
      this.attachEvents();
    });

    // Solution toggle
    this.container.querySelector('#btn-toggle-solution')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.showSolution = !this.showSolution;
      this.showHint = false;
      this.render();
      this.attachEvents();
    });

    // Quick test button
    this.container.querySelectorAll('.btn-quick-test').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
        if (cmd) {
          this.sound.playKeyClick();
          this.onRunCommand(cmd);
        }
      });
    });

    // Copy & Run in solution drawer
    this.container.querySelectorAll('.btn-copy-solution').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
        if (cmd) {
          this.sound.playKeyClick();
          this.onRunCommand(cmd);
        }
      });
    });

    // Success next challenge button
    this.container.querySelector('#btn-success-next')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      if (this.onNextChallenge) {
        this.onNextChallenge();
      }
    });
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
