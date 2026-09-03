import { CmdChallenge } from '../challenges/catalog';
import { VirtualFileSystem } from '../engine/vfs';
import { SoundFX } from '../audio/soundFx';

export class ChallengePromptView {
  private container: HTMLElement;
  private challenge: CmdChallenge;
  private isSolved: boolean;
  private sound: SoundFX;
  private vfs: VirtualFileSystem;
  private onRunCommand: (cmd: string) => void;
  private onNextChallenge?: () => void;

  private showHint: boolean = false;
  private showSolution: boolean = false;
  private showFiles: boolean = false;
  private lastSolvedChars: number = 0;

  constructor(
    container: HTMLElement,
    challenge: CmdChallenge,
    isSolved: boolean,
    sound: SoundFX,
    vfs: VirtualFileSystem,
    onRunCommand: (cmd: string) => void,
    onNextChallenge?: () => void
  ) {
    this.container = container;
    this.challenge = challenge;
    this.isSolved = isSolved;
    this.sound = sound;
    this.vfs = vfs;
    this.onRunCommand = onRunCommand;
    this.onNextChallenge = onNextChallenge;

    this.render();
    this.attachEvents();
  }

  public update(challenge: CmdChallenge, isSolved: boolean, solvedChars?: number): void {
    this.challenge = challenge;
    this.isSolved = isSolved;
    if (solvedChars) this.lastSolvedChars = solvedChars;
    this.showHint = false;
    this.showSolution = false;
    this.showFiles = false;
    this.render();
    this.attachEvents();
  }

  private render(): void {
    const c = this.challenge;
    const files = this.vfs.getTree();

    const hintsHtml = c.hints.map((h, i) => `
      <div class="cmd-drawer-row">
        <span class="cmd-hint-num">Hint ${i + 1}:</span>
        <span>${this.escapeHtml(h)}</span>
      </div>
    `).join('');

    const solutionsHtml = c.solutions.map(s => `
      <div class="cmd-solution-row">
        <code>${this.escapeHtml(s)}</code>
        <div class="sol-right-meta">
          <span class="char-count-pill">${s.length} chars</span>
          <button class="cmd-btn-run-sol" data-cmd="${this.escapeHtml(s)}">Run ▶</button>
        </div>
      </div>
    `).join('');

    const filesHtml = files.map(f => {
      const isDir = f.type === 'directory';
      const rel = f.path.replace(/c:\\users\\student\\?/i, '') || '.';
      return `
        <div class="vfs-tree-row">
          <span class="vfs-icon">${isDir ? '📁' : '📄'}</span>
          <span class="vfs-name ${isDir ? 'is-dir' : 'is-file'}">${this.escapeHtml(rel)}</span>
          <span class="vfs-size">${f.size !== undefined ? f.size + ' B' : ''}</span>
          ${!isDir ? `<button class="vfs-view-btn" data-cmd="Get-Content ${this.escapeHtml(rel)}">View</button>` : ''}
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="cmd-prompt-card ${this.isSolved ? 'is-solved' : ''}">
        <div class="cmd-prompt-top">
          <div class="cmd-slug-tag">
            <span>#${c.id}</span>
            <strong>${c.slug}</strong>
          </div>
          <div class="top-tags-right">
            <span class="diff-badge diff-${c.difficulty.toLowerCase()}">${c.difficulty}</span>
            <span class="cmd-category-tag">${c.category}</span>
          </div>
        </div>

        <div class="cmd-prompt-main">
          <p class="cmd-prompt-text">${this.escapeHtml(c.prompt)}</p>
        </div>

        <!-- Success Banner -->
        ${this.isSolved ? `
          <div class="cmd-success-banner animate-slide-down">
            <div class="success-banner-left">
              <span class="success-check-icon">✓</span>
              <div>
                <div class="success-heading">
                  <strong>CORRECT!</strong>
                  ${this.lastSolvedChars > 0 ? `<span class="golf-badge">⚡ ${this.lastSolvedChars} characters</span>` : ''}
                </div>
                <span>Challenge solved successfully.</span>
              </div>
            </div>
            ${this.onNextChallenge ? `
              <button class="cmd-btn-next" id="btn-next-ch-banner">
                Next Challenge ▶
              </button>
            ` : ''}
          </div>
        ` : ''}

        <!-- Footer Actions (Hint, Solutions, Filesystem) -->
        <div class="cmd-prompt-actions">
          <div class="actions-left">
            <button class="cmd-action-link ${this.showHint ? 'active' : ''}" id="btn-toggle-hint">
              💡 Hint ${c.hints.length > 0 ? `(${c.hints.length})` : ''}
            </button>
            <button class="cmd-action-link ${this.showSolution ? 'active' : ''}" id="btn-toggle-solution">
              ✨ Solutions
            </button>
            <button class="cmd-action-link ${this.showFiles ? 'active' : ''}" id="btn-toggle-files">
              📁 Files (${files.length})
            </button>
          </div>

          ${c.solutions.length > 0 && !this.isSolved ? `
            <button class="cmd-quick-solution-btn" data-cmd="${this.escapeHtml(c.solutions[0])}">
              <span>Test Solution:</span> <code>${this.escapeHtml(c.solutions[0])}</code>
            </button>
          ` : ''}
        </div>

        <!-- Hint Drawer -->
        ${this.showHint ? `
          <div class="cmd-drawer hint-box animate-slide-down">
            <div class="drawer-title">HINTS</div>
            ${hintsHtml}
          </div>
        ` : ''}

        <!-- Solutions Drawer -->
        ${this.showSolution ? `
          <div class="cmd-drawer solution-box animate-slide-down">
            <div class="drawer-title">SOLUTIONS & CODE GOLF</div>
            ${solutionsHtml}
          </div>
        ` : ''}

        <!-- Filesystem Drawer -->
        ${this.showFiles ? `
          <div class="cmd-drawer files-box animate-slide-down">
            <div class="drawer-title">CURRENT WORKSPACE FILES (C:\\Users\\student)</div>
            <div class="vfs-tree-grid">
              ${filesHtml}
            </div>
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
      this.showFiles = false;
      this.render();
      this.attachEvents();
    });

    // Solution toggle
    this.container.querySelector('#btn-toggle-solution')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.showSolution = !this.showSolution;
      this.showHint = false;
      this.showFiles = false;
      this.render();
      this.attachEvents();
    });

    // Files toggle
    this.container.querySelector('#btn-toggle-files')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.showFiles = !this.showFiles;
      this.showHint = false;
      this.showSolution = false;
      this.render();
      this.attachEvents();
    });

    // Quick test
    this.container.querySelectorAll('.cmd-quick-solution-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
        if (cmd) {
          this.sound.playKeyClick();
          this.onRunCommand(cmd);
        }
      });
    });

    // Run from solutions drawer
    this.container.querySelectorAll('.cmd-btn-run-sol').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
        if (cmd) {
          this.sound.playKeyClick();
          this.onRunCommand(cmd);
        }
      });
    });

    // View file from VFS tree
    this.container.querySelectorAll('.vfs-view-btn').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd');
        if (cmd) {
          this.sound.playKeyClick();
          this.onRunCommand(cmd);
        }
      });
    });

    // Next button
    this.container.querySelector('#btn-next-ch-banner')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      if (this.onNextChallenge) this.onNextChallenge();
    });
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
