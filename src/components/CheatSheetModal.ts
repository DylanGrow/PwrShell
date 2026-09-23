export interface CheatSheetEntry {
  cmdlet: string;
  aliases?: string[];
  category: 'Files' | 'Pipeline' | 'System' | 'Data' | 'Syntax';
  syntax: string;
  description: string;
  example: string;
}

export const CheatSheetData: CheatSheetEntry[] = [
  // 📁 Files
  {
    cmdlet: 'Get-ChildItem',
    aliases: ['dir', 'ls', 'gci'],
    category: 'Files',
    syntax: 'Get-ChildItem [[-Path] <string>] [-Force] [-Recurse]',
    description: 'Lists files, folders, and items in current or target path.',
    example: 'Get-ChildItem -Force'
  },
  {
    cmdlet: 'Get-Content',
    aliases: ['cat', 'gc', 'type'],
    category: 'Files',
    syntax: 'Get-Content [-Path] <string> [-TotalCount <int>] [-Tail <int>]',
    description: 'Reads contents of text files line by line.',
    example: 'Get-Content access.log -Tail 3'
  },
  {
    cmdlet: 'Set-Content',
    aliases: ['sc'],
    category: 'Files',
    syntax: 'Set-Content [-Path] <string> [-Value] <any>',
    description: 'Writes or overwrites text into a file.',
    example: 'Set-Content hello.ps1 \'Write-Host "Hello"\' '
  },
  {
    cmdlet: 'Test-Path',
    aliases: [],
    category: 'Files',
    syntax: 'Test-Path [-Path] <string>',
    description: 'Returns True if a file or directory path exists, False otherwise.',
    example: 'Test-Path backup'
  },
  {
    cmdlet: 'Split-Path',
    aliases: [],
    category: 'Files',
    syntax: 'Split-Path [-Path] <string> [-Leaf] [-Parent]',
    description: 'Returns the parent or leaf filename portion of a path.',
    example: 'Split-Path "C:\\Users\\Dylan\\welcome.txt" -Leaf'
  },
  {
    cmdlet: 'Join-Path',
    aliases: [],
    category: 'Files',
    syntax: 'Join-Path [-Path] <string> [-ChildPath] <string>',
    description: 'Combines path elements with proper directory separators.',
    example: 'Join-Path "C:\\Users" "Dylan\\projects"'
  },
  {
    cmdlet: 'Copy-Item',
    aliases: ['cp', 'copy', 'cpi'],
    category: 'Files',
    syntax: 'Copy-Item [-Path] <string> [-Destination] <string>',
    description: 'Copies a file or directory to another destination.',
    example: 'Copy-Item config.json backup'
  },
  {
    cmdlet: 'Remove-Item',
    aliases: ['rm', 'del', 'ri'],
    category: 'Files',
    syntax: 'Remove-Item [-Path] <string> [-Recurse] [-Force]',
    description: 'Deletes specified files, folders, or wildcards.',
    example: 'Remove-Item temp\\*.tmp'
  },

  // ⚡ Pipeline & Objects
  {
    cmdlet: 'Where-Object',
    aliases: ['?', 'where'],
    category: 'Pipeline',
    syntax: 'Where-Object [-Property] <string> [-Operator] <value>',
    description: 'Filters objects passing through the pipeline based on properties.',
    example: 'Get-Process | Where-Object CPU -gt 50'
  },
  {
    cmdlet: 'Select-Object',
    aliases: ['select'],
    category: 'Pipeline',
    syntax: 'Select-Object [-Property <string[]>] [-First <int>] [-Last <int>] [-Unique]',
    description: 'Selects specific properties or limits row count.',
    example: 'Get-Process | Select-Object -First 3 ProcessName, Id'
  },
  {
    cmdlet: 'Sort-Object',
    aliases: ['sort'],
    category: 'Pipeline',
    syntax: 'Sort-Object [[-Property] <string>] [-Descending] [-Unique]',
    description: 'Sorts pipeline objects in ascending or descending order.',
    example: 'Get-Process | Sort-Object WorkingSet64 -Descending'
  },
  {
    cmdlet: 'Measure-Object',
    aliases: ['measure'],
    category: 'Pipeline',
    syntax: 'Measure-Object [[-Property] <string>] [-Sum] [-Average] [-Line]',
    description: 'Calculates numeric sums, averages, min/max, or line counts.',
    example: '1..100 | Measure-Object -Sum'
  },
  {
    cmdlet: 'Group-Object',
    aliases: ['group'],
    category: 'Pipeline',
    syntax: 'Group-Object [[-Property] <string>]',
    description: 'Groups pipeline objects by value of a specified property.',
    example: 'Import-Csv employees.csv | Group-Object Department'
  },
  {
    cmdlet: 'ForEach-Object',
    aliases: ['%', 'foreach'],
    category: 'Pipeline',
    syntax: 'ForEach-Object [-Process] { ... }',
    description: 'Performs an operation on each individual item in the pipeline.',
    example: 'Get-Content names.txt | ForEach-Object { $_.ToUpper() }'
  },
  {
    cmdlet: 'Select-String',
    aliases: ['sls'],
    category: 'Pipeline',
    syntax: 'Select-String [-Path] <string> [-Pattern] <regex>',
    description: 'Searches text and files for matching patterns and regex.',
    example: 'Select-String -Path access.log -Pattern "404"'
  },
  {
    cmdlet: 'Compare-Object',
    aliases: ['diff'],
    category: 'Pipeline',
    syntax: 'Compare-Object [-ReferenceObject] <list> [-DifferenceObject] <list>',
    description: 'Compares two sets of objects or arrays.',
    example: 'Compare-Object (1..3) (2..4)'
  },
  {
    cmdlet: 'Tee-Object',
    aliases: ['tee'],
    category: 'Pipeline',
    syntax: 'Tee-Object [-FilePath] <string>',
    description: 'Saves pipeline output to a file and passes it downstream.',
    example: 'Get-Process | Tee-Object procs.txt'
  },

  // 🖥️ System & Admin
  {
    cmdlet: 'Get-Process',
    aliases: ['ps', 'gps'],
    category: 'System',
    syntax: 'Get-Process [[-Name] <string>]',
    description: 'Inspects running system processes, CPU utilization, and memory.',
    example: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 3'
  },
  {
    cmdlet: 'Get-Service',
    aliases: ['gsv'],
    category: 'System',
    syntax: 'Get-Service [[-Name] <string>]',
    description: 'Retrieves Windows background services and their statuses.',
    example: 'Get-Service | Where-Object Status -eq "Stopped"'
  },
  {
    cmdlet: 'Get-Date',
    aliases: [],
    category: 'System',
    syntax: 'Get-Date [-Format <string>]',
    description: 'Retrieves current date and time or formats it as a string.',
    example: 'Get-Date -Format "yyyy-MM-dd"'
  },
  {
    cmdlet: 'Get-Random',
    aliases: [],
    category: 'System',
    syntax: 'Get-Random [-Minimum <int>] [-Maximum <int>]',
    description: 'Generates a pseudo-random integer or selects random item.',
    example: 'Get-Random -Minimum 1 -Maximum 101'
  },
  {
    cmdlet: 'Get-Command',
    aliases: ['gcm'],
    category: 'System',
    syntax: 'Get-Command [[-Noun] <string>] [[-Verb] <string>]',
    description: 'Discovers available cmdlets, aliases, and functions.',
    example: 'Get-Command -Noun Process'
  },
  {
    cmdlet: 'Get-Help',
    aliases: ['help', 'man'],
    category: 'System',
    syntax: 'Get-Help [-Name] <string>',
    description: 'Displays detailed synopsis, syntax, and examples for a cmdlet.',
    example: 'Get-Help Where-Object'
  },

  // 📊 Data & GUI
  {
    cmdlet: 'Import-Csv',
    aliases: ['ipcsv'],
    category: 'Data',
    syntax: 'Import-Csv [-Path] <string>',
    description: 'Parses a CSV file into PowerShell custom objects.',
    example: 'Import-Csv employees.csv | Where-Object Department -eq "Engineering"'
  },
  {
    cmdlet: 'Export-Csv',
    aliases: ['epcsv'],
    category: 'Data',
    syntax: 'Export-Csv [-Path] <string> [-NoTypeInformation]',
    description: 'Converts objects into CSV data and saves them to disk.',
    example: 'Get-Process | Export-Csv procs.csv'
  },
  {
    cmdlet: 'ConvertFrom-Json',
    aliases: [],
    category: 'Data',
    syntax: 'ConvertFrom-Json [-InputObject] <string>',
    description: 'Converts a JSON-formatted string into a custom object.',
    example: 'Get-Content config.json | ConvertFrom-Json'
  },
  {
    cmdlet: 'ConvertTo-Json',
    aliases: [],
    category: 'Data',
    syntax: 'ConvertTo-Json [-InputObject] <any>',
    description: 'Converts PowerShell objects into formatted JSON text.',
    example: 'Get-Process | Select-Object -First 2 | ConvertTo-Json'
  },
  {
    cmdlet: 'Out-GridView',
    aliases: ['ogv', 'grid'],
    category: 'Data',
    syntax: 'Out-GridView [[-Title] <string>]',
    description: 'Launches an interactive GUI table with search and column sorting.',
    example: 'Get-Process | Out-GridView'
  },
  {
    cmdlet: 'Out-File',
    aliases: [],
    category: 'Data',
    syntax: 'Out-File [-FilePath] <string>',
    description: 'Sends command output directly to a disk file.',
    example: 'Get-Service | Out-File services.txt'
  },

  // 🔤 Syntax & Operators
  {
    cmdlet: 'Comparison Operators',
    aliases: ['-eq', '-ne', '-gt', '-ge', '-lt', '-le'],
    category: 'Syntax',
    syntax: '$a -eq $b  |  $a -gt 50  |  $name -match "^A"',
    description: 'Equality, numeric comparison, and regular expression matching.',
    example: 'Import-Csv employees.csv | Where-Object YearsExperience -ge 5'
  },
  {
    cmdlet: 'Range Operator (..)',
    aliases: ['..'],
    category: 'Syntax',
    syntax: '<start>..<end>',
    description: 'Creates an array of sequential integers.',
    example: '1..100 | Measure-Object -Sum'
  },
  {
    cmdlet: 'Current Pipeline Item ($_)',
    aliases: ['$_', '$PSItem'],
    category: 'Syntax',
    syntax: '$_.<Property> or $_.Method()',
    description: 'Represents the current object inside pipeline script blocks.',
    example: 'Get-Content names.txt | ForEach-Object { $_.ToUpper() }'
  },
  {
    cmdlet: '$PSVersionTable',
    aliases: ['$PSVersionTable.PSVersion'],
    category: 'Syntax',
    syntax: '$PSVersionTable.PSVersion',
    description: 'Automatic variable containing active PowerShell edition and version.',
    example: '$PSVersionTable.PSVersion'
  }
];

export class CheatSheetModal {
  private activeCategory: string = 'All';
  private searchQuery: string = '';
  private modalEl: HTMLElement | null = null;
  private onSelectCmd?: (cmd: string) => void;
  private onClose?: () => void;

  constructor(onSelectCmd?: (cmd: string) => void, onClose?: () => void) {
    this.onSelectCmd = onSelectCmd;
    this.onClose = onClose;
  }

  public show(): void {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'cheatsheet-backdrop animate-fade';
    document.body.appendChild(this.modalEl);

    this.render();
    this.attachEvents();
  }

  public close(): void {
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  private escapeHtml(str: any): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private render(): void {
    if (!this.modalEl) return;

    const categories = ['All', 'Files', 'Pipeline', 'System', 'Data', 'Syntax'];

    const filtered = CheatSheetData.filter(item => {
      const matchesCat = this.activeCategory === 'All' || item.category === this.activeCategory;
      if (!matchesCat) return false;

      if (!this.searchQuery.trim()) return true;
      const q = this.searchQuery.toLowerCase();
      return (
        item.cmdlet.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q) ||
        item.aliases?.some(a => a.toLowerCase().includes(q))
      );
    });

    const categoriesHtml = categories.map(cat => `
      <button class="cs-tab-btn ${this.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat === 'All' ? '⚡ All' : cat}
      </button>
    `).join('');

    const itemsHtml = filtered.map(item => {
      const aliasBadge = item.aliases && item.aliases.length > 0
        ? `<span class="cs-alias-chip" title="PowerShell Aliases">${item.aliases.map(a => this.escapeHtml(a)).join(', ')}</span>`
        : '';

      return `
        <div class="cs-row">
          <div class="cs-col-main">
            <div class="cs-row-title-line">
              <strong class="cs-cmd-name">${this.escapeHtml(item.cmdlet)}</strong>
              ${aliasBadge}
              <span class="cs-cat-badge cs-cat-${item.category.toLowerCase()}">${item.category}</span>
            </div>
            <div class="cs-description">${this.escapeHtml(item.description)}</div>
            <div class="cs-syntax-line">
              <span class="cs-label">SYNTAX:</span>
              <code>${this.escapeHtml(item.syntax)}</code>
            </div>
          </div>
          <div class="cs-col-example">
            <div class="cs-example-box">
              <span class="cs-label">EXAMPLE:</span>
              <code class="cs-code-text">${this.escapeHtml(item.example)}</code>
            </div>
            <button class="cs-try-btn" data-cmd="${this.escapeHtml(item.example)}" title="Paste into terminal">
              Try ➔
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.modalEl.innerHTML = `
      <div class="cs-modal-card animate-slide">
        <div class="cs-header">
          <div class="cs-header-left">
            <span class="cs-header-icon">📖</span>
            <div>
              <div class="cs-title">PowerShell Command CheatSheet</div>
              <div class="cs-subtitle">Quick reference guide &amp; examples curated for Dylan Grow • Press <strong>F1</strong> or <strong>?</strong> anytime</div>
            </div>
          </div>
          <button class="cs-close-btn" id="btn-cs-close" title="Close CheatSheet (Esc)">✕</button>
        </div>

        <div class="cs-controls-row">
          <div class="cs-search-wrap">
            <span class="cs-search-icon">🔍</span>
            <input
              type="text"
              id="cs-search-input"
              class="cs-search-input"
              placeholder="Filter cmdlets, aliases, syntax (e.g. 'Out-GridView', 'sort', 'regex')..."
              value="${this.escapeHtml(this.searchQuery)}"
            />
          </div>
          <div class="cs-tabs-strip">
            ${categoriesHtml}
          </div>
        </div>

        <div class="cs-list-scroll">
          ${itemsHtml.length > 0 
            ? itemsHtml 
            : `<div class="cs-empty">No cmdlets found matching "${this.escapeHtml(this.searchQuery)}".</div>`}
        </div>

        <div class="cs-footer">
          <span class="cs-hint">💡 Click <strong>Try ➔</strong> on any command to load it directly into your terminal.</span>
          <span class="cs-count">${filtered.length} of ${CheatSheetData.length} cmdlets shown</span>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    if (!this.modalEl) return;

    // Close button
    this.modalEl.querySelector('#btn-cs-close')?.addEventListener('click', () => {
      this.close();
    });

    // Backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Esc key
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        window.removeEventListener('keydown', onKeyDown);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Search input
    const searchInput = this.modalEl.querySelector('#cs-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value;
        this.render();
        this.attachEvents();
        const nextInput = this.modalEl?.querySelector('#cs-search-input') as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.selectionStart = nextInput.selectionEnd = nextInput.value.length;
        }
      });
    }

    // Category tabs
    this.modalEl.querySelectorAll('.cs-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat') || 'All';
        this.activeCategory = cat;
        this.render();
        this.attachEvents();
      });
    });

    // Try buttons
    this.modalEl.querySelectorAll('.cs-try-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd && this.onSelectCmd) {
          this.onSelectCmd(cmd);
          this.close();
        }
      });
    });
  }
}
