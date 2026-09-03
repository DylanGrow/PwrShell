import { PSObject } from './psobject';

export interface FormattedOutput {
  html: string;
  rawText: string;
}

export class Formatters {
  public static formatTable(objects: any[], properties?: string[]): FormattedOutput {
    if (!objects || objects.length === 0) {
      return { html: '', rawText: '' };
    }

    const psObjs = objects.map((item) => {
      if (item instanceof PSObject) return item;
      if (typeof item === 'object' && item !== null) {
        const p = new PSObject();
        for (const [k, v] of Object.entries(item)) {
          p.setProperty(k, v);
        }
        return p;
      }
      const p = new PSObject();
      p.setProperty('Value', item);
      return p;
    });

    // Determine columns
    let cols: string[] = [];
    if (properties && properties.length > 0) {
      cols = properties;
    } else {
      const propSet = new Set<string>();
      for (const obj of psObjs) {
        for (const prop of obj.getProperties()) {
          propSet.add(prop.name);
        }
      }
      cols = Array.from(propSet);
    }

    if (cols.length === 0) {
      return { html: '', rawText: '' };
    }

    // Build raw text table
    const widths: Record<string, number> = {};
    for (const col of cols) {
      widths[col] = Math.max(col.length, 4);
    }
    for (const obj of psObjs) {
      for (const col of cols) {
        const val = obj.getProperty(col);
        const strVal = val !== undefined && val !== null ? String(val) : '';
        widths[col] = Math.max(widths[col], Math.min(strVal.length, 30));
      }
    }

    const headerParts = cols.map(c => c.padEnd(widths[c]));
    const dividerParts = cols.map(c => '-'.repeat(widths[c]));
    let rawText = headerParts.join('  ') + '\n' + dividerParts.join('  ') + '\n';

    // Build clean semantic HTML table
    let html = `<div class="table-scroll-container"><table class="cmd-result-table"><thead><tr>`;
    for (const col of cols) {
      html += `<th>${this.escapeHtml(col)}</th>`;
    }
    html += `</tr></thead><tbody>`;

    for (const obj of psObjs) {
      const rowParts: string[] = [];
      html += `<tr>`;
      for (const col of cols) {
        const val = obj.getProperty(col);
        const strVal = val !== undefined && val !== null ? String(val) : '';
        rowParts.push(strVal.padEnd(widths[col]));

        html += `<td>${this.formatCellBadge(strVal, col)}</td>`;
      }
      html += `</tr>`;
      rawText += rowParts.join('  ') + '\n';
    }
    html += `</tbody></table></div>`;

    return { html, rawText };
  }

  public static formatList(objects: any[]): FormattedOutput {
    if (!objects || objects.length === 0) return { html: '', rawText: '' };

    let rawText = '';
    let html = `<div class="cmd-list-container">`;

    for (const item of objects) {
      const psObj = item instanceof PSObject ? item : new PSObject(item);
      const props = psObj.getProperties();
      const maxPropLen = Math.max(...props.map((p) => p.name.length), 6);

      html += `<div class="cmd-list-card">`;
      for (const p of props) {
        const strVal = p.value !== undefined && p.value !== null ? String(p.value) : '';
        rawText += `${p.name.padEnd(maxPropLen)} : ${strVal}\n`;
        html += `
          <div class="cmd-list-field">
            <span class="field-key">${this.escapeHtml(p.name)}</span>
            <span class="field-val">${this.formatCellBadge(strVal, p.name)}</span>
          </div>
        `;
      }
      html += `</div>`;
      rawText += '\n';
    }
    html += `</div>`;

    return { html, rawText };
  }

  public static formatCellBadge(val: string, colName = ''): string {
    const escaped = this.escapeHtml(val);
    const lower = val.toLowerCase();
    const colLower = colName.toLowerCase();

    // Status badges
    if (lower === 'online' || lower === 'active' || lower === 'normal' || lower === 'true' || lower === 'docked') {
      return `<span class="badge-chip chip-green">● ${escaped}</span>`;
    }
    if (lower === 'offline' || lower === 'critical' || lower === 'error' || lower === 'depressurized' || lower === 'false') {
      return `<span class="badge-chip chip-red">● ${escaped}</span>`;
    }
    if (lower === 'warning' || lower === 'standby' || lower === 'deploying' || lower === 'contaminated') {
      return `<span class="badge-chip chip-yellow">● ${escaped}</span>`;
    }

    // Power or Numbers
    if (colLower.includes('power') || colLower.includes('integrity') || colLower.includes('battery')) {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        return `<span class="badge-chip chip-blue">${num}%</span>`;
      }
    }

    // Sector / ID
    if (colLower === 'sector' || colLower === 'id' || colLower === 'location') {
      return `<span class="badge-chip chip-purple">${escaped}</span>`;
    }

    if (/^\d+(\.\d+)?$/.test(val)) {
      return `<span class="text-number">${escaped}</span>`;
    }

    return `<span class="text-default">${escaped}</span>`;
  }

  public static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
