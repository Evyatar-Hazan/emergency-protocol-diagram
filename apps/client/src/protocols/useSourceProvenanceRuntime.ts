import { useEffect, useState } from 'react';
import type { SourceProvenanceLoadState } from '../types/sourceProvenance';
import { loadSourceProvenanceRuntime } from './sourceProvenanceRuntime';

const loadingState: SourceProvenanceLoadState = {
  status: 'loading',
  manifest: null,
  loadedAt: null,
  error: null,
};

export function useSourceProvenanceRuntime() {
  const [state, setState] = useState<SourceProvenanceLoadState>(loadingState);

  useEffect(() => {
    let active = true;
    void loadSourceProvenanceRuntime().then((nextState) => {
      if (active) setState(nextState);
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
