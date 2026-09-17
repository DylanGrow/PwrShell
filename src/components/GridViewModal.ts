export interface GridViewData {
  title: string;
  columns: string[];
  rows: Record<string, any>[];
}

export class GridViewModal {
  private data: GridViewData;
  private currentRows: Record<string, any>[];
  private sortColumn: string | null = null;
  private sortAsc: boolean = true;
  private filterQuery: string = '';
  private selectedIndex: number = -1;
  private modalEl: HTMLElement | null = null;
  private onClose?: () => void;

  constructor(data: GridViewData, onClose?: () => void) {
    this.data = data;
    this.currentRows = [...data.rows];
    this.onClose = onClose;
  }

  public show(): void {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'gridview-backdrop animate-fade';
    document.body.appendChild(this.modalEl);

    this.render();
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
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private applyFilterAndSort(): void {
    let list = [...this.data.rows];

    // Filter
    if (this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase();
      list = list.filter(row => {
        return Object.values(row).some(v => 
          String(v).toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (this.sortColumn) {
      const col = this.sortColumn;
      const asc = this.sortAsc;
      list.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }

        const sA = String(valA ?? '');
        const sB = String(valB ?? '');
        return asc ? sA.localeCompare(sB) : sB.localeCompare(sA);
      });
    }

    this.currentRows = list;
  }

  private render(): void {
    if (!this.modalEl) return;

    this.applyFilterAndSort();

    // Headers
    const headersHtml = this.data.columns.map(col => {
      let icon = '';
      if (this.sortColumn === col) {
        icon = this.sortAsc ? ' ▲' : ' ▼';
      }
      return `
        <th class="gv-th" data-col="${this.escapeHtml(col)}">
          <div class="gv-th-inner">
            <span>${this.escapeHtml(col)}</span>
            <span class="gv-sort-icon">${icon}</span>
          </div>
        </th>
      `;
    }).join('');

    // Rows
    const rowsHtml = this.currentRows.map((row, idx) => {
      const isSelected = this.selectedIndex === idx;
      const cells = this.data.columns.map(col => {
        const val = row[col];
        return `<td class="gv-td">${this.escapeHtml(val)}</td>`;
      }).join('');

      return `
        <tr class="gv-tr ${isSelected ? 'selected' : ''}" data-idx="${idx}">
          ${cells}
        </tr>
      `;
    }).join('');

    this.modalEl.innerHTML = `
      <div class="gridview-window">
        <!-- Title bar -->
        <div class="gv-titlebar">
          <div class="gv-title-left">
            <span class="gv-icon">📊</span>
            <span class="gv-title-text">${this.escapeHtml(this.data.title)} [PowerShell Grid View]</span>
          </div>
          <div class="gv-controls">
            <button class="gv-btn-close" id="btn-gv-x">✕</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="gv-toolbar">
          <div class="gv-filter-wrap">
            <span class="gv-search-icon">🔍</span>
            <input
              type="text"
              id="gv-filter-input"
              class="gv-filter-input"
              placeholder="Filter items across all columns (e.g. 'chrome', 'Engineering')..."
              value="${this.escapeHtml(this.filterQuery)}"
            />
            ${this.filterQuery ? `<button class="gv-btn-clear" id="btn-gv-clear">✕</button>` : ''}
          </div>
        </div>

        <!-- Table Container -->
        <div class="gv-table-scroll">
          <table class="gv-table">
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="${this.data.columns.length}" class="gv-empty">No matching records found.</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- Status Bar -->
        <div class="gv-statusbar">
          <span>Showing ${this.currentRows.length} of ${this.data.rows.length} items</span>
          <div class="gv-status-right">
            <button class="gv-btn-action" id="btn-gv-ok">OK</button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.modalEl) return;

    // Close button
    this.modalEl.querySelector('#btn-gv-x')?.addEventListener('click', () => this.close());
    this.modalEl.querySelector('#btn-gv-ok')?.addEventListener('click', () => this.close());

    // Click outside window to close
    this.modalEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('gridview-backdrop')) {
        this.close();
      }
    });

    // Escape key
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', onKey);
        this.close();
      }
    };
    window.addEventListener('keydown', onKey);

    // Filter input
    const filterInput = this.modalEl.querySelector('#gv-filter-input') as HTMLInputElement;
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this.filterQuery = (e.target as HTMLInputElement).value;
        this.render();
        const nextInput = this.modalEl?.querySelector('#gv-filter-input') as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        }
      });
    }

    // Clear filter
    this.modalEl.querySelector('#btn-gv-clear')?.addEventListener('click', () => {
      this.filterQuery = '';
      this.render();
    });

    // Column sorting
    this.modalEl.querySelectorAll('.gv-th').forEach(th => {
      th.addEventListener('click', (e) => {
        const col = (e.currentTarget as HTMLElement).getAttribute('data-col');
        if (!col) return;

        if (this.sortColumn === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortColumn = col;
          this.sortAsc = true;
        }
        this.render();
      });
    });

    // Row selection
    this.modalEl.querySelectorAll('.gv-tr').forEach(tr => {
      tr.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '-1', 10);
        this.selectedIndex = idx;
        this.render();
      });
    });
  }
}
