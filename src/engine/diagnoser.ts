export interface DiagnosticAdvice {
  title: string;
  explanation: string;
  suggestedFix?: string;
  example?: string;
}

export class Diagnoser {
  public static diagnose(rawInput: string, error: string, availableCmdlets: string[]): DiagnosticAdvice {
    const trimmed = rawInput.trim();

    // 1. Missing hyphen in Verb-Noun (e.g. 'GetModule' instead of 'Get-StationModule')
    const verbNounMatch = trimmed.match(/^([a-zA-Z]+)(Module|Station|Help|Command|Member|Process|Service|Item)/i);
    if (verbNounMatch && !trimmed.includes('-')) {
      const verb = verbNounMatch[1];
      const noun = verbNounMatch[2];
      return {
        title: 'PowerShell Verb-Noun Convention',
        explanation: `PowerShell commands always use a hyphen between the Action Verb and the Target Noun (e.g. Verb-Noun).`,
        suggestedFix: `${verb}-${noun}`,
        example: `Get-StationModule or Get-Help`
      };
    }

    // 2. Linux / Bash habits (e.g. 'grep', 'cat', 'ls', 'awk')
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (firstWord === 'grep') {
      return {
        title: 'Looking for grep?',
        explanation: `In PowerShell, instead of 'grep', we filter objects using 'Where-Object' (or the '?' shortcut)!`,
        suggestedFix: trimmed.replace(/^grep/i, 'Where-Object'),
        example: `Get-StationModule | Where-Object Status -eq 'Offline'`
      };
    }
    if (firstWord === 'awk' || firstWord === 'cut') {
      return {
        title: 'Looking for column cutters?',
        explanation: `In PowerShell, we select properties using 'Select-Object' (or 'select') rather than cutting raw text columns!`,
        suggestedFix: `Get-StationModule | Select-Object -Property Name, Status`,
        example: `Get-StationModule | Select-Object -Property Name, PowerLevel`
      };
    }

    // 3. Double equals (==) instead of PowerShell (-eq)
    if (trimmed.includes('==') || trimmed.includes('!=')) {
      const fixed = trimmed.replace(/==/g, '-eq').replace(/!=/g, '-ne');
      return {
        title: 'PowerShell Comparison Operators',
        explanation: `PowerShell uses dash comparison operators like '-eq' (equals), '-ne' (not equals), '-gt' (greater than), and '-lt' (less than) instead of '==' or '!='.`,
        suggestedFix: fixed,
        example: `Where-Object Status -eq 'Offline'`
      };
    }

    // 4. Quotation typos
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
      return {
        title: 'Unclosed Quotation Mark',
        explanation: `It looks like you opened a quote (' or ") without closing it. Make sure every opened quote has a matching pair!`,
        example: `Where-Object Status -eq 'Offline'`
      };
    }

    // 5. Cmdlet Typo / Fuzzy match
    const candidate = availableCmdlets.find(c => {
      const dist = levenshtein(c.toLowerCase(), firstWord);
      return dist > 0 && dist <= 3;
    });

    if (candidate) {
      const escapedFirst = firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return {
        title: `Did you mean '${candidate}'?`,
        explanation: `PowerShell cmdlet names are case-insensitive, but make sure your spelling is exact.`,
        suggestedFix: trimmed.replace(new RegExp(`^${escapedFirst}`, 'i'), candidate),
        example: `${candidate}`
      };
    }

    // Generic fallback
    return {
      title: 'Command Syntax Notice',
      explanation: error || `Check your syntax or run 'Get-Command' and 'Get-Help' for guidance.`,
      example: `Get-Help Get-StationModule`
    };
  }
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
