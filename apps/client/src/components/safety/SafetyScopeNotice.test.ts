import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SAFETY_SCOPE_COPY, SafetyScopeNotice } from './SafetyScopeNotice';

describe('SafetyScopeNotice', () => {
  it('labels the copy as review-required and states the learning-only boundary', () => {
    const markup = renderToStaticMarkup(
      createElement(SafetyScopeNotice, { id: 'test-scope' })
    );

    expect(markup).toContain('data-review-status="review-required"');
    expect(markup).toContain('aria-labelledby="test-scope-title"');
    expect(markup).toContain(SAFETY_SCOPE_COPY.reviewLabel);
    expect(markup).toContain(SAFETY_SCOPE_COPY.title);
    expect(markup).toContain(SAFETY_SCOPE_COPY.summary);
    expect(markup).toContain(SAFETY_SCOPE_COPY.operatingBoundary);
    expect(markup).toContain(SAFETY_SCOPE_COPY.approvalBoundary);
  });

  it('keeps the review status visible in the compact entry-point variant', () => {
    const markup = renderToStaticMarkup(
      createElement(SafetyScopeNotice, { compact: true, id: 'loading-scope' })
    );

    expect(markup).toContain('data-review-status="review-required"');
    expect(markup).toContain(SAFETY_SCOPE_COPY.reviewLabel);
    expect(markup).toContain(SAFETY_SCOPE_COPY.approvalBoundary);
    expect(markup).not.toContain('<details');
  });
});
