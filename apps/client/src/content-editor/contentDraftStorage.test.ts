import { describe, expect, it } from 'vitest';
import unifiedFlow from '../protocols/unified-flow.json';
import type { Protocol } from '../types/protocol';
import {
  contentDraftStorageKey,
  loadContentDrafts,
  saveContentDrafts,
  upsertContentDraft,
} from './contentDraftStorage';
import { createContentDraft } from './contentWorkflow';

const protocol = unifiedFlow as Protocol;

describe('content draft storage', () => {
  it('round-trips local draft history without a server or live user data', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const draft = createContentDraft(protocol, 'report_departure', new Date('2026-10-02T12:00:00.000Z'));

    saveContentDrafts([draft], storage);

    expect(values.has(contentDraftStorageKey)).toBe(true);
    expect(loadContentDrafts(storage)).toEqual([draft]);
  });

  it('ignores malformed persisted data and updates a draft in place', () => {
    const brokenStorage = { getItem: () => '{broken' };
    expect(loadContentDrafts(brokenStorage)).toEqual([]);

    const draft = createContentDraft(protocol, 'report_departure', new Date('2026-10-02T12:00:00.000Z'));
    expect(upsertContentDraft([], draft)).toEqual([draft]);
    expect(upsertContentDraft([draft], { ...draft, nodeId: 'safety' })).toEqual([
      expect.objectContaining({ draftId: draft.draftId, nodeId: 'safety' }),
    ]);
  });
});
