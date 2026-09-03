import { Token, ASTNode, PipelineNode, CommandNode, CommandArgument, AssignmentNode } from '../types';
import { Lexer } from './lexer';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public static parse(input: string): ASTNode | null {
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    if (tokens.length === 0) return null;
    const parser = new Parser(tokens);
    return parser.parseTopLevel();
  }

  public parseTopLevel(): ASTNode | null {
    if (this.isAtEnd()) return null;

    // Check for variable assignment: $var = <expression / pipeline>
    if (
      this.peek()?.type === 'VARIABLE' &&
      (this.peekNext()?.type === 'OPERATOR' || this.peekNext()?.type === 'IDENTIFIER') &&
      this.peekNext()?.value === '='
    ) {
      const varToken = this.advance();
      this.advance(); // consume =
      const expr = this.parsePipeline();
      const assignment: AssignmentNode = {
        type: 'Assignment',
        variable: varToken.value,
        expression: expr
      };
      return assignment;
    }

    return this.parsePipeline();
  }

  public parsePipeline(): PipelineNode {
    const commands: CommandNode[] = [];

    commands.push(this.parseCommand());

    while (this.match('PIPE')) {
      commands.push(this.parseCommand());
    }

    return {
      type: 'Pipeline',
      commands
    };
  }

  private parseCommand(): CommandNode {
    const headToken = this.advance();
    const commandName = headToken ? (headToken.type === 'VARIABLE' ? `$${headToken.value}` : headToken.value) : '';
    const args: CommandArgument[] = [];

    while (!this.isAtEnd() && this.peek()?.type !== 'PIPE' && this.peek()?.type !== 'SEMICOLON') {
      const token = this.peek();
      if (!token) break;

      if (token.type === 'PARAMETER') {
        this.advance();
        const paramName = token.value;

        // Check if next token is a value for this parameter (unless next token is another parameter or pipe)
        const next = this.peek();
        if (
          next &&
          next.type !== 'PARAMETER' &&
          next.type !== 'PIPE' &&
          next.type !== 'SEMICOLON' &&
          next.type !== 'COMPARISON'
        ) {
          const valToken = this.advance();
          args.push({
            name: paramName,
            value: this.evaluateTokenValue(valToken),
            isParameterName: true
          });
        } else {
          // Switch parameter (e.g. -Descending, -Unique)
          args.push({
            name: paramName,
            value: true,
            isParameterName: true
          });
        }
      } else if (token.type === 'COMPARISON') {
        const opToken = this.advance();
        // Look for the operand following comparison
        const rightToken = !this.isAtEnd() ? this.advance() : null;
        args.push({
          name: 'Operator',
          value: {
            op: opToken.value,
            operand: rightToken ? this.evaluateTokenValue(rightToken) : null
          }
        });
      } else if (token.type === 'SCRIPTBLOCK') {
        const sbToken = this.advance();
        args.push({
          value: sbToken.value
        });
      } else if (token.type === 'LPAREN') {
        this.advance(); // consume (
        const innerTokens: Token[] = [];
        let depth = 1;
        while (!this.isAtEnd() && depth > 0) {
          const t = this.advance();
          if (t.type === 'LPAREN') {
            depth++;
            innerTokens.push(t);
          } else if (t.type === 'RPAREN') {
            depth--;
            if (depth === 0) break;
            innerTokens.push(t);
          } else {
            innerTokens.push(t);
          }
        }
        const innerVal = innerTokens.map(t => t.value).join('');
        args.push({
          value: innerVal
        });
      } else {
        const argToken = this.advance();
        args.push({
          value: this.evaluateTokenValue(argToken)
        });
      }
    }

    return {
      type: 'Command',
      name: commandName,
      arguments: args
    };
  }

  private evaluateTokenValue(token: Token): any {
    switch (token.type) {
      case 'NUMBER':
        return Number(token.value);
      case 'STRING':
        return token.value;
      case 'VARIABLE':
        return { isVariable: true, name: token.value };
      case 'IDENTIFIER':
        if (token.value.toLowerCase() === '$true' || token.value.toLowerCase() === 'true') return true;
        if (token.value.toLowerCase() === '$false' || token.value.toLowerCase() === 'false') return false;
        if (token.value.toLowerCase() === '$null' || token.value.toLowerCase() === 'null') return null;
        return token.value;
      default:
        return token.value;
    }
  }

  private match(type: string): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek()?.type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private peek(): Token | undefined {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    if (this.current + 1 >= this.tokens.length) return undefined;
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
