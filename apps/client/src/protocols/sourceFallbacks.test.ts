import { describe, expect, it } from 'vitest';
import type { Protocol } from '../types/protocol';
import { applySourceFallbacks } from './sourceFallbacks';

const createProtocol = (): Protocol => ({
  id: 'test',
  name: 'Test',
  description: 'Test protocol',
  version: '1.0.0',
  startNode: 'report_arrival',
  nodes: {
    report_arrival: { id: 'report_arrival', type: 'start', title: 'Arrival' },
    safety: {
      id: 'safety',
      type: 'check',
      title: 'Safety',
      content: { sources: [{ label: 'Existing', url: 'https://example.com' }] },
    },
  },
});

describe('applySourceFallbacks', () => {
  it('adds missing sources without mutating the input protocol', () => {
    const protocol = createProtocol();
    const result = applySourceFallbacks(protocol);

    expect(result.nodes.report_arrival.content?.sources).toHaveLength(1);
    expect(protocol.nodes.report_arrival.content).toBeUndefined();
  });

  it('preserves sources already declared by the protocol', () => {
    const result = applySourceFallbacks(createProtocol());

    expect(result.nodes.safety.content?.sources).toEqual([
      { label: 'Existing', url: 'https://example.com' },
    ]);
  });
});
