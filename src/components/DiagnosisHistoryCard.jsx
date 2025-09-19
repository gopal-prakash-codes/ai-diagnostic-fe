import React from 'react';
import { Card, CardHeader, CardContent } from './UI';
import { HistoryIcon } from 'lucide-react';

// Reusing the icon components from your main file
const DocumentIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const HeartIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
);
const FlaskIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 21a2 2 0 01-2-2v-4a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15h1a2 2 0 002-2V9a2 2 0 00-2-2h-1m-4 0a2 2 0 00-2 2v4a2 2 0 002 2h1m4-11h-4a2 2 0 00-2 2v1h8v-1a2 2 0 00-2-2z" /></svg>
);
const PillIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26 2.438.775 2.413 1.073" /></svg>
);

function DiagnosisHistoryCard({ diagnosis }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-white rounded-lg shadow-md w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Visit History</h3>
        </div>
        <div className="flex items-center text-sm space-x-2 sm:space-x-4 flex-wrap">
          <span className="text-gray-900 font-semibold">{formatDate(diagnosis.createdAt)}</span>
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">
            Dr {diagnosis.doctor}
          </span>
        </div>
      </div>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Diagnosis Section */}
          <div>
            <div className="flex items-center text-sm font-semibold text-gray-700 mb-2 sm:mb-3 space-x-2">
              <DocumentIcon className="w-4 h-4 text-blue-600" />
              <span>Diagnosis</span>
            </div>
            {diagnosis.diagnosisData && diagnosis.diagnosisData.length > 0 ? (
              <div className="space-y-1.5">
                {diagnosis.diagnosisData.map((diagnosisItem, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">{diagnosisItem.condition}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      diagnosisItem.confidence >= 80 ? 'bg-green-100 text-green-800' :
                      diagnosisItem.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {diagnosisItem.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{diagnosis.diagnosis}</p>
            )}
          </div>

          {/* Vitals Section */}
          <div>
            <div className="flex items-center text-sm font-semibold text-gray-700 mb-2 sm:mb-3 space-x-2">
              <HeartIcon className="w-4 h-4 text-red-500" />
              <span>Vitals</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-medium">BP:</span>
                <span>125/80 mmHg</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-medium">HR:</span>
                <span>70 bpm</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-medium">Temp:</span>
                <span>98.2°F</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-medium">Weight:</span>
                <span>165 lbs</span>
              </div>
            </div>
          </div>

          {/* Lab Results Section */}
          <div>
            <div className="flex items-center text-sm font-semibold text-gray-700 mb-2 sm:mb-3 space-x-2">
              <FlaskIcon className="w-4 h-4 text-purple-600" />
              <span>Lab Results</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-medium">HbA1c:</span>
                <span>6.8%</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-medium">Fasting Glucose:</span>
                <span>110 mg/dL</span>
              </div>
            </div>
          </div>

          {/* Medications Section */}
          <div>
            <div className="flex items-center text-sm font-semibold text-gray-700 mb-2 sm:mb-3 space-x-2">
              <PillIcon className="w-4 h-4 text-emerald-600" />
              <span>Medications</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-1 mr-2"></div>
                <span className="text-sm text-gray-700">Type 2 Diabetes - Well Controlled</span>
              </div>
              <div className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-1 mr-2"></div>
                <span className="text-sm text-gray-700">Type 2 Diabetes - Well Controlled</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DiagnosisHistoryCard;
