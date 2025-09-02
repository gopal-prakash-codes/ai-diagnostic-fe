import { useState, useRef, useEffect } from "react";
import { transcribe } from "../api/api";
import { toast } from 'react-toastify';

export default function SpeechComp({ onTranscriptUpdate, selectedPatient, isRecording, onRecordingToggle }) {
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const isProcessingLiveRef = useRef(false);

  // Sync with parent component
  useEffect(() => {
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcript);
    }
  }, [transcript, onTranscriptUpdate]);

  // Debug live transcript changes
  useEffect(() => {
    console.log('🔄 Live transcript state changed:', liveTranscript);
    console.log('🎙️ Is recording:', isRecording);
    console.log('📝 Has transcript:', !!transcript);
    console.log('🎯 UI will show:', isRecording && liveTranscript ? 'Live + Previous' : isRecording ? 'Recording + Previous' : transcript ? 'Final Only' : 'Empty');
  }, [liveTranscript, isRecording, transcript]);

  // Clear transcript when patient changes
  useEffect(() => {
    if (selectedPatient) {
      setTranscript("");
      setLiveTranscript("");
      audioChunksRef.current = [];
    }
  }, [selectedPatient]);

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
      audioChunksRef.current = []; // Reset audio chunks for new recording (keep existing transcript)
      setLiveTranscript(""); // Reset live transcript
      
      // Use WebM with Opus codec - most widely supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Process audio chunks in real-time for live transcription
      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log(`Processing live audio chunk: ${e.data.size} bytes`);
          
          // Process this chunk immediately for live transcription
          await processLiveChunk(e.data, mimeType);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clear any pending intervals
        if (chunkIntervalRef.current) {
          clearInterval(chunkIntervalRef.current);
          chunkIntervalRef.current = null;
        }
        
        // Process final complete recording
        await processCompleteRecording(mimeType);
        
        // Clean up stream
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

      // Start recording with 3-second chunks for responsive live transcription
      mediaRecorder.start(3000);

      if (onRecordingToggle) {
        onRecordingToggle(true);
      }
      
      toast.success("Recording started - speak clearly for best results");

    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to access microphone. Please check permissions.");
    }
  };

  // Process audio chunk in real-time for live transcription
  const processLiveChunk = async (audioData, mimeType) => {
    // Skip if already processing a live chunk to prevent concurrent calls
    if (isProcessingLiveRef.current) {
      console.log('Skipping chunk - already processing live transcription');
      return;
    }

    console.log(`Live chunk received: ${audioData.size} bytes, total chunks: ${audioChunksRef.current.length}`);

    try {
      isProcessingLiveRef.current = true;
      
      // Create a complete audio file from all chunks collected so far
      // This ensures proper audio file structure with headers
      const allChunksBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      console.log(`Total accumulated audio: ${allChunksBlob.size} bytes`);
      
      // Process if we have at least 2 chunks (first chunk + current chunk)
      if (audioChunksRef.current.length >= 2 && allChunksBlob.size > 3000) {
        const formData = new FormData();
        formData.append("file", allChunksBlob, `live-audio-${Date.now()}.webm`);

        console.log(`🔴 SENDING LIVE: ${allChunksBlob.size} bytes from ${audioChunksRef.current.length} chunks`);
        
        const res = await transcribe(formData);
        
        if (res && res.success && res.text && res.text.trim()) {
          const newText = res.text.trim();
          console.log('✅ Live transcription received:', newText);
          
          // Update live transcript with the latest complete transcription
          console.log('📝 Setting live transcript:', newText);
          setLiveTranscript(newText);
          
          // Show success indicator briefly
          toast.success("✓ Live", { autoClose: 1000, hideProgressBar: true, position: "bottom-right" });
        } else {
          console.log('❌ No text received from live transcription');
        }
      } else {
        console.log(`⏳ Waiting for more audio data... (${audioChunksRef.current.length} chunks, ${allChunksBlob.size} bytes)`);
      }
    } catch (err) {
      console.error("❌ Live transcription error:", err);
      console.log("Continuing live recording despite error...");
    } finally {
      isProcessingLiveRef.current = false;
    }
  };

  // Process complete recording with single API call
  const processCompleteRecording = async (mimeType) => {
    if (audioChunksRef.current.length === 0) {
      toast.warning("No audio data recorded");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Combine all audio chunks into single blob
      const completeAudioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const totalSize = completeAudioBlob.size;
      
      console.log(`Processing complete recording: ${totalSize} bytes, ${audioChunksRef.current.length} chunks`);
      
      if (totalSize < 1000) { // Less than 1KB might be too short
        toast.warning("Recording too short. Please try speaking for a longer duration.");
        return;
      }

      const formData = new FormData();
      formData.append("file", completeAudioBlob, "recording.webm");

      const res = await transcribe(formData);
      console.log('Complete transcription response:', res);
      
      if (res && res.success && res.text) {
        const finalTranscriptText = res.text.trim();
        if (finalTranscriptText) {
          // Use the more accurate final transcript, append to existing
          setTranscript(prev => {
            const updatedText = prev ? `${prev} ${finalTranscriptText}` : finalTranscriptText;
            console.log('Final accurate transcript:', updatedText);
            return updatedText;
          });
          
          // Clear live transcript since we have the final version
          setLiveTranscript("");
          toast.success("Final transcription completed!");
        } else if (liveTranscript) {
          // If no final transcript but we have live transcript, use that
          setTranscript(prev => {
            const updatedText = prev ? `${prev} ${liveTranscript}` : liveTranscript;
            return updatedText;
          });
          setLiveTranscript("");
          toast.success("Live transcription saved!");
        } else {
          toast.info("No speech detected in the recording");
        }
      } else if (liveTranscript) {
        // Fallback to live transcript if API failed
        setTranscript(prev => {
          const updatedText = prev ? `${prev} ${liveTranscript}` : liveTranscript;
          return updatedText;
        });
        setLiveTranscript("");
        toast.info("Using live transcription (final processing failed)");
      } else {
        toast.error("Transcription failed - no text received");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error(`Transcription failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // This will trigger onstop event
    }

    if (onRecordingToggle) {
      onRecordingToggle(false);
    }
    
    toast.info("Recording stopped - processing...");
  };

  const clearTranscript = () => {
    setTranscript("");
    setLiveTranscript("");
    audioChunksRef.current = [];
    setIsEditing(false);
    setEditedText("");
    if (onTranscriptUpdate) {
      onTranscriptUpdate("");
    }
    toast.info("Transcript cleared");
  };

  const handleEdit = () => {
    setEditedText(transcript);
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
    setTranscript(editedText);
    setIsEditing(false);
    toast.success("Transcript updated");
  };

  const handleCancel = () => {
    setEditedText("");
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
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
    <div className="mt-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Live Transcription</h3>
            <div className="flex items-center space-x-2">
              {isProcessing && (
                <div className="flex items-center text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm">Getting final accurate transcription...</span>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium">🔴 LIVE - Text appears as you speak!</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 max-[1245px]:flex-col max-[1245px]:w-full max-[1245px]:*:w-full *:w-1/3">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                disabled={!selectedPatient}
                className={`flex justify-center items-center px-2 py-1.5 rounded-lg font-medium transition-colors ${
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
                className="flex justify-center items-center bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg font-medium transition-colors"
              >
                ⏹ Stop Recording
              </button>
            )}
            
            {transcript && !isEditing && (
              <>
                <button 
                  onClick={handleEdit}
                  disabled={isRecording}
                  className="flex justify-center items-center bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-2 py-1.5 rounded-lg font-medium transition-colors"
                >
                Edit
                </button>
                <button 
                  onClick={clearTranscript}
                  disabled={isRecording}
                  className="flex justify-center items-center bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-2 py-1.5 rounded-lg font-medium transition-colors"
                >
                 Clear
                </button>
              </>
            )}
            
            {isEditing && (
              <>
                <button 
                  onClick={handleSave}
                  className="flex justify-center items-center bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded-lg font-medium transition-colors"
                >
                Save
                </button>
                <button 
                  onClick={handleCancel}
                  className="flex justify-center items-center bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg font-medium transition-colors"
                >
                Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className={`rounded-lg p-4 min-h-40 max-h-80 overflow-y-auto border ${isEditing ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            {/* Live Transcription Display */}
            {isEditing ? (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-64 bg-transparent border-none p-0 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none placeholder-gray-400"
                  placeholder="Edit your transcription here..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  Press Ctrl+Enter to save
                </div>
              </div>
            ) : isRecording && liveTranscript ? (
              <div className="space-y-3">
                {/* Show existing transcript if present */}
                {transcript && (
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Previous Transcript</span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {transcript}
                    </p>
                  </div>
                )}
                
                {/* Show live transcript */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium text-blue-800">🔴 Live Preview (OpenAI Whisper)</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {liveTranscript}
                    <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1">|</span>
                  </p>
                </div>
              </div>
            ) : isRecording ? (
              <div className="space-y-3">
                {/* Show existing transcript if present */}
                {transcript && (
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded">
                    <div className="flex items-center mb-2">
                      <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Previous Transcript</span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {transcript}
                    </p>
                  </div>
                )}
                
                {/* Show waiting message */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium text-yellow-800">🎙️ Recording... Waiting for transcription</span>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    Speak clearly, text will appear here as you talk...
                    <span className="inline-block w-2 h-4 bg-yellow-400 animate-pulse ml-1">|</span>
                  </p>
                </div>
              </div>
            ) : transcript ? (
              <div className="p-3 bg-white border border-gray-200 rounded shadow-sm">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Transcription Complete</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {transcript}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 flex items-center justify-center h-32">
                <div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="text-sm">
                    {selectedPatient 
                      ? "Click 'Start Recording' to begin LIVE transcription. Text will appear as you speak!" 
                      : "Select a patient to start recording"
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
