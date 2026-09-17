export class SyntaxHighlighter {
  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public static highlight(code: string): string {
    if (!code) return '';

    let out = '';
    let i = 0;
    const len = code.length;

    while (i < len) {
      const char = code[i];

      // Comment
      if (char === '#') {
        const comment = code.slice(i);
        out += `<span class="ps-token-comment">${this.escapeHtml(comment)}</span>`;
        break;
      }

      // Single-quoted String
      if (char === "'") {
        let str = "'";
        i++;
        while (i < len) {
          if (code[i] === "'") {
            if (i + 1 < len && code[i + 1] === "'") {
              str += "''";
              i += 2;
              continue;
            }
            str += "'";
            i++;
            break;
          }
          str += code[i];
          i++;
        }
        out += `<span class="ps-token-string">${this.escapeHtml(str)}</span>`;
        continue;
      }

      // Double-quoted String
      if (char === '"') {
        let str = '"';
        i++;
        while (i < len) {
          if (code[i] === '`' && i + 1 < len) {
            str += code[i] + code[i + 1];
            i += 2;
            continue;
          }
          if (code[i] === '"') {
            str += '"';
            i++;
            break;
          }
          str += code[i];
          i++;
        }
        out += `<span class="ps-token-string">${this.escapeHtml(str)}</span>`;
        continue;
      }

      // Variable
      if (char === '$') {
        let varName = '$';
        i++;
        while (i < len && /[a-zA-Z0-9_:.]/.test(code[i])) {
          varName += code[i];
          i++;
        }
        out += `<span class="ps-token-variable">${this.escapeHtml(varName)}</span>`;
        continue;
      }

      // Parameter or Comparison operator (-Path, -eq, etc.)
      if (char === '-' && i + 1 < len && /[a-zA-Z]/.test(code[i + 1])) {
        let param = '-';
        i++;
        while (i < len && /[a-zA-Z0-9_]/.test(code[i])) {
          param += code[i];
          i++;
        }
        const lower = param.toLowerCase();
        if (['-eq', '-ne', '-gt', '-ge', '-lt', '-le', '-like', '-notlike', '-match', '-notmatch'].includes(lower)) {
          out += `<span class="ps-token-operator">${this.escapeHtml(param)}</span>`;
        } else {
          out += `<span class="ps-token-parameter">${this.escapeHtml(param)}</span>`;
        }
        continue;
      }

      // Range operator (..)
      if (char === '.' && i + 1 < len && code[i + 1] === '.') {
        out += `<span class="ps-token-operator">..</span>`;
        i += 2;
        continue;
      }

      // Pipe or Semicolon
      if (char === '|' || char === ';') {
        out += `<span class="ps-token-pipe">${char}</span>`;
        i++;
        continue;
      }

      // Numbers
      if (/\d/.test(char) && (i === 0 || /[\s(,=]/.test(code[i - 1]))) {
        let num = '';
        while (i < len && /[\d.]/.test(code[i])) {
          num += code[i];
          i++;
        }
        out += `<span class="ps-token-number">${this.escapeHtml(num)}</span>`;
        continue;
      }

      // Identifiers / Words (Cmdlets, Aliases, Arguments)
      if (/[a-zA-Z0-9_\\/.]/.test(char)) {
        let word = '';
        const startPos = i;
        while (i < len && !/[\s|;()'",`$]/.test(code[i])) {
          word += code[i];
          i++;
        }

        // Check if cmdlet / command
        const isCmdlet = /^[A-Z][a-zA-Z0-9]*-[A-Z][a-zA-Z0-9]*$/i.test(word);
        const aliases = ['dir', 'ls', 'cat', 'gc', 'sc', 'sls', 'grep', 'ps', 'gps', 'gsv', 'pwd', 'gl', 'cd', 'echo', 'diff', 'tee', 'ogv', 'grid', 'type'];
        const isAlias = aliases.includes(word.toLowerCase());

        // Check if at command position (start or after pipe/semicolon)
        const preceding = code.slice(0, startPos).trim();
        const isHead = preceding.length === 0 || preceding.endsWith('|') || preceding.endsWith(';');

        if (isCmdlet || isAlias || isHead) {
          out += `<span class="ps-token-command">${this.escapeHtml(word)}</span>`;
        } else {
          out += `<span class="ps-token-identifier">${this.escapeHtml(word)}</span>`;
        }
        continue;
      }

      // Fallback
      out += this.escapeHtml(char);
      i++;
    }

    return out;
  }
}
