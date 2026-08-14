import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowData, Protocol } from '../types/protocol';
import { useFlowStore } from './flowStore';

const primaryProtocol: Protocol = {
  id: 'primary',
  name: 'Primary',
  description: 'Primary protocol',
  version: '1.0.0',
  startNode: 'start',
  nodes: {
    start: { id: 'start', type: 'start', title: 'Start' },
    next: { id: 'next', type: 'action', title: 'Next' },
  },
};

const secondaryProtocol: Protocol = {
  id: 'secondary',
  name: 'Secondary',
  description: 'Secondary protocol',
  version: '1.0.0',
  startNode: 'entry',
  nodes: {
    entry: { id: 'entry', type: 'start', title: 'Entry' },
  },
};

const flowData: FlowData = {
  version: '1.0.0',
  language: 'he',
  protocols: { primary: primaryProtocol, secondary: secondaryProtocol },
};

describe('flowStore navigation', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { scrollTo: vi.fn() });
    useFlowStore.getState().reset();
    useFlowStore.getState().loadData(flowData);
  });

  it('starts an active protocol at its declared start node', () => {
    useFlowStore.getState().setActiveProtocol('primary');

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocolId: 'primary',
      currentNodeId: 'start',
      navigationHistory: ['primary:start'],
    });
  });

  it('navigates forward and returns to the previous node', () => {
    useFlowStore.getState().setActiveProtocol('primary');
    useFlowStore.getState().navigateToNode('next');

    expect(useFlowStore.getState().currentNodeId).toBe('next');
    expect(useFlowStore.getState().navigationHistory).toEqual(['primary:start', 'primary:next']);

    useFlowStore.getState().goBack();

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocolId: 'primary',
      currentNodeId: 'start',
      navigationHistory: ['primary:start'],
    });
  });

  it('restores the previous protocol after cross-protocol navigation', () => {
    useFlowStore.getState().setActiveProtocol('primary');
    useFlowStore.getState().navigateToNode('secondary:entry');

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocolId: 'secondary',
      currentNodeId: 'entry',
    });

    useFlowStore.getState().goBack();

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocolId: 'primary',
      currentNodeId: 'start',
      currentNode: primaryProtocol.nodes.start,
    });
  });

  it('keeps the current state when a target node does not exist', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    useFlowStore.getState().setActiveProtocol('primary');
    useFlowStore.getState().navigateToNode('missing');

    expect(useFlowStore.getState().currentNodeId).toBe('start');
    expect(useFlowStore.getState().navigationHistory).toEqual(['primary:start']);
    errorSpy.mockRestore();
  });

  it('rejects unknown protocols and cross-protocol targets', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    useFlowStore.getState().setActiveProtocol('missing');
    expect(useFlowStore.getState().activeProtocolId).toBeNull();

    useFlowStore.getState().setActiveProtocol('primary');
    useFlowStore.getState().navigateToNode('missing:entry');
    useFlowStore.getState().navigateToNode('secondary:missing');

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocolId: 'primary',
      currentNodeId: 'start',
      navigationHistory: ['primary:start'],
    });
    errorSpy.mockRestore();
  });

  it('clears the active navigation state', () => {
    useFlowStore.getState().setActiveProtocol('primary');
    useFlowStore.getState().setActiveProtocol(null);

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocol: null,
      activeProtocolId: null,
      currentNode: null,
      currentNodeId: null,
      navigationHistory: [],
    });
  });

  it('does not corrupt state when a history target is no longer available', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    useFlowStore.getState().setActiveProtocol('primary');
    useFlowStore.getState().navigateToNode('next');
    useFlowStore.getState().loadData({ ...flowData, protocols: {} });
    useFlowStore.getState().goBack();

    expect(useFlowStore.getState()).toMatchObject({
      activeProtocolId: 'primary',
      currentNodeId: 'next',
      navigationHistory: ['primary:start', 'primary:next'],
    });
    errorSpy.mockRestore();
  });
});
