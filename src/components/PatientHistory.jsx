import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getPatientHistory, getPatients } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardContent } from './UI';
import SidebarLayout from './SideBar';
import Navbar from './NavBar';

const ArrowLeft = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Stethoscope = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26 2.438.775 2.413 1.073" />
  </svg>
);

const LogOut = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const User = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Heart = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Activity = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FileText = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Pill = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26 2.438.775 2.413 1.073" />
  </svg>
);

const AlertTriangle = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const Clock = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Calendar = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Phone = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Mail = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ViewDetails = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ChevronLeft = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
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

  // Helper function to capitalize first word
  const capitalizeFirstWord = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Report</h3>
              <p className="text-sm text-gray-500">{formatDate(diagnosis.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">by {diagnosis.doctor}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Symptoms Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Symptoms</h4>
            {diagnosis.symptoms && diagnosis.symptoms.length > 0 ? (
              <div className="space-y-2">
                {diagnosis.symptoms.map((symptom, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3 flex-shrink-0 mt-1"></div>
                    <span className="text-sm text-gray-700 leading-relaxed break-words">{capitalizeFirstWord(symptom)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No symptoms recorded</p>
            )}
          </div>
          
          {/* Diagnosis Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Diagnosis</h4>
            {diagnosis.diagnosisData && diagnosis.diagnosisData.length > 0 ? (
              <div className="space-y-3">
                {diagnosis.diagnosisData.map((diagnosisItem, index) => (
                  <div key={index} className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-1 xs:space-y-0">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 break-words">{diagnosisItem.condition}</span>
                    </div>
                    <span className={`ml-5 xs:ml-2 px-2 py-1 text-xs font-medium rounded-full self-start xs:self-auto ${
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
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{diagnosis.diagnosis}</p>
                {diagnosis.confidence && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      diagnosis.confidence >= 80 ? 'bg-green-100 text-green-800' :
                      diagnosis.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {diagnosis.confidence}% confidence
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Treatment Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Next Steps</h4>
            {diagnosis.treatment ? (
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0 mt-1"></div>
                  <span className="text-sm text-gray-700 leading-relaxed break-words">{diagnosis.treatment}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No treatment recommendations recorded</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for empty visit history cards - shows empty fields instead of message
function EmptyVisitHistoryCards({ selectedDate, onClearFilter }) {
  return (
    <div className="space-y-4">
      {/* Main Visit History Card - Empty State */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Neutral Header */}
        <div className="bg-[#FAFAFA] text-[#172B4C] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#172B4C]" />
            <span className="font-semibold text-base">Visit History</span>
          </div>
          <div className="text-sm text-[#172B4C]">
            No visits recorded
          </div>
        </div>

        {/* White Content Area */}
        <div className="p-6">
          {/* Four Section Grid Layout - Empty State */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagnosis Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Diagnosis</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                <span className="text-sm text-gray-500">No diagnosis available</span>
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Symptoms</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                <span className="text-sm text-gray-500">No symptoms recorded</span>
              </div>
            </div>

            {/* Treatment Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Treatment</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                <span className="text-sm text-gray-500">No treatment plan available</span>
              </div>
            </div>

            {/* Allergies Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Allergies</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                <span className="text-sm text-gray-500">No known allergies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for visit history cards that matches the Figma design
function VisitHistoryCards({ diagnoses, selectedDate, onClearFilter }) {
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Group diagnoses by date if a specific date is selected
  const organizedSessions = React.useMemo(() => {
    if (selectedDate) {
      const sameDateSessions = diagnoses.filter(diagnosis => {
        const diagnosisDate = new Date(diagnosis.createdAt).toDateString();
        const filterDate = new Date(selectedDate).toDateString();
        return diagnosisDate === filterDate;
      });
      return sameDateSessions;
    }
    return diagnoses;
  }, [diagnoses, selectedDate]);

  const currentSession = organizedSessions[currentSessionIndex];
  
  if (!currentSession) {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardContent className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
          <p className="text-sm text-gray-500 mb-4">No sessions available for the selected criteria.</p>
          {selectedDate && (
            <Button variant="outline" onClick={onClearFilter} className="border border-gray-300 text-gray-800 hover:bg-gray-100">
              Clear Date Filter
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Visit History Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Neutral Header */}
        <div className="bg-[#FAFAFA] text-[#172B4C] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#172B4C]" />
            <span className="font-semibold text-base">Visit History</span>
          </div>
          <div className="text-sm text-[#172B4C]">
            {new Date(currentSession.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })} at{' '}
            {new Date(currentSession.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </div>
        </div>

        {/* White Content Area */}
        <div className="p-6">
          {/* Visit Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {new Date(currentSession.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })} at{' '}
                {new Date(currentSession.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </h3>
              <p className="text-sm text-gray-600">Medical Consultation</p>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <span className="text-sm font-medium text-gray-900">Dr {currentSession.doctor}</span>
              {currentSession.confidence && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentSession.confidence >= 70 ? 'bg-green-100 text-green-800' :
                  currentSession.confidence >= 40 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentSession.confidence}% confidence
                </span>
              )}
            </div>
          </div>

          {/* Four Section Grid Layout - API Data Only */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagnosis Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Diagnosis</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                {currentSession.diagnosis && currentSession.diagnosis.trim() ? (
                  currentSession.diagnosis.split(',').map((diag, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">{diag.trim()}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No diagnosis available</span>
                )}
              </div>
            </div>

            {/* Symptoms Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Symptoms</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                {currentSession.symptoms && currentSession.symptoms.length > 0 ? (
                  currentSession.symptoms.map((symptom, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">{symptom}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No symptoms available</span>
                )}
              </div>
            </div>

            {/* Treatment Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <Pill className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Treatment</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                {currentSession.treatment && currentSession.treatment.trim() ? (
                  <div className="bg-green-50 p-3 rounded-md">
                    <span className="text-sm text-green-800">{currentSession.treatment}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No treatment plan available</span>
                )}
              </div>
            </div>

            {/* Allergies Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-gray-800 rounded-sm flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900">Allergies</h4>
              </div>
              <hr className="border-gray-200 mb-4" />
              <div className="space-y-2">
                {currentSession.allergies && currentSession.allergies.length > 0 ? (
                  currentSession.allergies.map((allergy, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">{allergy}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No allergies available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Session Pagination */}
      {selectedDate && organizedSessions.length > 1 && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSessionIndex(Math.max(0, currentSessionIndex - 1))}
              disabled={currentSessionIndex === 0}
              className="px-3 py-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm font-medium text-gray-700 px-4">
              {currentSessionIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSessionIndex(Math.min(organizedSessions.length - 1, currentSessionIndex + 1))}
              disabled={currentSessionIndex === organizedSessions.length - 1}
              className="px-3 py-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

function PatientHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();
  const { user, logout } = useAuth();
  
  // Sidebar state
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  // Check if patient data was passed through navigation state
  const passedPatient = location.state?.patient;
  const [patient, setPatient] = useState(passedPatient || null);

  // Clear navigation state to prevent stale data on browser refresh
  useEffect(() => {
    if (passedPatient && location.state) {
      // Replace current history entry to clear the state
      navigate(location.pathname, { replace: true });
    }
  }, [passedPatient, location.state, location.pathname, navigate]);
  
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredDiagnoses, setFilteredDiagnoses] = useState([]);
  const previousPatientId = useRef(null);
  const isLoadingRef = useRef(false);

  // Combined effect to load patient data and history
  useEffect(() => {
    const loadData = async () => {
      if (!patientId || isLoadingRef.current) return;
      
      const patientChanged = previousPatientId.current !== patientId;
      
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);
        
        // Load patient data only when patient changes and we don't already have it
        if (patientChanged) {
          // Only fetch patient data if we don't have it from navigation state
          if (!passedPatient || (passedPatient.id || passedPatient._id) !== patientId) {
            const patientsResponse = await getPatients();
            if (patientsResponse.success && patientsResponse.data) {
              const patientsData = patientsResponse.data.patients || patientsResponse.data;
              const foundPatient = Array.isArray(patientsData) 
                ? patientsData.find(p => (p.id || p._id) === patientId)
                : null;
              setPatient(foundPatient);
            }
          }
          // If we have passedPatient and IDs match, patient is already set in useState
          previousPatientId.current = patientId;
          
          // Reset to first page when patient changes
          if (currentPage !== 1) {
            setCurrentPage(1);
            return; // Let the next useEffect handle loading with page 1
          }
        }
        
        // Load patient history
        const historyResponse = await getPatientHistory(patientId, currentPage, 10);
        
        if (historyResponse.success && historyResponse.data) {
          setHistoryData(historyResponse.data);
          setFilteredDiagnoses(historyResponse.data.diagnoses || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    if (patientId) {
      loadData();
    }
  }, [patientId, currentPage, passedPatient]);

  // Filter diagnoses by selected date and auto-select most recent date
  useEffect(() => {
    if (!historyData?.diagnoses) return;
    
    // Auto-select most recent date on first load
    if (!selectedDate && historyData.diagnoses.length > 0) {
      const mostRecentDiagnosis = historyData.diagnoses.reduce((latest, current) => {
        return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
      });
      const mostRecentDate = new Date(mostRecentDiagnosis.createdAt).toISOString().split('T')[0];
      setSelectedDate(mostRecentDate);
      return;
    }
    
    if (!selectedDate) {
      setFilteredDiagnoses(historyData.diagnoses);
    } else {
      const filtered = historyData.diagnoses.filter(diagnosis => {
        const diagnosisDate = new Date(diagnosis.createdAt).toDateString();
        const filterDate = new Date(selectedDate).toDateString();
        return diagnosisDate === filterDate;
      });
      setFilteredDiagnoses(filtered);
    }
  }, [selectedDate, historyData]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (historyData?.pagination && currentPage < historyData.pagination.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">No patient selected</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Helper functions for mock data
  const getAvatarUrl = (patient) => {
    const genderPath = patient.gender === 'female' ? 'women' : 'men';
    const seedNumber = Math.abs(patient.name.charCodeAt(0) % 99) + 1;
    return `https://randomuser.me/api/portraits/${genderPath}/${seedNumber}.jpg`;
  };

  const formatPatientAge = (age) => {
    const birthYear = new Date().getFullYear() - age;
    return `${age} years old (Born ${birthYear})`;
  };

  const getLastVisitDate = () => {
    const dates = historyData?.diagnoses?.map(d => new Date(d.createdAt)) || [];
    if (dates.length === 0) return 'No visits recorded';
    const latest = new Date(Math.max(...dates));
    return latest.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SidebarLayout isOpen={isOpen}>
      <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
      
      <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Patient Header Section */}
          <div className="bg-transparent p-6 mb-3">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Patient Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-[#FAFAFA] flex items-center justify-center border-4 border-gray-200">
                  <span className="text-[#172B4C] text-xl font-bold">
                    {patient.name ? patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NA'}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                  <p className="text-gray-600">Complete Medical History And Visit</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-300 focus:border-gray-300 text-sm"
                />
                <Button 
                  className="bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100 text-sm px-4 py-2"
                  onClick={() => navigate(`/patient/${patientId}/schedule`, { 
                    state: { patient: patient } 
                  })}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Visit
                </Button>
              </div>
            </div>
          </div>

          {/* Visit History Cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading patient history...</p>
            </div>
          ) : error ? (
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
                <p className="text-sm text-gray-500">{error}</p>
              </CardContent>
            </Card>
          ) : filteredDiagnoses && filteredDiagnoses.length > 0 ? (
            <VisitHistoryCards 
              diagnoses={filteredDiagnoses} 
              selectedDate={selectedDate}
              onClearFilter={() => setSelectedDate('')}
            />
          ) : (
            <EmptyVisitHistoryCards selectedDate={selectedDate} onClearFilter={() => setSelectedDate('')} />
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

export default PatientHistory;
