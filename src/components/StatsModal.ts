import { ChallengesCatalog } from '../challenges/catalog';

export interface StatsData {
  solvedIds: Set<number>;
  personalBests: Record<number, number>;
  getStars: (id: number) => number;
  getTotalStars: () => number;
  getDylanRank: () => { title: string; color: string; icon: string };
}

export class StatsModal {
  private backdrop: HTMLElement | null = null;
  private data: StatsData;
  private onClose?: () => void;

  constructor(data: StatsData, onClose?: () => void) {
    this.data = data;
    this.onClose = onClose;
  }

  public show(): void {
    this.close();

    const backdrop = document.createElement('div');
    backdrop.className = 'stats-backdrop animate-fade';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'stats-title');
    backdrop.innerHTML = this.buildHTML();
    document.body.appendChild(backdrop);
    this.backdrop = backdrop;

    // Focus close button on show
    const closeBtn = backdrop.querySelector('#stats-close-btn') as HTMLElement;
    closeBtn?.focus();

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    closeBtn?.addEventListener('click', () => this.close());

    // Focus trap & Escape key
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        window.removeEventListener('keydown', keyHandler);
        return;
      }
      if (e.key === 'Tab' && this.backdrop) {
        const focusables = Array.from(this.backdrop.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', keyHandler);
  }

  public close(): void {
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  private buildHTML(): string {
    const { solvedIds, personalBests, getStars, getTotalStars, getDylanRank } = this.data;

    const total = ChallengesCatalog.length;
    const solved = solvedIds.size;
    const pct = Math.round((solved / total) * 100);
    const totalStars = getTotalStars();
    const maxStars = total * 3;
    const rank = getDylanRank();

    // Star distribution
    const star3 = ChallengesCatalog.filter(c => getStars(c.id) === 3).length;
    const star2 = ChallengesCatalog.filter(c => getStars(c.id) === 2).length;
    const star1 = ChallengesCatalog.filter(c => getStars(c.id) === 1).length;
    const star0 = solved - star3 - star2 - star1;

    // Category breakdown
    const categories = ['Basics', 'Filesystem', 'Text & Search', 'Pipelines', 'Objects & JSON', 'Processes & Admin'] as const;
    const catStats = categories.map(cat => {
      const catChallenges = ChallengesCatalog.filter(c => c.category === cat);
      const catSolved = catChallenges.filter(c => solvedIds.has(c.id)).length;
      return { cat, total: catChallenges.length, solved: catSolved };
    });

    // Personal bests — top 5 by shortest solution
    const bests = Object.entries(personalBests)
      .map(([id, len]) => {
        const ch = ChallengesCatalog.find(c => c.id === Number(id));
        return ch ? { id: Number(id), slug: ch.slug, title: ch.title, len, stars: getStars(Number(id)) } : null;
      })
      .filter(Boolean) as { id: number; slug: string; title: string; len: number; stars: number }[];
    bests.sort((a, b) => a.len - b.len);
    const top5 = bests.slice(0, 5);

    return `
      <div class="stats-modal-card">
        <div class="stats-header">
          <div class="stats-title-group">
            <span class="stats-icon" aria-hidden="true">📊</span>
            <h2 class="stats-title" id="stats-title">Dylan Grow's Stats Dashboard</h2>
          </div>
          <button class="stats-close-btn" id="stats-close-btn" aria-label="Close Stats Dashboard" title="Close (Esc)">✕</button>
        </div>

        <div class="stats-body">

          <!-- Rank Banner -->
          <div class="stats-rank-banner" style="border-color: ${rank.color}; color: ${rank.color};">
            <span class="rank-icon">${rank.icon}</span>
            <div class="rank-text">
              <div class="rank-label">CURRENT RANK</div>
              <div class="rank-title">${rank.title}</div>
            </div>
            <div class="rank-stars">
              <span class="rank-star-count">${totalStars}</span>
              <span class="rank-star-label">/ ${maxStars} stars</span>
            </div>
          </div>

          <!-- Progress Overview -->
          <div class="stats-section">
            <div class="stats-section-title">🏁 Progress Overview</div>
            <div class="stats-overview-grid">
              <div class="stats-metric">
                <div class="metric-val">${solved}</div>
                <div class="metric-label">Solved</div>
              </div>
              <div class="stats-metric">
                <div class="metric-val">${total - solved}</div>
                <div class="metric-label">Remaining</div>
              </div>
              <div class="stats-metric">
                <div class="metric-val">${pct}%</div>
                <div class="metric-label">Complete</div>
              </div>
              <div class="stats-metric">
                <div class="metric-val">${totalStars}</div>
                <div class="metric-label">⭐ Stars</div>
              </div>
            </div>
            <div class="stats-progress-bar-wrap">
              <div class="stats-progress-bar-bg">
                <div class="stats-progress-bar-fill" style="width: ${pct}%"></div>
              </div>
              <span class="stats-progress-label">${pct}% complete</span>
            </div>
          </div>

          <!-- Star Distribution -->
          <div class="stats-section">
            <div class="stats-section-title">⭐ Star Distribution</div>
            <div class="stats-star-dist">
              ${this.starBar('⭐⭐⭐', star3, solved, '#f59e0b')}
              ${this.starBar('⭐⭐', star2, solved, '#94a3b8')}
              ${this.starBar('⭐', star1, solved, '#64748b')}
              ${this.starBar('(solved)', star0, solved, '#334155')}
              ${this.starBar('(unsolved)', total - solved, total, '#1e293b')}
            </div>
          </div>

          <!-- Category Breakdown -->
          <div class="stats-section">
            <div class="stats-section-title">📁 Category Progress</div>
            <div class="stats-category-list">
              ${catStats.map(c => `
                <div class="stats-cat-row">
                  <span class="stats-cat-name">${c.cat}</span>
                  <div class="stats-cat-bar-wrap">
                    <div class="stats-cat-bar-bg">
                      <div class="stats-cat-bar-fill" style="width: ${c.total > 0 ? Math.round((c.solved / c.total) * 100) : 0}%"></div>
                    </div>
                  </div>
                  <span class="stats-cat-count">${c.solved}/${c.total}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Personal Bests -->
          ${top5.length > 0 ? `
          <div class="stats-section">
            <div class="stats-section-title">🏌️ Golf Personal Bests (Top 5 Shortest)</div>
            <div class="stats-bests-list">
              ${top5.map((b, i) => `
                <div class="stats-best-row">
                  <span class="stats-best-rank">#${i + 1}</span>
                  <span class="stats-best-slug">${b.slug}</span>
                  <span class="stats-best-len">${b.len} chars</span>
                  <span class="stats-best-stars">${'★'.repeat(b.stars)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

        </div>

        <div class="stats-footer">
          <span>Keep going Dylan! 💪 ${solved < total ? `${total - solved} challenges remain.` : '🎉 All challenges complete!'}</span>
        </div>
      </div>
    `;
  }

  private starBar(label: string, count: number, total: number, color: string): string {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="star-dist-row">
        <span class="star-dist-label">${label}</span>
        <div class="star-dist-bar-wrap">
          <div class="star-dist-bar-bg">
            <div class="star-dist-bar-fill" style="width: ${pct}%; background: ${color};"></div>
          </div>
        </div>
        <span class="star-dist-count">${count}</span>
      </div>
    `;
  }
}
