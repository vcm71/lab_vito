import { BaseEngine } from '../../core/BaseEngine.js';
import { renderAtaqueTab } from '../../../ataqueRenderer.js';

export class AtaqueEngine extends BaseEngine {
  constructor(tracker) {
    super('Ataque');
    this.tracker = tracker;
  }

  async initialize() { this.initialized = true; }
  async start() { this.started = true; }
  async stop() { this.started = false; }
  async dispose() { this.initialized = false; this.started = false; this.tracker = null; }

  render() {
    try { renderAtaqueTab(this.tracker); } catch(e) { console.warn('[AtaqueEngine] render error:', e); }
  }
}
