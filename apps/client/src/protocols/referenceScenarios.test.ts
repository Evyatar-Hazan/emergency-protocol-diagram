import { describe, expect, it } from 'vitest';
import type { Protocol } from '../types/protocol';
import { protocolsData } from './index';
import { referenceScenarios } from './referenceScenarios';
import { runReferenceScenario } from './referenceScenarioRunner';

describe('17 reference scenarios — technical navigation only', () => {
  it('keeps the executable manifest complete, ordered, and pending clinical review', () => {
    expect(referenceScenarios.map(({ id }) => id)).toEqual(Array.from({ length: 17 }, (_, index) => index + 1));
    expect(referenceScenarios.every(({ clinicalReviewStatus }) => clinicalReviewStatus === 'pending')).toBe(true);
  });

  it.each(referenceScenarios)('$id — $title', (scenario) => {
    const result = runReferenceScenario(protocolsData, scenario);

    expect(result).toMatchObject({
      scenarioId: scenario.id,
      technicalStatus: 'passed',
      clinicalReviewStatus: 'pending',
      backNavigationChecked: true,
    });
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.segments.every(({ path }) => path.length >= 1)).toBe(true);
  });
});

describe('reference scenario engine contracts', () => {
  it('follows an executable cross-protocol target and preserves back history', () => {
    const source: Protocol = {
      id: 'source', name: 'Source', description: 'Source', version: '1', startNode: 'start',
      nodes: {
        start: { id: 'start', type: 'start', title: 'Start', next: 'target:finish' },
      },
    };
    const target: Protocol = {
      id: 'target', name: 'Target', description: 'Target', version: '1', startNode: 'finish',
      nodes: { finish: { id: 'finish', type: 'end', title: 'Finish' } },
    };

    const result = runReferenceScenario(
      { version: '1', language: 'he', protocols: { source, target } },
      {
        id: 999,
        title: 'Cross protocol fixture',
        checkpoints: ['source:start', 'target:finish'],
        clinicalReviewStatus: 'pending',
      },
    );

    expect(result.segments[0].path).toEqual(['source:start', 'target:finish']);
    expect(result.backNavigationChecked).toBe(true);
  });

  it('emits a useful failure artifact when a required route is absent', () => {
    const protocol: Protocol = {
      id: 'broken', name: 'Broken', description: 'Broken', version: '1', startNode: 'start',
      nodes: {
        start: { id: 'start', type: 'start', title: 'Start' },
        isolated: { id: 'isolated', type: 'end', title: 'Isolated' },
      },
    };

    expect(() => runReferenceScenario(
      { version: '1', language: 'he', protocols: { broken: protocol } },
      {
        id: 998,
        title: 'Broken fixture',
        checkpoints: ['broken:start', 'broken:isolated'],
        clinicalReviewStatus: 'pending',
      },
    )).toThrow('No learner-visible navigation path from broken:start to broken:isolated');
  });
});
