import { Token } from '../types';

export class Lexer {
  private input: string;
  private pos: number = 0;
  private len: number;

  constructor(input: string) {
    this.input = input;
    this.len = input.length;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.len) {
      this.skipWhitespace();
      if (this.pos >= this.len) break;

      const char = this.input[this.pos];
      const start = this.pos;

      // Single line comments: # ...
      if (char === '#') {
        this.skipUntilNewline();
        continue;
      }

      // Pipe: |
      if (char === '|') {
        this.pos++;
        tokens.push({ type: 'PIPE', value: '|', raw: '|', start, end: this.pos });
        continue;
      }

      // Assignment / Equals: =
      if (char === '=') {
        this.pos++;
        tokens.push({ type: 'OPERATOR', value: '=', raw: '=', start, end: this.pos });
        continue;
      }

      // Semicolon: ;
      if (char === ';') {
        this.pos++;
        tokens.push({ type: 'SEMICOLON', value: ';', raw: ';', start, end: this.pos });
        continue;
      }

      // Comma: ,
      if (char === ',') {
        this.pos++;
        tokens.push({ type: 'COMMA', value: ',', raw: ',', start, end: this.pos });
        continue;
      }

      // Parentheses & Braces
      if (char === '(') {
        this.pos++;
        tokens.push({ type: 'LPAREN', value: '(', raw: '(', start, end: this.pos });
        continue;
      }
      if (char === ')') {
        this.pos++;
        tokens.push({ type: 'RPAREN', value: ')', raw: ')', start, end: this.pos });
        continue;
      }

      // Script block or hashtable { }
      if (char === '{') {
        const scriptBlock = this.readScriptBlock();
        tokens.push({
          type: 'SCRIPTBLOCK',
          value: scriptBlock.value,
          raw: scriptBlock.raw,
          start,
          end: this.pos
        });
        continue;
      }

      // Variables: $var or $_ or $PSItem or $Tanks
      if (char === '$') {
        const variable = this.readVariable();
        tokens.push({
          type: 'VARIABLE',
          value: variable,
          raw: this.input.substring(start, this.pos),
          start,
          end: this.pos
        });
        continue;
      }

      // Parameters or Comparison operators: -Name, -eq, -gt, -like, -match
      if (char === '-') {
        const paramToken = this.readParameter();
        tokens.push(paramToken);
        continue;
      }

      // Strings: '...' or "..."
      if (char === "'" || char === '"') {
        const str = this.readString(char);
        tokens.push({
          type: 'STRING',
          value: str,
          raw: this.input.substring(start, this.pos),
          start,
          end: this.pos
        });
        continue;
      }

      // Numbers: 123, 45.6
      if (this.isDigit(char)) {
        const num = this.readNumber();
        tokens.push({
          type: 'NUMBER',
          value: num,
          raw: num,
          start,
          end: this.pos
        });
        continue;
      }

      // Identifiers / Cmdlets / Values (e.g. Get-StationModule, Online, Alpha)
      const ident = this.readIdentifier();
      if (ident.length > 0) {
        tokens.push({
          type: 'IDENTIFIER',
          value: ident,
          raw: ident,
          start,
          end: this.pos
        });
      } else {
        // Fallback for single unknown char
        this.pos++;
        tokens.push({
          type: 'UNKNOWN',
          value: char,
          raw: char,
          start,
          end: this.pos
        });
      }
    }

    return tokens;
  }

  private skipWhitespace(): void {
    while (this.pos < this.len && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private skipUntilNewline(): void {
    while (this.pos < this.len && this.input[this.pos] !== '\n') {
      this.pos++;
    }
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private readNumber(): string {
    const start = this.pos;
    while (this.pos < this.len && /[0-9.]/.test(this.input[this.pos])) {
      this.pos++;
    }
    return this.input.substring(start, this.pos);
  }

  private readString(quote: string): string {
    this.pos++; // skip opening quote
    let result = '';
    while (this.pos < this.len) {
      const char = this.input[this.pos];
      if (char === quote) {
        // Check for escaped quote in PowerShell ('' or "")
        if (this.pos + 1 < this.len && this.input[this.pos + 1] === quote) {
          result += quote;
          this.pos += 2;
          continue;
        }
        this.pos++; // skip closing quote
        break;
      }
      result += char;
      this.pos++;
    }
    return result;
  }

  private readVariable(): string {
    this.pos++; // skip $
    const start = this.pos;
    while (this.pos < this.len && /[a-zA-Z0-9_:.]/.test(this.input[this.pos])) {
      this.pos++;
    }
    return this.input.substring(start, this.pos);
  }

  private readParameter(): Token {
    const start = this.pos;
    this.pos++; // skip -
    const pStart = this.pos;
    while (this.pos < this.len && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
      this.pos++;
    }
    const name = this.input.substring(pStart, this.pos);
    const raw = this.input.substring(start, this.pos);

    // Check if it is a standard comparison operator:
    const lower = name.toLowerCase();
    const comparisonOps = [
      'eq', 'ne', 'gt', 'ge', 'lt', 'le',
      'like', 'notlike', 'match', 'notmatch',
      'contains', 'notcontains', 'in', 'notin'
    ];

    if (comparisonOps.includes(lower)) {
      return {
        type: 'COMPARISON',
        value: lower,
        raw,
        start,
        end: this.pos
      };
    }

    return {
      type: 'PARAMETER',
      value: name,
      raw,
      start,
      end: this.pos
    };
  }

  private readScriptBlock(): { value: string; raw: string } {
    const start = this.pos;
    this.pos++; // skip {
    let depth = 1;
    const bodyStart = this.pos;

    while (this.pos < this.len && depth > 0) {
      const char = this.input[this.pos];
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          const value = this.input.substring(bodyStart, this.pos).trim();
          this.pos++; // skip }
          const raw = this.input.substring(start, this.pos);
          return { value, raw };
        }
      }
      this.pos++;
    }

    const value = this.input.substring(bodyStart, this.pos).trim();
    const raw = this.input.substring(start, this.pos);
    return { value, raw };
  }

  private readIdentifier(): string {
    const start = this.pos;
    while (this.pos < this.len) {
      const char = this.input[this.pos];
      if (/[a-zA-Z0-9_.*:\-\\\/]/.test(char)) {
        this.pos++;
      } else {
        break;
      }
    }
    return this.input.substring(start, this.pos);
  }
}
