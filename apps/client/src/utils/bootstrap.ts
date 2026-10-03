import protocolAssetUrl from '../protocols/unified-flow.json?url';
import { applySourceFallbacks } from '../protocols/sourceFallbacks';
import type { FlowData, Protocol } from '../types/protocol';

/**
 * Bootstrap Logic - טעינת נתונים ראשוניים
 * 
 * סדר עדיפות:
 * 1. window.__INITIAL_FLOW_DATA__ (אם קיים)
 * 2. קבצי config מ-/config (אם קיימים)
 * 3. ברירת מחדל מ-src/protocols
 */

/**
 * טעינת קונפיגורציה מ-/config
 */
async function loadConfigFiles(): Promise<Partial<FlowData> | null> {
  try {
    // נסה לטעון flow-overrides.json
    const response = await fetch('/config/flow-overrides.json');
    if (response.ok) {
      const overrides = await response.json();
      return overrides;
    }
  } catch {
    // Optional local override is absent or unavailable.
  }
  return null;
}

/**
 * מיזוג נתונים מכמה מקורות
 */
function mergeFlowData(
  base: FlowData,
  override?: Partial<FlowData>
): FlowData {
  if (!override) return base;

  return {
    ...base,
    ...override,
    protocols: {
      ...base.protocols,
      ...(override.protocols || {}),
    },
  };
}

/**
 * אתחול הדאטא - נקרא פעם אחת בהתחלה
 */
export async function initializeFlowData(): Promise<FlowData> {
  // 1. התחל עם הדאטא המובנה
  const protocolResponse = await fetch(protocolAssetUrl, { credentials: 'omit' });
  if (!protocolResponse.ok) {
    throw new Error(`Failed to load protocol data: ${protocolResponse.status}`);
  }
  const protocol = await protocolResponse.json() as Protocol;
  if (protocol.id !== 'unified_flow' || !protocol.nodes || !protocol.startNode) {
    throw new Error('Protocol data did not pass the runtime shape check');
  }
  let flowData: FlowData = {
    version: '2.0.0',
    language: 'he',
    protocols: { unified_flow: applySourceFallbacks(protocol) },
  };

  // 2. בדוק אם יש window.__INITIAL_FLOW_DATA__
  if (typeof window !== 'undefined' && window.__INITIAL_FLOW_DATA__) {
    flowData = mergeFlowData(flowData, window.__INITIAL_FLOW_DATA__);
  }

  // 3. טען קונפיגורציה חיצונית (אם קיימת)
  const configOverrides = await loadConfigFiles();
  if (configOverrides) {
    flowData = mergeFlowData(flowData, configOverrides);
  }

  return flowData;
}

/**
 * טעינת feature flags מ-/config
 */
export async function loadFeatureFlags(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch('/config/feature-flags.json');
    if (response.ok) {
      const flags = await response.json();
      return flags;
    }
  } catch {
    // Optional local feature flags are absent or unavailable.
  }

  return {
    version: '1.0.0',
    features: {
      enableAdvancedProtocols: false,
      enableOfflineMode: true,
      enableDebugMode: false,
      enableTelemetry: false,
    },
    ui: {
      showNodeIds: false,
      animateTransitions: true,
      compactMode: false,
    },
  };
}
