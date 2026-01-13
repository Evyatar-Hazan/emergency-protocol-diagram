import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useFlowStore } from './store/flowStore';
import { useAuthStore } from './store/authStore';
import { initializeFlowData, loadFeatureFlags } from './utils/bootstrap';
import { FullFlowDiagram } from './components/flow/FullFlowDiagram';
import { StepByStepView } from './components/StepByStep/StepByStepView';
import { VitalSignsView } from './components/VitalSigns/VitalSignsView';
import { UserMenu } from './components/auth/UserMenu';

type ViewMode = 'step-by-step' | 'diagram' | 'vital-signs';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { t } = useTranslation();
  const { flowData, activeProtocol, loadData, setActiveProtocol } = useFlowStore();
  const { checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [featureFlags, setFeatureFlags] = useState<Record<string, unknown> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('step-by-step');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Check authentication status
        checkAuth();

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
  }, [loadData, checkAuth]);

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

  // תצוגה עם טאבים
  if (!isLoading && flowData.protocols) {
    return (
      <div className="min-h-screen bg-gray-100" dir="rtl">
        {/* Header עם תפריט נפתח */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* לוגו וכותרת */}
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-white font-bold text-lg sm:text-xl">🚑 UH Protocol</h1>
            </div>

            {/* כפתור תפריט (hamburger) - מוצג רק במובייל */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex flex-col gap-1.5 mr-3 p-2 hover:bg-blue-500 rounded-lg transition"
              aria-label="תפריט"
            >
              <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>

            {/* תפריט - נמצא בצד יימין (מוצג תמיד בdktop, נפתח בموβايل) */}
            <div className={`${
              isMenuOpen
                ? 'absolute top-full left-0 right-0 bg-white border-t-4 border-blue-600 shadow-xl'
                : 'hidden lg:block'
            }`}>
              <div className={`max-w-7xl mx-auto ${isMenuOpen ? 'px-4 py-4' : 'flex gap-2'}`}>
                <button
                  onClick={() => {
                    setViewMode('step-by-step');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full lg:w-auto flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 lg:py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === 'step-by-step'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 lg:bg-gray-200 text-gray-700 hover:bg-gray-200 lg:hover:bg-gray-300'
                  }`}
                >
                  <span className="text-lg">📱</span>
                  <span>צעד-אחר-צעד</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('diagram');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full lg:w-auto flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 lg:py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === 'diagram'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 lg:bg-gray-200 text-gray-700 hover:bg-gray-200 lg:hover:bg-gray-300'
                  }`}
                >
                  <span className="text-lg">🗺️</span>
                  <span>תרשים מלא</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('vital-signs');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full lg:w-auto flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 lg:py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === 'vital-signs'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 lg:bg-gray-200 text-gray-700 hover:bg-gray-200 lg:hover:bg-gray-300'
                  }`}
                >
                  <span className="text-lg">📊</span>
                  <span>מדדים</span>
                </button>

                {/* תפריט משתמש בתוך התפריט הנפתח */}
                <div className={`${isMenuOpen ? 'mt-4 pt-4 border-t border-gray-200' : 'hidden lg:block'}`}>
                  <UserMenu />
                </div>
              </div>
            </div>

            {/* תפריט משתמש בdktop */}
            <div className="hidden lg:block">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* תוכן */}
        {viewMode === 'step-by-step' ? (
          <StepByStepView protocols={flowData.protocols} />
        ) : viewMode === 'diagram' ? (
          <FullFlowDiagram protocols={flowData.protocols} />
        ) : (
          <VitalSignsView />
        )}
      </div>
    );
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

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}
