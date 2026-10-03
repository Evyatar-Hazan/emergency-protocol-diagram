import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getOfflinePackageFreshness,
  type OfflineLearningNode,
  type OfflineLearningPackage,
} from './offlineLearningPackage';

type ReaderState =
  | { status: 'loading' }
  | { status: 'missing'; message: string }
  | { status: 'stale'; packageValue: OfflineLearningPackage }
  | { status: 'ready'; packageValue: OfflineLearningPackage };

const renderValue = (value: unknown): ReactNode => {
  if (Array.isArray(value)) {
    return <ul>{value.map((entry, index) => <li key={index}>{renderValue(entry)}</li>)}</ul>;
  }
  if (value && typeof value === 'object') {
    return (
      <dl className="reader-details">
        {Object.entries(value as Record<string, unknown>).map(([key, entry]) => (
          <div key={key}><dt>{key}</dt><dd>{renderValue(entry)}</dd></div>
        ))}
      </dl>
    );
  }
  return String(value ?? '');
};

const NodeCard = ({ node }: { node: OfflineLearningNode }) => (
  <article className="reader-card">
    <header>
      <span className="reader-node-id">{node.id}</span>
      <h2>{node.title}</h2>
      {node.description && <p>{node.description}</p>}
    </header>
    {node.content && Object.entries(node.content).map(([key, value]) => (
      <section key={key} className="reader-section">
        <h3>{key}</h3>
        {renderValue(value)}
      </section>
    ))}
    <footer>
      <h3>מקורות שאושרו לשימוש המוצהר</h3>
      <ul>
        {node.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
            <span>גרסה {source.versionOrDate} · סקירה בתוקף עד {source.reviewDue}</span>
          </li>
        ))}
      </ul>
    </footer>
  </article>
);

export function OfflineLearningReader() {
  const [state, setState] = useState<ReaderState>({ status: 'loading' });
  const [query, setQuery] = useState('');

  useEffect(() => {
    void fetch('/__offline-learning/package.json', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('לא נמצאה חבילת למידה מותקנת.');
        const packageValue = await response.json() as OfflineLearningPackage;
        const freshness = await getOfflinePackageFreshness(packageValue);
        if (freshness === 'invalid') throw new Error('שלמות החבילה אינה תקינה ולכן התוכן נחסם.');
        setState(freshness === 'stale'
          ? { status: 'stale', packageValue }
          : { status: 'ready', packageValue });
      })
      .catch((error: unknown) => setState({
        status: 'missing',
        message: error instanceof Error ? error.message : 'טעינת החבילה נכשלה.',
      }));
  }, []);

  const filteredNodes = useMemo(() => {
    if (state.status !== 'ready') return [];
    const normalized = query.trim().toLocaleLowerCase('he');
    if (!normalized) return state.packageValue.payload.nodes;
    return state.packageValue.payload.nodes.filter((node) =>
      `${node.title} ${node.description ?? ''} ${node.id}`.toLocaleLowerCase('he').includes(normalized),
    );
  }, [query, state]);

  return (
    <main className="reader-shell" dir="rtl">
      <header className="reader-hero">
        <span className="reader-kicker">קריאה לימודית בלבד</span>
        <h1>למידה ללא רשת</h1>
        <p>הקורא אינו מיועד לקבלת החלטות או לטיפול בזמן אירוע חי.</p>
        <p className="reader-boundary">בזמן אירוע יש לפעול לפי ההכשרה, הפרוטוקול הארגוני העדכני והנחיות הגורם המוסמך.</p>
      </header>

      {state.status === 'loading' && <div className="reader-message">מאמת את החבילה המקומית…</div>}
      {state.status === 'missing' && <div className="reader-message reader-error"><h2>התוכן חסום</h2><p>{state.message}</p></div>}
      {state.status === 'stale' && (
        <div className="reader-message reader-error">
          <h2>תוקף התוכן פג</h2>
          <p>גרסה {state.packageValue.payload.protocolVersion} נשמרה במכשיר, אך תוקף הסקירה שלה הסתיים ב־{new Date(state.packageValue.payload.reviewValidUntil).toLocaleDateString('he-IL')}. יש להתחבר לרשת ולעדכן לפני קריאה.</p>
        </div>
      )}
      {state.status === 'ready' && (
        <>
          <section className="reader-version" aria-label="פרטי גרסה">
            <div><strong>גרסת פרוטוקול</strong><span>{state.packageValue.payload.protocolVersion}</span></div>
            <div><strong>בסיס עקיבות</strong><span>{state.packageValue.payload.provenanceBaseSha.slice(0, 12)}</span></div>
            <div><strong>תוקף סקירה</strong><span>{new Date(state.packageValue.payload.reviewValidUntil).toLocaleDateString('he-IL')}</span></div>
            <div><strong>צמתים מאומתים</strong><span>{state.packageValue.payload.nodeCount}</span></div>
          </section>
          <label className="reader-search">
            <span>חיפוש בחבילה המאומתת</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="חיפוש לפי נושא…" />
          </label>
          <section className="reader-list" aria-live="polite">
            {filteredNodes.map((node) => <NodeCard key={node.id} node={node} />)}
            {filteredNodes.length === 0 && <p className="reader-message">לא נמצאו תוצאות בחבילה.</p>}
          </section>
        </>
      )}
    </main>
  );
}
