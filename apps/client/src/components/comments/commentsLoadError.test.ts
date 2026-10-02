import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CommentsLoadError } from './CommentsThread';

describe('CommentsLoadError', () => {
  it('renders a visible alert and retry control for comment load failures', () => {
    const markup = renderToStaticMarkup(
      createElement(CommentsLoadError, { onRetry: vi.fn() })
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('לא הצלחנו לטעון את התגובות כרגע');
    expect(markup).toContain('נסה שוב');
  });
});
