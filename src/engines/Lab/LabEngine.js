import { BaseEngine } from '../../core/BaseEngine.js';
import { LabRenderer } from '../../../controlador_de_la_vista_lab.js';

export class LabEngine extends BaseEngine {
  constructor(containerId, tracker) {
    super('Lab');
    this.containerId = containerId;
    this.tracker = tracker;
    this.renderer = null;
  }

  async initialize() { this.initialized = true; }
  async start() {
    this.started = true;
    if (!this.renderer) {
      this.renderer = new LabRenderer(this.containerId, this.tracker);
      this.renderer.init();
    }
  }
  updateRenderer() { if (this.renderer) this.renderer.update(); }
  async stop() { this.started = false; }
  async dispose() {
    this.renderer = null;
    this.initialized = false; this.started = false; this.tracker = null;
  }
}
