export const TOMADOR_COLORS = Object.freeze({
  gold: '#d4af37',
  goldHot: '#fbbf24',
  purple: '#a855f7',
  blue: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
  darkPanel: '#121418',
  slate: '#475569',
  muted: '#94a3b8',
  red: '#dc2626',
  green: '#16a34a',
  wheelDark: '#1e293b',
});

export const TOMADOR_SURFACE_COLORS = Object.freeze({
  clothBorder: TOMADOR_COLORS.blue,
  clothBackground: 'rgba(59, 130, 246, 0.03)',
  zeroesBorder: TOMADOR_COLORS.blue,
  zeroesBackground: 'rgba(59, 130, 246, 0.03)',
  wheelStroke: TOMADOR_COLORS.darkPanel,
  wheelCross: TOMADOR_COLORS.blue,
  wheelCenterFill: TOMADOR_COLORS.darkPanel,
  wheelCenterStroke: TOMADOR_COLORS.slate,
  wheelText: TOMADOR_COLORS.white,
  wheelHint: TOMADOR_COLORS.muted,
});

export function getTomadorClothSurfaceStyle() {
  return {
    background: [
      'radial-gradient(circle at 15% 18%, rgba(255,255,255,0.04), transparent 20%)',
      'radial-gradient(circle at 85% 12%, rgba(212,175,55,0.08), transparent 18%)',
      'radial-gradient(circle at 20% 82%, rgba(59,130,246,0.10), transparent 22%)',
      'repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 7px)',
      'linear-gradient(180deg, rgba(8, 15, 25, 0.96), rgba(15, 23, 42, 0.98))',
    ].join(', '),
    border: `1px solid rgba(59, 130, 246, 0.28)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.35)',
    borderRadius: '16px',
    padding: '12px 12px 14px',
    position: 'relative',
    overflow: 'hidden',
  };
}

export function getTomadorClothSurfaceStyleScaled(scale = 1) {
  const padX = Math.max(4, Math.round(12 * scale));
  const padY = Math.max(4, Math.round(14 * scale));
  const radius = Math.max(6, Math.round(16 * scale));

  return {
    ...getTomadorClothSurfaceStyle(),
    padding: `${padX}px ${padX}px ${padY}px`,
    borderRadius: `${radius}px`,
  };
}

export const COLUMN_ARROW_COLORS = Object.freeze([
  TOMADOR_COLORS.gold,
  TOMADOR_COLORS.purple,
  TOMADOR_COLORS.blue,
]);

export function getColumnArrowStyle({ delay, maxDelay, mostDelayed }) {
  if (delay === 0) {
    return {
      color: TOMADOR_COLORS.gold,
      textShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
    };
  }

  if (mostDelayed && maxDelay > 0) {
    return {
      color: TOMADOR_COLORS.purple,
      textShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
    };
  }

  return {
    color: TOMADOR_COLORS.white,
    textShadow: 'none',
  };
}

export function getDozenBlockStyle({ delay, maxDelay, mostDelayed }) {
  if (delay === 0) {
    return {
      borderColor: TOMADOR_COLORS.gold,
      boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)',
      arrowColor: TOMADOR_COLORS.gold,
    };
  }

  if (mostDelayed && maxDelay > 0) {
    return {
      borderColor: TOMADOR_COLORS.purple,
      boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
      arrowColor: TOMADOR_COLORS.purple,
    };
  }

  return {
    borderColor: TOMADOR_COLORS.blue,
    boxShadow: 'none',
    arrowColor: TOMADOR_COLORS.white,
  };
}

export function getNumberHighlightStyle({
  isColPurple,
  isDozPurple,
  isNumPurple,
  isColYellow,
  isDozYellow,
  isNumHot,
}) {
  if (isColPurple && isDozPurple) {
    if (isNumPurple) {
      return {
        backgroundColor: '#7c3aed',
        color: 'white',
        border: '3px solid #fff',
        boxShadow: '0 0 30px rgba(124, 58, 237, 1), inset 0 0 10px rgba(255,255,255,0.5)',
        zIndex: '10',
      };
    }

    return {
      backgroundColor: TOMADOR_COLORS.purple,
      color: 'white',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 0 20px rgba(168, 85, 247, 0.9)',
    };
  }

  if (isColYellow && isDozYellow) {
    return {
      backgroundColor: isNumHot ? TOMADOR_COLORS.goldHot : TOMADOR_COLORS.gold,
      color: 'black',
      border: '2px solid rgba(0, 0, 0, 0.2)',
      boxShadow: isNumHot
        ? '0 0 30px rgba(251, 191, 36, 1), inset 0 0 10px rgba(255,255,255,0.8)'
        : '0 0 20px rgba(212, 175, 55, 0.9)',
    };
  }

  return null;
}
