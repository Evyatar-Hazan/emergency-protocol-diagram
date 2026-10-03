import type { ContentDraftWorkspace } from './contentWorkflow';

const storageKey = 'emergency-protocol-content-drafts-v1';

const isWorkspace = (value: unknown): value is ContentDraftWorkspace => {
  if (!value || typeof value !== 'object') return false;
  const workspace = value as Partial<ContentDraftWorkspace>;
  return Boolean(
    workspace.draftId &&
    workspace.protocolId &&
    workspace.nodeId &&
    workspace.activeRevisionId &&
    Array.isArray(workspace.revisions) &&
    workspace.revisions.length > 0,
  );
};

export function loadContentDrafts(storage: Pick<Storage, 'getItem'> = localStorage): ContentDraftWorkspace[] {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isWorkspace) : [];
  } catch {
    return [];
  }
}

export function saveContentDrafts(
  drafts: ContentDraftWorkspace[],
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(storageKey, JSON.stringify(drafts));
}

export function upsertContentDraft(
  drafts: ContentDraftWorkspace[],
  workspace: ContentDraftWorkspace,
): ContentDraftWorkspace[] {
  const existingIndex = drafts.findIndex(({ draftId }) => draftId === workspace.draftId);
  if (existingIndex === -1) return [...drafts, workspace];
  return drafts.map((draft, index) => (index === existingIndex ? workspace : draft));
}

export const contentDraftStorageKey = storageKey;
