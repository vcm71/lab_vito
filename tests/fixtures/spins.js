import { createSpin } from '../builders/index.js';

export const emptySession = [];

export const singleSpin = [createSpin({ id: 1, number: '17' })];

export const tenSpins = buildSpinSequence(['00', '0', '1', '2', '3', '4', '5', '6', '7', '8']);

export const hundredSpins = buildSpinSequence(
  Array.from({ length: 100 }, (_, index) => String(index % 37 === 0 ? '00' : index % 37)),
  { baseId: 1, startedAt: '2026-01-01T00:00:00.000Z' },
);

export const thousandSpins = buildSpinSequence(
  Array.from({ length: 1000 }, (_, index) => {
    const value = index % 37;
    return value === 0 ? '00' : String(value);
  }),
  { baseId: 1, startedAt: '2026-01-01T00:00:00.000Z' },
);

export const randomSession = buildDeterministicSession(42, 25);

export const invalidSession = [
  { id: null, number: 'x' },
  { id: 2, number: undefined },
  { number: '37' },
];

export const customSeries = buildSpinSequence(['1', '13', '25', '2', '14', '26', '3', '15', '27']);

export function buildSpinSequence(numbers, options = {}) {
  const baseId = options.baseId ?? 1;
  const startedAt = options.startedAt ?? '2026-01-01T00:00:00.000Z';
  const startMs = new Date(startedAt).getTime();

  return numbers.map((number, index) => createSpin({
    id: baseId + index,
    number,
    timestamp: new Date(startMs + (index * 1000)).toISOString(),
  }));
}

export function buildDeterministicSession(seed, length) {
  const numbers = [];
  let state = seed >>> 0;

  for (let index = 0; index < length; index += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const value = state % 37;
    numbers.push(value === 0 ? '00' : String(value));
  }

  return buildSpinSequence(numbers, {
    baseId: 1,
    startedAt: '2026-01-02T00:00:00.000Z',
  });
}
