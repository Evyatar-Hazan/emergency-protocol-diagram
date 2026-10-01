import { describe, expect, it, vi } from 'vitest';
import type { GsiButtonConfiguration, IdConfiguration } from '@react-oauth/google';
import {
  createGoogleIdentityManager,
  type GoogleIdentityApi,
  type GoogleLoginAttempt,
} from './googleIdentityManager';

function createHarness() {
  let initializeConfiguration: IdConfiguration | undefined;
  const renderedConfigurations: GsiButtonConfiguration[] = [];
  const api: GoogleIdentityApi = {
    initialize: vi.fn((configuration) => {
      initializeConfiguration = configuration;
    }),
    renderButton: vi.fn((_parent, configuration) => {
      renderedConfigurations.push(configuration);
    }),
  };
  const parent = {
    replaceChildren: vi.fn(),
  } as unknown as HTMLElement;

  return {
    api,
    parent,
    renderedConfigurations,
    getInitializeConfiguration: () => initializeConfiguration,
  };
}

describe('googleIdentityManager', () => {
  it('initializes once across repeated provider mounts', () => {
    const manager = createGoogleIdentityManager();
    const harness = createHarness();
    const firstHandler = vi.fn();
    const latestHandler = vi.fn();

    expect(manager.initialize(harness.api, 'client-id', firstHandler)).toBe(true);
    expect(manager.initialize(harness.api, 'client-id', latestHandler)).toBe(false);
    expect(harness.api.initialize).toHaveBeenCalledTimes(1);

    harness.getInitializeConfiguration()?.callback?.({ credential: 'token' });
    expect(firstHandler).not.toHaveBeenCalled();
    expect(latestHandler).toHaveBeenCalledOnce();
  });

  it('renders menu and comments entry points without reinitializing', () => {
    const manager = createGoogleIdentityManager();
    const harness = createHarness();
    const credentialHandler = vi.fn();
    const menuAttempt: GoogleLoginAttempt = { onSuccess: vi.fn() };
    const commentsAttempt: GoogleLoginAttempt = { onSuccess: vi.fn() };

    manager.initialize(harness.api, 'client-id', credentialHandler);
    manager.renderButton(harness.api, harness.parent, { text: 'signin_with' }, menuAttempt);
    manager.renderButton(harness.api, harness.parent, { text: 'signin_with' }, commentsAttempt);

    expect(harness.api.initialize).toHaveBeenCalledTimes(1);
    expect(harness.api.renderButton).toHaveBeenCalledTimes(2);

    harness.renderedConfigurations[1].click_listener?.();
    harness.getInitializeConfiguration()?.callback?.({ credential: 'token' });
    expect(credentialHandler).toHaveBeenCalledWith(
      { credential: 'token' },
      commentsAttempt
    );
  });

  it('keeps one initialization through comments unmounts and repeated navigation', () => {
    const manager = createGoogleIdentityManager();
    const harness = createHarness();
    const credentialHandler = vi.fn();

    manager.initialize(harness.api, 'client-id', credentialHandler);

    for (let navigation = 0; navigation < 4; navigation += 1) {
      const cleanup = manager.renderButton(
        harness.api,
        harness.parent,
        { text: 'signin_with' },
        { onSuccess: vi.fn() }
      );
      cleanup();
      manager.initialize(harness.api, 'client-id', credentialHandler);
    }

    expect(harness.api.initialize).toHaveBeenCalledTimes(1);
    expect(harness.api.renderButton).toHaveBeenCalledTimes(4);
  });
});
