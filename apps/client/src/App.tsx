import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useFlowStore } from './store/flowStore';
import { useAuthStore } from './store/authStore';
import { initializeFlowData } from './utils/bootstrap';
import { StepByStepView } from './components/StepByStep/StepByStepView';
import { VitalSignsView } from './components/VitalSigns/VitalSignsView';
import { UserMenu } from './components/auth/UserMenu';
import { GoogleIdentityManagerProvider } from './components/auth/GoogleIdentityManagerProvider';
import { SafetyScopeNotice } from './components/safety/SafetyScopeNotice';
import './App.css';

type ViewMode = 'step-by-step' | 'practice' | 'vital-signs';
type SecondaryTool = 'none' | 'diagram' | 'content-editor' | 'offline-learning';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasGoogleClientId =
  Boolean(googleClientId) && !googleClientId.includes('your_google_client_id_here');
const contentEditorEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_CONTENT_EDITOR === 'true';
const enablePracticeAndAssessment = import.meta.env.VITE_ENABLE_PRACTICE_MODE === 'true';

const FullFlowDiagram = lazy(() =>
  import('./components/flow/FullFlowDiagram').then((module) => ({
    default: module.FullFlowDiagram,
  }))
);

const PracticeMode = enablePracticeAndAssessment
  ? lazy(() =>
      import('./components/PracticeMode/PracticeMode').then((module) => ({
        default: module.PracticeMode,
      })),
    )
  : null;

class PracticeModeBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.error('Failed to load practice mode:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <section className="surface-card-strong rounded-4xl p-6 text-center sm:p-8" role="alert">
          <span className="clinical-kicker">מצב תרגול</span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-clinical-ink">
            סביבת התרגול לא נטענה
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-clinical-muted">
            ההתקדמות המקומית נשמרה. אפשר לטעון מחדש ולנסות שוב, או לחזור למסלול הלמידה בלי למחוק אותה.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-clinical-blue px-5 py-3 font-bold text-white transition hover:bg-clinical-deep"
            >
              טעינה מחדש וניסיון נוסף
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onExit();
              }}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-clinical-ink transition hover:bg-slate-50"
            >
              חזרה למסלול הלמידה
            </button>
          </div>
        </section>
      </div>
    );
  }
}

const ContentEditorWorkspace = contentEditorEnabled
  ? lazy(() =>
      import('./components/content-editor/ContentEditorWorkspace').then((module) => ({
        default: module.ContentEditorWorkspace,
      })),
    )
  : null;

const OfflineLearningManager = lazy(() =>
  import('./offlineLearning/OfflineLearningManager').then((module) => ({
    default: module.OfflineLearningManager,
  }))
);
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
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void initialize();
  }, [loadData, checkAuth]);

  useEffect(() => {
    if (!isLoading && !activeProtocol && flowData.protocols.unified_flow) {
      setActiveProtocol('unified_flow');
    }
  }, [isLoading, activeProtocol, flowData, setActiveProtocol]);

  if (isLoading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4" dir="rtl">
        <div className="surface-card-strong clinical-panel rise-in w-full max-w-xl rounded-4xl px-8 py-12 text-center">
          <span className="clinical-kicker mb-6">
            סביבת למידה מונחית
          </span>
          <div className="pulse-glow mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-clinical-blue/10 bg-white/70">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-clinical-blue/20 border-t-clinical-blue"></div>
          </div>
          <h1 className="mb-3 font-display text-3xl font-extrabold text-clinical-ink">
            תרשים פרוטוקול חירום
          </h1>
          <p className="mx-auto max-w-md text-base leading-7 text-clinical-muted">
            טוען מסלול למידה צעד־אחר־צעד ל־BLS, עם שליפה מהירה של מדדים ושכבות עזר מקצועיות.
          </p>
          <SafetyScopeNotice compact className="mt-6" id="loading-safety-scope" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell editorial-grid font-body text-clinical-ink" dir="rtl">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-clinical-header shadow-strong backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="hidden h-12 w-[1px] bg-white/12 sm:block" />
            <div className="min-w-0">
              <span className="shimmer-line mb-1 inline-flex items-center rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white/75 sm:mb-2 sm:px-3 sm:text-[11px]">
                מסלול למידה ראשי
              </span>
              <h1 className="truncate font-display text-base font-extrabold leading-tight text-white sm:text-2xl">
                תרשים פרוטוקול חירום
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-white/72 sm:block">
                למידה ורענון ל־BLS במסלול מדורג, עם מדדים מהירים ושכבות עזר סביב כל צומת.
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
              פרוטוקול ראשי
            </button>
            {enablePracticeAndAssessment && (
              <button
                onClick={() => {
                  setViewMode('practice');
                  setSecondaryTool('none');
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  viewMode === 'practice'
                    ? 'bg-white text-clinical-ink shadow-soft'
                    : 'bg-white/10 text-white hover:bg-white/16'
                }`}
              >
                מצב תרגול
              </button>
            )}
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
            className="mr-0.5 flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/14 bg-white/10 p-0 transition hover:bg-white/16 sm:mr-1 sm:h-auto sm:w-auto sm:p-3"
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
                  הניווט הראשי מחולק למסלול למידה צעד־אחר־צעד ולשליפה מהירה של מדדים. תרשים המערכת המלא נשאר כלי עזר משני בלבד.
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
                  <span>מסלול למידה צעד־אחר־צעד</span>
                </span>
              </button>
              {enablePracticeAndAssessment && (
                <button
                  onClick={() => {
                    setViewMode('practice');
                    setSecondaryTool('none');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    viewMode === 'practice'
                      ? 'bg-clinical-blue text-white shadow-soft'
                      : 'bg-white/75 text-clinical-ink hover:bg-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-lg">◇</span>
                    <span>מצב תרגול מדורג</span>
                  </span>
                </button>
              )}
              <button
                onClick={() => {
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
                      תרשים המערכת נשאר זמין לסקירה מתקדמת, הדרכה והקשר רחב, אבל אינו חלק ממסלול הביצוע הראשי.
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
                  {contentEditorEnabled && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setSecondaryTool('content-editor');
                        }}
                        className="w-full rounded-2xl border border-clinical-blue/20 bg-clinical-blue/5 px-4 py-3 text-sm font-semibold text-clinical-deep transition hover:bg-clinical-blue/10"
                      >
                        פתח סביבת עריכת תוכן מקומית
                      </button>
                    </div>
                  )}
                  <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm leading-6 text-slate-600">
                      חבילת קריאה לימודית ללא רשת כוללת רק תוכן שעבר את חוזה האימות ובתוקף.
                    </p>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setSecondaryTool('offline-learning');
                      }}
                      className="rounded-2xl bg-clinical-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinical-deep"
                    >
                      ניהול למידה ללא רשת
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

      <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-6 sm:pt-4">
        <SafetyScopeNotice id="global-safety-scope" />
      </div>

      {secondaryTool === 'content-editor' && contentEditorEnabled && ContentEditorWorkspace ? (
        <div>
          <div className="mx-auto w-full max-w-[1500px] px-3 pt-4 sm:px-6">
            <button
              onClick={() => setSecondaryTool('none')}
              className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-2.5 text-sm font-semibold text-clinical-ink transition hover:border-clinical-blue"
            >
              חזרה למסלול הלמידה
            </button>
          </div>
          <Suspense
            fallback={
              <div className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center p-6 text-center">
                <div>
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-clinical-blue/20 border-t-clinical-blue" />
                  <p className="text-sm font-semibold text-clinical-muted">טוען את סביבת העריכה המקומית...</p>
                </div>
              </div>
            }
          >
            <ContentEditorWorkspace protocol={flowData.protocols.unified_flow} />
          </Suspense>
        </div>
      ) : secondaryTool === 'diagram' ? (
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <div className="surface-card mb-4 rounded-3xl p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="clinical-kicker mb-2">כלי משני</div>
                <h2 className="font-display text-2xl font-extrabold text-clinical-ink">
                  מבט מערכת מתקדם
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-clinical-muted">
                  התרשים המלא זמין לסקירה מערכתית, הדרכה והבנת הקשרים רחבים, אבל אינו חלק מזרימת הפרוטוקול הראשית.
                </p>
              </div>
              <button
                onClick={() => setSecondaryTool('none')}
                className="rounded-2xl bg-clinical-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-clinical-deep"
              >
                חזרה למסלול הלמידה
              </button>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="surface-card flex min-h-[420px] items-center justify-center rounded-3xl p-6 text-center">
                <div>
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-clinical-blue/20 border-t-clinical-blue" />
                  <p className="text-sm font-semibold text-clinical-muted">
                    טוען את מבט המערכת...
                  </p>
                </div>
              </div>
            }
          >
            <FullFlowDiagram protocols={flowData.protocols} />
          </Suspense>
        </div>
      ) : secondaryTool === 'offline-learning' ? (
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <div className="mb-4 flex justify-start">
            <button
              onClick={() => setSecondaryTool('none')}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              חזרה למסלול הלמידה
            </button>
          </div>
          <Suspense
            fallback={
              <div className="surface-card flex min-h-[260px] items-center justify-center rounded-3xl p-6 text-center">
                <p className="text-sm font-semibold text-clinical-muted">טוען את מנהל ה־offline…</p>
              </div>
            }
          >
            {flowData.protocols.unified_flow ? (
              <OfflineLearningManager protocol={flowData.protocols.unified_flow} />
            ) : (
              <div className="surface-card rounded-3xl p-6 text-center text-sm text-red-800">
                הפרוטוקול הפעיל אינו זמין; לא ניתן להכין חבילה.
              </div>
            )}
          </Suspense>
        </div>
      ) : viewMode === 'step-by-step' ? (
        <StepByStepView protocols={flowData.protocols} />
      ) : viewMode === 'practice' && enablePracticeAndAssessment && PracticeMode ? (
        <Suspense
          fallback={
            <div className="mx-auto flex min-h-[420px] w-full max-w-6xl items-center justify-center px-4 py-8 text-center">
              <div className="surface-card rounded-3xl p-8">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-clinical-blue/20 border-t-clinical-blue" />
                <p className="text-sm font-semibold text-clinical-muted">טוען סביבת תרגול...</p>
              </div>
            </div>
          }
        >
          <PracticeModeBoundary onExit={() => setViewMode('step-by-step')}>
            <PracticeMode onExit={() => setViewMode('step-by-step')} />
          </PracticeModeBoundary>
        </Suspense>
      ) : (
        <VitalSignsView />
      )}
    </div>
  );
}

export default function App() {
  return (
    hasGoogleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <GoogleIdentityManagerProvider>
          <AppContent />
        </GoogleIdentityManagerProvider>
      </GoogleOAuthProvider>
    ) : (
      <AppContent />
    )
  );
}
