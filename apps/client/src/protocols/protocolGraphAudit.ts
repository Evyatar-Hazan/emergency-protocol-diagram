import type { Node, Protocol } from '../types/protocol';

export type ProtocolEdgeKind = 'next' | 'condition' | 'option' | 'action';

export interface ProtocolEdge {
  source: string;
  target: string;
  kind: ProtocolEdgeKind;
}

export interface UnreachableComponent {
  root: string;
  nodeIds: string[];
}

export interface ProtocolGraphAudit {
  nodeCount: number;
  declaredEdgeCount: number;
  navigationEdgeCount: number;
  startNodeExists: boolean;
  nodeIdMismatches: string[];
  danglingEdges: ProtocolEdge[];
  reachableNodeIds: string[];
  unreachableNodeIds: string[];
  unreachableComponents: UnreachableComponent[];
  intentionalReferenceNodeIds: string[];
  unresolvedUnreachableNodeIds: string[];
}

const byNodeId = (left: string, right: string) => left.localeCompare(right);

const toNextTargets = (node: Node): string[] => {
  if (!node.next) return [];
  return Array.isArray(node.next) ? node.next : [node.next];
};

const toEdges = (source: string, targets: string[], kind: ProtocolEdgeKind): ProtocolEdge[] =>
  targets.map((target) => ({ source, target, kind }));

/**
 * Returns every edge declared in protocol JSON. This preserves the historical
 * graph metric, even when a node declares more than one navigation mechanism.
 */
export const getDeclaredProtocolEdges = (protocol: Protocol): ProtocolEdge[] =>
  Object.entries(protocol.nodes).flatMap(([source, node]) => [
    ...toEdges(source, toNextTargets(node), 'next'),
    ...toEdges(source, (node.conditions ?? []).map(({ target }) => target), 'condition'),
    ...toEdges(source, (node.options ?? []).map(({ target }) => target), 'option'),
    ...toEdges(source, (node.content?.actions ?? []).map(({ target }) => target), 'action'),
  ]);

/**
 * Mirrors StepByStepView navigation precedence: actions, conditions, options,
 * then the first `next` target. Reachability must reflect what a learner can
 * actually select in the primary step-by-step experience.
 */
export const getNavigationProtocolEdges = (protocol: Protocol): ProtocolEdge[] =>
  Object.entries(protocol.nodes).flatMap(([source, node]) => {
    const actions = node.content?.actions ?? [];
    if (actions.length > 0) {
      return toEdges(source, actions.map(({ target }) => target), 'action');
    }

    const conditions = node.conditions ?? [];
    if (conditions.length > 0) {
      return toEdges(source, conditions.map(({ target }) => target), 'condition');
    }

    const options = node.options ?? [];
    if (options.length > 0) {
      return toEdges(source, options.map(({ target }) => target), 'option');
    }

    const nextTargets = toNextTargets(node);
    return nextTargets.length > 0 ? toEdges(source, [nextTargets[0]], 'next') : [];
  });

const collectReachableNodeIds = (
  protocol: Protocol,
  edges: ProtocolEdge[],
  startNodeExists: boolean,
): Set<string> => {
  if (!startNodeExists) return new Set();

  const outgoing = new Map<string, string[]>();
  for (const { source, target } of edges) {
    if (!protocol.nodes[target]) continue;
    outgoing.set(source, [...(outgoing.get(source) ?? []), target]);
  }

  const reachable = new Set<string>();
  const pending = [protocol.startNode];

  while (pending.length > 0) {
    const nodeId = pending.pop()!;
    if (reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    pending.push(...(outgoing.get(nodeId) ?? []));
  }

  return reachable;
};

const collectUnreachableComponents = (
  unreachableNodeIds: string[],
  edges: ProtocolEdge[],
): UnreachableComponent[] => {
  const unreachable = new Set(unreachableNodeIds);
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const { source, target } of edges) {
    if (!unreachable.has(source) || !unreachable.has(target)) continue;
    outgoing.set(source, [...(outgoing.get(source) ?? []), target]);
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
  }

  const roots = unreachableNodeIds.filter((nodeId) => (incoming.get(nodeId) ?? 0) === 0);
  const assigned = new Set<string>();

  const collectFromRoot = (root: string): string[] => {
    const component = new Set<string>();
    const pending = [root];

    while (pending.length > 0) {
      const nodeId = pending.pop()!;
      if (component.has(nodeId) || assigned.has(nodeId)) continue;
      component.add(nodeId);
      pending.push(...(outgoing.get(nodeId) ?? []));
    }

    for (const nodeId of component) assigned.add(nodeId);
    return [...component].sort(byNodeId);
  };

  const components = roots
    .sort(byNodeId)
    .map((root) => ({ root, nodeIds: collectFromRoot(root) }));

  for (const nodeId of unreachableNodeIds) {
    if (!assigned.has(nodeId)) {
      components.push({ root: nodeId, nodeIds: collectFromRoot(nodeId) });
    }
  }

  return components;
};

export const auditProtocolGraph = (
  protocol: Protocol,
  intentionalReferenceNodeIds: readonly string[] = [],
): ProtocolGraphAudit => {
  const nodeIds = Object.keys(protocol.nodes).sort(byNodeId);
  const declaredEdges = getDeclaredProtocolEdges(protocol);
  const navigationEdges = getNavigationProtocolEdges(protocol);
  const startNodeExists = Boolean(protocol.nodes[protocol.startNode]);
  const reachable = collectReachableNodeIds(protocol, navigationEdges, startNodeExists);
  const unreachableNodeIds = nodeIds.filter((nodeId) => !reachable.has(nodeId));
  const approvedReferences = new Set(intentionalReferenceNodeIds);
  const classifiedReferenceNodeIds = unreachableNodeIds.filter((nodeId) => approvedReferences.has(nodeId));

  return {
    nodeCount: nodeIds.length,
    declaredEdgeCount: declaredEdges.length,
    navigationEdgeCount: navigationEdges.length,
    startNodeExists,
    nodeIdMismatches: nodeIds.filter((nodeId) => protocol.nodes[nodeId].id !== nodeId),
    danglingEdges: declaredEdges.filter(({ target }) => !protocol.nodes[target]),
    reachableNodeIds: nodeIds.filter((nodeId) => reachable.has(nodeId)),
    unreachableNodeIds,
    unreachableComponents: collectUnreachableComponents(unreachableNodeIds, navigationEdges),
    intentionalReferenceNodeIds: classifiedReferenceNodeIds,
    unresolvedUnreachableNodeIds: unreachableNodeIds.filter((nodeId) => !approvedReferences.has(nodeId)),
  };
};
