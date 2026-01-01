import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

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
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6">
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
              התשתית הושלמה בהצלחה!
            </h2>
            <p className="text-gray-600 mb-4">
              המערכת מוכנה לפיתוח רכיבי תרשים הזרימה
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <div className="px-4 py-2 bg-emergency-normal rounded">
                {t('abcde.a')}
              </div>
              <div className="px-4 py-2 bg-emergency-stable rounded">
                {t('abcde.b')}
              </div>
              <div className="px-4 py-2 bg-emergency-warning rounded">
                {t('abcde.c')}
              </div>
              <div className="px-4 py-2 bg-emergency-urgent rounded">
                {t('abcde.d')}
              </div>
              <div className="px-4 py-2 bg-emergency-critical rounded">
                {t('abcde.e')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">✅ הושלם</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Vite + React + TypeScript</li>
              <li>• TailwindCSS + RTL</li>
              <li>• i18next (עברית/אנגלית)</li>
              <li>• מבנה תיקיות</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">🔄 בתהליך</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• המרת פרוטוקולים ל-JSON</li>
              <li>• רכיבי Flow</li>
              <li>• Zustand Store</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">📋 מתוכנן</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Bootstrap Logic</li>
              <li>• Unit Tests</li>
              <li>• E2E Tests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
