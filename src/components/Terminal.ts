import { Executor, ExecutionResult } from '../engine/executor';
import { SoundFX } from '../audio/soundFx';

export class Terminal {
  private container: HTMLElement;
  private executor: Executor;
  private sound: SoundFX;
  private history: string[] = [];
  private historyIndex: number = -1;
  private onCommandExecuted?: (cmd: string, result: ExecutionResult) => void;

  private outputEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private promptEl!: HTMLElement;
  private highlightEl!: HTMLElement;
  private autocompletePopupEl!: HTMLElement;

  public autocompleteMatches: string[] = [];
  private autocompleteIndex: number = -1;

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

  public focus(): void {
    if (this.inputEl) this.inputEl.focus();
  }

  public clear(): void {
    if (this.outputEl) this.outputEl.innerHTML = '';
  }

  public updatePrompt(): void {
    const curPath = this.executor.getVFS().getCurrentPath();
    if (this.promptEl) {
      this.promptEl.textContent = `PS ${curPath}>`;
    }
  }

  private render(): void {
    const curPath = this.executor.getVFS().getCurrentPath();

    this.container.innerHTML = `
      <div class="cmd-terminal" role="region" aria-label="PowerShell Interactive Terminal">
        <div class="cmd-terminal-top">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-shell-title">PowerShell 7.4.2 (student@localhost)</div>
          <div class="term-top-right">
            <span class="tab-hint-pill">⇥ Tab to autocomplete</span>
            <button class="cmd-term-clear-btn" id="btn-term-clear" title="Clear (Ctrl+L)">Clear</button>
          </div>
        </div>

        <div class="cmd-terminal-body" id="term-output" role="log" aria-live="polite">
          <div class="term-line output-info">PowerShell Command Challenge Shell [Version 7.4.2]</div>
          <div class="term-line output-info">Type your PowerShell one-liner below and press Enter.</div>
        </div>

        <!-- Autocomplete Suggestions Popup -->
        <div class="autocomplete-popup" id="term-autocomplete" style="display: none;"></div>

        <div class="cmd-terminal-input-row">
          <span class="cmd-prompt-label" id="cmd-prompt-label">PS ${curPath}&gt;</span>
          <div class="cmd-input-container">
            <div class="cmd-syntax-layer" id="term-highlight" aria-hidden="true"></div>
            <input
              type="text"
              id="cmd-input"
              class="cmd-real-input"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              aria-label="PowerShell Command Line Input"
              placeholder="Type command here..."
            />
          </div>
          <button class="cmd-enter-btn" id="btn-submit-cmd">Enter ↵</button>
        </div>
      </div>
    `;

    this.outputEl = this.container.querySelector('#term-output') as HTMLElement;
    this.inputEl = this.container.querySelector('#cmd-input') as HTMLInputElement;
    this.promptEl = this.container.querySelector('#cmd-prompt-label') as HTMLElement;
    this.highlightEl = this.container.querySelector('#term-highlight') as HTMLElement;
    this.autocompletePopupEl = this.container.querySelector('#term-autocomplete') as HTMLElement;

    setTimeout(() => this.focus(), 50);
  }

  private attachEvents(): void {
    this.container.querySelector('#btn-term-clear')?.addEventListener('click', () => {
      this.clear();
      this.focus();
    });

    this.container.querySelector('#btn-submit-cmd')?.addEventListener('click', () => {
      this.executeInput();
    });

    this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.hideAutocomplete();
        this.executeInput();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.hideAutocomplete();
        this.navigateHistory('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.hideAutocomplete();
        this.navigateHistory('down');
      } else if (e.key === 'Escape') {
        this.hideAutocomplete();
      } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.clear();
      }
    });

    this.inputEl.addEventListener('input', () => {
      this.sound.playKeyClick();
      this.updateSyntaxHighlight();
      this.hideAutocomplete();
    });

    this.outputEl.addEventListener('click', () => {
      this.focus();
    });
  }

  private handleTabCompletion(): void {
    const val = this.inputEl.value;
    const cursorPos = this.inputEl.selectionStart || val.length;
    const textBeforeCursor = val.substring(0, cursorPos);
    const words = textBeforeCursor.split(/[\s|]+/);
    const currentWord = words[words.length - 1] || '';

    if (!currentWord) return;

    // Collect candidates
    const candidates: string[] = [];

    // 1. Parameters
    if (currentWord.startsWith('-')) {
      const params = [
        '-Property', '-Descending', '-Unique', '-Average', '-Sum', '-Maximum', '-Minimum',
        '-Line', '-Pattern', '-TotalCount', '-Tail', '-Raw', '-Path', '-Filter', '-Recurse',
        '-Force', '-File', '-Directory', '-ItemType', '-Value', '-Format', '-Leaf', '-Parent',
        '-ChildPath', '-ExpandProperty', '-NoTypeInformation', '-Status'
      ];
      for (const p of params) {
        if (p.toLowerCase().startsWith(currentWord.toLowerCase())) candidates.push(p);
      }
    }
    // 2. Variables
    else if (currentWord.startsWith('$')) {
      const vars = ['$PWD', '$null', '$true', '$false', '$stopped', '$PSVersionTable', '$_'];
      for (const v of vars) {
        if (v.toLowerCase().startsWith(currentWord.toLowerCase())) candidates.push(v);
      }
    }
    // 3. Files in VFS
    else {
      const files = this.executor.getVFS().listDirectory(undefined, true, false).map(f => f.name);
      for (const f of files) {
        if (f.toLowerCase().startsWith(currentWord.toLowerCase())) candidates.push(f);
      }

      // 4. Cmdlets
      const cmdlets = this.executor.getAvailableCmdletNames();
      for (const c of cmdlets) {
        if (c.toLowerCase().startsWith(currentWord.toLowerCase())) candidates.push(c);
      }
    }

    if (candidates.length === 0) return;

    if (candidates.length === 1) {
      this.applyCompletion(candidates[0], currentWord);
      this.hideAutocomplete();
    } else {
      this.autocompleteMatches = candidates;
      this.autocompleteIndex = (this.autocompleteIndex + 1) % candidates.length;
      this.showAutocompletePopup(candidates, currentWord);
      this.applyCompletion(candidates[this.autocompleteIndex], currentWord);
    }
  }

  private applyCompletion(completion: string, oldWord: string): void {
    const val = this.inputEl.value;
    const cursorPos = this.inputEl.selectionStart || val.length;
    const before = val.substring(0, cursorPos - oldWord.length);
    const after = val.substring(cursorPos);

    this.inputEl.value = before + completion + after;
    this.inputEl.setSelectionRange(before.length + completion.length, before.length + completion.length);
    this.updateSyntaxHighlight();
  }

  private showAutocompletePopup(candidates: string[], _currentWord: string): void {
    const itemsHtml = candidates.map((c, i) => `
      <div class="ac-item ${i === this.autocompleteIndex ? 'active' : ''}">${this.escapeHtml(c)}</div>
    `).join('');

    this.autocompletePopupEl.innerHTML = itemsHtml;
    this.autocompletePopupEl.style.display = 'flex';
  }

  private hideAutocomplete(): void {
    this.autocompletePopupEl.style.display = 'none';
    this.autocompleteMatches = [];
    this.autocompleteIndex = -1;
  }

  public runDirectCommand(cmdText: string): void {
    this.inputEl.value = cmdText;
    this.updateSyntaxHighlight();
    this.executeInput();
  }

  public insertCommand(cmdText: string): void {
    this.inputEl.value = cmdText;
    this.updateSyntaxHighlight();
    this.focus();
  }

  private async executeInput(): Promise<void> {
    const raw = this.inputEl.value.trim();
    if (!raw) return;

    this.history.push(raw);
    this.historyIndex = this.history.length;

    // Append prompt line to terminal
    const curPath = this.executor.getVFS().getCurrentPath();
    this.appendLine(`PS ${curPath}> ${raw}`, 'prompt');

    this.inputEl.value = '';
    this.updateSyntaxHighlight();

    // Execute
    const result = await this.executor.execute(raw);

    // Update prompt path in case Set-Location / cd changed directory
    this.updatePrompt();

    if (!result.success && result.error) {
      this.sound.playError();
      this.appendLine(result.error, 'error');
    } else {
      if (result.formattedHtml) {
        this.appendHtml(result.formattedHtml);
      }
    }

    if (this.onCommandExecuted) {
      this.onCommandExecuted(raw, result);
    }

    this.scrollToBottom();
  }

  public appendLine(text: string, type: 'info' | 'success' | 'warning' | 'error' | 'prompt' = 'info'): void {
    const div = document.createElement('div');
    div.className = `term-line output-${type}`;
    div.innerText = text;
    this.outputEl.appendChild(div);
    this.scrollToBottom();
  }

  public appendHtml(html: string): void {
    const div = document.createElement('div');
    div.className = 'term-line output-html';
    div.innerHTML = html;
    this.outputEl.appendChild(div);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  private navigateHistory(dir: 'up' | 'down'): void {
    if (this.history.length === 0) return;

    if (dir === 'up') {
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
    const tokens = val.split(/(\s+|\||;)/);

    const colored = tokens.map(tok => {
      if (!tok) return '';
      if (tok === '|' || tok === ';') return `<span class="syn-pipe">${tok}</span>`;
      if (tok.startsWith('$')) return `<span class="syn-var">${this.escapeHtml(tok)}</span>`;
      if (tok.startsWith('-')) return `<span class="syn-param">${this.escapeHtml(tok)}</span>`;
      if (tok.includes('-')) return `<span class="syn-cmdlet">${this.escapeHtml(tok)}</span>`;
      if (tok.startsWith("'") || tok.startsWith('"')) return `<span class="syn-str">${this.escapeHtml(tok)}</span>`;
      if (/^\d+$/.test(tok)) return `<span class="syn-num">${this.escapeHtml(tok)}</span>`;
      return `<span>${this.escapeHtml(tok)}</span>`;
    }).join('');

    this.highlightEl.innerHTML = colored;
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
