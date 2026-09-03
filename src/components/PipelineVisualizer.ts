export interface PipelineStage {
  name: string;
  inCount: number;
  outCount: number;
  type: 'source' | 'filter' | 'action' | 'measure' | 'select' | 'sort';
}

export class PipelineVisualizer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public showPipeline(_rawCommand: string, stages: PipelineStage[]): void {
    if (!stages || stages.length <= 1) {
      this.hide();
      return;
    }

    const stagesHtml = stages.map((stage, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === stages.length - 1;
      const badgeClass = stage.type;

      return `
        <div class="pipe-stage stage-${badgeClass}">
          <div class="stage-tag">${stage.type.toUpperCase()}</div>
          <div class="stage-cmd"><code>${stage.name}</code></div>
          <div class="stage-stats">
            ${!isFirst ? `<span class="in-stat">📥 ${stage.inCount}</span>` : ''}
            ${!isFirst && !isLast ? `<span class="arrow-stat">➔</span>` : ''}
            <span class="out-stat">📤 ${stage.outCount} obj</span>
          </div>
        </div>
        ${!isLast ? `<div class="pipe-connector"><div class="pipe-stream-particle"></div></div>` : ''}
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="pipeline-viz-card animate-slide-down">
        <div class="viz-header">
          <div class="viz-title">
            <span class="viz-icon">⚡</span>
            <span>LIVE OBJECT PIPELINE FLOW</span>
          </div>
          <span class="viz-sub">PowerShell streamed typed objects without text parsing</span>
        </div>
        <div class="pipeline-conveyor">
          ${stagesHtml}
        </div>
      </div>
    `;
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.innerHTML = '';
    this.container.classList.add('hidden');
  }

  private render(): void {
    this.container.className = 'pipeline-viz-container hidden';
  }
}
