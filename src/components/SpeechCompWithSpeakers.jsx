import { useState, useRef, useEffect } from "react";
import { transcribeWithSpeakers } from "../api/api";
import { toast } from 'react-toastify';
import SpeakerChat from './SpeakerChat';

export default function SpeechCompWithSpeakers({ onTranscriptUpdate, onSpeakersUpdate, selectedPatient, isRecording, onRecordingToggle, clearTrigger, onTranscriptionStatusChange }) {
  const [transcript, setTranscript] = useState("");
  const [speakers, setSpeakers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribingChunks, setIsTranscribingChunks] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartTime = useRef(null);
  const chunkIntervalRef = useRef(null);
  const isProcessingLiveRef = useRef(false);
  const chunkQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
  
  const speakerMappingRef = useRef(new Map());
  const lastRecordingSessionRef = useRef(null);
  const newSessionAudioChunksRef = useRef([]);
  useEffect(() => {
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  useEffect(() => {
    if (onSpeakersUpdate) {
      onSpeakersUpdate(speakers);
    }
  }, [speakers, onSpeakersUpdate]);
  useEffect(() => {
    const checkTranscriptionStatus = () => {
      const isTranscribing = isProcessingLiveRef.current || isProcessingQueueRef.current || chunkQueueRef.current.length > 0;
      setIsTranscribingChunks(isTranscribing);
      if (onTranscriptionStatusChange) {
        onTranscriptionStatusChange(isTranscribing);
      }
    };

    const interval = setInterval(checkTranscriptionStatus, 200); 
    return () => clearInterval(interval);
  }, [onTranscriptionStatusChange]);

  useEffect(() => {
    if (clearTrigger) {
      setTranscript("");
      setSpeakers([]);
      setIsTranscribingChunks(false);
      audioChunksRef.current = [];
      chunkQueueRef.current = [];
      newSessionAudioChunksRef.current = [];
      speakerMappingRef.current.clear();
      lastRecordingSessionRef.current = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (onRecordingToggle) {
        onRecordingToggle(false);
      }
    }
  }, [clearTrigger, onRecordingToggle]);

  const startRecording = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1,
          latency: 0.01,
          advanced: [{
            googEchoCancellation: {exact: false},
            googAutoGainControl: {exact: false},
            googNoiseSuppression: {exact: false},
            googHighpassFilter: {exact: false},
            googTypingNoiseDetection: {exact: false}
          }]
        }
      });
      
      streamRef.current = stream;
      chunkQueueRef.current = [];
      newSessionAudioChunksRef.current = [];
      lastRecordingSessionRef.current = Date.now();
      recordingStartTime.current = Date.now();
      let mimeType;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav'; 
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else {
        mimeType = 'audio/webm;codecs=pcm'; 
      }
      
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          newSessionAudioChunksRef.current.push(e.data);
          await processLiveChunk(e.data, mimeType);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunkIntervalRef.current) {
          clearInterval(chunkIntervalRef.current);
          chunkIntervalRef.current = null;
        }
        
        await processRemainingChunks(mimeType);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (e) => {
        toast.error("Recording error occurred");
        stopRecording();
      };
      mediaRecorder.start(10000); 

      if (onRecordingToggle) {
        onRecordingToggle(true);
      }
      
      toast.success("Recording continued - adding to existing conversation!");

    } catch (err) {
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  const processChunkQueue = async (mimeType) => {
    if (isProcessingQueueRef.current || chunkQueueRef.current.length === 0) {
      return;
    }

    try {
      isProcessingQueueRef.current = true;

      while (chunkQueueRef.current.length > 0) {
        const queuedChunk = chunkQueueRef.current.shift();
        
        try {
          const hasExistingSpeakers = speakers.length > 0;
          const chunksToProcess = hasExistingSpeakers ? newSessionAudioChunksRef.current : audioChunksRef.current;
          const allChunksBlob = new Blob(chunksToProcess, { type: mimeType });
          if (chunksToProcess.length >= 1 && allChunksBlob.size > 50000) {
            const formData = new FormData();
            formData.append("file", allChunksBlob, `queued-audio-${hasExistingSpeakers ? 'session' : 'full'}-${Date.now()}.webm`);
            
            const res = await transcribeWithSpeakers(formData); 
            
            if (res && res.success) {
              if (res.speakers && res.speakers.length > 0) {
                let processedSpeakers = optimizeSpeakersOnFrontend(res.speakers);
                
                if (hasExistingSpeakers) {
                  processedSpeakers = mapSpeakersForContinuity(processedSpeakers, speakers);
                  const mergedSpeakers = [...speakers, ...processedSpeakers];
                  setSpeakers(mergedSpeakers);
                } else {
                  setSpeakers(processedSpeakers);
                }
                
                if (res.text) {
                  setTranscript(prevTranscript => {
                    if (prevTranscript && res.text && !res.text.includes(prevTranscript)) {
                      return prevTranscript + '\n' + res.text;
                    }
                    return res.text;
                  });
                }
              } else if (res.text) {
                setTranscript(prevTranscript => {
                  if (prevTranscript && res.text && !res.text.includes(prevTranscript)) {
                    return prevTranscript + '\n' + res.text;
                  }
                  return res.text;
                });
              }
            }
          }
        } catch (err) {
        }
      }
    } catch (err) {
    } finally {
      isProcessingQueueRef.current = false;
    }
  };
  const processLiveChunk = async (audioData, mimeType) => {
    if (isProcessingLiveRef.current) {
      chunkQueueRef.current.push(audioData);
      return;
    }

    try {
      isProcessingLiveRef.current = true;
      
      const hasExistingSpeakers = speakers.length > 0;
      const chunksToProcess = hasExistingSpeakers ? newSessionAudioChunksRef.current : audioChunksRef.current;
      const allChunksBlob = new Blob(chunksToProcess, { type: mimeType });
      
      if (chunksToProcess.length >= 1 && allChunksBlob.size > 50000) { 
        const formData = new FormData();
        formData.append("file", allChunksBlob, `live-audio-${hasExistingSpeakers ? 'session' : 'full'}-${Date.now()}.webm`);
        
        const res = await transcribeWithSpeakers(formData); 
        
        if (res && res.success) {
          if (res.speakers && res.speakers.length > 0) {
            let processedSpeakers = optimizeSpeakersOnFrontend(res.speakers);
            
            if (hasExistingSpeakers) {
              processedSpeakers = mapSpeakersForContinuity(processedSpeakers, speakers);
              
              const mergedSpeakers = [...speakers, ...processedSpeakers];
              setSpeakers(mergedSpeakers);
            } else {
              setSpeakers(processedSpeakers);
            }
            
            if (res.text) {
              setTranscript(prevTranscript => {
                if (prevTranscript && res.text && !res.text.includes(prevTranscript)) {
                  return prevTranscript + '\n' + res.text;
                }
                return res.text;
              });
            }
          } else if (res.text) {
            setTranscript(prevTranscript => {
              if (prevTranscript && res.text && !res.text.includes(prevTranscript)) {
                return prevTranscript + '\n' + res.text;
              }
              return res.text;
            });
          }
        }
      }
    } catch (err) {
    } finally {
      isProcessingLiveRef.current = false;
      
      if (chunkQueueRef.current.length > 0) {
        processChunkQueue(mimeType).catch(err => {
        });
      }
    }
  };
  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/\s+/g, ' ').trim();
  };

  const mapSpeakersForContinuity = (newSpeakers, existingSpeakers) => {
    if (!newSpeakers || newSpeakers.length === 0) return [];
    if (!existingSpeakers || existingSpeakers.length === 0) return newSpeakers;

    const existingSpeakerLabels = [...new Set(existingSpeakers.map(s => s.speaker))];
    const newSpeakerLabels = [...new Set(newSpeakers.map(s => s.speaker))];
    
    if (existingSpeakerLabels.length === newSpeakerLabels.length) {
      const mapping = new Map();
      
      newSpeakerLabels.forEach((newLabel, index) => {
        if (index < existingSpeakerLabels.length) {
          mapping.set(newLabel, existingSpeakerLabels[index]);
        }
      });

      return newSpeakers.map(speaker => ({
        ...speaker,
        speaker: mapping.get(speaker.speaker) || speaker.speaker
      }));
    }

    const nextLabel = existingSpeakerLabels.length > 0 ? 
      String.fromCharCode(Math.max(...existingSpeakerLabels.map(l => l.charCodeAt(0))) + 1) : 'A';
    
    return newSpeakers.map((speaker, index) => ({
      ...speaker,
      speaker: String.fromCharCode(nextLabel.charCodeAt(0) + (index % 2))
    }));
  };
  const optimizeSpeakersOnFrontend = (speakers) => {
    if (!speakers || speakers.length === 0) return [];
    const optimized = [];

    for (const speaker of speakers) {
      const cleanedText = cleanText(speaker.text);
      if (!cleanedText || cleanedText.length < 2) continue;

      const optimizedSpeaker = {
        ...speaker,
        text: cleanedText,
        speaker: speaker.speaker 
      };

      const lastSpeaker = optimized[optimized.length - 1];
      if (lastSpeaker && 
          lastSpeaker.speaker === optimizedSpeaker.speaker && 
          (optimizedSpeaker.start - lastSpeaker.end) < 2000) {
        lastSpeaker.text += ' ' + optimizedSpeaker.text;
        lastSpeaker.end = optimizedSpeaker.end;
        lastSpeaker.confidence = Math.max(lastSpeaker.confidence, optimizedSpeaker.confidence);
      } else {
        optimized.push(optimizedSpeaker);
      }
    }

    return optimized;
  };

  const processRemainingChunks = async (mimeType) => {
    if (isProcessingLiveRef.current || isProcessingQueueRef.current) {
      isProcessingLiveRef.current = false;
      isProcessingQueueRef.current = false;
    }
    
    if (chunkQueueRef.current.length > 0) {
      await processChunkQueue(mimeType);
    }
    
    if (audioChunksRef.current.length === 0) {
      return;
    }

    try {
      isProcessingLiveRef.current = true;
      
      const hasExistingSpeakers = speakers.length > 0;
      const chunksToProcess = hasExistingSpeakers ? newSessionAudioChunksRef.current : audioChunksRef.current;
      const allChunksBlob = new Blob(chunksToProcess, { type: mimeType });
      
      const formData = new FormData();
      formData.append("file", allChunksBlob, `final-speaker-audio-${hasExistingSpeakers ? 'session' : 'full'}-${Date.now()}.webm`);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Final processing timeout')), 30000);
      });
      
      const res = await Promise.race([
        transcribeWithSpeakers(formData),
        timeoutPromise
      ]);
      
      if (res && res.success) {
        if (res.speakers && res.speakers.length > 0) {
          let processedSpeakers = optimizeSpeakersOnFrontend(res.speakers);
          
          if (hasExistingSpeakers) {
            processedSpeakers = mapSpeakersForContinuity(processedSpeakers, speakers);
            const mergedSpeakers = [...speakers, ...processedSpeakers];
            setSpeakers(mergedSpeakers);
          } else {
            setSpeakers(processedSpeakers);
          }
          
          if (res.text) {
            setTranscript(prevTranscript => {
              if (prevTranscript && res.text && !res.text.includes(prevTranscript)) {
                return prevTranscript + '\n' + res.text;
              }
              return res.text;
            });
          }
          
          toast.success("Final speaker detection completed - conversation updated!");
        } else if (res.text) {
          setTranscript(prevTranscript => {
            if (prevTranscript && res.text && !res.text.includes(prevTranscript)) {
              return prevTranscript + '\n' + res.text;
            }
            return res.text;
          });
          toast.success("Final transcription completed - conversation updated!");
        } else {
          toast.info("No additional speech detected in remaining audio");
        }
      } else {
        toast.warning("Final processing failed, but live conversation was captured");
      }
    } catch (err) {
      toast.warning(`Final processing error: ${err.message}, but live conversation was captured`);
    } finally {
      isProcessingLiveRef.current = false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (onRecordingToggle) {
      onRecordingToggle(false);
    }
    
    toast.info("Recording stopped - processing remaining audio for speaker detection...");
  };

  const clearConversation = () => {
    setTranscript("");
    setSpeakers([]);
    audioChunksRef.current = [];
    chunkQueueRef.current = [];
    newSessionAudioChunksRef.current = [];
    speakerMappingRef.current.clear();
    lastRecordingSessionRef.current = null;
    
    if (onTranscriptUpdate) {
      onTranscriptUpdate("");
    }
    if (onSpeakersUpdate) {
      onSpeakersUpdate([]);
    }
    toast.info("Conversation cleared - ready for new session");
  };

  const getRecordingDuration = () => {
    if (!recordingStartTime.current) return "0:00";
    const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle component unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-gray-900">
               Live Transcription
             </h3>
            <div className="flex items-center space-x-4">
              {isRecording && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium">🔴 Live: {getRecordingDuration()}</span>
                </div>
              )}
              {isTranscribingChunks && (
                <div className="flex items-center text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium">📝 Transcribing...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                disabled={!selectedPatient}
                className={`flex justify-center items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPatient
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                 🎙 Start Recording
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="flex justify-center items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⏹ Stop Recording
              </button>
            )}
            
            {(speakers.length > 0 || transcript) && !isRecording && (
              <button 
                onClick={clearConversation}
                className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🗑 Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <SpeakerChat 
        speakers={speakers} 
        isRecording={isRecording}
        className="min-h-96"
      />
    </div>
  );
}
