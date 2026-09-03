export class CodexModal {
  private container: HTMLElement;
  private onInsertCmdlet?: (cmd: string) => void;

  constructor(container: HTMLElement, onInsertCmdlet?: (cmd: string) => void) {
    this.container = container;
    this.onInsertCmdlet = onInsertCmdlet;
    this.render();
    this.attachEvents();
  }

  public open(): void {
    this.container.querySelector('#codex-backdrop')?.classList.remove('hidden');
  }

  public close(): void {
    this.container.querySelector('#codex-backdrop')?.classList.add('hidden');
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="modal-backdrop hidden" id="codex-backdrop" role="dialog" aria-modal="true" aria-label="PowerShell Codex Reference Manual">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title">
              <span>📖 POWERSHELL STARSHIP CODEX</span>
            </div>
            <button class="modal-close-btn" id="btn-close-codex" aria-label="Close Codex">✕</button>
          </div>

          <div class="modal-body">
            <div class="codex-tabs">
              <button class="tab-btn active" data-tab="tab-verb-noun">Verb-Noun Rule</button>
              <button class="tab-btn" data-tab="tab-pipeline">The Pipeline (|)</button>
              <button class="tab-btn" data-tab="tab-operators">Comparison Ops</button>
              <button class="tab-btn" data-tab="tab-ps-vs-bash">PowerShell vs Bash</button>
              <button class="tab-btn" data-tab="tab-glossary">Cmdlet Glossary</button>
            </div>

            <div class="codex-content">
              <!-- Tab 1: Verb-Noun -->
              <div class="tab-pane active" id="tab-verb-noun">
                <h3>The Verb-Noun Naming Standard</h3>
                <p>PowerShell cmdlets always follow the <code>Verb-Noun</code> pattern. The <strong>Verb</strong> describes the action, and the <strong>Noun</strong> describes the resource being acted upon.</p>
                
                <table class="codex-table">
                  <thead><tr><th>Verb</th><th>Meaning</th><th>Examples</th></tr></thead>
                  <tbody>
                    <tr><td><code>Get</code></td><td>Retrieve information or objects</td><td><code class="codex-insert" data-cmd="Get-Command">Get-Command</code>, <code class="codex-insert" data-cmd="Get-StationModule">Get-StationModule</code></td></tr>
                    <tr><td><code>Set</code></td><td>Modify configuration or data</td><td><code class="codex-insert" data-cmd="Set-PowerRoute -Sector 'Core' -Watts 100">Set-PowerRoute</code>, <code>Set-Variable</code></td></tr>
                    <tr><td><code>Start</code> / <code>Stop</code></td><td>Start or stop a process or generator</td><td><code class="codex-insert" data-cmd="Start-Generator">Start-Generator</code></td></tr>
                    <tr><td><code>Restart</code></td><td>Cycle a service or hardware array</td><td><code class="codex-insert" data-cmd="Restart-CommsArray">Restart-CommsArray</code></td></tr>
                    <tr><td><code>Test</code></td><td>Check health, ping, or connectivity</td><td><code class="codex-insert" data-cmd="Test-Connection 'CoreRouter'">Test-Connection</code></td></tr>
                  </tbody>
                </table>
              </div>

              <!-- Tab 2: The Pipeline -->
              <div class="tab-pane hidden" id="tab-pipeline">
                <h3>The Object Pipeline ( | )</h3>
                <p>In traditional text shells, pipes pass flat strings. In PowerShell, the pipe passes <strong>rich .NET objects</strong> with properties and methods intact!</p>
                <div class="pipeline-diagram">
                  <div class="pipe-node">Get-StationModule<br/><code>[Emits 9 Objects]</code></div>
                  <div class="pipe-arrow">➜ | ➜</div>
                  <div class="pipe-node">Where-Object Status -eq 'Offline'<br/><code>[Filters to 3 Objects]</code></div>
                  <div class="pipe-arrow">➜ | ➜</div>
                  <div class="pipe-node">Repair-System<br/><code>[Repairs & Restores Grid]</code></div>
                </div>
              </div>

              <!-- Tab 3: Comparison Operators -->
              <div class="tab-pane hidden" id="tab-operators">
                <h3>PowerShell Comparison Operators</h3>
                <p>Because the <code>&gt;</code> and <code>&lt;</code> characters are reserved for redirection, PowerShell uses dash-prefixed operators:</p>
                <table class="codex-table">
                  <thead><tr><th>Operator</th><th>Meaning</th><th>Example</th></tr></thead>
                  <tbody>
                    <tr><td><code>-eq</code></td><td>Equals</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object Status -eq 'Online'">Where-Object Status -eq 'Online'</code></td></tr>
                    <tr><td><code>-ne</code></td><td>Not Equals</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object Status -ne 'Critical'">Where-Object Status -ne 'Critical'</code></td></tr>
                    <tr><td><code>-gt</code></td><td>Greater Than</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object PowerLevel -gt 50">Where-Object PowerLevel -gt 50</code></td></tr>
                    <tr><td><code>-ge</code></td><td>Greater Than or Equal</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object PowerLevel -ge 75">Where-Object PowerLevel -ge 75</code></td></tr>
                    <tr><td><code>-lt</code></td><td>Less Than</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object Temperature -lt 30">Where-Object Temperature -lt 30</code></td></tr>
                    <tr><td><code>-le</code></td><td>Less Than or Equal</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object Temperature -le 100">Where-Object Temperature -le 100</code></td></tr>
                    <tr><td><code>-like</code></td><td>Wildcard Match (*)</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object Name -like '*Oxygen*'">Where-Object Name -like '*Oxygen*'</code></td></tr>
                    <tr><td><code>-match</code></td><td>Regex Match</td><td><code class="codex-insert" data-cmd="Get-StationModule | Where-Object Sector -match 'Alpha|Core'">Where-Object Sector -match 'Alpha|Core'</code></td></tr>
                  </tbody>
                </table>
              </div>

              <!-- Tab 4: PowerShell vs Bash -->
              <div class="tab-pane hidden" id="tab-ps-vs-bash">
                <h3>PowerShell vs Linux Bash Quick Reference</h3>
                <table class="codex-table">
                  <thead><tr><th>Task</th><th>Linux Bash</th><th>PowerShell</th></tr></thead>
                  <tbody>
                    <tr><td>Filter rows</td><td><code>grep 'error'</code></td><td><code class="codex-insert" data-cmd="Get-SecurityLog | Where-Object Level -eq 'Error'">Where-Object Level -eq 'Error'</code></td></tr>
                    <tr><td>Select columns</td><td><code>awk '{print $1}'</code></td><td><code class="codex-insert" data-cmd="Get-StationModule | Select-Object -Property Name, Status">Select-Object -Property Name</code></td></tr>
                    <tr><td>Count & stats</td><td><code>wc -l</code></td><td><code class="codex-insert" data-cmd="Get-StationModule | Measure-Object -Property PowerLevel -Average">Measure-Object -Property ...</code></td></tr>
                    <tr><td>Sort items</td><td><code>sort -r</code></td><td><code class="codex-insert" data-cmd="Get-StationModule | Sort-Object -Property PowerLevel -Descending">Sort-Object -Descending</code></td></tr>
                    <tr><td>Inspect object</td><td>(not available)</td><td><code class="codex-insert" data-cmd="Get-StationModule | Get-Member">Get-Member</code> (gm)</td></tr>
                  </tbody>
                </table>
              </div>

              <!-- Tab 5: Cmdlet Glossary -->
              <div class="tab-pane hidden" id="tab-glossary">
                <h3>Station Cmdlet Glossary</h3>
                <div class="glossary-grid">
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Get-StationModule">Get-StationModule</code>
                    <p>Scans station diagnostics, power levels, and temperatures.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Get-StationModule | Where-Object Status -eq 'Offline' | Repair-System">Repair-System</code>
                    <p>Calibrates and brings offline modules back online.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Get-AirlockStatus">Get-AirlockStatus</code>
                    <p>Checks bulkhead door seals and atmospheric pressure.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Lock-Door 'AL-03'">Lock-Door / Unlock-Door</code>
                    <p>Secures or releases magnetic blast doors.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Start-Generator">Start-Generator</code>
                    <p>Engages magnetic containment and ignites plasma core.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Set-PowerRoute -Sector 'Core' -Watts 100">Set-PowerRoute</code>
                    <p>Allocates wattage to specific station sectors.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Deploy-RepairDrone -Id 'DR-01' -Sector 'Alpha'">Deploy-RepairDrone</code>
                    <p>Dispatches autonomous maintenance drones.</p>
                  </div>
                  <div class="glossary-card">
                    <code class="codex-insert" data-cmd="Send-DistressBeacon -Frequency '1420.405 MHz'">Send-DistressBeacon</code>
                    <p>Transmits interstellar SOS packets to rescue ships.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    // Close button
    this.container.querySelector('#btn-close-codex')?.addEventListener('click', () => {
      this.close();
    });

    // Close when clicking outside
    this.container.querySelector('#codex-backdrop')?.addEventListener('click', (e: Event) => {
      if ((e.target as HTMLElement).id === 'codex-backdrop') {
        this.close();
      }
    });

    // Tab switcher
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTab = btn.getAttribute('data-tab');
        this.container.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
        if (targetTab) {
          this.container.querySelector(`#${targetTab}`)?.classList.remove('hidden');
        }
      });
    });

    // Clickable code insertion from Codex
    this.container.querySelectorAll('.codex-insert').forEach(el => {
      el.addEventListener('click', () => {
        const cmd = el.getAttribute('data-cmd');
        if (cmd && this.onInsertCmdlet) {
          this.onInsertCmdlet(cmd);
          this.close();
        }
      });
    });
  }
}
