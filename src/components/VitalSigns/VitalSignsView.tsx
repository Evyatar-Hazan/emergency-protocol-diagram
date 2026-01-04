import { useState } from 'react';
import vitalSignsData from '../../data/vital-signs.json';

type AgeGroup = 'adult' | 'child';

export function VitalSignsView() {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');

  const categories = [
    { key: 'airway', data: vitalSignsData.airway },
    { key: 'breathing', data: vitalSignsData.breathing },
    { key: 'circulation', data: vitalSignsData.circulation },
    { key: 'disability', data: vitalSignsData.disability },
    { key: 'exposure', data: vitalSignsData.exposure },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 text-blue-900">
            📊 מדדים תקינים - ABCDE
          </h1>
          
          {/* Age Group Toggle */}
          <div className="flex justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setAgeGroup('adult')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all ${
                ageGroup === 'adult'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👨 מבוגר
            </button>
            <button
              onClick={() => setAgeGroup('child')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-bold transition-all ${
                ageGroup === 'child'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👶 ילד
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4 sm:space-y-6">
          {categories.map((category) => {
            const categoryData = category.data[ageGroup];
            
            return (
              <div
                key={category.key}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-5">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">{category.data.icon}</span>
                    <span>{category.data.title}</span>
                  </h2>
                </div>

                {/* Parameters */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {Object.entries(categoryData).map(([key, param]: [string, any]) => (
                    <div
                      key={key}
                      className="border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <h3 className="font-bold text-base sm:text-lg text-blue-900 mb-2 sm:mb-3">
                        {param.parameter}
                      </h3>
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        {Object.entries(param)
                          .filter(([k]) => k !== 'parameter')
                          .map(([k, v]) => {
                            let bgColor = 'bg-gray-50';
                            let textColor = 'text-gray-800';
                            let label = k;

                            // Color coding based on severity
                            if (k === 'normal') {
                              bgColor = 'bg-green-100';
                              textColor = 'text-green-900';
                              label = '✅ תקין';
                            } else if (k === 'mild' || k === 'elevated') {
                              bgColor = 'bg-yellow-100';
                              textColor = 'text-yellow-900';
                              label = '⚠️ קל';
                            } else if (k === 'moderate') {
                              bgColor = 'bg-orange-100';
                              textColor = 'text-orange-900';
                              label = '⚠️ בינוני';
                            } else if (k === 'severe' || k === 'abnormal') {
                              bgColor = 'bg-red-100';
                              textColor = 'text-red-900';
                              label = k === 'severe' ? '🚨 חמור' : '❌ לא תקין';
                            } else if (k === 'note') {
                              bgColor = 'bg-blue-50';
                              textColor = 'text-blue-800';
                              label = 'ℹ️ הערה';
                            } else if (k.includes('hypo')) {
                              bgColor = 'bg-blue-100';
                              textColor = 'text-blue-900';
                            } else if (k.includes('hyper') || k.includes('fever')) {
                              bgColor = 'bg-red-100';
                              textColor = 'text-red-900';
                            } else if (k === 'bradycardia' || k === 'tachycardia') {
                              bgColor = 'bg-orange-100';
                              textColor = 'text-orange-900';
                            }

                            return (
                              <div
                                key={k}
                                className={`${bgColor} ${textColor} rounded px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm`}
                              >
                                <span className="font-semibold">{label}:</span>{' '}
                                <span>{v as string}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note at bottom */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-yellow-900">
            <strong>⚠️ הערה חשובה:</strong> מדדים אלו הם ערכים כלליים. יש לקחת בחשבון את המצב הקליני המלא של המטופל,
            תרופות שהוא נוטל, ומצבים רפואיים קיימים. בספק - התייעץ עם רופא.
          </p>
        </div>
      </div>
    </div>
  );
}
