  import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { analyzeDiagnosis } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardHeader, CardContent, Input, Select } from './UI';
import SidebarLayout from './SideBar';
import Navbar from './NavBar';
import SpeechCompWithSpeakers from './SpeechCompWithSpeakers';

// Icon components
const Calendar = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const User = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const AlertTriangle = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.350 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const FileText = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Pill = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const ActivityIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Mic = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const CheckCircle = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Flask = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const Edit = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

function ConversationDisplay({ conversation, isRecording, onConversationUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  const handleEdit = () => {
    setEditedText(conversation || '');
    setIsEditing(true);
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

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (chatContainerRef.current && conversation && !isEditing) {
      setTimeout(() => {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [conversation, isEditing]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className={`rounded-lg p-4 flex-1 overflow-y-auto border min-h-0 ${isEditing ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        {isEditing ? (
          <div className="h-full flex flex-col">
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full flex-1 bg-transparent border-none p-0 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none placeholder-gray-400"
              placeholder="Edit your transcription here..."
            />
            <div className="flex justify-end space-x-2 mt-2 pt-2 border-t border-gray-200">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : conversation ? (
          <div className="relative group h-full">
            <div ref={chatContainerRef} className="space-y-3 h-full overflow-y-auto pb-2 scroll-smooth min-h-0">
              {conversation.split('\n').filter(line => line.trim()).map((line, idx) => {
                const lowerLine = line.toLowerCase();
                const isDoctor = lowerLine.includes('doctor:');
                const isPatient = lowerLine.includes('patient:');
                
                let speaker = null;
                let message = line.trim();
                
                if (isDoctor) {
                  speaker = 'Doctor';
                  message = line.split(':').slice(1).join(':').trim();
                } else if (isPatient) {
                  speaker = 'Patient';
                  message = line.split(':').slice(1).join(':').trim();
                }
                
                // Skip empty messages
                if (!message && !speaker) return null;
                
                return (
                  <div key={idx} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      isDoctor 
                        ? 'bg-blue-100 text-blue-900 rounded-br-none' 
                        : 'bg-green-100 text-green-900 rounded-bl-none'
                    }`}>
                      {speaker && (
                        <div className="text-xs font-semibold mb-1 opacity-70">
                          {speaker}
                        </div>
                      )}
                      <div className="text-sm">{message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isRecording && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  className="bg-white shadow-sm"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ) : (
                  <div className="text-center text-gray-500 flex items-center justify-center h-full min-h-[160px]">
            <div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mic className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm">
                {isRecording ? 'Listening... Start speaking to begin transcription.' : 'Enter Clinical Notes Here Or Use Voice Dictation.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleVisit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId } = useParams();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);
  
  // Get patient data from navigation state
  const patient = location.state?.patient;
  
  // Conversation and transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [completeTranscript, setCompleteTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Form state
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (!patientId) {
      navigate('/dashboard');
      return;
    }
    if (!patient) {
      // In a real app, you'd fetch patient details here if not passed
      console.warn("Patient data not passed via state. Fetching would be needed here.");
      // For now, redirect if no patient data
      navigate('/dashboard');
    }
  }, [patientId, patient, navigate]);

  if (!patient) {
    return (
      <SidebarLayout isOpen={isOpen}>
        <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
        <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500">Loading patient data...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Ensure conversation is updated when speakers change
  useEffect(() => {
    if (speakers && speakers.length > 0) {
      const formattedConversation = speakers
        .map(segment => `${segment.speaker === 'A' ? 'Doctor' : 'Patient'}: ${segment.text}`)
        .join('\n');
      console.log('Formatted conversation from speakers:', formattedConversation);
      setConversation(formattedConversation);
    }
  }, [speakers]);

  const handleInputChange = (field, value) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTranscriptUpdate = (transcript) => {
    setCompleteTranscript(transcript);
    if (speakers.length === 0) {
      setConversation(transcript);
    }
  };

  const handleSpeakersUpdate = (speakerData) => {
    setSpeakers(speakerData);
    // The useEffect hook will handle formatting the conversation
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
    setClearTrigger(prev => prev + 1);
  };

  const handleSendForDiagnosis = async () => {
    if (!patient || !conversation.trim()) {
      toast.error('Please ensure there is conversation text to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      const patientId = patient.id || patient._id;
      if (isRecording) {
        setIsRecording(false);
      }
      
      const response = await analyzeDiagnosis(
        patientId,
        conversation.trim()
      );

      if (response.success && response.data && response.data.analysis) {
        setDiagnosis(response.data.analysis);
        toast.success('Diagnosis analysis completed successfully!');
      } else {
        throw new Error(response.message || 'Failed to analyze conversation');
      }
    } catch (error) {
      console.error('Diagnosis analysis error:', error);
      toast.error(error.message || 'Failed to analyze conversation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompleteVisit = () => {
    // TODO: Implement visit completion API call
    console.log('Completing visit:', { appointmentData, diagnosis, conversation });
    toast.success('Visit completed successfully!');
    // Navigate to the specific session history if diagnosis exists
    if (diagnosis && diagnosis._id) {
      navigate(`/patient/${patientId}/history`, { 
        state: { 
          patient: patient,
          sessionId: diagnosis._id,
          scrollToSession: true 
        } 
      });
    } else {
      navigate(`/patient/${patientId}/history`, { state: { patient } });
    }
  };

  const handleOrderLabTests = () => {
    // Navigate to radiology page
    navigate('/radiology', { 
      state: { 
        patient: patient,
        fromScheduleVisit: true
      } 
    });
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <SidebarLayout isOpen={isOpen}>
      <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
      
      <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Patient Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-[#FAFAFA] flex items-center justify-center border border-gray-200">
                <span className="text-[#172B4C] text-lg font-bold">
                  {getInitials(patient.name)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <div className="flex items-center space-x-3">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    In Progress
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <Button 
                  className="bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center space-x-2"
                  onClick={() => setIsRecording(true)}
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Conversation</span>
                </Button>
              ) : (
                <>
                  <Button 
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    onClick={() => setIsRecording(false)}
                  >
                    Stop
                  </Button>
                  <Button 
                    variant="outline"
                    className="px-4 py-2 rounded-lg border-gray-300 hover:bg-gray-50"
                    onClick={handleClearConversation}
                  >
                    Clear
                  </Button>
                </>
              )}
              {!isRecording && conversation && (
                <Button 
                  className="bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100 px-4 py-2 rounded-lg"
                  onClick={handleSendForDiagnosis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              )}
            </div>
          </div>

          {/* Patient Information and Allergies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="bg-red-700 px-4 py-3 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-base">Patient Information</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Name</span>
                    <span className="text-sm text-gray-900 font-medium">{patient.name}</span>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Age</span>
                    <span className="text-sm text-gray-900 font-medium">{patient.age} years</span>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 flex justify-between items-center lg:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Gender</span>
                    <span className="text-sm text-gray-900 font-medium capitalize">{patient.gender}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="bg-red-700 px-4 py-3 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-base">Allergies</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Known Allergies</span>
                </div>
                 <div className="min-h-[80px] border border-gray-200 rounded-md p-3 flex items-center justify-center">
                  {diagnosis?.allergies && diagnosis.allergies.length > 0 ? (
                    <div className="space-y-1 w-full">
                      {diagnosis.allergies.map((allergy, idx) => (
                        <div key={idx} className="flex items-center">
                          <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700">{allergy}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No known allergies</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Transcription and Diagnosis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Transcription */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full">
              <CardHeader className="bg-red-700 px-4 py-3 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-base">Transcription</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col min-h-[300px]">
                <ConversationDisplay 
                  conversation={conversation}
                  isRecording={isRecording}
                  onConversationUpdate={handleConversationUpdate}
                />
              </CardContent>
            </Card>

            {/* Diagnosis & Next Steps */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col w-full">
              <CardHeader className="bg-red-700 px-4 py-3 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <ActivityIcon className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-base">Diagnosis & Next Steps</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 flex-1 min-h-[300px]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms:
                  </label>
                   <div className="min-h-[60px] border border-gray-200 rounded-md p-3">
                    {diagnosis?.symptoms && diagnosis.symptoms.length > 0 ? (
                      <div className="space-y-1">
                        {diagnosis.symptoms.map((symptom, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700">{symptom}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No symptoms identified</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis:
                  </label>
                   <div className="min-h-[60px] border border-gray-200 rounded-md p-3">
                    {diagnosis?.diagnosisData && diagnosis.diagnosisData.length > 0 ? (
                      <div className="space-y-2 w-full">
                        {diagnosis.diagnosisData.map((diagItem, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-700 font-medium">{diagItem.condition}</span>
                            </div>
                            <span className="text-xs text-gray-500">{diagItem.confidence}%</span>
                          </div>
                        ))}
                      </div>
                    ) : diagnosis?.diagnosis ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{diagnosis.diagnosis}</span>
                        </div>
                        {diagnosis.confidence && (
                          <span className="text-xs text-gray-500">{diagnosis.confidence}%</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No diagnosis available</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Steps (Treatment)
                  </label>
                   <div className="min-h-[80px] border border-gray-200 rounded-md p-3">
                    {diagnosis?.treatment ? (
                      <span className="text-sm text-gray-700">{diagnosis.treatment}</span>
                    ) : (
                      <span className="text-sm text-gray-500">No treatment plan available</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SpeechCompWithSpeakers component - positioned off-screen but functional */}
          <div className="absolute -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
            <SpeechCompWithSpeakers 
              onTranscriptUpdate={handleTranscriptUpdate}
              onSpeakersUpdate={handleSpeakersUpdate}
              selectedPatient={patient}
              isRecording={isRecording}
              onRecordingToggle={setIsRecording}
              clearTrigger={clearTrigger}
              onTranscriptionStatusChange={setIsTranscribing}
            />
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              className="text-sm px-4 py-2 border border-[black] text-[black] hover:bg-gray-100"
              onClick={handleOrderLabTests}
            >
              <Flask className="w-4 h-4 mr-2" />
              Order Lab Tests
            </Button>
            <Button 
              className="bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100 text-sm px-4 py-2"
              onClick={handleCompleteVisit}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Visit
            </Button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default ScheduleVisit;