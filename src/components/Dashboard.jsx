import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createPatient, getPatients, analyzeDiagnosis } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardContent, Input, Select, Modal, Badge } from './UI';
import SpeechCompWithSpeakers from './SpeechCompWithSpeakers';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { FiPlus } from "react-icons/fi";
import { HiOutlineUser } from "react-icons/hi";
import { FaUserMd } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import { MdHistory } from "react-icons/md";
import { IoSendOutline } from "react-icons/io5";
import { HiOutlineTrash } from "react-icons/hi";
import { IoRefreshOutline } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { IoCheckmarkOutline } from "react-icons/io5";
import { IoCloseOutline } from "react-icons/io5";

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
      className={`cursor-pointer transition-all duration-200 bg-white rounded-lg border border-gray-200 shadow-sm ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-md hover:border-gray-300'}`}
      onClick={handleClick}
      style={{ userSelect: 'none' }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <HiOutlineUser className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
            <p className="text-xs text-gray-500">{patient.gender}, {patient.age}y</p>
          </div>
          {isSelected && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationDisplay({ conversation, isRecording, onConversationUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const textareaRef = useRef(null);

  const handleEdit = () => {
    setEditedText(conversation || '');
    setIsEditing(true);
    // Focus textarea after render
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
      }
    }, 100);
  };

  const handleSave = () => {
    if (onConversationUpdate) {
      onConversationUpdate(editedText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText('');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Transcription</h3>
          <div className="flex items-center space-x-2">
            {conversation && !isRecording && !isEditing && (
              <Button
                onClick={handleEdit}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                <MdOutlineEdit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            {isEditing && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  onClick={handleSave}
                  variant="primary"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                >
                  <IoCheckmarkOutline className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                >
                  <IoCloseOutline className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">Recording...</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`rounded-lg p-4 min-h-40 max-h-80 overflow-y-auto border mt-4 ${isEditing ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-64 bg-transparent border-none p-0 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none placeholder-gray-400"
              placeholder="Edit your transcription here..."
            />
          ) : conversation ? (
            <div className="relative group">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pt-2">{conversation}</p>
              {!isRecording && (
                <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    size="sm"
                    className="bg-white shadow-sm"
                  >
                    <MdOutlineEdit className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 flex items-center justify-center h-32">
              <div>
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-sm">Click the microphone to start recording</p>
              </div>
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
  const diagnosisData = diagnosis.diagnosisData || [];
  const treatment = diagnosis.treatment || diagnosis['Possible Treatment'] || diagnosis.possible_treatment || '';
  const confidence = diagnosis.confidence || 0;

  // Helper function to capitalize first word
  const capitalizeFirstWord = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

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
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-1.5"></div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">{capitalizeFirstWord(symptom)}</p>
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
              {diagnosisData && diagnosisData.length > 0 ? (
                diagnosisData.map((diagnosisItem, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm sm:text-base break-words">{diagnosisItem.condition}</p>
                    </div>
                    <span className={`ml-5 sm:ml-3 px-2 py-1 text-xs font-medium rounded-full self-start sm:self-auto ${
                      diagnosisItem.confidence >= 80 ? 'bg-green-100 text-green-800' :
                      diagnosisItem.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {diagnosisItem.confidence}%
                    </span>
                  </div>
                ))
              ) : Array.isArray(possibleDiagnoses) ? (
                possibleDiagnoses.map((diagnosisItem, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-1.5"></div>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">{diagnosisItem}</p>
                  </div>
                ))
              ) : possibleDiagnoses ? (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-1.5"></div>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">{possibleDiagnoses}</p>
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      )}
      
      {/* Treatment Section */}
      {treatment && (
        <Card className="border-gray-200 bg-white">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-700 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Treatment plan</h3>
              </div>
              {confidence > 0 && (
                <span className={`ml-8 sm:ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                  confidence >= 80 ? 'bg-green-100 text-green-800' :
                  confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {confidence}% 
                </span>              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 sm:mr-4 flex-shrink-0 mt-1.5"></div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{treatment}</p>
              </div>
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
      // MODIFIED: Don't clear conversation when selecting patient - allow continuation
      // setConversation(''); // REMOVED
      setDiagnosis(null);
      setIsRecording(false);
    }
  };

  const [isOpen, setIsOpen] = useState(true); 

  const toggleSidebar = () => setIsOpen(!isOpen);

  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [completeTranscript, setCompleteTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: ''
  });

  // Ensure conversation is updated when speakers change
  useEffect(() => {
    if (speakers && speakers.length > 0) {
      const formattedConversation = speakers
        .map(segment => `${segment.speaker === 'A' ? 'Doctor' : 'Patient'}: ${segment.text}`)
        .join('\n');
      setConversation(formattedConversation);
    }
  }, [speakers]);


  useEffect(() => {
    if (!hasLoadedPatients.current) {
      hasLoadedPatients.current = true;
      loadPatients();
    }
  }, []);

  const loadPatients = useCallback(async () => {
    if (isLoadingPatients.current) return; 
    
    try {
      isLoadingPatients.current = true;
      setLoading(true);
      
      const response = await getPatients();
      if (response.success && response.data) {
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
  };

  const handleTranscriptUpdate = (transcript) => {
    setCompleteTranscript(transcript);
    if (speakers.length === 0) {
      setConversation(transcript);
    }
  };

  const handleSpeakersUpdate = (speakerData) => {
    setSpeakers(speakerData);
    if (speakerData && speakerData.length > 0) {
      const formattedConversation = speakerData
        .map(segment => `${segment.speaker === 'A' ? 'Doctor' : 'Patient'}: ${segment.text}`)
        .join('\n');
      setConversation(formattedConversation);
    }
  };

  const handleConversationUpdate = (updatedConversation) => {
    setConversation(updatedConversation);
  };

  const handleClearConversation = () => {
    setConversation('');
    setSpeakers([]);
    setCompleteTranscript('');
    setDiagnosis(null);
    setIsRecording(false);
    // Trigger clear in the SpeechCompWithSpeakers component
    setClearTrigger(prev => prev + 1);
  };

  const handleSendForDiagnosis = async () => {
    if (!selectedPatient || !conversation.trim()) {
      toast.error('Please select a patient and ensure there is conversation text to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      const patientId = selectedPatient.id || selectedPatient._id;
      
      // Stop recording if still active
      if (isRecording) {
        setIsRecording(false);
      }
      
      // Use the complete transcript if it's longer than the speaker-formatted conversation
      let finalConversation = conversation;
      
      // Check if we have a complete transcript that's longer than the speaker segments
      if (completeTranscript && completeTranscript.length > conversation.length) {
        finalConversation = completeTranscript;
      }
      
      const isExtension = diagnosis !== null;
      const response = await analyzeDiagnosis(patientId, finalConversation, isExtension);
      
      if (response.success && response.data && response.data.analysis) {
        setDiagnosis(response.data.analysis);
        toast.success('Diagnosis analysis completed successfully!');
      } else {
        toast.error('Analysis completed but no diagnosis data received');
      }
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      toast.error(error.message || 'Failed to analyze conversation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SidebarLayout isOpen={isOpen}>
      <div className="min-h-screen bg-gray-50">
        <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />

        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Column - Patient History (3/12 = 25%) */}
            <div className="md:col-span-1 lg:col-span-3">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
                  <Button 
                    onClick={() => setShowCreatePatient(true)}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <FiPlus className="w-4 h-4" />
                  </Button>
                </div>
                {selectedPatient && (
                  <Button 
                    variant="outline" 
                    onClick={() => selectedPatient && navigate(`/patient/${selectedPatient.id || selectedPatient._id}/history`, { 
                      state: { patient: selectedPatient } 
                    })}
                    size="sm"
                    className="w-full"
                  >
                    <MdHistory className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                )}
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
                      <HiOutlineUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

            {/* Middle Column - Transcription (6/12 = 50%) */}
            <div className="md:col-span-1 lg:col-span-6">
              {selectedPatient ? (
                <>
                  <Card>
                    <CardHeader className="p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{selectedPatient.name}</h3>
                            <p className="text-sm text-gray-500">{selectedPatient.gender}, {selectedPatient.age} years old</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                          <Button
                            onClick={handleSendForDiagnosis}
                            disabled={!conversation.trim() || isAnalyzing || isRecording}
                            variant={conversation.trim() && !isRecording ? 'primary' : 'secondary'}
                            size="sm"
                            className="flex-1"
                          >
                            <IoSendOutline className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              {isAnalyzing ? 'Analyzing...' : isRecording ? 'Stop Recording First' : 'Analyze Conversation'}
                            </span>
                          </Button>
                          
                          {/* Show new analysis button when diagnosis is available */}
                          {(diagnosis || conversation.trim()) && (
                            <Button
                              onClick={handleClearConversation}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              <IoRefreshOutline className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">New Session</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Live Transcription with Speaker Detection */}
                  <SpeechCompWithSpeakers 
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onSpeakersUpdate={handleSpeakersUpdate}
                    selectedPatient={selectedPatient}
                    isRecording={isRecording}
                    onRecordingToggle={setIsRecording}
                    clearTrigger={clearTrigger}
                    onTranscriptionStatusChange={setIsTranscribing}
                  />
                </>
              ) : (
                <Card className="h-fit">
                  <CardContent className="text-center py-20">
                    <FaUserMd className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Select a Patient</h3>
                    <p className="text-gray-500">Choose a patient from the left panel to start recording and analyzing conversations</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              {selectedPatient && diagnosis && (
                <DiagnosisResult diagnosis={diagnosis} />
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
    </SidebarLayout>
  );
}

export default Dashboard;