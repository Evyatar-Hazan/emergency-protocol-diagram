import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const relativeLuminance = (hex) => {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  return channels.reduce((sum, value, index) => {
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
};

const contrastRatio = (foreground, background) => {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
};

describe('accessibility regressions', () => {
  it('keeps comment metadata and actions above the WCAG AA text contrast threshold', () => {
    const source = readSource('./comments/CommentItem.tsx');

    expect(contrastRatio('475569', 'ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(source).toContain('className="text-xs text-slate-600">{authorHandle}</span>');
    expect(source).toContain('className="text-xs text-slate-600">{formatRelativeTime(createdAt)}</span>');
    expect(source).toContain('gap-2 text-xs text-slate-600');
    expect(source).toContain('p-2 text-slate-600 transition');
    expect(source).toContain('text-xs text-slate-500" aria-hidden="true">·</span>');
  });

  it('keeps the complete mobile action row within the measured 355px content width', () => {
    const source = readSource('./StepByStep/StepByStepView.tsx');
    const minimumButtonWidths = [76, 76, 76, 92];
    const threeGapsAtFourPixels = 3 * 4;
    const horizontalPadding = 4;
    const requiredWidth = minimumButtonWidths.reduce((sum, width) => sum + width, 0)
      + threeGapsAtFourPixels
      + horizontalPadding;

    expect(requiredWidth).toBeLessThanOrEqual(355);
    expect(source.match(/min-w-\[76px\]/g)).toHaveLength(3);
    expect(source.match(/min-w-\[92px\]/g)).toHaveLength(1);
    expect(source).toContain('flex min-w-max items-center gap-1 px-0.5');
  });
});
