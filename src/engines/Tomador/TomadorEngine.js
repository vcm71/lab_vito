import { BaseEngine } from '../../core/BaseEngine.js';
import { TomadorRenderer } from '../../../tomadorRenderer.js';

export class TomadorEngine extends BaseEngine {
  constructor(tracker, options = {}) {
    super('Tomador');
    this.tracker = tracker;
    this.renderer = null;
    this.options = options;
  }

  async initialize() { this.initialized = true; }
  async start() { this.started = true; }
  initRenderer(targetContainer) {
    this.renderer = new TomadorRenderer(this.tracker, { ...this.options, container: targetContainer });
    return this.renderer;
  }
  async stop() { this.started = false; }
  async dispose() {
    if (this.renderer) { /* cleanup handled by main.js */ }
    this.initialized = false; this.started = false; this.tracker = null;
  }
}
