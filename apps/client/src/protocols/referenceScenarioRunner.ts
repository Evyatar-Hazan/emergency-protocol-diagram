import type { FlowData, Node, Protocol } from '../types/protocol';
import type { NodeReference, ReferenceScenario } from './referenceScenarios';

export interface ScenarioSegmentTrace {
  from: NodeReference;
  to: NodeReference;
  path: NodeReference[];
}

export interface ReferenceScenarioResult {
  scenarioId: number;
  title: string;
  technicalStatus: 'passed';
  clinicalReviewStatus: 'pending';
  segments: ScenarioSegmentTrace[];
  branchAssertions: number;
  backNavigationChecked: boolean;
}

const navigationTargets = (node: Node): string[] => {
  const actions = node.content?.actions ?? [];
  if (actions.length > 0) return actions.map(({ target }) => target);

  const conditions = node.conditions ?? [];
  if (conditions.length > 0) return conditions.map(({ target }) => target);

  const options = node.options ?? [];
  if (options.length > 0) return options.map(({ target }) => target);

  if (!node.next) return [];
  return [Array.isArray(node.next) ? node.next[0] : node.next];
};

const asReference = (protocolId: string, target: string): NodeReference =>
  (target.includes(':') ? target : `${protocolId}:${target}`) as NodeReference;

const getProtocolAndNode = (
  flowData: FlowData,
  reference: NodeReference,
): { protocol: Protocol; node: Node } => {
  const separator = reference.indexOf(':');
  const protocolId = reference.slice(0, separator);
  const nodeId = reference.slice(separator + 1);
  const protocol = flowData.protocols[protocolId];
  const node = protocol?.nodes[nodeId];

  if (!protocol || !node) {
    throw new Error(`Unknown reference node: ${reference}`);
  }

  return { protocol, node };
};

export const getReferenceNavigationTargets = (
  flowData: FlowData,
  reference: NodeReference,
): NodeReference[] => {
  const separator = reference.indexOf(':');
  const protocolId = reference.slice(0, separator);
  const { node } = getProtocolAndNode(flowData, reference);
  return navigationTargets(node).map((target) => asReference(protocolId, target));
};

export const findReferencePath = (
  flowData: FlowData,
  from: NodeReference,
  to: NodeReference,
): NodeReference[] => {
  getProtocolAndNode(flowData, from);
  getProtocolAndNode(flowData, to);
  if (from === to) return [from];

  const pending: NodeReference[][] = [[from]];
  const visited = new Set<NodeReference>([from]);

  while (pending.length > 0) {
    const path = pending.shift()!;
    const current = path[path.length - 1];

    for (const target of getReferenceNavigationTargets(flowData, current)) {
      if (visited.has(target)) continue;
      const nextPath = [...path, target];
      if (target === to) return nextPath;
      visited.add(target);
      pending.push(nextPath);
    }
  }

  throw new Error(`No learner-visible navigation path from ${from} to ${to}`);
};

export const runReferenceScenario = (
  flowData: FlowData,
  scenario: ReferenceScenario,
): ReferenceScenarioResult => {
  if (scenario.checkpoints.length === 0) {
    throw new Error(`Scenario ${scenario.id} has no checkpoints`);
  }

  const firstReference = scenario.checkpoints[0];
  const firstProtocolId = firstReference.slice(0, firstReference.indexOf(':'));
  const firstProtocol = flowData.protocols[firstProtocolId];
  if (!firstProtocol) throw new Error(`Unknown scenario protocol: ${firstProtocolId}`);

  const start = asReference(firstProtocolId, firstProtocol.startNode);
  const waypoints = scenario.checkpoints[0] === start
    ? scenario.checkpoints
    : [start, ...scenario.checkpoints];

  const segments: ScenarioSegmentTrace[] = [];
  const history: NodeReference[] = [start];

  for (let index = 1; index < waypoints.length; index += 1) {
    const from = waypoints[index - 1];
    const to = waypoints[index];
    const path = findReferencePath(flowData, from, to);
    segments.push({ from, to, path });
    history.push(...path.slice(1));
  }

  let branchAssertions = 0;
  for (const branch of scenario.branches ?? []) {
    // A declared branch is only useful if a learner can first reach its source
    // from the canonical start node.
    findReferencePath(flowData, start, branch.from);
    const actualTargets = getReferenceNavigationTargets(flowData, branch.from);
    for (const target of branch.targets) {
      if (!actualTargets.includes(target)) {
        throw new Error(
          `Scenario ${scenario.id} branch ${branch.from} does not expose ${target}; `
          + `actual targets: ${actualTargets.join(', ')}`,
        );
      }
      branchAssertions += 1;
    }
  }

  if (history.length < 2) {
    throw new Error(`Scenario ${scenario.id} cannot exercise back navigation`);
  }
  const current = history.pop();
  const previous = history[history.length - 1];
  if (!current || !previous || current === previous) {
    throw new Error(`Scenario ${scenario.id} produced an invalid back-navigation history`);
  }

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    technicalStatus: 'passed',
    clinicalReviewStatus: scenario.clinicalReviewStatus,
    segments,
    branchAssertions,
    backNavigationChecked: true,
  };
};
