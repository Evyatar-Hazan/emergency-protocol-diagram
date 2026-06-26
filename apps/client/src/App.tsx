import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useFlowStore } from './store/flowStore';
import { useAuthStore } from './store/authStore';
import { initializeFlowData } from './utils/bootstrap';
import { FullFlowDiagram } from './components/flow/FullFlowDiagram';
import { StepByStepView } from './components/StepByStep/StepByStepView';
import { VitalSignsView } from './components/VitalSigns/VitalSignsView';
import { UserMenu } from './components/auth/UserMenu';
import './App.css';

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
      <div className="app-shell flex min-h-screen items-center justify-center px-4" dir="rtl">
        <div className="surface-card-strong w-full max-w-xl rounded-4xl px-8 py-12 text-center">
          <span className="clinical-kicker mb-6">
            סביבת למידה קלינית
          </span>
          <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-full border-[3px] border-clinical-blue/20 border-t-clinical-blue"></div>
          <h1 className="mb-3 font-display text-3xl font-extrabold text-clinical-ink">
            Emergency Protocol Diagram
          </h1>
          <p className="mx-auto max-w-md text-base leading-7 text-clinical-muted">
            טוען מסלול למידה קליני לחובשים ומתלמדים עם התקדמות מודרכת, שליפה מהירה של מדדים ודיון מקצועי.
          </p>
        </div>
      </div>
    );
  }

  console.log('[App] activeProtocol:', activeProtocol);

  return (
    <div className="app-shell editorial-grid font-body text-clinical-ink" dir="rtl">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-clinical-header shadow-strong backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="hidden h-12 w-[1px] bg-white/12 sm:block" />
            <div className="min-w-0">
              <span className="mb-2 inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-white/75">
                CLINICAL LEARNING SYSTEM
              </span>
              <h1 className="truncate font-display text-lg font-extrabold text-white sm:text-2xl">
                Emergency Protocol Diagram
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-white/72 sm:block">
                סביבת למידה אקדמית לחובשים ומתלמדים עם מסלול חשיבה צעד-אחר-צעד, מדדים מהירים ודיון מקצועי סביב כל צומת.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mr-1 flex flex-col gap-1.5 rounded-2xl border border-white/14 bg-white/10 p-3 transition hover:bg-white/16"
            aria-label="תפריט"
          >
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          <div className={`${
            isMenuOpen
              ? 'absolute left-0 right-0 top-full border-t border-white/10 bg-[#fffaf3]/95 shadow-strong backdrop-blur-2xl'
              : 'hidden'
          }`}>
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              <button
                onClick={() => {
                  setViewMode('step-by-step');
                  setIsMenuOpen(false);
                }}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  viewMode === 'step-by-step'
                    ? 'bg-clinical-blue text-white shadow-soft'
                    : 'bg-white/75 text-clinical-ink hover:bg-white'
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-lg">◎</span>
                  <span>מסלול למידה צעד-אחר-צעד</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setViewMode('diagram');
                  setIsMenuOpen(false);
                }}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  viewMode === 'diagram'
                    ? 'bg-clinical-blue text-white shadow-soft'
                    : 'bg-white/75 text-clinical-ink hover:bg-white'
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-lg">◌</span>
                  <span>מבט מערכת מתקדם</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setViewMode('vital-signs');
                  setIsMenuOpen(false);
                }}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  viewMode === 'vital-signs'
                    ? 'bg-clinical-teal text-white shadow-soft'
                    : 'bg-white/75 text-clinical-ink hover:bg-white'
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-lg">▣</span>
                  <span>מדדים מהירים</span>
                </span>
              </button>

              <div className="mt-4 border-t border-slate-200/80 pt-4">
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
