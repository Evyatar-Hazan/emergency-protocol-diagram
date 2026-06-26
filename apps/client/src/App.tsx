import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useFlowStore } from './store/flowStore';
import { useAuthStore } from './store/authStore';
import { initializeFlowData } from './utils/bootstrap';
import { FullFlowDiagram } from './components/flow/FullFlowDiagram';
import { StepByStepView } from './components/StepByStep/StepByStepView';
import { VitalSignsView } from './components/VitalSigns/VitalSignsView';
import { UserMenu } from './components/auth/UserMenu';

type ViewMode = 'step-by-step' | 'diagram' | 'vital-signs';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { flowData, activeProtocol, loadData, setActiveProtocol } = useFlowStore();
  const { checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('step-by-step');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        checkAuth();

        const data = await initializeFlowData();
        loadData(data);

        console.log('[App] Auto-starting unified flow');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void initialize();
  }, [loadData, checkAuth]);

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

  console.log('[App] activeProtocol:', activeProtocol);

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-white font-bold text-lg sm:text-xl">🚑 UH Protocol</h1>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1.5 mr-3 p-2 hover:bg-blue-500 rounded-lg transition"
            aria-label="תפריט"
          >
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          <div className={`${
            isMenuOpen
              ? 'absolute top-full left-0 right-0 bg-white border-t-4 border-blue-600 shadow-xl'
              : 'hidden'
          }`}>
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  setViewMode('step-by-step');
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'step-by-step'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'diagram'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'vital-signs'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-lg">📊</span>
                <span>מדדים</span>
              </button>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}
