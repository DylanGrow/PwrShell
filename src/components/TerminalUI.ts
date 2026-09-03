import { Executor, ExecutionResult } from '../engine/executor';
import { SoundFX } from '../audio/soundFx';

export class TerminalUI {
  private container: HTMLElement;
  private executor: Executor;
  private sound: SoundFX;
  private history: string[] = [];
  private historyIndex: number = -1;
  private onCommandExecuted?: (cmd: string, result: ExecutionResult) => void;

  private outputEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private highlightEl!: HTMLElement;
  private suggestionBox!: HTMLElement;
  private scriptEditorEl!: HTMLTextAreaElement;

  private activeTab: 'console' | 'script' = 'console';
  private currentSuggestions: string[] = [];
  private selectedSuggestionIndex: number = -1;

  constructor(
    container: HTMLElement,
    executor: Executor,
    sound: SoundFX,
    onCommandExecuted?: (cmd: string, result: ExecutionResult) => void
  ) {
    this.container = container;
    this.executor = executor;
    this.sound = sound;
    this.onCommandExecuted = onCommandExecuted;

    this.render();
    this.attachEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="terminal-card" role="region" aria-label="PowerShell Terminal Console">
        <div class="terminal-header">
          <div class="terminal-tabs-left">
            <div class="terminal-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <button class="term-tab-btn active" id="tab-term-console">⚡ Console (One-Liner)</button>
            <button class="term-tab-btn" id="tab-term-script">📝 Script Bay (Recovery.ps1)</button>
          </div>

          <div class="terminal-actions">
            <button class="terminal-btn" id="btn-clear-term" title="Clear Screen (Ctrl+L)" aria-label="Clear Terminal">Clear</button>
          </div>
        </div>

        <!-- Terminal Output View -->
        <div class="terminal-body" id="term-output" role="log" aria-live="polite">
          <div class="term-welcome">
            <div class="welcome-text">
              👋 <strong>Terminal Ready:</strong> Type a command below, or click any <strong>[▶ Run]</strong> button in the mission above!
            </div>
          </div>
        </div>

        <!-- Mode 1: Interactive Console Input -->
        <div class="terminal-input-bar" id="console-input-bar">
          <span class="prompt-text">PS Aegis&gt;</span>
          <div class="input-wrapper">
            <div class="syntax-highlight" id="term-highlight" aria-hidden="true"></div>
            <input
              type="text"
              id="term-input"
              class="terminal-input"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              aria-label="PowerShell Command Input"
              placeholder="Type command here (e.g. Get-Command)..."
            />
            <div class="autocomplete-popup hidden" id="autocomplete-popup" role="listbox" aria-label="Command suggestions"></div>
          </div>
          <button class="btn-run" id="btn-run-cmd" aria-label="Execute Command">Enter ↵</button>
        </div>

        <!-- Mode 2: Multi-line Script Editor -->
        <div class="script-editor-bar hidden" id="script-editor-bar">
          <div class="script-editor-header">
            <span class="script-file-tag">📄 Recovery.ps1</span>
            <div class="script-quick-actions">
              <button class="btn-script-action" id="btn-load-template">Load Template</button>
              <button class="btn-script-action" id="btn-clear-script">Clear</button>
            </div>
          </div>
          <textarea
            id="script-editor-text"
            class="script-editor-textarea"
            spellcheck="false"
            placeholder="# Write multi-line PowerShell automation script here...&#10;$Offline = Get-StationModule | Where-Object Status -eq 'Offline'&#10;$Offline | Repair-System&#10;Start-Generator"
          ></textarea>
          <div class="script-footer">
            <span class="script-hint">💡 Press <strong>Run Script (F5)</strong> to execute sequentially</span>
            <button class="btn-run-script" id="btn-run-script">▶ Run Script (F5)</button>
          </div>
        </div>
      </div>
    `;

    this.outputEl = this.container.querySelector('#term-output') as HTMLElement;
    this.inputEl = this.container.querySelector('#term-input') as HTMLInputElement;
    this.highlightEl = this.container.querySelector('#term-highlight') as HTMLElement;
    this.suggestionBox = this.container.querySelector('#autocomplete-popup') as HTMLElement;
    this.scriptEditorEl = this.container.querySelector('#script-editor-text') as HTMLTextAreaElement;
  }

  private attachEvents(): void {
    const tabConsole = this.container.querySelector('#tab-term-console');
    const tabScript = this.container.querySelector('#tab-term-script');
    const consoleBar = this.container.querySelector('#console-input-bar');
    const scriptBar = this.container.querySelector('#script-editor-bar');

    // Switch to Console Tab
    tabConsole?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.activeTab = 'console';
      tabConsole.classList.add('active');
      tabScript?.classList.remove('active');
      consoleBar?.classList.remove('hidden');
      scriptBar?.classList.add('hidden');
      this.inputEl.focus();
    });

    // Switch to Script Tab
    tabScript?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.activeTab = 'script';
      tabScript.classList.add('active');
      tabConsole?.classList.remove('active');
      consoleBar?.classList.add('hidden');
      scriptBar?.classList.remove('hidden');
      this.scriptEditorEl.focus();
    });

    // Clear Screen
    this.container.querySelector('#btn-clear-term')?.addEventListener('click', () => {
      this.clear();
      if (this.activeTab === 'console') this.inputEl.focus();
    });

    // Run One-Liner
    this.container.querySelector('#btn-run-cmd')?.addEventListener('click', () => {
      this.executeCurrentInput();
    });

    // Run Multi-Line Script
    this.container.querySelector('#btn-run-script')?.addEventListener('click', () => {
      this.executeScript();
    });

    // Load Template Script
    this.container.querySelector('#btn-load-template')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.scriptEditorEl.value = `# Auto-Recovery PowerShell Script\n$Offline = Get-StationModule | Where-Object Status -eq 'Offline'\n$Offline | Repair-System\nSet-PowerRoute -Sector 'Core' -Watts 100\nStart-Generator\nGet-LifeSupport`;
    });

    // Clear Script Editor
    this.container.querySelector('#btn-clear-script')?.addEventListener('click', () => {
      this.sound.playKeyClick();
      this.scriptEditorEl.value = '';
    });

    // Keyboard Shortcuts
    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.executeCurrentInput();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory('down');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabAutocomplete();
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.clear();
      }
    });

    // Script editor F5 shortcut
    this.scriptEditorEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'F5' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        this.executeScript();
      }
    });

    // Syntax highlighting in input bar
    this.inputEl.addEventListener('input', () => {
      this.sound.playKeyClick();
      this.updateSyntaxHighlight();
      this.updateSuggestions();
    });
  }

  public runDirectCommand(cmdText: string): void {
    this.inputEl.value = cmdText;
    this.updateSyntaxHighlight();
    this.executeCurrentInput();
  }

  public insertCommand(cmdText: string): void {
    this.inputEl.value = cmdText;
    this.updateSyntaxHighlight();
    this.inputEl.focus();
  }

  private async executeCurrentInput(): Promise<void> {
    const raw = this.inputEl.value.trim();
    if (!raw) return;

    // History tracking
    this.history.push(raw);
    this.historyIndex = this.history.length;

    // Echo input to terminal
    this.appendPromptEcho(raw);

    this.inputEl.value = '';
    this.updateSyntaxHighlight();
    this.hideSuggestions();

    // Execute
    const result = await this.executor.execute(raw);

    // Render result
    if (!result.success && result.error) {
      this.sound.playError();
      this.renderErrorCard(result.error, result.diagnosticAdvice);
    } else {
      if (result.formattedHtml) {
        this.appendOutputHtml(result.formattedHtml);
      }
    }

    if (this.onCommandExecuted) {
      this.onCommandExecuted(raw, result);
    }

    this.scrollToBottom();
  }

  private async executeScript(): Promise<void> {
    const script = this.scriptEditorEl.value.trim();
    if (!script) return;

    this.appendOutputText(`\n▶ [SCRIPT EXECUTION] Running Recovery.ps1...`, 'info');

    const lines = script.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      this.appendPromptEcho(line);
      const result = await this.executor.execute(line);

      if (!result.success && result.error) {
        this.sound.playError();
        this.renderErrorCard(result.error, result.diagnosticAdvice);
      } else if (result.formattedHtml) {
        this.appendOutputHtml(result.formattedHtml);
      }

      if (this.onCommandExecuted) {
        this.onCommandExecuted(line, result);
      }
    }

    this.appendOutputText(`✔ [SCRIPT COMPLETE] Finished executing Recovery.ps1\n`, 'success');
    this.scrollToBottom();
  }

  private appendPromptEcho(cmdText: string): void {
    const row = document.createElement('div');
    row.className = 'term-line term-prompt-line';
    row.innerHTML = `<span class="prompt-text">PS Aegis&gt;</span> <span class="echo-text">${this.escapeHtml(cmdText)}</span>`;
    this.outputEl.appendChild(row);
  }

  public appendOutputText(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const div = document.createElement('div');
    div.className = `term-line output-${type}`;
    div.innerText = text;
    this.outputEl.appendChild(div);
    this.scrollToBottom();
  }

  public appendOutputHtml(html: string): void {
    const div = document.createElement('div');
    div.className = 'term-line output-html';
    div.innerHTML = html;
    this.outputEl.appendChild(div);
    this.scrollToBottom();
  }

  private renderErrorCard(errorMsg: string, advice?: any): void {
    let adviceHtml = '';
    if (advice) {
      adviceHtml = `
        <div class="helios-tip-card">
          <div class="tip-header">
            <span>💡 HELIOS DIAGNOSTIC</span>
          </div>
          <div class="tip-body">${advice.tip}</div>
          ${advice.suggestion ? `<div class="tip-action"><button class="clickable-fix" data-fix="${advice.suggestion}">Run '${advice.suggestion}'</button></div>` : ''}
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'term-error-block';
    card.innerHTML = `
      <div class="error-msg">❌ ${this.escapeHtml(errorMsg)}</div>
      ${adviceHtml}
    `;

    // Click to fix
    card.querySelectorAll('.clickable-fix').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        const fix = (e.currentTarget as HTMLElement).getAttribute('data-fix');
        if (fix) {
          this.runDirectCommand(fix);
        }
      });
    });

    this.outputEl.appendChild(card);
  }

  public clear(): void {
    this.outputEl.innerHTML = '';
  }

  private scrollToBottom(): void {
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  private navigateHistory(direction: 'up' | 'down'): void {
    if (this.history.length === 0) return;

    if (direction === 'up') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputEl.value = this.history[this.historyIndex];
      }
    } else {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.inputEl.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.inputEl.value = '';
      }
    }
    this.updateSyntaxHighlight();
  }

  private updateSyntaxHighlight(): void {
    const val = this.inputEl.value;
    const tokens = val.split(/(\s+|\|)/);

    const colored = tokens.map(tok => {
      if (!tok) return '';
      if (tok === '|') return `<span class="syn-pipe">|</span>`;
      if (tok.startsWith('$')) return `<span class="syn-var">${this.escapeHtml(tok)}</span>`;
      if (tok.startsWith('-')) return `<span class="syn-param">${this.escapeHtml(tok)}</span>`;
      if (tok.includes('-')) return `<span class="syn-cmdlet">${this.escapeHtml(tok)}</span>`;
      if (tok.startsWith("'") || tok.startsWith('"')) return `<span class="syn-str">${this.escapeHtml(tok)}</span>`;
      if (/^\d+$/.test(tok)) return `<span class="syn-num">${this.escapeHtml(tok)}</span>`;
      return `<span>${this.escapeHtml(tok)}</span>`;
    }).join('');

    this.highlightEl.innerHTML = colored;
  }

  private updateSuggestions(): void {
    const val = this.inputEl.value.trim();
    if (!val) {
      this.hideSuggestions();
      return;
    }

    const words = val.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.length < 2) {
      this.hideSuggestions();
      return;
    }

    const available = this.executor.getAvailableCmdletNames();
    this.currentSuggestions = available.filter(cmd => cmd.toLowerCase().startsWith(lastWord.toLowerCase()));

    if (this.currentSuggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.selectedSuggestionIndex = 0;
    this.suggestionBox.innerHTML = this.currentSuggestions.map((s, i) => `
      <div class="sugg-item ${i === 0 ? 'active' : ''}" data-index="${i}">${this.escapeHtml(s)}</div>
    `).join('');
    this.suggestionBox.classList.remove('hidden');
  }

  private hideSuggestions(): void {
    this.suggestionBox.innerHTML = '';
    this.suggestionBox.classList.add('hidden');
  }

  private handleTabAutocomplete(): void {
    if (this.currentSuggestions.length > 0 && this.selectedSuggestionIndex >= 0) {
      const chosen = this.currentSuggestions[this.selectedSuggestionIndex];
      const words = this.inputEl.value.split(/\s+/);
      words[words.length - 1] = chosen;
      this.inputEl.value = words.join(' ') + ' ';
      this.updateSyntaxHighlight();
      this.hideSuggestions();
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
