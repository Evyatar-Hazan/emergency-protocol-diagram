import { useEffect, useMemo, useState } from 'react';
import type { Protocol } from '../types/protocol';
import { useSourceProvenanceRuntime } from '../protocols/useSourceProvenanceRuntime';
import {
  buildOfflineLearningPackage,
  type OfflinePackageBuildResult,
} from './offlineLearningPackage';
import {
  cancelOfflineLearningInstall,
  deleteOfflineLearningPackage,
  emptyOfflineLearningStatus,
  getOfflineLearningStatus,
  installOfflineLearningPackage,
  type OfflineLearningInstallStatus,
} from './offlineLearningClient';

interface OfflineLearningManagerProps {
  protocol: Protocol;
}

type OperationState = 'idle' | 'building' | 'installing' | 'deleting';

const formatDate = (value: string | null): string => value
  ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'לא מותקן';

export function OfflineLearningManager({ protocol }: OfflineLearningManagerProps) {
  const provenanceState = useSourceProvenanceRuntime();
  const [status, setStatus] = useState<OfflineLearningInstallStatus>(emptyOfflineLearningStatus);
  const [operation, setOperation] = useState<OperationState>('idle');
  const [operationId, setOperationId] = useState<string | null>(null);
  const [lastBuild, setLastBuild] = useState<OfflinePackageBuildResult | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    void getOfflineLearningStatus()
      .then(setStatus)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : 'לא ניתן לקרוא את מצב חבילת ה־offline.');
      });
  }, []);

  const updateAvailable = useMemo(() => {
    if (!status.installed || provenanceState.status !== 'ready' || !provenanceState.manifest) return false;
    return (
      status.protocolVersion !== protocol.version ||
      status.provenanceBaseSha !== provenanceState.manifest.base_sha
    );
  }, [protocol.version, provenanceState, status]);

  const install = async () => {
    setMessage('');
    setOperation('building');
    try {
      const build = await buildOfflineLearningPackage(protocol, provenanceState);
      setLastBuild(build);
      if (!build.package) {
        setMessage(build.reasons.join(' '));
        return;
      }

      const nextOperationId = crypto.randomUUID();
      setOperationId(nextOperationId);
      setOperation('installing');
      const nextStatus = await installOfflineLearningPackage(build.package, nextOperationId);
      setStatus(nextStatus);
      setMessage('החבילה הוחלפה אטומית והיא מוכנה לקריאה ללא רשת.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'הכנת חבילת ה־offline נכשלה.');
    } finally {
      setOperationId(null);
      setOperation('idle');
    }
  };

  const cancel = async () => {
    if (!operationId) return;
    try {
      const result = await cancelOfflineLearningInstall(operationId);
      setMessage(result.cancelled ? 'ההורדה בוטלה; הגרסה הקודמת נשארה פעילה.' : 'לא נמצאה הורדה פעילה לביטול.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ביטול ההורדה נכשל.');
    }
  };

  const remove = async () => {
    setOperation('deleting');
    setMessage('');
    try {
      setStatus(await deleteOfflineLearningPackage());
      setLastBuild(null);
      setMessage('חבילת הקריאה המקומית נמחקה מהמכשיר.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'מחיקת חבילת ה־offline נכשלה.');
    } finally {
      setOperation('idle');
    }
  };

  return (
    <section className="surface-card-strong rounded-3xl p-5 sm:p-7" aria-labelledby="offline-learning-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <span className="clinical-kicker mb-3">קריאה לימודית בלבד</span>
          <h2 id="offline-learning-title" className="font-display text-2xl font-extrabold text-clinical-ink">
            למידה ללא רשת
          </h2>
          <p className="mt-3 text-sm leading-7 text-clinical-muted">
            החבילה שומרת רק צמתים שכל מקורותיהם עברו אימות, סמכות מתועדת וסקירה בתוקף. היא אינה שומרת תגובות API, פרטי חשבון, credentials או מידע אישי.
          </p>
          <p className="mt-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
            אין להשתמש במצב זה לקבלת החלטות או לטיפול בזמן אירוע חי. בזמן אירוע יש לפעול לפי ההכשרה, הפרוטוקול הארגוני העדכני והנחיות הגורם המוסמך.
          </p>
        </div>

        <dl className="grid min-w-[260px] gap-3 rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm">
          <div>
            <dt className="font-bold text-slate-500">גרסה מותקנת</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {status.installed ? `${status.protocolVersion} · ${status.provenanceBaseSha?.slice(0, 12)}` : 'אין חבילה'}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">הותקנה</dt>
            <dd className="mt-1 text-slate-900">{formatDate(status.installedAt)}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">תוקף סקירה</dt>
            <dd className="mt-1 text-slate-900">{formatDate(status.reviewValidUntil)}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">צמתים מאומתים</dt>
            <dd className="mt-1 text-slate-900">{status.nodeCount}</dd>
          </div>
        </dl>
      </div>

      {updateAvailable && (
        <p className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-950">
          קיימת גרסת תוכן חדשה. הגרסה הישנה נשארת פעילה עד שההורדה והאימות של החדשה מסתיימים במלואם.
        </p>
      )}

      {lastBuild && (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          בדיקת חבילה אחרונה: {lastBuild.approvedNodeCount} מאושרים, {lastBuild.excludedNodeCount} הושמטו מתוך {lastBuild.totalNodeCount}.
        </p>
      )}

      {message && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800" role="status">
          {message}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void install()}
          disabled={operation !== 'idle' || provenanceState.status !== 'ready'}
          className="rounded-2xl bg-clinical-blue px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {operation === 'building' || operation === 'installing'
            ? 'מכין חבילה מאומתת…'
            : status.installed ? 'בדוק ועדכן חבילה' : 'הכן לקריאה ללא רשת'}
        </button>
        {operation === 'installing' && (
          <button type="button" onClick={() => void cancel()} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800">
            בטל הורדה
          </button>
        )}
        {status.installed && (
          <>
            <a href="/offline-learning.html" className="rounded-2xl border border-clinical-blue bg-white px-5 py-3 text-sm font-bold text-clinical-blue">
              פתח קורא offline
            </a>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={operation !== 'idle'}
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-800 disabled:opacity-50"
            >
              מחק חבילה מהמכשיר
            </button>
          </>
        )}
      </div>
    </section>
  );
}
