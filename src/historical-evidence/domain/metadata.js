/**
 * Mutation-safe metadata validator and normalizer.
 *
 * Ensures metadata passed into evidence records is JSON-safe, plain,
 * and deeply freezeable.
 */

import { deepFreeze } from './immutable.js';

/**
 * Normalise metadata to a deep-frozen plain object, or null.
 *
 * @param {*} metadata — raw metadata from caller
 * @returns {object|null} deep-frozen plain object or null
 * @throws {InvalidMetadataError} if unsafe types detected
 */
export function normaliseMetadata(metadata) {
  if (metadata === undefined || metadata === null) return null;

  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new TypeError('Metadata must be a plain object or null.');
  }

  const proto = Object.getPrototypeOf(metadata);
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError('Metadata must be a plain object.');
  }

  return deepFreeze({ ...metadata });
}
