import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createPatient, getPatients, analyzeDiagnosis } from '../api/api';
import { useAuth } from '../context/AuthContext';
import VoiceRecorder from './VoiceRecorder';
import { Button, Card, CardHeader, CardContent, Input, Select, Modal, Badge } from './UI';

const Plus = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const User = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

const History = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Send = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const Trash = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const RefreshCw = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

function PatientCard({ patient, onSelect, isSelected }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelect && typeof onSelect === 'function') {
      onSelect(patient);
    }
  };

  return (
    <div 
      className={`cursor-pointer transition-all duration-200 bg-white rounded-xl border border-gray-200 shadow-sm ${isSelected ? 'ring-2 ring-gray-900' : 'hover:shadow-md'}`}
      onClick={handleClick}
      style={{ userSelect: 'none' }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
            <p className="text-sm text-gray-500">{patient.gender}, {patient.age} years</p>
          </div>
          {isSelected && (
            <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationDisplay({ conversation, isRecording }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Conversation</h3>
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">Recording...</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 min-h-32 max-h-64 overflow-y-auto">
          {conversation ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{conversation}</p>
          ) : (
            <div className="text-center text-gray-500">
              {/* <p className="text-sm italic">Start recording to see conversation...</p> */}
              <p className="text-xs mt-1">Click the microphone to begin</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DiagnosisResult({ diagnosis }) {
  if (!diagnosis) return null;
  const symptoms = diagnosis.Symptoms || diagnosis.symptoms || [];
  const possibleDiagnoses = diagnosis['Possible Diagnosis'] || diagnosis['Potential Diagnosis'] || diagnosis.diagnosis || [];

  return (
    <div className="mt-4 space-y-4">
      {/* Symptoms Section */}
      {symptoms && symptoms.length > 0 && (
        <Card className="border-gray-200 bg-white">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Symptoms</h3>
            </div>
            <div className="space-y-3">
              {symptoms.map((symptom, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                  <p className="text-gray-700">{symptom}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      
      {/* Possible Diagnoses Section */}
      {possibleDiagnoses && possibleDiagnoses.length > 0 && (
        <Card className="border-gray-200 bg-white">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Possible Diagnosis</h3>
            </div>
            <div className="space-y-3">
              {Array.isArray(possibleDiagnoses) ? (
                possibleDiagnoses.map((diagnosisItem, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                    <p className="text-gray-700">{diagnosisItem}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-4 flex-shrink-0"></div>
                  <p className="text-gray-700">{possibleDiagnoses}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const hasLoadedPatients = useRef(false);
  const isLoadingPatients = useRef(false);

  const handlePatientSelect = (patient) => {
    if (patient && (patient.id || patient._id)) {
      setSelectedPatient(patient);
      setConversation('');
      setDiagnosis(null);
      setIsRecording(false);
    }
  };
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: ''
  });

  useEffect(() => {
    if (!hasLoadedPatients.current) {
      hasLoadedPatients.current = true;
      loadPatients();
    }
  }, []);

  const loadPatients = useCallback(async () => {
    if (isLoadingPatients.current) return; // Prevent multiple concurrent calls
    
    try {
      isLoadingPatients.current = true;
      setLoading(true);
      
      const response = await getPatients();
      if (response.success && response.data) {
        // Handle both response.data.patients and response.data directly
        const patientsData = response.data.patients || response.data;
        const validPatients = Array.isArray(patientsData) ? patientsData : [];
        setPatients(validPatients);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients. Please refresh the page.');
      setPatients([]);
    } finally {
      setLoading(false);
      isLoadingPatients.current = false;
    }
  }, []);

  const handleCreatePatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(newPatient.name.trim())) {
      toast.error('Patient name can only contain letters and spaces');
      return;
    }

    const age = parseInt(newPatient.age);
    if (isNaN(age) || age < 1 || age > 150) {
      toast.error('Please enter a valid age between 1 and 150');
      return;
    }

    try {
      const response = await createPatient({
        name: newPatient.name.trim(),
        age: age,
        gender: newPatient.gender
      });

      if (response.success && response.data) {
        const newPatientData = response.data.patient || response.data;
        if (newPatientData && (newPatientData.id || newPatientData._id)) {
          setPatients([...patients, newPatientData]);
          setNewPatient({ name: '', age: '', gender: '' });
          setShowCreatePatient(false);
          toast.success(`Patient "${newPatient.name}" created successfully!`);
        }
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Failed to create patient. Please try again.');
    }
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setDiagnosis(null);
    }
  };

  const handleTranscriptUpdate = (transcript) => {
    setConversation(transcript);
  };

  const handleClearConversation = () => {
    setConversation('');
    setDiagnosis(null);
    setIsRecording(false);
  };

  const handleSendForDiagnosis = async () => {
    if (!selectedPatient || !conversation.trim()) return;

    try {
      setIsAnalyzing(true);
      const patientId = selectedPatient.id || selectedPatient._id;
      
      const response = await analyzeDiagnosis(patientId, conversation);
      
      if (response.success && response.data && response.data.analysis) {
        setDiagnosis(response.data.analysis);
        if (isRecording) {
          setIsRecording(false);
        }
        toast.success('Diagnosis analysis completed successfully!');
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      toast.error('Failed to analyze conversation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => selectedPatient && navigate(`/patient/${selectedPatient.id || selectedPatient._id}/history`, { 
                    state: { patient: selectedPatient } 
                  })}
                  disabled={!selectedPatient}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <History className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Patient History</span>
                  <span className="sm:hidden">History</span>
                </Button>
                <Button 
                  onClick={() => setShowCreatePatient(true)}
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Patient</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading patients...</p>
                </div>
              ) : patients.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No patients yet</p>
                    <p className="text-xs text-gray-400">Create your first patient</p>
                  </CardContent>
                </Card>
              ) : (
                patients.map((patient) => (
                  <PatientCard
                    key={patient.id || patient._id}
                    patient={patient}
                    onSelect={handlePatientSelect}
                    isSelected={selectedPatient && ((selectedPatient._id || selectedPatient.id) === (patient._id || patient.id))}
                  />
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <>
                
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{selectedPatient.name}</h3>
                        <p className="text-sm text-gray-500">{selectedPatient.gender}, {selectedPatient.age} years</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        
                        {/* Show voice recorder and diagnosis buttons when no diagnosis */}
                        {!diagnosis && (
                          <>
                            <VoiceRecorder
                              isRecording={isRecording}
                              onRecordingToggle={handleRecordingToggle}
                              onTranscriptUpdate={handleTranscriptUpdate}
                              conversationText={conversation}
                            />
                            
                            {/* Clear conversation button */}
                            <Button
                              onClick={handleClearConversation}
                              disabled={!conversation.trim() && !isRecording}
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Clear
                            </Button>
                            
                            <Button
                              onClick={handleSendForDiagnosis}
                              disabled={!conversation.trim() || isAnalyzing}
                              variant={conversation.trim() ? 'primary' : 'secondary'}
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Send for Diagnosis'}</span>
                              <span className="sm:hidden">{isAnalyzing ? 'Analyzing...' : 'Send'}</span>
                            </Button>
                          </>
                        )}
                        
                        {/* Show new analysis button when diagnosis is available */}
                        {diagnosis && (
                          <Button
                            onClick={handleClearConversation}
                            variant="primary"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            New Analysis
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {!diagnosis && (
                  <ConversationDisplay conversation={conversation} isRecording={isRecording} />
                )}
                
                <DiagnosisResult diagnosis={diagnosis} />
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                  <p className="text-sm text-gray-500">Choose a patient to start conversation recording</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCreatePatient}
        onClose={() => setShowCreatePatient(false)}
        title="Create New Patient"
      >
        <div className="space-y-4">
          <Input
            label="Patient Name"
            value={newPatient.name}
            onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            placeholder="Enter patient name"
          />
          
          <Input
            label="Age"
            type="number"
            value={newPatient.age}
            onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
            placeholder="Enter age"
            min="1"
            max="150"
          />
          
          <Select
            label="Gender"
            value={newPatient.gender}
            onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
            placeholder="Select gender"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              onClick={handleCreatePatient}
              disabled={!newPatient.name || !newPatient.age || !newPatient.gender}
              className="flex-1"
            >
              Create Patient
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreatePatient(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;