import { useState, useRef, useEffect } from "react";
import { transcribeWithSpeakers } from "../api/api";
import { toast } from 'react-toastify';
import SpeakerChat from './SpeakerChat';

export default function SpeechCompWithSpeakers({ onTranscriptUpdate, onSpeakersUpdate, selectedPatient, isRecording, onRecordingToggle, clearTrigger }) {
  const [transcript, setTranscript] = useState("");
  const [speakers, setSpeakers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartTime = useRef(null);
  const chunkIntervalRef = useRef(null);
  const isProcessingLiveRef = useRef(false);
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
    if (selectedPatient) {
      setTranscript("");
      setSpeakers([]);
      audioChunksRef.current = [];
    }
  }, [selectedPatient]);
  useEffect(() => {
    if (clearTrigger) {
      setTranscript("");
      setSpeakers([]);
      audioChunksRef.current = [];
      // Stop recording if active
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
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();
      setSpeakers([]);
      setTranscript("");
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      console.log('Using MIME type for Assembly AI:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log(`Audio chunk collected: ${e.data.size} bytes`);
          await processLiveChunk(e.data, mimeType);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunkIntervalRef.current) {
          clearInterval(chunkIntervalRef.current);
          chunkIntervalRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        toast.error("Recording error occurred");
        stopRecording();
      };
      mediaRecorder.start(5000); 

      if (onRecordingToggle) {
        onRecordingToggle(true);
      }
      
      toast.success("Live recording started - Speaker detection in real-time!");

    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };
  const processLiveChunk = async (audioData, mimeType) => {
    if (isProcessingLiveRef.current) {
      console.log('Skipping chunk - already processing live speaker detection');
      return;
    }

    console.log(`Live chunk received: ${audioData.size} bytes, total chunks: ${audioChunksRef.current.length}`);

    try {
      isProcessingLiveRef.current = true;
      const allChunksBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      console.log(`Total accumulated audio: ${allChunksBlob.size} bytes`);
      if (audioChunksRef.current.length >= 2 && allChunksBlob.size > 10000) {
        const formData = new FormData();
        formData.append("file", allChunksBlob, `live-audio-${Date.now()}.webm`);
        
        const res = await transcribeWithSpeakers(formData); 
        
        if (res && res.success) {
          if (res.speakers && res.speakers.length > 0) {
            const optimizedSpeakers = optimizeSpeakersOnFrontend(res.speakers);
            setSpeakers(optimizedSpeakers);
            setTranscript(res.text || "");
          } else if (res.text) {
            setTranscript(res.text);
          }
        } else {
          console.log('No response from hybrid transcription');
        }
      } else {
        console.log(`⏳ Waiting for more audio data... (${audioChunksRef.current.length} chunks, ${allChunksBlob.size} bytes)`);
      }
    } catch (err) {
      console.error(" Live speaker detection error:", err);
    } finally {
      isProcessingLiveRef.current = false;
    }
  };
  const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/\s+/g, ' ').trim();
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
        speaker: speaker.speaker === 'A' ? 'A' : 'B' 
      };

      const lastSpeaker = optimized[optimized.length - 1];
      if (lastSpeaker && 
          lastSpeaker.speaker === optimizedSpeaker.speaker && 
          (optimizedSpeaker.start - lastSpeaker.end) < 3000) {
        lastSpeaker.text += ' ' + optimizedSpeaker.text;
        lastSpeaker.end = optimizedSpeaker.end;
        lastSpeaker.confidence = Math.max(lastSpeaker.confidence, optimizedSpeaker.confidence);
      } else {
        optimized.push(optimizedSpeaker);
      }
    }

    return optimized;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (onRecordingToggle) {
      onRecordingToggle(false);
    }
    
    toast.info("Recording stopped - live conversation saved!");
  };

  const clearConversation = () => {
    setTranscript("");
    setSpeakers([]);
    audioChunksRef.current = [];
    if (onTranscriptUpdate) {
      onTranscriptUpdate("");
    }
    if (onSpeakersUpdate) {
      onSpeakersUpdate([]);
    }
    toast.info("Conversation cleared");
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
