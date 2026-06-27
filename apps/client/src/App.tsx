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

type ViewMode = 'step-by-step' | 'vital-signs';
type SecondaryTool = 'none' | 'diagram';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { flowData, activeProtocol, loadData, setActiveProtocol } = useFlowStore();
  const { checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('step-by-step');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDiagramTools, setShowDiagramTools] = useState(false);
  const [secondaryTool, setSecondaryTool] = useState<SecondaryTool>('none');

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
        <div className="surface-card-strong clinical-panel rise-in w-full max-w-xl rounded-4xl px-8 py-12 text-center">
          <span className="clinical-kicker mb-6">
            סביבת למידה קלינית
          </span>
          <div className="pulse-glow mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-clinical-blue/10 bg-white/70">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-clinical-blue/20 border-t-clinical-blue"></div>
          </div>
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
              <span className="shimmer-line mb-2 inline-flex items-center rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-white/75">
                מערכת למידה קלינית
              </span>
              <h1 className="truncate font-display text-lg font-extrabold text-white sm:text-2xl">
                Emergency Protocol Diagram
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-white/72 sm:block">
                סביבת למידה אקדמית לחובשים ומתלמדים עם מסלול חשיבה צעד-אחר-צעד, מדדים מהירים ודיון מקצועי סביב כל צומת.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              onClick={() => setViewMode('step-by-step')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'step-by-step'
                  ? 'bg-white text-clinical-ink shadow-soft'
                  : 'bg-white/10 text-white hover:bg-white/16'
              }`}
            >
              מסלול למידה
            </button>
            <button
              onClick={() => setViewMode('vital-signs')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'vital-signs'
                  ? 'bg-white text-clinical-ink shadow-soft'
                  : 'bg-white/10 text-white hover:bg-white/16'
              }`}
            >
              מדדים מהירים
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mr-1 flex flex-col gap-1.5 rounded-2xl border border-white/14 bg-white/10 p-3 transition hover:bg-white/16"
            aria-label="תפריט"
            aria-expanded={isMenuOpen}
            aria-controls="main-mobile-menu"
          >
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

          <div
            id="main-mobile-menu"
            className={`${
            isMenuOpen
              ? 'absolute left-0 right-0 top-full border-t border-white/10 bg-[#fffaf3]/95 shadow-strong backdrop-blur-2xl'
              : 'hidden'
          }`}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              <div className="mb-2 flex flex-col gap-1 rounded-3xl border border-slate-200/80 bg-white/80 p-3 text-right">
                <span className="text-[11px] font-bold tracking-[0.18em] text-clinical-muted">
                  נתיבי המוצר הראשיים
                </span>
                <p className="text-sm leading-6 text-slate-600">
                  הניווט הראשי מחולק למסלול למידה מודרך ולשליפה מהירה של מדדים. תרשים המערכת המלא נשאר ככלי משני בלבד.
                </p>
              </div>
              <button
                onClick={() => {
                  setViewMode('step-by-step');
                  setSecondaryTool('none');
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
                  setIsMenuOpen(false);
                  setShowDiagramTools(!showDiagramTools);
                }}
                className="w-full rounded-2xl border border-slate-200/90 bg-white/75 px-4 py-3 text-sm font-semibold text-clinical-ink transition-all hover:bg-white"
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-lg">◌</span>
                  <span>כלי מערכת מתקדמים</span>
                </span>
              </button>
              {showDiagramTools && (
                <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-3 text-right">
                  <div className="mb-2 text-xs font-bold tracking-[0.14em] text-clinical-muted">
                    כלי משני
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-6 text-slate-600">
                      תרשים המערכת נשאר זמין למדריכים, סקירה מתקדמת והבנת ההקשר הרחב, אבל אינו חלק מהמסלול הראשי.
                    </p>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSecondaryTool('diagram');
                      }}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      פתח מבט מערכת
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setViewMode('vital-signs');
                  setSecondaryTool('none');
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

      {secondaryTool === 'diagram' ? (
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <div className="surface-card mb-4 rounded-3xl p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="clinical-kicker mb-2">כלי משני</div>
                <h2 className="font-display text-2xl font-extrabold text-clinical-ink">
                  מבט מערכת מתקדם
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-clinical-muted">
                  התרשים המלא זמין לסקירה מערכתית, הדרכה והבנת הקשרים רחבים, אבל אינו חלק מזרימת הלמידה הראשית.
                </p>
              </div>
              <button
                onClick={() => setSecondaryTool('none')}
                className="rounded-2xl bg-clinical-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-clinical-deep"
              >
                חזרה למסלול הראשי
              </button>
            </div>
          </div>
          <FullFlowDiagram protocols={flowData.protocols} />
        </div>
      ) : viewMode === 'step-by-step' ? (
        <StepByStepView protocols={flowData.protocols} />
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
