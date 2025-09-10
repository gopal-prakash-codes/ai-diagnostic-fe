import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getPatientHistory, getPatients } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardContent } from './UI';

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
            <h4 className="text-sm font-medium text-gray-900 mb-3">Treatment</h4>
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

function PatientHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();
  const { user, logout } = useAuth();
  
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
        }
      } catch (err) {
        console.error('Error loading data:', err);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-gray-900" />
              <span className="ml-2 text-xl font-semibold text-gray-900">AI Doctor</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Dr. {user.firstName} {user.lastName}
              </span>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Patient History</h1>
          </div>
        </div>

        {/* Patient Details Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-gray-600">Age: {patient.age} years</span>
                  <span className="text-gray-600">Gender: {patient.gender}</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Patient ID: {patient.id || patient._id}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading patient history...</p>
          </div>
        ) : error ? (
          <Card>
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
        ) : historyData && historyData.diagnoses && historyData.diagnoses.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Diagnosis History ({historyData.pagination?.total || historyData.diagnoses.length} total)
              </h3>
            </div>
            <div className="space-y-4">
              {historyData.diagnoses.map((diagnosis) => (
                <DiagnosisHistoryCard 
                  key={diagnosis._id} 
                  diagnosis={diagnosis} 
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {historyData.pagination && historyData.pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex items-center">
                  {/* <p className="text-sm text-gray-700">
                    page <span className="font-medium">{historyData.pagination.page}</span> of{' '}
                    <span className="font-medium">{historyData.pagination.pages}</span> pages
                  </p> */}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: historyData.pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        variant={currentPage === pageNum ? 'primary' : 'outline'}
                        size="sm"
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === historyData.pagination.pages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No History Found</h3>
              <p className="text-sm text-gray-500">This patient doesn't have any diagnosis history yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default PatientHistory;
