import { VirtualFileSystem } from '../engine/vfs';
import { Executor } from '../engine/executor';
import { createDefaultState } from '../state/gameState';
import { ChallengesCatalog, CmdChallenge } from '../challenges/catalog';
import { Formatters } from '../engine/formatters';
import { PSObject } from '../engine/psobject';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { GridViewModal } from './GridViewModal';
import { CertificateModal } from './CertificateModal';
import { CheatSheetModal } from './CheatSheetModal';
import { StatsModal } from './StatsModal';

export class CmdSite {
  private container: HTMLElement;
  private vfs: VirtualFileSystem;
  private executor: Executor;

  private currentId: number = 1;
  private solvedIds: Set<number> = new Set();
  private personalBests: Record<number, number> = {};
  private history: string[] = [];
  private historyIndex: number = -1;
  private fontScale: 'normal' | 'lg' | 'xl' = 'normal';

  // Reverse history search (Ctrl+R)
  private isReverseSearch: boolean = false;
  private reverseSearchQuery: string = '';
  private reverseSearchMatchedCmd: string = '';
  private reverseSearchMatchIndex: number = -1;

  private showLearn: boolean = false;
  private showSolutions: boolean = false;
  private showFiles: boolean = false;
  private showCatalog: boolean = false;
  private catalogSearchQuery: string = '';
  private soundEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;
  private lastFocusedElement: HTMLElement | null = null;

  private autocompleteList: string[] = [
    'Get-ChildItem', 'Get-Content', 'Set-Content', 'Add-Content', 'New-Item', 'Remove-Item', 'Copy-Item',
    'Get-Location', 'Set-Location', 'Test-Path', 'Split-Path', 'Join-Path', 'Get-Item',
    'Select-String', 'Where-Object', 'Select-Object', 'Sort-Object', 'Measure-Object', 'Group-Object', 'ForEach-Object',
    'Compare-Object', 'Tee-Object', 'Out-File', 'Out-GridView', 'Get-Command', 'Get-Help', 'Get-Variable', 'Set-Variable',
    'Import-Csv', 'Export-Csv', 'ConvertFrom-Json', 'ConvertTo-Json',
    'Get-Process', 'Get-Service', 'Get-Date', 'Get-Random', 'Write-Output', 'Clear-Host',
    'dir', 'ls', 'cat', 'gc', 'sc', 'sls', 'grep', 'ps', 'gps', 'gsv', 'pwd', 'gl', 'cd', 'echo', 'diff', 'tee', 'ogv', 'grid',
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
      const bests = localStorage.getItem('ps_cmdchallenge_bests');
      if (bests) {
        this.personalBests = JSON.parse(bests);
      }
      const fs = localStorage.getItem('ps_font_scale');
      if (fs === 'normal' || fs === 'lg' || fs === 'xl') {
        this.fontScale = fs;
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
      localStorage.setItem('ps_cmdchallenge_bests', JSON.stringify(this.personalBests));
      localStorage.setItem('ps_font_scale', this.fontScale);
    } catch {
      // Ignore
    }
  }

  public toggleFontScale(): void {
    if (this.fontScale === 'normal') {
      this.fontScale = 'lg';
    } else if (this.fontScale === 'lg') {
      this.fontScale = 'xl';
    } else {
      this.fontScale = 'normal';
    }
    this.saveProgress();
    this.render();
    this.attachEvents();
    this.focusTerminal();
  }

  public openCheatSheet(): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    const cs = new CheatSheetModal(
      (cmd: string) => {
        const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;
        if (input) {
          input.value = cmd;
          this.updateSyntaxAndCounter(cmd);
          input.focus();
          input.selectionStart = input.selectionEnd = cmd.length;
        }
      },
      () => {
        this.lastFocusedElement?.focus();
      }
    );
    cs.show();
  }

  public getStarsForChallenge(chId: number): number {
    if (!this.solvedIds.has(chId)) return 0;
    const ch = ChallengesCatalog.find(c => c.id === chId);
    if (!ch) return 1;
    const best = this.personalBests[chId];
    if (!best) return 1;

    const solLengths = ch.solutions.map(s => s.length);
    const minLen = Math.min(...solLengths);
    const maxLen = Math.max(...solLengths);

    if (best <= minLen) return 3;
    if (best <= maxLen + 5) return 2;
    return 1;
  }

  public getTotalStars(): number {
    let sum = 0;
    for (const id of this.solvedIds) {
      sum += this.getStarsForChallenge(id);
    }
    return sum;
  }

  private getDylanRank(): { title: string; color: string; icon: string } {
    const count = this.solvedIds.size;
    if (count >= 70) return { title: 'Grandmaster of PowerShell', color: '#f59e0b', icon: '👑' };
    if (count >= 55) return { title: 'PowerShell Architect', color: '#f97316', icon: '🏆' };
    if (count >= 40) return { title: 'DevOps Engineer', color: '#38bdf8', icon: '🚀' };
    if (count >= 25) return { title: 'SysAdmin Specialist', color: '#a855f7', icon: '⚡' };
    if (count >= 10) return { title: 'Pipeline Apprentice', color: '#10b981', icon: '🛠️' };
    return { title: 'PowerShell Explorer', color: '#94a3b8', icon: '🌱' };
  }

  public openStats(): void {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    const modal = new StatsModal(
      {
        solvedIds: this.solvedIds,
        personalBests: this.personalBests,
        getStars: (id: number) => this.getStarsForChallenge(id),
        getTotalStars: () => this.getTotalStars(),
        getDylanRank: () => this.getDylanRank()
      },
      () => {
        this.lastFocusedElement?.focus();
      }
    );
    modal.show();
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
    this.isReverseSearch = false;
    this.saveProgress();
    this.vfs.reset();
    this.render();
    this.attachEvents();
    this.focusTerminal();
    const ch = this.getCurrentChallenge();
    this.announce(`Loaded challenge ${ch.id} of ${ChallengesCatalog.length}: ${ch.title}. ${ch.prompt}`);
  }

  private announce(msg: string): void {
    const el = this.container.querySelector('#a11y-announcer');
    if (el) {
      el.textContent = '';
      setTimeout(() => {
        el.textContent = msg;
      }, 50);
    }
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

    // Challenge badges with Stars
    const badgesHtml = ChallengesCatalog.map(c => {
      const isCur = c.id === this.currentId;
      const isDone = this.solvedIds.has(c.id);
      const stars = this.getStarsForChallenge(c.id);
      let cls = 'ch-badge';
      if (isCur) cls += ' active';
      if (isDone) cls += ' solved';

      let starIcons = '';
      if (stars === 3) starIcons = '⭐⭐⭐';
      else if (stars === 2) starIcons = '⭐⭐';
      else if (stars === 1) starIcons = '⭐';

      const accessibleLabel = `Challenge ${c.id}: ${this.escapeHtml(c.title)} (${c.difficulty})${isDone ? ', Solved' : ''}${stars > 0 ? `, ${stars} stars` : ''}`;

      return `
        <button class="${cls}" data-id="${c.id}" role="tab" aria-selected="${isCur}" aria-controls="main-challenge" aria-label="${accessibleLabel}" title="${c.id}. ${c.title} (${c.difficulty}) ${starIcons}">
          ${isDone ? '<span class="ch-check" aria-hidden="true">✓</span>' : ''}
          <span class="badge-num">${c.id}</span>
          <span class="badge-slug">${c.slug}</span>
          ${stars > 0 ? `<span class="badge-stars" aria-hidden="true">${'★'.repeat(stars)}</span>` : ''}
        </button>
      `;
    }).join('');

    // Solutions HTML with Golf lengths
    const solutionsHtml = ch.solutions.map(s => `
      <div class="sol-item">
        <div class="sol-code-wrap">
          <span class="sol-dollar" aria-hidden="true">PS&gt;</span>
          <code>${this.escapeHtml(s)}</code>
          <span class="sol-char-len">[${s.length} chars]</span>
        </div>
        <button class="btn-try-sol" data-cmd="${this.escapeHtml(s)}" aria-label="Run solution: ${this.escapeHtml(s)}">Run ➔</button>
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
        <button class="btn-view-file" data-file="${f.name}" aria-label="View file ${f.name}">View ➔</button>
      </div>
    `).join('');

    // Catalog filtered list with Stars
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
      const stars = this.getStarsForChallenge(c.id);
      return `
        <button type="button" class="catalog-item ${c.id === this.currentId ? 'current' : ''}" data-id="${c.id}" role="option" aria-selected="${c.id === this.currentId}" aria-label="Challenge #${c.id}: ${this.escapeHtml(c.title)} (${c.difficulty})${isDone ? ', Solved' : ''}">
          <div class="cat-item-left">
            <span class="cat-item-id">#${c.id}</span>
            ${isDone ? '<span class="ch-check" aria-hidden="true">✓</span>' : ''}
            <span class="cat-item-slug">${c.slug}</span>
            <span class="diff-chip diff-${c.difficulty.toLowerCase()}">${c.difficulty}</span>
            ${stars > 0 ? `<span class="cat-item-stars" aria-hidden="true">${'★'.repeat(stars)}</span>` : ''}
          </div>
          <span class="cat-item-prompt">${this.escapeHtml(c.prompt)}</span>
        </button>
      `;
    }).join('');

    const currentBest = this.personalBests[ch.id];
    const bestStars = this.getStarsForChallenge(ch.id);
    const minSolLen = Math.min(...ch.solutions.map(s => s.length));

    this.container.innerHTML = `
      <div class="cmd-page ${this.fontScale !== 'normal' ? `font-scale-${this.fontScale}` : ''}">
        <!-- ♿ Skip Navigation Links -->
        <a href="#cmd-term-input" class="skip-nav-link">Skip to PowerShell Terminal</a>
        <a href="#main-challenge" class="skip-nav-link">Skip to Challenge Content</a>

        <!-- ♿ Screen Reader Live Announcer -->
        <div id="a11y-announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>

        <!-- Top Navbar -->
        <header class="navbar" role="banner">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-box" aria-hidden="true">
                <span class="logo-prompt">PS&gt;</span>
              </div>
              <span class="site-title">DYLAN GROW'S POWERSHELL CHALLENGE</span>
            </div>

            <div class="header-right">
              <div class="progress-container" role="progressbar" aria-valuenow="${this.solvedIds.size}" aria-valuemin="0" aria-valuemax="${ChallengesCatalog.length}" aria-label="Challenge progress: ${this.solvedIds.size} of ${ChallengesCatalog.length} challenges solved" title="${this.solvedIds.size} of ${ChallengesCatalog.length} completed">
                <div class="progress-bar-bg" aria-hidden="true">
                  <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
                <span class="progress-label" aria-hidden="true">${this.solvedIds.size} / ${ChallengesCatalog.length}</span>
              </div>

              <button class="font-scale-btn" id="btn-toggle-font" aria-label="Font size: ${this.fontScale === 'normal' ? '16px' : this.fontScale === 'lg' ? '18px' : '20px'}. Click to toggle font size" title="Toggle Font Size: Normal (16px) ➔ Large (18px) ➔ XL (20px)">
                Aa <span class="font-scale-badge">${this.fontScale === 'normal' ? '16px' : this.fontScale === 'lg' ? '18px' : '20px'}</span>
              </button>

              <button class="nav-btn" id="btn-open-cheatsheet" aria-label="Open PowerShell Command CheatSheet (Press F1 or ?)" title="PowerShell Command CheatSheet & Examples (Press F1 or ?)">
                📖 CheatSheet
              </button>
              <button class="nav-btn" id="btn-open-stats" aria-label="Open Dylan's Stats Dashboard" title="View your Stats Dashboard: progress, stars, personal bests">
                📊 Stats
              </button>

              <button class="nav-btn" id="btn-open-catalog" aria-label="Search all ${ChallengesCatalog.length} challenges in catalog" title="Search all ${ChallengesCatalog.length} challenges">
                🔍 Catalog
              </button>

              <button class="nav-btn icon-only" id="btn-open-cert" aria-label="View Dylan Grow's Certificate of Mastery" title="View Dylan Grow's Certificate of Mastery">
                🏆
              </button>

              <button class="nav-btn icon-only" id="btn-reset-progress" aria-label="Reset all challenge progress" title="Reset all progress">
                ↺
              </button>
            </div>
          </div>
        </header>

        <!-- Challenge Navigation Strip -->
        <nav class="challenge-nav-bar" aria-label="Challenge selection">
          <div class="ch-nav-inner">
            <button class="nav-arrow" id="btn-nav-prev" ${this.currentId === 1 ? 'disabled' : ''} aria-label="Previous challenge" title="Previous Challenge (Ctrl+Left or [)">
              ◀
            </button>
            <div class="badges-scroll" id="badges-track" role="tablist" aria-label="Challenges navigation strip">
              ${badgesHtml}
            </div>
            <button class="nav-arrow" id="btn-nav-next" ${this.currentId === ChallengesCatalog.length ? 'disabled' : ''} aria-label="Next challenge" title="Next Challenge (Ctrl+Right or ])">
              ▶
            </button>
          </div>
        </nav>

        <!-- Main Challenge Stage -->
        <main class="challenge-container" id="main-challenge" role="main">
          <section class="challenge-card" aria-labelledby="current-ch-title">
            <h1 id="current-ch-title" class="sr-only">Challenge #${ch.id}: ${this.escapeHtml(ch.title)}</h1>

            <div class="ch-card-top">
              <div class="ch-meta">
                <span class="ch-number-tag">#${ch.id} of ${ChallengesCatalog.length}</span>
                <span class="category-chip cat-${ch.category.toLowerCase().replace(/[^a-z]/g, '')}">${ch.category}</span>
                <span class="diff-chip diff-${ch.difficulty.toLowerCase()}">${ch.difficulty}</span>
                <span class="ch-slug-pill">${ch.slug}</span>
                ${currentBest ? `
                  <span class="golf-par-pill" title="Personal Best: ${currentBest} chars (Golf Target: ${minSolLen} chars)">
                    🏌️ Best: ${currentBest}c ${'★'.repeat(bestStars)}
                  </span>
                ` : `
                  <span class="golf-par-pill" title="Golf target for 3 stars">
                    🏌️ Golf Par: ${minSolLen}c
                  </span>
                `}
              </div>
              <div class="ch-controls">
                <button class="toggle-link ${this.showFiles ? 'active' : ''}" id="btn-toggle-files" aria-expanded="${this.showFiles}" aria-controls="files-drawer" aria-label="Toggle virtual workspace files drawer">
                  <span>📁 Workspace Files</span>
                </button>
                <button class="toggle-link ${this.showLearn ? 'active' : ''}" id="btn-toggle-learn" aria-expanded="${this.showLearn}" aria-controls="learn-drawer" aria-label="Toggle hints and concepts drawer">
                  <span>💡 Hints &amp; Syntax</span>
                </button>
                <button class="toggle-link ${this.showSolutions ? 'active' : ''}" id="btn-toggle-solutions" aria-expanded="${this.showSolutions}" aria-controls="solutions-drawer" aria-label="Toggle verified solutions drawer">
                  <span>✨ Solutions</span>
                </button>
              </div>
            </div>

            <div class="ch-description">
              <p>${ch.prompt}</p>
            </div>

            ${ch.syntaxTip ? `
              <div class="syntax-tip-box" aria-label="Syntax tip">
                <span class="tip-label">Syntax Tip:</span>
                <code>${this.escapeHtml(ch.syntaxTip)}</code>
              </div>
            ` : ''}

            <!-- Workspace Files Drawer -->
            ${this.showFiles ? `
              <div class="files-drawer animate-slide" id="files-drawer" role="region" aria-label="Dylan's Virtual Filesystem (C:\\Users\\Dylan)">
                <div class="drawer-header">
                  <span class="drawer-icon" aria-hidden="true">📁</span>
                  <span class="drawer-heading">Dylan's Virtual Filesystem (C:\\Users\\Dylan)</span>
                </div>
                <div class="drawer-body files-list">${filesHtml}</div>
              </div>
            ` : ''}

            <!-- Hints Drawer -->
            ${this.showLearn ? `
              <div class="learn-drawer animate-slide" id="learn-drawer" role="region" aria-label="Hints and concepts">
                <div class="drawer-header">
                  <span class="drawer-icon" aria-hidden="true">💡</span>
                  <span class="drawer-heading">Hints &amp; Concepts</span>
                </div>
                <ul class="drawer-hints-list">${hintsHtml}</ul>
              </div>
            ` : ''}

            <!-- Solutions Drawer -->
            ${this.showSolutions ? `
              <div class="solutions-drawer animate-slide" id="solutions-drawer" role="region" aria-label="Verified solutions and code-golf pars">
                <div class="drawer-header">
                  <span class="drawer-icon" aria-hidden="true">✨</span>
                  <span class="drawer-heading">Verified Solutions &amp; Code-Golf Pars</span>
                </div>
                <div class="drawer-body">${solutionsHtml}</div>
              </div>
            ` : ''}

            <!-- Correct Banner with Golf Stars -->
            ${isSolved ? `
              <div class="correct-banner animate-slide" role="status" aria-live="polite">
                <div class="correct-left">
                  <div class="correct-badge-wrap" aria-hidden="true">
                    <span class="correct-icon">✓</span>
                  </div>
                  <div>
                    <div class="correct-title-row">
                      <span class="correct-title">CORRECT!</span>
                      <span class="correct-stars-text" aria-label="${bestStars || 1} stars">${'★'.repeat(bestStars || 1)}</span>
                    </div>
                    <span class="correct-desc">
                      Nicely done, Dylan! Challenge #${ch.id} verified. 
                      ${currentBest ? `Best: <strong>${currentBest} chars</strong> (Golf target: ${minSolLen} chars)` : ''}
                    </span>
                  </div>
                </div>
                ${this.currentId < ChallengesCatalog.length ? `
                  <button class="btn-next-challenge" id="btn-next-banner" aria-label="Advance to Next Challenge">Next Challenge ➔</button>
                ` : `<span class="all-solved-text">🎉 Outstanding Dylan! You completed all ${ChallengesCatalog.length} challenges!</span>`}
              </div>
            ` : ''}

            <!-- Terminal Component -->
            <section class="terminal-wrapper" id="terminal-box" aria-label="Interactive PowerShell Terminal">
              <div class="terminal-titlebar">
                <div class="term-traffic-lights" aria-hidden="true">
                  <span class="traffic-dot dot-red"></span>
                  <span class="traffic-dot dot-yellow"></span>
                  <span class="traffic-dot dot-green"></span>
                </div>
                <div class="term-window-title">PowerShell 7.4 — C:\\Users\\Dylan — 80×24</div>
                <div class="term-right-tools">
                  <span class="reverse-search-hint" title="Press Ctrl+R to search previous command history">Ctrl+R Search</span>
                  <span id="term-char-counter" class="char-counter" aria-live="off">0 chars</span>
                  <button class="term-clear-btn" id="btn-term-clear" aria-label="Clear terminal output (Ctrl+L)" title="Clear terminal output (Ctrl+L)">Clear</button>
                </div>
              </div>

              <div class="term-screen" id="term-output-area" role="log" aria-live="polite" aria-label="Terminal output log" tabindex="0">
                <div class="term-line info-text">PowerShell 7.4.2 [Client-Side Simulation Engine]</div>
                <div class="term-line info-text">Workspace: C:\\Users\\Dylan | User: Dylan Grow</div>
                <div class="term-line info-text">💡 Tip: Press <code>Ctrl+R</code> to search history. Pipe to <code>Out-GridView</code> (<code>ogv</code>) for GUI table!</div>
              </div>

              <!-- Terminal Input Row with Real-Time Syntax Overlay -->
              <div class="term-input-row">
                <span class="term-ps-prompt" id="term-prompt-label" aria-hidden="true">
                  ${this.isReverseSearch 
                    ? `<span class="reverse-search-label">(reverse-i-search)\`<b>${this.escapeHtml(this.reverseSearchQuery)}</b>\`:</span>` 
                    : `PS C:\\Users\\Dylan&gt;`}
                </span>
                <div class="term-input-box-wrap">
                  <div class="term-syntax-overlay" id="term-syntax-overlay" aria-hidden="true"></div>
                  <input
                    type="text"
                    id="cmd-term-input"
                    class="term-input-field"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    placeholder="${this.isReverseSearch ? 'Type to search previous commands (Enter to run, Esc to cancel)...' : `Type PowerShell command here (e.g. ${this.escapeHtml(ch.solutions[0])})...`}"
                    aria-label="PowerShell command line input"
                  />
                </div>
                <button class="term-run-btn" id="btn-submit-cmd" aria-label="Execute command" title="Execute command (Enter)">Enter ↵</button>
              </div>
            </section>
          </section>
        </main>

        <!-- Search / Jump Catalog Modal -->
        ${this.showCatalog ? `
          <div class="modal-backdrop animate-fade" id="catalog-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title">
            <div class="modal-card">
              <div class="modal-header">
                <div class="modal-title-group">
                  <span class="modal-icon" aria-hidden="true">🔍</span>
                  <h2 class="modal-title" id="catalog-modal-title">Challenges Catalog (${ChallengesCatalog.length} Total)</h2>
                </div>
                <button class="btn-close-modal" id="btn-close-catalog" aria-label="Close challenges catalog">✕</button>
              </div>
              <div class="modal-search-box">
                <input
                  type="text"
                  id="catalog-search-input"
                  placeholder="Search by cmdlet, category, keyword (e.g. 'Get-Process', 'csv', 'filter')..."
                  aria-label="Search challenges by keyword, cmdlet, or category"
                  value="${this.escapeHtml(this.catalogSearchQuery)}"
                />
              </div>
              <div class="catalog-list-scroll" role="listbox" aria-label="Challenges list">
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

    // Font scale toggle button
    this.container.querySelector('#btn-toggle-font')?.addEventListener('click', () => {
      this.toggleFontScale();
    });

    // CheatSheet button
    this.container.querySelector('#btn-open-cheatsheet')?.addEventListener('click', () => {
      this.openCheatSheet();
    });

    // Stats dashboard button
    this.container.querySelector('#btn-open-stats')?.addEventListener('click', () => {
      this.openStats();
    });

    // Certificate button
    this.container.querySelector('#btn-open-cert')?.addEventListener('click', () => {
      this.lastFocusedElement = this.container.querySelector('#btn-open-cert') as HTMLElement;
      const stats = {
        solvedCount: this.solvedIds.size,
        totalCount: ChallengesCatalog.length,
        totalStars: this.getTotalStars(),
        maxStars: ChallengesCatalog.length * 3,
        rankTitle: this.getDylanRank().title
      };
      const certModal = new CertificateModal(stats, () => {
        this.lastFocusedElement?.focus();
      });
      certModal.show();
    });

    // Sound toggle
    this.container.querySelector('#btn-toggle-sound')?.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.saveProgress();
      this.render();
      this.attachEvents();
    });

    // Catalog modal open/close & focus management
    const closeCatalog = () => {
      this.showCatalog = false;
      this.render();
      this.attachEvents();
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus();
      } else {
        this.focusTerminal();
      }
    };

    this.container.querySelector('#btn-open-catalog')?.addEventListener('click', () => {
      this.lastFocusedElement = this.container.querySelector('#btn-open-catalog') as HTMLElement;
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

    this.container.querySelector('#btn-close-catalog')?.addEventListener('click', closeCatalog);

    this.container.querySelector('#catalog-modal-backdrop')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'catalog-modal-backdrop') {
        closeCatalog();
      }
    });

    // Catalog items click
    this.container.querySelectorAll('.catalog-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = parseInt((e.currentTarget as HTMLElement).getAttribute('data-id') || '1', 10);
        this.selectChallenge(id);
      });
    });

    // Global keyboard shortcuts for prev/next, CheatSheet, and Catalog focus trap
    window.onkeydown = (e: KeyboardEvent) => {
      if (this.showCatalog) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeCatalog();
          return;
        }
        if (e.key === 'Tab') {
          const modalBackdrop = this.container.querySelector('#catalog-modal-backdrop');
          if (modalBackdrop) {
            const focusables = Array.from(modalBackdrop.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));
            if (focusables.length > 0) {
              const first = focusables[0];
              const last = focusables[focusables.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
                return;
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
                return;
              }
            }
          }
        }
        return;
      }
      if (e.key === 'F1' || (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        this.openCheatSheet();
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
        this.personalBests = {};
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
        const cmd = this.isReverseSearch && this.reverseSearchMatchedCmd ? this.reverseSearchMatchedCmd : input.value.trim();
        this.exitReverseSearch();
        this.history.push(cmd);
        this.historyIndex = this.history.length;
        input.value = '';
        this.updateSyntaxAndCounter('');
        this.playClickSound();
        this.runCommand(cmd);
      }
    });

    // Terminal input handling with Real-Time Syntax Highlighting & Ctrl+R
    const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;
    const overlay = this.container.querySelector('#term-syntax-overlay') as HTMLElement;

    if (input) {
      input.addEventListener('input', () => {
        if (this.isReverseSearch) {
          this.handleReverseSearchInput(input.value);
        } else {
          this.updateSyntaxAndCounter(input.value);
        }
      });

      input.addEventListener('scroll', () => {
        if (overlay) {
          overlay.scrollLeft = input.scrollLeft;
        }
      });

      input.addEventListener('keydown', (e: KeyboardEvent) => {
        // Ctrl+R Reverse history search
        if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
          e.preventDefault();
          if (!this.isReverseSearch) {
            this.isReverseSearch = true;
            this.reverseSearchQuery = input.value;
            this.reverseSearchMatchIndex = -1;
            this.updateReverseSearchPrompt();
            this.handleReverseSearchInput(input.value);
          } else {
            // Find next older match
            this.findNextReverseMatch();
          }
          return;
        }

        if (this.isReverseSearch) {
          if (e.key === 'Escape') {
            e.preventDefault();
            this.exitReverseSearch();
            return;
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const cmd = this.reverseSearchMatchedCmd;
            this.exitReverseSearch();
            input.value = cmd;
            this.updateSyntaxAndCounter(cmd);
            return;
          }
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          const cmd = this.isReverseSearch && this.reverseSearchMatchedCmd 
            ? this.reverseSearchMatchedCmd 
            : input.value.trim();

          this.exitReverseSearch();
          if (cmd) {
            this.history.push(cmd);
            this.historyIndex = this.history.length;
            input.value = '';
            this.updateSyntaxAndCounter('');
            this.playClickSound();
            this.runCommand(cmd);
          }
        } else if (e.key === 'Tab') {
          if (e.shiftKey) {
            // Allow Shift+Tab to naturally move focus backwards out of the input
            return;
          }
          const text = input.value;
          const parts = text.split(' ');
          const lastWord = parts[parts.length - 1];
          if (lastWord && lastWord.trim().length > 0) {
            e.preventDefault();
            this.handleTabAutocomplete(input);
          }
          // If no token is being typed, standard Tab moves focus forward to #btn-submit-cmd
        } else if (e.key === 'Escape') {
          if (this.isReverseSearch) {
            e.preventDefault();
            this.exitReverseSearch();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.history.length > 0 && this.historyIndex > 0) {
            this.historyIndex--;
            input.value = this.history[this.historyIndex];
            this.updateSyntaxAndCounter(input.value);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            input.value = this.history[this.historyIndex];
            this.updateSyntaxAndCounter(input.value);
          } else {
            this.historyIndex = this.history.length;
            input.value = '';
            this.updateSyntaxAndCounter('');
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

  private handleReverseSearchInput(q: string): void {
    this.reverseSearchQuery = q;
    this.reverseSearchMatchIndex = -1;
    this.findNextReverseMatch();
  }

  private findNextReverseMatch(): void {
    const q = this.reverseSearchQuery.toLowerCase();
    const startIndex = this.reverseSearchMatchIndex === -1 ? this.history.length - 1 : this.reverseSearchMatchIndex - 1;

    let matched = '';
    let foundIndex = -1;

    if (q) {
      for (let i = startIndex; i >= 0; i--) {
        if (this.history[i].toLowerCase().includes(q)) {
          matched = this.history[i];
          foundIndex = i;
          break;
        }
      }
    }

    this.reverseSearchMatchedCmd = matched;
    this.reverseSearchMatchIndex = foundIndex;
    this.updateReverseSearchPrompt();
  }

  private updateReverseSearchPrompt(): void {
    const promptLabel = this.container.querySelector('#term-prompt-label');
    const overlay = this.container.querySelector('#term-syntax-overlay') as HTMLElement;
    const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;

    if (promptLabel) {
      if (this.isReverseSearch) {
        promptLabel.innerHTML = `<span class="reverse-search-label">(reverse-i-search)\`<b>${this.escapeHtml(this.reverseSearchQuery)}</b>\`:</span>`;
      } else {
        promptLabel.innerHTML = `PS C:\\Users\\Dylan&gt;`;
      }
    }

    if (this.isReverseSearch) {
      if (overlay) {
        if (this.reverseSearchMatchedCmd) {
          overlay.innerHTML = `<span class="reverse-matched-cmd">${this.escapeHtml(this.reverseSearchMatchedCmd)}</span>`;
        } else {
          overlay.innerHTML = `<span class="reverse-no-match">[no match]</span>`;
        }
      }
    } else {
      if (input && overlay) {
        overlay.innerHTML = SyntaxHighlighter.highlight(input.value);
      }
    }
  }

  private exitReverseSearch(): void {
    if (!this.isReverseSearch) return;
    this.isReverseSearch = false;
    this.reverseSearchQuery = '';
    this.reverseSearchMatchedCmd = '';
    this.reverseSearchMatchIndex = -1;
    this.updateReverseSearchPrompt();
    const input = this.container.querySelector('#cmd-term-input') as HTMLInputElement;
    if (input) {
      this.updateSyntaxAndCounter(input.value);
    }
  }

  private updateSyntaxAndCounter(val: string): void {
    const counter = this.container.querySelector('#term-char-counter') as HTMLElement;
    if (counter) {
      counter.innerText = `${val.length} chars`;
    }

    const overlay = this.container.querySelector('#term-syntax-overlay') as HTMLElement;
    if (overlay) {
      overlay.innerHTML = SyntaxHighlighter.highlight(val);
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
      this.updateSyntaxAndCounter(input.value);
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

      // Check for Out-GridView interception
      if (res.output && res.output.length > 0 && res.output[0]?.__isGridView) {
        const gvPayload = res.output[0];
        const gvModal = new GridViewModal(gvPayload);
        gvModal.show();

        const gvLine = document.createElement('div');
        gvLine.className = 'term-line info-text';
        gvLine.innerText = `[Out-GridView] Displayed interactive window '${gvPayload.title}' with ${gvPayload.rows.length} rows.`;
        outputArea.appendChild(gvLine);
        outputArea.scrollTop = outputArea.scrollHeight;
        return;
      }

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

        // Update personal best character count
        const prevBest = this.personalBests[ch.id];
        if (!prevBest || cmd.length < prevBest) {
          this.personalBests[ch.id] = cmd.length;
        }

        this.saveProgress();
        this.playSuccessSound();
        this.burstConfetti();

        const stars = this.getStarsForChallenge(ch.id);
        const starText = '★'.repeat(stars);

        const successLine = document.createElement('div');
        successLine.className = 'term-line correct-text';
        successLine.innerText = `CORRECT! [Challenge #${ch.id} Solved: ${cmd.length} chars • ${starText}]`;
        outputArea.appendChild(successLine);
        this.announce(`Correct! Challenge ${ch.id} verified. Solved in ${cmd.length} characters with ${stars} stars.`);

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

  private burstConfetti(): void {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    const colors = ['#00f0ff', '#f59e0b', '#10b981', '#a855f7', '#38bdf8', '#f87171', '#4ade80', '#fb923c'];
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; rot: number; drot: number }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        alpha: 1,
        rot: Math.random() * Math.PI * 2,
        drot: (Math.random() - 0.5) * 0.2
      });
    }

    const start = performance.now();
    const duration = 2000;

    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = elapsed / duration;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.rot += p.drot;
        p.alpha = Math.max(0, 1 - progress * 1.2);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    };

    requestAnimationFrame(frame);
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
