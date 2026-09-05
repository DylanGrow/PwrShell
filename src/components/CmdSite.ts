import { VirtualFileSystem } from '../engine/vfs';
import { Executor } from '../engine/executor';
import { createDefaultState } from '../state/gameState';
import { ChallengesCatalog, CmdChallenge } from '../challenges/catalog';
import { Formatters } from '../engine/formatters';
import { PSObject } from '../engine/psobject';

export class CmdSite {
  private container: HTMLElement;
  private vfs: VirtualFileSystem;
  private executor: Executor;

  private currentId: number = 1;
  private solvedIds: Set<number> = new Set();
  private history: string[] = [];
  private historyIndex: number = -1;

  private showLearn: boolean = false;
  private showSolutions: boolean = false;
  private showFiles: boolean = false;
  private showCatalog: boolean = false;
  private catalogSearchQuery: string = '';
  private soundEnabled: boolean = true;

  private audioCtx: AudioContext | null = null;

  private autocompleteList: string[] = [
    'Get-ChildItem', 'Get-Content', 'Set-Content', 'Add-Content', 'New-Item', 'Remove-Item', 'Copy-Item',
    'Get-Location', 'Set-Location', 'Test-Path', 'Split-Path', 'Join-Path', 'Get-Item',
    'Select-String', 'Where-Object', 'Select-Object', 'Sort-Object', 'Measure-Object', 'Group-Object', 'ForEach-Object',
    'Compare-Object', 'Tee-Object', 'Out-File', 'Get-Command', 'Get-Help', 'Get-Variable', 'Set-Variable',
    'Import-Csv', 'Export-Csv', 'ConvertFrom-Json', 'ConvertTo-Json',
    'Get-Process', 'Get-Service', 'Get-Date', 'Get-Random', 'Write-Output', 'Clear-Host',
    'dir', 'ls', 'cat', 'gc', 'sc', 'sls', 'grep', 'ps', 'gps', 'gsv', 'pwd', 'gl', 'cd', 'echo', 'diff', 'tee',
    '$PSVersionTable', '$PSVersionTable.PSVersion', '$PWD', '$PROFILE',
    '-Path', '-Filter', '-Recurse', '-Force', '-Pattern', '-Property', '-ExpandProperty',
    '-First', '-Last', '-Unique', '-Descending', '-Sum', '-Average', '-Line', '-Format',
    '-Minimum', '-Maximum', '-TotalCount', '-FilePath', '-Append', '-Noun', '-match',
    'welcome.txt', 'access.log', 'employees.csv', 'config.json', 'notes.txt', 'names.txt', 'procs.txt'
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    this.vfs = new VirtualFileSystem();
    const state = createDefaultState();
    this.executor = new Executor(state, this.vfs);

    this.loadProgress();
    this.render();
    this.attachEvents();
    this.focusTerminal();
  }

  private initAudio(): void {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  private playSuccessSound(): void {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, this.audioCtx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.12, this.audioCtx!.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx!.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(this.audioCtx!.currentTime + idx * 0.08);
        osc.stop(this.audioCtx!.currentTime + idx * 0.08 + 0.4);
      });
    } catch {
      // Audio autoplay restrictions gracefully ignored
    }
  }

  private playClickSound(): void {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('ps_cmdchallenge_solved');
      if (saved) {
        this.solvedIds = new Set(JSON.parse(saved));
      }
      const cur = localStorage.getItem('ps_cmdchallenge_current');
      if (cur) {
        const id = parseInt(cur, 10);
        if (id >= 1 && id <= ChallengesCatalog.length) {
          this.currentId = id;
        }
      }
      const snd = localStorage.getItem('ps_cmdchallenge_sound');
      if (snd !== null) {
        this.soundEnabled = snd === 'true';
      }
    } catch {
      // Ignore
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem('ps_cmdchallenge_solved', JSON.stringify(Array.from(this.solvedIds)));
      localStorage.setItem('ps_cmdchallenge_current', String(this.currentId));
      localStorage.setItem('ps_cmdchallenge_sound', String(this.soundEnabled));
    } catch {
      // Ignore
    }
  }

  private getDylanRank(): { title: string; color: string; icon: string } {
    const count = this.solvedIds.size;
    if (count >= 55) return { title: 'Grandmaster of PowerShell', color: '#f59e0b', icon: '👑' };
    if (count >= 40) return { title: 'DevOps Engineer', color: '#38bdf8', icon: '🚀' };
    if (count >= 25) return { title: 'SysAdmin Specialist', color: '#a855f7', icon: '⚡' };
    if (count >= 10) return { title: 'Pipeline Apprentice', color: '#10b981', icon: '🛠️' };
    return { title: 'PowerShell Explorer', color: '#94a3b8', icon: '🌱' };
  }

  private getCurrentChallenge(): CmdChallenge {
    return ChallengesCatalog.find(c => c.id === this.currentId) || ChallengesCatalog[0];
  }

  public selectChallenge(id: number): void {
    if (id < 1 || id > ChallengesCatalog.length) return;
    this.currentId = id;
    this.showLearn = false;
    this.showSolutions = false;
    this.showFiles = false;
    this.showCatalog = false;
    this.saveProgress();
    this.vfs.reset();
    this.render();
    this.attachEvents();
    this.focusTerminal();
  }

  public nextChallenge(): void {
    if (this.currentId < ChallengesCatalog.length) {
      this.selectChallenge(this.currentId + 1);
    }
  }

  private focusTerminal(): void {
    const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;
    if (input) input.focus();
  }

  private render(): void {
    const ch = this.getCurrentChallenge();
    const isSolved = this.solvedIds.has(ch.id);
    const progressPercent = Math.round((this.solvedIds.size / ChallengesCatalog.length) * 100);
    const rank = this.getDylanRank();

    // Challenge badges
    const badgesHtml = ChallengesCatalog.map(c => {
      const isCur = c.id === this.currentId;
      const isDone = this.solvedIds.has(c.id);
      let cls = 'ch-badge';
      if (isCur) cls += ' active';
      if (isDone) cls += ' solved';

      return `
        <button class="${cls}" data-id="${c.id}" title="${c.id}. ${c.title} (${c.difficulty})">
          ${isDone ? '<span class="ch-check">✓</span>' : ''}
          <span class="badge-num">${c.id}</span>
          <span class="badge-slug">${c.slug}</span>
        </button>
      `;
    }).join('');

    // Solutions HTML
    const solutionsHtml = ch.solutions.map(s => `
      <div class="sol-item">
        <div class="sol-code-wrap">
          <span class="sol-dollar">PS&gt;</span>
          <code>${this.escapeHtml(s)}</code>
        </div>
        <button class="btn-try-sol" data-cmd="${this.escapeHtml(s)}">Run ➔</button>
      </div>
    `).join('');

    // Hints HTML
    const hintsHtml = ch.hints.map(h => `
      <li class="hint-bullet">• ${this.escapeHtml(h)}</li>
    `).join('');

    // Files HTML
    const vfsFiles = [
      { name: 'welcome.txt', desc: 'Personalized welcome note for Dylan Grow' },
      { name: 'access.log', desc: 'Web server access logs with IP addresses & HTTP codes' },
      { name: 'employees.csv', desc: 'Dataset with Id, Name, Department, Salary, Experience' },
      { name: 'config.json', desc: 'JSON server config with host, port, database and flags' },
      { name: 'notes.txt', desc: 'Admin tasks and system maintenance checklist' },
      { name: 'names.txt', desc: 'Unformatted names list for text processing' },
      { name: 'backup/', desc: 'Target directory for file backups' },
      { name: 'scripts/dylan_profile.ps1', desc: "Dylan Grow's PowerShell startup script" }
    ];

    const filesHtml = vfsFiles.map(f => `
      <div class="vfs-file-row">
        <div class="vfs-file-info">
          <span class="vfs-file-name">📄 ${f.name}</span>
          <span class="vfs-file-desc">${f.desc}</span>
        </div>
        <button class="btn-view-file" data-file="${f.name}">View ➔</button>
      </div>
    `).join('');

    // Catalog filtered list
    const filteredCatalog = ChallengesCatalog.filter(c => {
      if (!this.catalogSearchQuery) return true;
      const q = this.catalogSearchQuery.toLowerCase();
      return c.slug.toLowerCase().includes(q) ||
             c.title.toLowerCase().includes(q) ||
             c.category.toLowerCase().includes(q) ||
             c.prompt.toLowerCase().includes(q) ||
             c.solutions.some(s => s.toLowerCase().includes(q));
    });

    const catalogListHtml = filteredCatalog.map(c => {
      const isDone = this.solvedIds.has(c.id);
      return `
        <div class="catalog-item ${c.id === this.currentId ? 'current' : ''}" data-id="${c.id}">
          <div class="cat-item-left">
            <span class="cat-item-id">#${c.id}</span>
            ${isDone ? '<span class="ch-check">✓</span>' : ''}
            <span class="cat-item-slug">${c.slug}</span>
            <span class="diff-chip diff-${c.difficulty.toLowerCase()}">${c.difficulty}</span>
          </div>
          <span class="cat-item-prompt">${this.escapeHtml(c.prompt)}</span>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="cmd-page">
        <!-- Top Navbar -->
        <header class="navbar">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-box">
                <span class="logo-prompt">PS&gt;</span>
              </div>
              <div class="brand-group">
                <div class="brand-row">
                  <span class="site-title">DYLAN GROW'S POWERSHELL CHALLENGE</span>
                  <span class="bash-chip">PowerShell 7.4</span>
                  <span class="dylan-badge">Dylan Grow</span>
                  <span class="rank-badge" style="border-color: ${rank.color}; color: ${rank.color};">
                    ${rank.icon} ${rank.title}
                  </span>
                </div>
                <span class="site-sub">Interactive PowerShell Command Line Mastery • ${ChallengesCatalog.length} Progressive Challenges</span>
              </div>
            </div>

            <div class="header-right">
              <div class="progress-container" title="${this.solvedIds.size} of ${ChallengesCatalog.length} completed">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <span class="progress-label">${this.solvedIds.size} / ${ChallengesCatalog.length} (${progressPercent}%)</span>
              </div>

              <button class="nav-btn ${this.soundEnabled ? 'active' : ''}" id="btn-toggle-sound" title="Toggle audio effects">
                ${this.soundEnabled ? '🔊 Sound' : '🔇 Mute'}
              </button>

              <button class="nav-btn" id="btn-open-catalog" title="Search all 55 challenges">
                🔍 Catalog
              </button>

              <button class="nav-btn" id="btn-reset-progress" title="Reset all progress">
                <span class="btn-icon">↺</span> Reset
              </button>
            </div>
          </div>
        </header>

        <!-- Challenge Navigation Strip -->
        <div class="challenge-nav-bar">
          <div class="ch-nav-inner">
            <button class="nav-arrow" id="btn-nav-prev" ${this.currentId === 1 ? 'disabled' : ''} title="Previous Challenge (Ctrl+Left or [)">
              ◀
            </button>
            <div class="badges-scroll" id="badges-track">
              ${badgesHtml}
            </div>
            <button class="nav-arrow" id="btn-nav-next" ${this.currentId === ChallengesCatalog.length ? 'disabled' : ''} title="Next Challenge (Ctrl+Right or ])">
              ▶
            </button>
          </div>
        </div>

        <!-- Main Challenge Stage -->
        <main class="challenge-container">
          <div class="challenge-card">
            <div class="ch-card-top">
              <div class="ch-meta">
                <span class="ch-number-tag">#${ch.id} of ${ChallengesCatalog.length}</span>
                <span class="category-chip cat-${ch.category.toLowerCase().replace(/[^a-z]/g, '')}">${ch.category}</span>
                <span class="diff-chip diff-${ch.difficulty.toLowerCase()}">${ch.difficulty}</span>
                <span class="ch-slug-pill">${ch.slug}</span>
              </div>
              <div class="ch-controls">
                <button class="toggle-link ${this.showFiles ? 'active' : ''}" id="btn-toggle-files">
                  <span>📁 Workspace Files</span>
                </button>
                <button class="toggle-link ${this.showLearn ? 'active' : ''}" id="btn-toggle-learn">
                  <span>💡 Hints &amp; Syntax</span>
                </button>
                <button class="toggle-link ${this.showSolutions ? 'active' : ''}" id="btn-toggle-solutions">
                  <span>✨ Solutions</span>
                </button>
              </div>
            </div>

            <div class="ch-description">
              <p>${ch.prompt}</p>
            </div>

            ${ch.syntaxTip ? `
              <div class="syntax-tip-box">
                <span class="tip-label">Syntax Tip:</span>
                <code>${this.escapeHtml(ch.syntaxTip)}</code>
              </div>
            ` : ''}

            <!-- Workspace Files Drawer -->
            ${this.showFiles ? `
              <div class="files-drawer animate-slide">
                <div class="drawer-header">
                  <span class="drawer-icon">📁</span>
                  <span class="drawer-heading">Dylan's Virtual Filesystem (C:\\Users\\Dylan)</span>
                </div>
                <div class="drawer-body files-list">${filesHtml}</div>
              </div>
            ` : ''}

            <!-- Hints Drawer -->
            ${this.showLearn ? `
              <div class="learn-drawer animate-slide">
                <div class="drawer-header">
                  <span class="drawer-icon">💡</span>
                  <span class="drawer-heading">Hints &amp; Concepts</span>
                </div>
                <ul class="drawer-hints-list">${hintsHtml}</ul>
              </div>
            ` : ''}

            <!-- Solutions Drawer -->
            ${this.showSolutions ? `
              <div class="solutions-drawer animate-slide">
                <div class="drawer-header">
                  <span class="drawer-icon">✨</span>
                  <span class="drawer-heading">Verified Solutions</span>
                </div>
                <div class="drawer-body">${solutionsHtml}</div>
              </div>
            ` : ''}

            <!-- Correct Banner -->
            ${isSolved ? `
              <div class="correct-banner animate-slide">
                <div class="correct-left">
                  <span class="correct-icon">✓</span>
                  <div>
                    <span class="correct-title">CORRECT!</span>
                    <span class="correct-desc">Nicely done, Dylan! Challenge #${ch.id} verified.</span>
                  </div>
                </div>
                ${this.currentId < ChallengesCatalog.length ? `
                  <button class="btn-next-challenge" id="btn-next-banner">Next Challenge ➔</button>
                ` : `<span class="all-solved-text">🎉 Outstanding Dylan! You completed all ${ChallengesCatalog.length} challenges!</span>`}
              </div>
            ` : ''}

            <!-- Terminal Component -->
            <div class="terminal-wrapper" id="terminal-box">
              <div class="terminal-titlebar">
                <div class="term-traffic-lights">
                  <span class="traffic-dot dot-red"></span>
                  <span class="traffic-dot dot-yellow"></span>
                  <span class="traffic-dot dot-green"></span>
                </div>
                <div class="term-window-title">PowerShell 7.4 — C:\\Users\\Dylan — 80×24</div>
                <div class="term-right-tools">
                  <span id="term-char-counter" class="char-counter">0 chars</span>
                  <button class="term-clear-btn" id="btn-term-clear" title="Clear terminal output (Ctrl+L)">Clear</button>
                </div>
              </div>

              <div class="term-screen" id="term-output-area" role="log" aria-live="polite">
                <div class="term-line info-text">PowerShell 7.4.2 [Client-Side Simulation Engine]</div>
                <div class="term-line info-text">Workspace: C:\\Users\\Dylan | User: Dylan Grow</div>
                <div class="term-line info-text">Type your PowerShell command below and press Enter. (Tab for autocomplete)</div>
              </div>

              <div class="term-input-row">
                <span class="term-ps-prompt">PS C:\\Users\\Dylan&gt;</span>
                <input
                  type="text"
                  id="cmd-term-input"
                  class="term-input-field"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="Type PowerShell command here (e.g. ${this.escapeHtml(ch.solutions[0])})..."
                  aria-label="PowerShell command line input"
                />
                <button class="term-run-btn" id="btn-submit-cmd" title="Execute command">Enter ↵</button>
              </div>
            </div>
          </div>
        </main>

        <!-- Search / Jump Catalog Modal -->
        ${this.showCatalog ? `
          <div class="modal-backdrop animate-fade" id="catalog-modal-backdrop">
            <div class="modal-card">
              <div class="modal-header">
                <div class="modal-title-group">
                  <span class="modal-icon">🔍</span>
                  <span class="modal-title">Challenges Catalog (${ChallengesCatalog.length} Total)</span>
                </div>
                <button class="btn-close-modal" id="btn-close-catalog">✕</button>
              </div>
              <div class="modal-search-box">
                <input
                  type="text"
                  id="catalog-search-input"
                  placeholder="Search by cmdlet, category, keyword (e.g. 'Get-Process', 'csv', 'filter')..."
                  value="${this.escapeHtml(this.catalogSearchQuery)}"
                />
              </div>
              <div class="catalog-list-scroll">
                ${catalogListHtml}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Footer personalized for Dylan Grow -->
        <footer class="cmd-footer">
          <div class="footer-inner">
            <div class="footer-dylan">
              <span class="footer-heart">⚡</span>
              <span>Designed &amp; Built for <strong>Dylan Grow</strong></span>
            </div>
            <span class="footer-dot">•</span>
            <span>PowerShell Command Challenge</span>
          </div>
        </footer>
      </div>
    `;

    // Scroll active badge into view
    const activeBadge = this.container.querySelector('.ch-badge.active') as HTMLElement;
    if (activeBadge) {
      activeBadge.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  private attachEvents(): void {
    // Prev / Next arrow buttons
    this.container.querySelector('#btn-nav-prev')?.addEventListener('click', () => {
      if (this.currentId > 1) this.selectChallenge(this.currentId - 1);
    });

    this.container.querySelector('#btn-nav-next')?.addEventListener('click', () => {
      if (this.currentId < ChallengesCatalog.length) this.selectChallenge(this.currentId + 1);
    });

    // Sound toggle
    this.container.querySelector('#btn-toggle-sound')?.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.saveProgress();
      this.render();
      this.attachEvents();
    });

    // Catalog modal open/close
    this.container.querySelector('#btn-open-catalog')?.addEventListener('click', () => {
      this.showCatalog = true;
      this.render();
      this.attachEvents();
      const sInput = this.container.querySelector('#catalog-search-input') as HTMLInputElement;
      if (sInput) {
        sInput.focus();
        sInput.addEventListener('input', (e) => {
          this.catalogSearchQuery = (e.target as HTMLInputElement).value;
          this.render();
          this.attachEvents();
          const nextInput = this.container.querySelector('#catalog-search-input') as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
          }
        });
      }
    });

    this.container.querySelector('#btn-close-catalog')?.addEventListener('click', () => {
      this.showCatalog = false;
      this.render();
      this.attachEvents();
      this.focusTerminal();
    });

    this.container.querySelector('#catalog-modal-backdrop')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'catalog-modal-backdrop') {
        this.showCatalog = false;
        this.render();
        this.attachEvents();
        this.focusTerminal();
      }
    });

    // Catalog items click
    this.container.querySelectorAll('.catalog-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = parseInt((e.currentTarget as HTMLElement).getAttribute('data-id') || '1', 10);
        this.selectChallenge(id);
      });
    });

    // Global keyboard shortcuts for prev/next
    window.onkeydown = (e: KeyboardEvent) => {
      if (this.showCatalog && e.key === 'Escape') {
        this.showCatalog = false;
        this.render();
        this.attachEvents();
        this.focusTerminal();
        return;
      }
      if ((e.ctrlKey && e.key === 'ArrowLeft') || (e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        if (this.currentId > 1) this.selectChallenge(this.currentId - 1);
      } else if ((e.ctrlKey && e.key === 'ArrowRight') || (e.key === ']' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        if (this.currentId < ChallengesCatalog.length) this.selectChallenge(this.currentId + 1);
      }
    };

    // Badge click
    this.container.querySelectorAll('.ch-badge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt((e.currentTarget as HTMLElement).getAttribute('data-id') || '1', 10);
        this.selectChallenge(id);
      });
    });

    // Reset button
    this.container.querySelector('#btn-reset-progress')?.addEventListener('click', () => {
      if (confirm('Reset your progress back to challenge 1?')) {
        this.solvedIds.clear();
        this.currentId = 1;
        this.saveProgress();
        this.selectChallenge(1);
      }
    });

    // Files toggle
    this.container.querySelector('#btn-toggle-files')?.addEventListener('click', () => {
      this.showFiles = !this.showFiles;
      this.render();
      this.attachEvents();
      this.focusTerminal();
    });

    // View file button in drawer
    this.container.querySelectorAll('.btn-view-file').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fname = (e.currentTarget as HTMLElement).getAttribute('data-file') || '';
        const cmd = `Get-Content ${fname}`;
        this.runCommand(cmd);
      });
    });

    // Learn toggle
    this.container.querySelector('#btn-toggle-learn')?.addEventListener('click', () => {
      this.showLearn = !this.showLearn;
      this.render();
      this.attachEvents();
      this.focusTerminal();
    });

    // Solutions toggle
    this.container.querySelector('#btn-toggle-solutions')?.addEventListener('click', () => {
      this.showSolutions = !this.showSolutions;
      this.render();
      this.attachEvents();
      this.focusTerminal();
    });

    // Try solution buttons
    this.container.querySelectorAll('.btn-try-sol').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmd = (e.currentTarget as HTMLElement).getAttribute('data-cmd') || '';
        this.runCommand(cmd);
      });
    });

    // Next challenge banner button
    this.container.querySelector('#btn-next-banner')?.addEventListener('click', () => {
      this.nextChallenge();
    });

    // Clear terminal button
    this.container.querySelector('#btn-term-clear')?.addEventListener('click', () => {
      const outputArea = this.container.querySelector('#term-output-area') as HTMLElement;
      if (outputArea) outputArea.innerHTML = '';
      this.focusTerminal();
    });

    // Run button in terminal
    this.container.querySelector('#btn-submit-cmd')?.addEventListener('click', () => {
      const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;
      if (input && input.value.trim()) {
        const cmd = input.value.trim();
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        input.value = '';
        this.updateCharCounter('');
        this.playClickSound();
        this.runCommand(cmd);
      }
    });

    // Terminal input handling
    const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        this.updateCharCounter(input.value);
      });

      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const cmd = input.value.trim();
          if (cmd) {
            this.history.push(cmd);
            this.historyIndex = this.history.length;
            input.value = '';
            this.updateCharCounter('');
            this.playClickSound();
            this.runCommand(cmd);
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.handleTabAutocomplete(input);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.history.length > 0 && this.historyIndex > 0) {
            this.historyIndex--;
            input.value = this.history[this.historyIndex];
            this.updateCharCounter(input.value);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            input.value = this.history[this.historyIndex];
            this.updateCharCounter(input.value);
          } else {
            this.historyIndex = this.history.length;
            input.value = '';
            this.updateCharCounter('');
          }
        } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          const outputArea = this.container.querySelector('#term-output-area') as HTMLElement;
          if (outputArea) outputArea.innerHTML = '';
        }
      });
    }

    // Clicking terminal focuses input
    this.container.querySelector('#terminal-box')?.addEventListener('click', () => {
      this.focusTerminal();
    });
  }

  private updateCharCounter(val: string): void {
    const counter = this.container.querySelector('#term-char-counter') as HTMLElement;
    if (counter) {
      counter.innerText = `${val.length} chars`;
    }
  }

  private handleTabAutocomplete(input: HTMLInputElement): void {
    const text = input.value;
    const parts = text.split(' ');
    const lastWord = parts[parts.length - 1];
    if (!lastWord) return;

    const matches = this.autocompleteList.filter(item => 
      item.toLowerCase().startsWith(lastWord.toLowerCase())
    );

    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + ' ';
      this.updateCharCounter(input.value);
    } else if (matches.length > 1) {
      const outputArea = this.container.querySelector('#term-output-area') as HTMLElement;
      if (outputArea) {
        const hintLine = document.createElement('div');
        hintLine.className = 'term-line info-text';
        hintLine.innerText = `Suggestions: ${matches.join('  ')}`;
        outputArea.appendChild(hintLine);
        outputArea.scrollTop = outputArea.scrollHeight;
      }
    }
  }

  private async runCommand(cmd: string): Promise<void> {
    const outputArea = this.container.querySelector('#term-output-area') as HTMLElement;
    if (!outputArea) return;

    // Display prompt line
    const promptLine = document.createElement('div');
    promptLine.className = 'term-line prompt-text';
    promptLine.innerText = `PS C:\\Users\\Dylan> ${cmd}`;
    outputArea.appendChild(promptLine);

    try {
      const res = await this.executor.execute(cmd);

      if (res.error) {
        const errLine = document.createElement('div');
        errLine.className = 'term-line error-text';
        errLine.innerText = res.error;
        outputArea.appendChild(errLine);
      } else if (res.output && res.output.length > 0) {
        let formatted = '';
        const first = res.output[0];

        if (first instanceof PSObject) {
          formatted = Formatters.formatTable(res.output).rawText;
        } else if (Array.isArray(first)) {
          formatted = first.map(item => String(item)).join('\n');
        } else {
          formatted = res.output.map(item => {
            if (item instanceof PSObject) return Formatters.formatTable([item]).rawText;
            if (typeof item === 'object' && item !== null) return JSON.stringify(item, null, 2);
            return String(item);
          }).join('\n');
        }

        if (formatted.trim()) {
          const outLine = document.createElement('div');
          outLine.className = 'term-line output-text';
          outLine.innerText = formatted;
          outputArea.appendChild(outLine);
        }
      }

      // Verify challenge
      const ch = this.getCurrentChallenge();
      const passed = ch.verify(this.vfs, res.output, cmd);

      if (passed) {
        this.solvedIds.add(ch.id);
        this.saveProgress();
        this.playSuccessSound();

        const successLine = document.createElement('div');
        successLine.className = 'term-line correct-text';
        successLine.innerText = `CORRECT! [Challenge #${ch.id} Solved: ${cmd.length} chars]`;
        outputArea.appendChild(successLine);

        // Refresh UI banner
        setTimeout(() => {
          this.render();
          this.attachEvents();
          this.focusTerminal();
        }, 400);
      }
    } catch (err: any) {
      const errLine = document.createElement('div');
      errLine.className = 'term-line error-text';
      errLine.innerText = err.message || String(err);
      outputArea.appendChild(errLine);
    }

    outputArea.scrollTop = outputArea.scrollHeight;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
