import { describe, expect, it } from 'vitest';
import type { Protocol } from '../types/protocol';
import unifiedFlow from './unified-flow.json';
import {
  auditProtocolGraph,
  getDeclaredProtocolEdges,
  getNavigationProtocolEdges,
} from './protocolGraphAudit';
import { advancedReferenceNodeIds } from './advancedReferences';

const documentedUnreachableNodeIds = [
  'airway_check_cpr',
  'aortic_dissection',
  'arrhythmia_afib',
  'arrhythmia_bradycardia',
  'arrhythmia_svt',
  'arrhythmia_vt',
  'cardiovascular_problem',
  'hypertensive_emergency',
  'mi_stemi',
  'pneumothorax',
  'pulse_check',
  'ventilations',
];

const approvedAdvancedReferenceNodeIds = advancedReferenceNodeIds.map((nodeId) => nodeId.split(':')[1]);

describe('protocol graph audit', () => {
  it('reproduces the documented unified-flow node, edge, and reachability audit', () => {
    const audit = auditProtocolGraph(unifiedFlow as Protocol);

    expect(audit).toMatchObject({
      nodeCount: 205,
      declaredEdgeCount: 358,
      navigationEdgeCount: 357,
      startNodeExists: true,
      nodeIdMismatches: [],
      danglingEdges: [],
    });
    expect(audit.reachableNodeIds).toHaveLength(193);
    expect(audit.unreachableNodeIds).toEqual(documentedUnreachableNodeIds);
  });

  it('keeps the four disconnected components visible for an authorized content decision', () => {
    const audit = auditProtocolGraph(unifiedFlow as Protocol);

    expect(audit.unreachableComponents).toEqual([
      {
        root: 'airway_check_cpr',
        nodeIds: ['airway_check_cpr', 'ventilations'],
      },
      {
        root: 'cardiovascular_problem',
        nodeIds: [
          'aortic_dissection',
          'arrhythmia_afib',
          'arrhythmia_bradycardia',
          'arrhythmia_svt',
          'arrhythmia_vt',
          'cardiovascular_problem',
          'hypertensive_emergency',
          'mi_stemi',
        ],
      },
      { root: 'pneumothorax', nodeIds: ['pneumothorax'] },
      { root: 'pulse_check', nodeIds: ['pulse_check'] },
    ]);
  });

  it('separates approved advanced reference from the five still-unresolved nodes', () => {
    const unresolvedAudit = auditProtocolGraph(unifiedFlow as Protocol);
    expect(unresolvedAudit.intentionalReferenceNodeIds).toEqual([]);
    expect(unresolvedAudit.unresolvedUnreachableNodeIds).toEqual(documentedUnreachableNodeIds);

    const approvedReferenceAudit = auditProtocolGraph(
      unifiedFlow as Protocol,
      approvedAdvancedReferenceNodeIds,
    );
    expect(approvedReferenceAudit.intentionalReferenceNodeIds).toEqual([
      'aortic_dissection',
      'arrhythmia_afib',
      'arrhythmia_bradycardia',
      'arrhythmia_svt',
      'arrhythmia_vt',
      'cardiovascular_problem',
      'mi_stemi',
    ]);
    expect(approvedReferenceAudit.unresolvedUnreachableNodeIds).toEqual([
      'airway_check_cpr',
      'hypertensive_emergency',
      'pneumothorax',
      'pulse_check',
      'ventilations',
    ]);
  });

  it('reports every declared edge while matching the step-by-step navigation precedence', () => {
    const protocol: Protocol = {
      id: 'test',
      name: 'Test',
      description: 'Test protocol',
      version: '1.0.0',
      startNode: 'start',
      nodes: {
        start: {
          id: 'start',
          type: 'start',
          title: 'Start',
          next: ['next-first', 'next-second'],
          conditions: [{ label: 'Condition', target: 'condition' }],
          options: [{ label: 'Option', target: 'option' }],
          content: { actions: [{ label: 'Action', target: 'action' }] },
        },
        'next-first': { id: 'next-first', type: 'end', title: 'Next first' },
        'next-second': { id: 'next-second', type: 'end', title: 'Next second' },
        condition: { id: 'condition', type: 'end', title: 'Condition' },
        option: { id: 'option', type: 'end', title: 'Option' },
        action: { id: 'action', type: 'end', title: 'Action' },
      },
    };

    expect(getDeclaredProtocolEdges(protocol)).toEqual([
      { source: 'start', target: 'next-first', kind: 'next' },
      { source: 'start', target: 'next-second', kind: 'next' },
      { source: 'start', target: 'condition', kind: 'condition' },
      { source: 'start', target: 'option', kind: 'option' },
      { source: 'start', target: 'action', kind: 'action' },
    ]);
    expect(getNavigationProtocolEdges(protocol)).toEqual([
      { source: 'start', target: 'action', kind: 'action' },
    ]);
  });

  it('flags a missing start, mismatched ids, dangling targets, and cyclic unreachable components', () => {
    const protocol: Protocol = {
      id: 'broken',
      name: 'Broken',
      description: 'Broken protocol',
      version: '1.0.0',
      startNode: 'missing-start',
      nodes: {
        a: { id: 'wrong-id', type: 'action', title: 'A', next: 'b' },
        b: { id: 'b', type: 'action', title: 'B', next: 'a' },
        dangling: { id: 'dangling', type: 'action', title: 'Dangling', next: 'missing' },
      },
    };

    const audit = auditProtocolGraph(protocol);

    expect(audit.startNodeExists).toBe(false);
    expect(audit.nodeIdMismatches).toEqual(['a']);
    expect(audit.danglingEdges).toEqual([{ source: 'dangling', target: 'missing', kind: 'next' }]);
    expect(audit.reachableNodeIds).toEqual([]);
    expect(audit.unreachableComponents).toEqual([
      { root: 'dangling', nodeIds: ['dangling'] },
      { root: 'a', nodeIds: ['a', 'b'] },
    ]);
  });

  it('uses conditions, options, and only the first next target when higher-precedence actions are absent', () => {
    const protocol: Protocol = {
      id: 'precedence',
      name: 'Precedence',
      description: 'Navigation precedence',
      version: '1.0.0',
      startNode: 'condition-source',
      nodes: {
        'condition-source': {
          id: 'condition-source', type: 'decision', title: 'Conditions',
          conditions: [{ label: 'Go', target: 'option-source' }],
        },
        'option-source': {
          id: 'option-source', type: 'decision', title: 'Options',
          options: [{ label: 'Go', target: 'next-source' }],
        },
        'next-source': {
          id: 'next-source', type: 'action', title: 'Next', next: ['finish', 'ignored'],
        },
        finish: { id: 'finish', type: 'end', title: 'Finish' },
        ignored: { id: 'ignored', type: 'end', title: 'Ignored' },
      },
    };

    expect(getNavigationProtocolEdges(protocol)).toEqual([
      { source: 'condition-source', target: 'option-source', kind: 'condition' },
      { source: 'option-source', target: 'next-source', kind: 'option' },
      { source: 'next-source', target: 'finish', kind: 'next' },
    ]);
  });
});
