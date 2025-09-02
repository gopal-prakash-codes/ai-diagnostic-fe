import React, { useState, useEffect, useRef, useCallback } from 'react';

const Mic = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const MicOff = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 5.586A2 2 0 015 7v3a9 9 0 009 9v1m-6-4a9 9 0 019-9m-9 9a9 9 0 009-9m-9 9v1a2 2 0 002 2h2m-6-4V7a2 2 0 012-2m2 0V4a2 2 0 012-2h4a2 2 0 012 2v1M9 21h6" />
  </svg>
);

function VoiceRecorder({ onTranscriptUpdate, isRecording, onRecordingToggle, conversationText = '' }) {
  const [recognition, setRecognition] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [restartTimeoutId, setRestartTimeoutId] = useState(null);
  const isRecordingRef = useRef(isRecording);
  const transcriptRef = useRef('');
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  const lastRestartTime = useRef(0);
  const lastProcessedIndex = useRef(0);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    onTranscriptUpdateRef.current = onTranscriptUpdate;
  }, [onTranscriptUpdate]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1; // Reduced for better performance
      
      // Enhanced settings for better speech detection
      if ('serviceURI' in recognitionInstance) {
        // Some browsers support additional settings
        try {
          recognitionInstance.maxAlternatives = 1;
        } catch (e) {
          console.log('Advanced speech settings not available');
        }
      }
      if ('grammars' in recognitionInstance) {
        const grammar = '#JSGF V1.0; grammar words; public <word> = ' + 
          'pain | fever | headache | cough | cold | flu | medicine | doctor | patient | ' +
          'symptoms | diagnosis | treatment | prescription | medical | health | illness | ' +
          'breathing | chest | throat | stomach | back | leg | arm | eye | ear | nose | ' +
          'blood | pressure | heart | diabetes | allergy | infection | injury | surgery';
        const speechRecognitionList = new (window.SpeechGrammarList || window.webkitSpeechGrammarList)();
        speechRecognitionList.addFromString(grammar, 1);
        recognitionInstance.grammars = speechRecognitionList;
      }
      

      recognitionInstance.onresult = (event) => {
        console.log('Speech recognition result received, results count:', event.results.length);
        console.log('Last processed index:', lastProcessedIndex.current);
        
        let newFinalTranscript = '';
        let currentInterimTranscript = '';
        
        // Process only new results (from lastProcessedIndex onwards)
        for (let i = lastProcessedIndex.current; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            newFinalTranscript += transcript;
            lastProcessedIndex.current = i + 1;
            console.log(`Processed final result ${i}: "${transcript}"`);
          }
        }
        
        // Get current interim results (always from the last final result onwards)
        for (let i = lastProcessedIndex.current; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal) {
            currentInterimTranscript += result[0].transcript;
          }
        }
        
        console.log('New final transcript from this event:', newFinalTranscript);
        console.log('Current interim transcript:', currentInterimTranscript);
        
        // Update stored transcript with new final results only
        if (newFinalTranscript.trim()) {
          const currentTranscript = transcriptRef.current || '';
          const updatedTranscript = currentTranscript + (currentTranscript ? ' ' : '') + newFinalTranscript.trim();
          
          setTranscript(updatedTranscript);
          transcriptRef.current = updatedTranscript;
          console.log('Updated stored transcript:', updatedTranscript);
        }

        // Combine stored transcript with current interim results
        const storedTranscript = transcriptRef.current || '';
        const displayTranscript = storedTranscript + 
          (storedTranscript && currentInterimTranscript.trim() ? ' ' : '') + 
          currentInterimTranscript.trim();
        
        console.log('Sending to parent:', displayTranscript);
        onTranscriptUpdateRef.current(displayTranscript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        switch (event.error) {
          case 'network':
            console.log('Network error - will retry in 2 seconds');
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current && recognitionInstance) {
                  try {
                    recognitionInstance.start();
                  } catch (error) {
                    console.error('Failed to restart after network error:', error);
                  }
                }
              }, 2000);
            }
            break;
          case 'audio-capture':
            console.error('Audio capture error - check microphone permissions');
            break;
          case 'not-allowed':
            console.error('Microphone permission denied');
            break;
          case 'no-speech':
            console.log('No speech detected - immediately restarting for continuous operation');
            // For truly continuous recognition, restart immediately on no-speech
            if (isRecordingRef.current) {
              try {
                recognitionInstance.start();
                console.log('Immediately restarted after no-speech');
              } catch (error) {
                console.error('Failed immediate restart after no-speech:', error);
                // Let onend handler try
              }
            }
            break;
          case 'aborted':
            console.log('Speech recognition aborted - immediately restarting for continuous operation');
            // For truly continuous recognition, restart immediately when aborted
            if (isRecordingRef.current) {
              try {
                recognitionInstance.start();
                console.log('Immediately restarted after abort');
              } catch (error) {
                console.error('Failed immediate restart after abort:', error);
                // Let onend handler try
              }
            }
            break;
          default:
            console.error('Unknown speech recognition error:', event.error);
            // For unknown errors, let onend handler manage restart
            console.log('Will restart via onend handler if needed');
        }
      };

      recognitionInstance.onend = () => {
        console.log('Recognition ended, isRecording from ref:', isRecordingRef.current);
        
        // Immediately restart if still recording - NO DELAYS for truly continuous recognition
        if (isRecordingRef.current) {
          console.log('Immediately restarting recognition for continuous operation...');
          
          try {
            recognitionInstance.start();
            console.log('Recognition restarted immediately');
          } catch (error) {
            console.error('Error restarting recognition:', error);
            
            // If immediate restart fails, try once more with minimal delay
            const timeoutId = setTimeout(() => {
              if (isRecordingRef.current && recognitionInstance) {
                try {
                  recognitionInstance.start();
                  console.log('Recognition restarted after error');
                } catch (retryError) {
                  console.error('All restart attempts failed:', retryError);
                }
              }
            }, 10); // Minimal 10ms delay only if immediate restart fails
            
            setRestartTimeoutId(timeoutId);
          }
        } else {
          console.log('Not restarting - user manually stopped recording');
        }
      };

      recognitionInstance.onstart = () => {
        console.log('Recognition started');
        lastProcessedIndex.current = 0; // Reset processing index for new session
        setIsInitializing(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (restartTimeoutId) {
        clearTimeout(restartTimeoutId);
        setRestartTimeoutId(null);
      }
    };
  }, []);

  useEffect(() => {
    if (recognition) {
      if (isRecording) {
        console.log('User started recording - initializing recognition');
        setIsInitializing(true);
        try {
          recognition.start();
          console.log('Recognition start command sent');
        } catch (error) {
          console.error('Error sending recognition start command:', error);
          setIsInitializing(false);
          
          // Try to start again after a short delay if it failed
          setTimeout(() => {
            if (isRecordingRef.current) {
              try {
                console.log('Retrying recognition start...');
                recognition.start();
              } catch (retryError) {
                console.error('Retry start failed:', retryError);
                setIsInitializing(false);
              }
            }
          }, 500);
        }
      } else {
        console.log('User stopped recording - stopping recognition');
        setIsInitializing(false);
        
        // Clear any pending restart timeouts
        if (restartTimeoutId) {
          console.log('Clearing pending restart timeout');
          clearTimeout(restartTimeoutId);
          setRestartTimeoutId(null);
        }
        
        // Stop recognition
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    }
  }, [isRecording, recognition, restartTimeoutId]);

  const handleToggleRecording = () => {
    onRecordingToggle();
  };
  const clearTranscript = useCallback(() => {
    console.log('Clearing transcript');
    setTranscript('');
    transcriptRef.current = '';
    lastProcessedIndex.current = 0; // Reset processing index when clearing
    onTranscriptUpdateRef.current('');
  }, []);
  useEffect(() => {
    if (conversationText === '' && transcriptRef.current !== '') {
      console.log('Parent cleared conversation, syncing internal state');
      setTranscript('');
      transcriptRef.current = '';
      lastProcessedIndex.current = 0; // Reset processing index when parent clears
    }
    else if (conversationText !== '' && transcript === '') {
      console.log('Syncing transcript with parent conversation');
      setTranscript(conversationText);
      transcriptRef.current = conversationText;
      lastProcessedIndex.current = 0; // Reset processing index when syncing with parent
    }
  }, [conversationText, transcript]);

  return (
    <button
      onClick={handleToggleRecording}
      className={`
        flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 flex-shrink-0
        ${isRecording 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }
      `}
    >
      {isRecording ? (
        <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
      ) : (
        <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
      )}
    </button>
  );
}

export default VoiceRecorder;