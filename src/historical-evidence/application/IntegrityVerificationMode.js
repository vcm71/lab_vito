import { deepFreeze } from '../domain/immutable.js';
import { InvalidIntegrityVerificationOptionsError } from '../domain/errors.js';

export const INTEGRITY_VERIFICATION_MODE = deepFreeze({
  SCIENTIFIC: 'SCIENTIFIC',
  OPERATIONAL: 'OPERATIONAL',
  FULL: 'FULL',
});

export function normalizeIntegrityVerificationMode(value) {
  if (typeof value !== 'string') {
    throw new InvalidIntegrityVerificationOptionsError(
      `mode must be one of: ${Object.values(INTEGRITY_VERIFICATION_MODE).join(', ')}`,
    );
  }
  const mode = value.toUpperCase();
  if (!Object.values(INTEGRITY_VERIFICATION_MODE).includes(mode)) {
    throw new InvalidIntegrityVerificationOptionsError(
      `mode must be one of: ${Object.values(INTEGRITY_VERIFICATION_MODE).join(', ')}`,
    );
  }
  return mode;
}
