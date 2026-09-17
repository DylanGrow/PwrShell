export interface CertificateStats {
  solvedCount: number;
  totalCount: number;
  totalStars: number;
  maxStars: number;
  rankTitle: string;
}

export class CertificateModal {
  private stats: CertificateStats;
  private modalEl: HTMLElement | null = null;
  private certId: string;
  private issueDate: string;

  constructor(stats: CertificateStats) {
    this.stats = stats;
    // Generate deterministic certificate ID based on date and name
    const year = new Date().getFullYear();
    const hash = Math.abs(this.simpleHash(`DylanGrow-${stats.solvedCount}-${year}`)).toString(16).toUpperCase().padStart(6, '0');
    this.certId = `DG-PWSH-${year}-${hash}`;
    this.issueDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  public show(): void {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'cert-backdrop animate-fade';
    document.body.appendChild(this.modalEl);

    this.render();
    this.attachEvents();
  }

  public close(): void {
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }

  private render(): void {
    if (!this.modalEl) return;

    const isComplete = this.stats.solvedCount >= this.stats.totalCount;

    this.modalEl.innerHTML = `
      <div class="cert-window">
        <!-- Top controls -->
        <div class="cert-top-bar">
          <div class="cert-top-title">
            <span>🏆</span>
            <strong>Official Certification of Competency</strong>
          </div>
          <button class="cert-close-btn" id="btn-cert-x">✕</button>
        </div>

        <!-- The Certificate Document -->
        <div class="cert-document-wrap" id="cert-printable">
          <div class="cert-frame">
            <div class="cert-inner-border">
              
              <!-- Header -->
              <div class="cert-header">
                <div class="cert-logo-badge">
                  <span class="cert-ps-text">PS&gt;</span>
                </div>
                <div class="cert-org-text">POWERSHELL AUTOMATION ACADEMY</div>
                <h1 class="cert-main-title">Certificate of Mastery</h1>
                <div class="cert-subtitle">THIS DOCUMENT OFFICIALLY CERTIFIES THAT</div>
              </div>

              <!-- Recipient -->
              <div class="cert-recipient-name">Dylan Grow</div>

              <!-- Description -->
              <div class="cert-body-text">
                has successfully demonstrated verified technical mastery in <strong>PowerShell 7.4</strong> cmdlets, object pipeline streaming, regular expressions, system automation, and code golf optimization across <strong>${this.stats.solvedCount} of ${this.stats.totalCount}</strong> progressive sysadmin challenges.
              </div>

              <!-- Metrics Row -->
              <div class="cert-metrics-row">
                <div class="cert-metric-card">
                  <div class="cert-metric-label">RANK ACHIEVED</div>
                  <div class="cert-metric-val highlight">${this.stats.rankTitle}</div>
                </div>
                <div class="cert-metric-card">
                  <div class="cert-metric-label">CHALLENGES SOLVED</div>
                  <div class="cert-metric-val">${this.stats.solvedCount} / ${this.stats.totalCount} (${Math.round((this.stats.solvedCount / this.stats.totalCount) * 100)}%)</div>
                </div>
                <div class="cert-metric-card">
                  <div class="cert-metric-label">EFFICIENCY STARS</div>
                  <div class="cert-metric-val">⭐ ${this.stats.totalStars} Stars</div>
                </div>
              </div>

              <!-- Footer with Seal and Signatures -->
              <div class="cert-footer-row">
                <div class="cert-sign-col">
                  <div class="cert-sign-line">Dylan Grow</div>
                  <div class="cert-sign-sub">VERIFIED RECIPIENT</div>
                </div>

                <div class="cert-seal-col">
                  <div class="cert-seal">
                    <div class="cert-seal-ring">
                      <div class="cert-seal-text">${isComplete ? 'VERIFIED' : 'ACTIVE'}</div>
                      <div class="cert-seal-star">★ ★ ★</div>
                      <div class="cert-seal-sub">2026</div>
                    </div>
                  </div>
                </div>

                <div class="cert-sign-col">
                  <div class="cert-sign-line">${this.issueDate}</div>
                  <div class="cert-sign-sub">DATE OF ISSUANCE • ID: ${this.certId}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="cert-actions-bar">
          <button class="cert-btn-primary" id="btn-cert-print">
            <span>🖨️</span> Print / Save as PDF
          </button>
          <button class="cert-btn-secondary" id="btn-cert-share">
            <span>📋</span> Copy Achievement Text
          </button>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    if (!this.modalEl) return;

    this.modalEl.querySelector('#btn-cert-x')?.addEventListener('click', () => this.close());

    // Print
    this.modalEl.querySelector('#btn-cert-print')?.addEventListener('click', () => {
      window.print();
    });

    // Share text
    this.modalEl.querySelector('#btn-cert-share')?.addEventListener('click', (e) => {
      const shareText = `🏆 Dylan Grow achieved the rank of ${this.stats.rankTitle} in PowerShell Command Challenge (${this.stats.solvedCount}/${this.stats.totalCount} challenges solved, ${this.stats.totalStars} ⭐)! Check it out: https://dylangrow.github.io/PwrShell/`;
      navigator.clipboard?.writeText(shareText);
      const btn = e.currentTarget as HTMLElement;
      btn.innerHTML = `<span>✓</span> Copied to Clipboard!`;
      setTimeout(() => {
        btn.innerHTML = `<span>📋</span> Copy Achievement Text`;
      }, 2000);
    });

    // Close on click outside
    this.modalEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('cert-backdrop')) {
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
  }
}
