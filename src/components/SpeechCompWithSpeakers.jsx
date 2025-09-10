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
  const chunkQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
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
      chunkQueueRef.current = [];
    }
  }, [selectedPatient]);
  useEffect(() => {
    if (clearTrigger) {
      setTranscript("");
      setSpeakers([]);
      audioChunksRef.current = [];
      chunkQueueRef.current = [];
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
          // Optimized specifically for speaker detection
          echoCancellation: false,    // CRITICAL: Preserve unique speaker voice characteristics
          noiseSuppression: false,    // CRITICAL: Keep speaker-specific audio features
          autoGainControl: false,     // CRITICAL: Prevent level changes that mask speaker differences
          sampleRate: 44100,         // Standard high-quality rate (48000 can cause issues)
          channelCount: 1,           // Mono for consistent speaker detection (stereo can confuse AI)
          latency: 0.01,             // Low latency for real-time processing
          // Advanced constraints for better speaker detection
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
      audioChunksRef.current = [];
      chunkQueueRef.current = [];
      recordingStartTime.current = Date.now();
      setSpeakers([]);
      setTranscript("");
      // Choose best audio format for speaker detection
      let mimeType;
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav'; // Best for speaker detection
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')) {
        mimeType = 'audio/webm;codecs=pcm'; // Uncompressed, good for speaker detection
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'; // Compressed but decent
      } else {
        mimeType = 'audio/webm'; // Fallback
      }
      
      console.log('🎤 Optimized audio format for speaker detection:', mimeType);
      
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
        
        // Process any remaining chunks before cleanup
        await processRemainingChunks(mimeType);
        
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
      mediaRecorder.start(10000); // Increased to 10 seconds for better speaker detection 

      if (onRecordingToggle) {
        onRecordingToggle(true);
      }
      
      toast.success("Live recording started - Speaker detection in real-time!");

    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  // Process chunks from the queue sequentially
  const processChunkQueue = async (mimeType) => {
    if (isProcessingQueueRef.current || chunkQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (chunkQueueRef.current.length > 0) {
      const queuedChunk = chunkQueueRef.current.shift();
      
      try {
        console.log(`Processing queued chunk: ${queuedChunk.size} bytes, remaining in queue: ${chunkQueueRef.current.length}`);
        
        const allChunksBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        console.log(`Total accumulated audio: ${allChunksBlob.size} bytes`);
        if (audioChunksRef.current.length >= 1 && allChunksBlob.size > 50000) {
          const formData = new FormData();
          formData.append("file", allChunksBlob, `queued-audio-${Date.now()}.webm`);
          
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
            console.log('No response from hybrid transcription for queued chunk');
          }
        } else {
          console.log(`⏳ Queued chunk waiting for more audio data... (${audioChunksRef.current.length} chunks, ${allChunksBlob.size} bytes)`);
        }
      } catch (err) {
        console.error("Error processing queued chunk:", err);
      }
    }

    isProcessingQueueRef.current = false;
  };
  const processLiveChunk = async (audioData, mimeType) => {
    if (isProcessingLiveRef.current) {
      console.log(`Queueing chunk - already processing live speaker detection. Queue size: ${chunkQueueRef.current.length + 1}`);
      chunkQueueRef.current.push(audioData);
      return;
    }

    console.log(`Live chunk received: ${audioData.size} bytes, total chunks: ${audioChunksRef.current.length}`);

    try {
      isProcessingLiveRef.current = true;
      const allChunksBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      console.log(`Total accumulated audio: ${allChunksBlob.size} bytes`);
      if (audioChunksRef.current.length >= 1 && allChunksBlob.size > 50000) { // Higher threshold for better speaker detection quality
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
      
      // Process any queued chunks after finishing current chunk
      if (chunkQueueRef.current.length > 0) {
        console.log(`🔄 Processing ${chunkQueueRef.current.length} queued chunks`);
        processChunkQueue(mimeType);
      }
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
        speaker: speaker.speaker // Preserve original speaker labels instead of forcing A/B 
      };

      const lastSpeaker = optimized[optimized.length - 1];
      if (lastSpeaker && 
          lastSpeaker.speaker === optimizedSpeaker.speaker && 
          (optimizedSpeaker.start - lastSpeaker.end) < 2000) { // Reduced merge threshold to 2 seconds
        lastSpeaker.text += ' ' + optimizedSpeaker.text;
        lastSpeaker.end = optimizedSpeaker.end;
        lastSpeaker.confidence = Math.max(lastSpeaker.confidence, optimizedSpeaker.confidence);
      } else {
        optimized.push(optimizedSpeaker);
      }
    }

    return optimized;
  };

  // Process any remaining chunks when recording stops
  const processRemainingChunks = async (mimeType) => {
    console.log(`🔄 Processing remaining chunks - available: ${audioChunksRef.current.length}, queued: ${chunkQueueRef.current.length}`);
    
    // Wait for any ongoing live processing to complete
    while (isProcessingLiveRef.current || isProcessingQueueRef.current) {
      console.log('⏳ Waiting for ongoing processing to complete...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Process any remaining queued chunks first
    if (chunkQueueRef.current.length > 0) {
      console.log(`🔄 Processing ${chunkQueueRef.current.length} final queued chunks`);
      await processChunkQueue(mimeType);
    }
    
    if (audioChunksRef.current.length === 0) {
      console.log('📝 No remaining chunks to process');
      return;
    }

    try {
      isProcessingLiveRef.current = true;
      
      // Process all remaining chunks as final transcription
      const allChunksBlob = new Blob(audioChunksRef.current, { type: mimeType });
      console.log(`🎵 Processing final chunks: ${allChunksBlob.size} bytes from ${audioChunksRef.current.length} chunks`);
      
      if (allChunksBlob.size < 500) {
        console.log('⚠️ Small final chunk, but processing anyway to capture remaining speech');
      }

      const formData = new FormData();
      formData.append("file", allChunksBlob, `final-speaker-audio-${Date.now()}.webm`);
      
      console.log('🚀 Sending final chunks for speaker detection and transcription...');
      const res = await transcribeWithSpeakers(formData);
      
      if (res && res.success) {
        console.log('✅ Final processing successful:', res);
        
        if (res.speakers && res.speakers.length > 0) {
          const optimizedSpeakers = optimizeSpeakersOnFrontend(res.speakers);
          console.log('👥 Final speaker segments processed:', optimizedSpeakers.length);
          
          // Merge with existing speakers instead of replacing
          setSpeakers(prevSpeakers => {
            const mergedSpeakers = [...prevSpeakers, ...optimizedSpeakers];
            console.log('👥 Total speakers after merge:', mergedSpeakers.length);
            return mergedSpeakers;
          });
          
          if (res.text) {
            setTranscript(prevTranscript => {
              const updatedText = prevTranscript ? `${prevTranscript} ${res.text}` : res.text;
              console.log('📝 Final transcript updated:', updatedText);
              return updatedText;
            });
          }
          
          toast.success("Final speaker detection completed!");
        } else if (res.text) {
          console.log('📝 No speakers but got transcription from final chunks');
          setTranscript(prevTranscript => {
            const updatedText = prevTranscript ? `${prevTranscript} ${res.text}` : res.text;
            return updatedText;
          });
          toast.success("Final transcription completed!");
        } else {
          console.log('ℹ️ No additional content in final chunks');
          toast.info("No additional speech detected in remaining audio");
        }
      } else {
        console.log('❌ Final processing failed:', res);
        toast.warning("Final processing failed, but live conversation was captured");
      }
    } catch (err) {
      console.error("❌ Error processing remaining chunks:", err);
      toast.warning(`Final processing error: ${err.message}, but live conversation was captured`);
    } finally {
      isProcessingLiveRef.current = false;
      // Clear processed chunks
      audioChunksRef.current = [];
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('🛑 Stopping speaker recording - will process remaining chunks...');
      mediaRecorderRef.current.stop(); // This will trigger onstop event which processes remaining chunks
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
