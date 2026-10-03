import { describe, expect, it } from 'vitest';
import type { Protocol } from '../types/protocol';
import unifiedFlow from './unified-flow.json';
import {
  ADVANCED_REFERENCE_SCOPE,
  advancedReferenceCatalog,
  advancedReferenceNodeIds,
  isAdvancedReferenceNode,
} from './advancedReferences';
import { auditProtocolGraph, getNavigationProtocolEdges } from './protocolGraphAudit';

const protocol = unifiedFlow as Protocol;
const approvedLocalNodeIds = advancedReferenceNodeIds.map((nodeId) => nodeId.split(':')[1]);

describe('advanced reference boundary', () => {
  it('classifies the seven approved advanced topics and no unresolved topic', () => {
    expect(advancedReferenceNodeIds).toEqual([
      'unified_flow:cardiovascular_problem',
      'unified_flow:mi_stemi',
      'unified_flow:arrhythmia_vt',
      'unified_flow:arrhythmia_svt',
      'unified_flow:arrhythmia_afib',
      'unified_flow:arrhythmia_bradycardia',
      'unified_flow:aortic_dissection',
    ]);
    expect(isAdvancedReferenceNode('unified_flow', 'hypertensive_emergency')).toBe(false);
    expect(isAdvancedReferenceNode('unified_flow', 'pulse_check')).toBe(false);
  });

  it('points every catalog entry at a real, unreachable node', () => {
    const audit = auditProtocolGraph(protocol, approvedLocalNodeIds);

    for (const entry of advancedReferenceCatalog) {
      const [, nodeId] = entry.nodeId.split(':');
      expect(protocol.nodes[nodeId]).toBeDefined();
      expect(audit.unreachableNodeIds).toContain(nodeId);
    }
    expect(audit.intentionalReferenceNodeIds).toEqual([...approvedLocalNodeIds].sort());
  });

  it('has no effective navigation edge from the main action graph into advanced reference', () => {
    const audit = auditProtocolGraph(protocol);
    const reachable = new Set(audit.reachableNodeIds);
    const approved = new Set(approvedLocalNodeIds);
    const incomingFromMainFlow = getNavigationProtocolEdges(protocol).filter(
      ({ source, target }) => reachable.has(source) && approved.has(target),
    );

    expect(incomingFromMainFlow).toEqual([]);
  });

  it('carries an explicit non-action, non-authorization scope guard', () => {
    expect(ADVANCED_REFERENCE_SCOPE.description).toContain('אינו מסלול פעולה');
    expect(ADVANCED_REFERENCE_SCOPE.description).toContain('אינו כלי לאבחון או לטיפול');
    expect(ADVANCED_REFERENCE_SCOPE.description).toContain('אינו מעניק סמכות קלינית');
  });
});
