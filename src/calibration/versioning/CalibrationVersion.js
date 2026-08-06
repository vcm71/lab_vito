/**
 * CalibrationVersion — semantic versioning for calibration strategies and metadata.
 *
 * Immutable value object. Comparison is delegated to a static helper so
 * strategies and the calibrator can check compatibility without coupling to
 * a particular version scheme.
 */
export class CalibrationVersion {
  /**
   * @param {number} major
   * @param {number} minor
   * @param {number} patch
   * @param {string|null} [label=null] — e.g. 'alpha', 'rc1', null for releases
   */
  constructor(major, minor, patch, label = null) {
    if (!Number.isInteger(major) || major < 0) throw new TypeError('CalibrationVersion: major must be a non-negative integer.');
    if (!Number.isInteger(minor) || minor < 0) throw new TypeError('CalibrationVersion: minor must be a non-negative integer.');
    if (!Number.isInteger(patch) || patch < 0) throw new TypeError('CalibrationVersion: patch must be a non-negative integer.');
    if (label !== null && typeof label !== 'string') throw new TypeError('CalibrationVersion: label must be a string or null.');

    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.label = label;
  }

  /** @returns {string} e.g. '1.0.0' or '1.1.0-alpha' */
  toString() {
    const base = `${this.major}.${this.minor}.${this.patch}`;
    return this.label ? `${base}-${this.label}` : base;
  }

  /** @returns {boolean} */
  equals(other) {
    if (!(other instanceof CalibrationVersion)) return false;
    return this.major === other.major
      && this.minor === other.minor
      && this.patch === other.patch
      && this.label === other.label;
  }

  /**
   * Parse a semver string like '1.0.0' or '2.1.3-rc1'.
   * @param {string} versionStr
   * @returns {CalibrationVersion}
   */
  static parse(versionStr) {
    if (typeof versionStr !== 'string' || !versionStr.trim()) {
      throw new TypeError('CalibrationVersion.parse: versionStr must be a non-empty string.');
    }
    const match = versionStr.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) {
      throw new Error(`CalibrationVersion.parse: invalid semver string "${versionStr}".`);
    }
    return new CalibrationVersion(
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10),
      match[4] || null,
    );
  }

  /**
   * Shallow-compatible check: major versions must match.
   * @param {CalibrationVersion} a
   * @param {CalibrationVersion} b
   * @returns {boolean}
   */
  static isCompatible(a, b) {
    if (!(a instanceof CalibrationVersion) || !(b instanceof CalibrationVersion)) return false;
    return a.major === b.major;
  }
}
