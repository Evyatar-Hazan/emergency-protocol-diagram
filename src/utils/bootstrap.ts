import type { FlowData } from '../types/protocol';
import { protocolsData } from '../protocols';

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
      console.log('[Bootstrap] Loaded config overrides:', overrides);
      return overrides;
    }
  } catch {
    console.log('[Bootstrap] No config overrides found');
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
  console.log('[Bootstrap] Initializing flow data...');

  // 1. התחל עם הדאטא המובנה
  let flowData: FlowData = protocolsData;

  // 2. בדוק אם יש window.__INITIAL_FLOW_DATA__
  if (typeof window !== 'undefined' && window.__INITIAL_FLOW_DATA__) {
    console.log('[Bootstrap] Found window.__INITIAL_FLOW_DATA__');
    flowData = mergeFlowData(flowData, window.__INITIAL_FLOW_DATA__);
  }

  // 3. טען קונפיגורציה חיצונית (אם קיימת)
  const configOverrides = await loadConfigFiles();
  if (configOverrides) {
    flowData = mergeFlowData(flowData, configOverrides);
  }

  console.log('[Bootstrap] Flow data initialized:', {
    version: flowData.version,
    language: flowData.language,
    protocols: Object.keys(flowData.protocols),
  });

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
      console.log('[Bootstrap] Loaded feature flags:', flags);
      return flags;
    }
  } catch {
    console.log('[Bootstrap] No feature flags found, using defaults');
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
