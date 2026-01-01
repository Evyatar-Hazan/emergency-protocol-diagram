import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useFlowStore } from './store/flowStore';
import { initializeFlowData, loadFeatureFlags } from './utils/bootstrap';
import { FullFlowDiagram } from './components/flow/FullFlowDiagram';

function App() {
  const { t } = useTranslation();
  const { flowData, activeProtocol, loadData, setActiveProtocol } = useFlowStore();
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        // טען את הדאטא
        const data = await initializeFlowData();
        loadData(data);

        // טען feature flags
        const flags = await loadFeatureFlags();
        setFeatureFlags(flags);

        // התחל אוטומטית עם הפרוטוקול המאוחד
        console.log('[App] Auto-starting unified flow');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [loadData]);

  // אתחול אוטומטי של הפרוטוקול המאוחד
  useEffect(() => {
    if (!isLoading && !activeProtocol && flowData.protocols.unified_flow) {
      console.log('[App] Setting unified_flow as active protocol');
      setActiveProtocol('unified_flow');
    }
  }, [isLoading, activeProtocol, flowData, setActiveProtocol]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מערכת...</p>
        </div>
      </div>
    );
  }

  const protocolKeys = Object.keys(flowData.protocols);

  console.log('[App] activeProtocol:', activeProtocol);

  // תצוגת תרשים זרימה מלא - כל הפרוטוקולים ביחד
  if (!isLoading && flowData.protocols) {
    return <FullFlowDiagram protocols={flowData.protocols} />;
  }

  // מסך בחירת פרוטוקול
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('app.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('app.subtitle')}
          </p>
          <div className="mt-2 text-sm text-gray-500">
            גרסה {flowData.version} | {protocolKeys.length} פרוטוקולים זמינים
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
              <svg 
                className="w-16 h-16 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              מערכת מונעת-דאטא פעילה!
            </h2>
            <p className="text-gray-600 mb-4">
              כל הפרוטוקולים נטענו מ-JSON
            </p>
          </div>
        </div>

        {/* בחירת פרוטוקול */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">פרוטוקולים זמינים</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocolKeys.map((key) => {
              const protocol = flowData.protocols[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveProtocol(key)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-right"
                >
                  <h4 className="font-semibold text-lg mb-1">{protocol.name}</h4>
                  <p className="text-sm text-gray-600">{protocol.description}</p>
                  <div className="mt-2 flex gap-2">
                    {protocol.metadata?.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* סטטוס */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">✅ הושלם</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Vite + React + TypeScript</li>
              <li>• TailwindCSS + RTL</li>
              <li>• i18next (עברית/אנגלית)</li>
              <li>• מבנה תיקיות</li>
              <li>• פרוטוקולים ב-JSON ✨</li>
              <li>• Zustand Store ✨</li>
              <li>• Bootstrap Logic ✨</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">🔄 בתהליך</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• רכיבי Flow</li>
              <li>• מנוע ניווט</li>
              <li>• UI Components</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">📊 סטטיסטיקות</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• פרוטוקולים: {protocolKeys.length}</li>
              <li>• צמתים בCPR: {Object.keys(flowData.protocols.cpr?.nodes || {}).length}</li>
              <li>• צמתים בABCDE: {Object.keys(flowData.protocols.abcde_medical?.nodes || {}).length}</li>
              <li>• Feature Flags: {featureFlags ? 'טעון' : 'ברירת מחדל'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
