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
  const processedResultsRef = useRef(0); 
  const lastInterimTextRef = useRef(''); 
  const interimStabilityTimeoutRef = useRef(null); 
  const lastSentContentRef = useRef(''); 
  const watchdogTimeoutRef = useRef(null); 
  const lastActivityTimeRef = useRef(Date.now()); 
  const startWatchdog = useCallback(() => {
    if (watchdogTimeoutRef.current) {
      clearTimeout(watchdogTimeoutRef.current);
    }
    
    watchdogTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTimeRef.current;
      if (timeSinceActivity > 15000 && isRecordingRef.current) {
        if (recognition) {
          try {
            recognition.stop();
            setTimeout(() => {
              if (isRecordingRef.current) {
                lastActivityTimeRef.current = Date.now();
                recognition.start();
              }
            }, 100);
          } catch (error) {
            console.error('Watchdog: Error restarting recognition:', error);
          }
        }
      }
      
      if (isRecordingRef.current) {
        startWatchdog();
      }
    }, 5000); 
  }, [recognition]);
  
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
      recognitionInstance.maxAlternatives = 1; 
      if ('speechSynthesis' in window) {
        recognitionInstance.serviceURI = '';
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
        lastActivityTimeRef.current = Date.now(); 
        
        if (processedResultsRef.current > event.results.length) {
          processedResultsRef.current = event.results.length;
        }
        
        let newFinalText = '';
        let allInterimText = '';
        
        let highestProcessedIndex = processedResultsRef.current;
        for (let i = processedResultsRef.current; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript.trim();
          if (result.isFinal && result[0].confidence > 0.3) {
            newFinalText += (newFinalText ? ' ' : '') + transcriptPart;
            highestProcessedIndex = i + 1; 
          }
        }
        if (highestProcessedIndex > processedResultsRef.current) {
          processedResultsRef.current = highestProcessedIndex;
        }
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result.isFinal && result[0].confidence > 0.1) { 
            const transcriptPart = result[0].transcript.trim();
            allInterimText += (allInterimText ? ' ' : '') + transcriptPart;
          }
        }
        
        if (newFinalText) {
          const updatedTranscript = transcriptRef.current ? 
            transcriptRef.current + ' ' + newFinalText : 
            newFinalText;
          setTranscript(updatedTranscript);
          transcriptRef.current = updatedTranscript;
          lastInterimTextRef.current = ''; 
          if (interimStabilityTimeoutRef.current) {
            clearTimeout(interimStabilityTimeoutRef.current);
            interimStabilityTimeoutRef.current = null;
          }
        }
        if (allInterimText && allInterimText === lastInterimTextRef.current) {
        } else if (allInterimText) {
          lastInterimTextRef.current = allInterimText;
          if (interimStabilityTimeoutRef.current) {
            clearTimeout(interimStabilityTimeoutRef.current);
          }
          
          interimStabilityTimeoutRef.current = setTimeout(() => {
            if (lastInterimTextRef.current && isRecordingRef.current) {
              const updatedTranscript = transcriptRef.current ? 
                transcriptRef.current + ' ' + lastInterimTextRef.current : 
                lastInterimTextRef.current;
              setTranscript(updatedTranscript);
              transcriptRef.current = updatedTranscript;
              lastInterimTextRef.current = '';
              if (updatedTranscript !== lastSentContentRef.current) {
                lastSentContentRef.current = updatedTranscript;
                onTranscriptUpdateRef.current(updatedTranscript);
              }
            }
          }, 1000);
        }
        let fullContent = transcriptRef.current;
        if (allInterimText) {
          if (fullContent && !fullContent.endsWith(' ')) {
            fullContent += ' ';
          }
          fullContent += allInterimText;
        }
        if (fullContent !== lastSentContentRef.current) {
          lastSentContentRef.current = fullContent;
          onTranscriptUpdateRef.current(fullContent);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        switch (event.error) {
          case 'network':
            console.log('Network error - will retry in 1 second');
            setTimeout(() => {
              if (isRecordingRef.current && recognitionInstance) {
                try {
                  recognitionInstance.start();
                } catch (error) {
                  console.error('Failed to restart after network error:', error);
                }
              }
            }, 1000);
            break;
          case 'audio-capture':
            console.error('Audio capture error - check microphone permissions');
            break;
          case 'not-allowed':
            console.error('Microphone permission denied');
            break;
          case 'no-speech':
            console.log('No speech detected - continuing to listen');
            break;
          case 'aborted':
            console.log('Speech recognition aborted - attempting restart');
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current && recognitionInstance) {
                  try {
                    lastActivityTimeRef.current = Date.now();
                    recognitionInstance.start();
                  } catch (error) {
                    console.error('Failed to restart after abort:', error);
                  }
                }
              }, 500);
            }
            break;
          case 'service-disconnect':
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current && recognitionInstance) {
                  try {
                    lastActivityTimeRef.current = Date.now();
                    recognitionInstance.start();
                  } catch (error) {
                    console.error('Failed to restart after service disconnect:', error);
                  }
                }
              }, 1000);
            }
            break;
          default:
            console.error('Unknown speech recognition error:', event.error);
            if (isRecordingRef.current) {
              setTimeout(() => {
                if (isRecordingRef.current && recognitionInstance) {
                  try {
                    lastActivityTimeRef.current = Date.now();
                    recognitionInstance.start();
                  } catch (error) {
                    console.error('Failed to restart after unknown error:', error);
                  }
                }
              }, 1000);
            }
        }
      };

      recognitionInstance.onend = () => {
        if (isRecordingRef.current && !isInitializing) {
          const now = Date.now();
          const timeSinceLastRestart = now - lastRestartTime.current;
          const minRestartInterval = 100; 
          
          const restartDelay = Math.max(50, minRestartInterval - timeSinceLastRestart); 
          
          const timeoutId = setTimeout(() => {
            if (isRecordingRef.current && recognitionInstance) {
              try {
                lastRestartTime.current = Date.now();
                recognitionInstance.start();
              } catch (error) {
                console.error('Error restarting recognition:', error);
                if (error.name === 'InvalidStateError') {
                  setTimeout(() => {
                    if (isRecordingRef.current) {
                      try {
                        lastRestartTime.current = Date.now();
                        recognitionInstance.start();
                      } catch (retryError) {
                        console.error('Failed to restart recognition on retry:', retryError);
                      }
                    }
                  }, 200); 
                }
              }
            }
          }, restartDelay);
          
          setRestartTimeoutId(timeoutId);
        } 
      };

      recognitionInstance.onstart = () => {
        if (!transcriptRef.current) {
          processedResultsRef.current = 0;
        }
        
        lastActivityTimeRef.current = Date.now();
        startWatchdog(); 
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
      if (interimStabilityTimeoutRef.current) {
        clearTimeout(interimStabilityTimeoutRef.current);
        interimStabilityTimeoutRef.current = null;
      }
      if (watchdogTimeoutRef.current) {
        clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    
    if (recognition) {
      if (isRecording) {

        setIsInitializing(true);
        try {
          recognition.start();

        } catch (error) {
          console.error('Error starting recognition:', error);
          setIsInitializing(false);
        }
      } else {

        recognition.stop();
        setIsInitializing(false);
        if (restartTimeoutId) {
          clearTimeout(restartTimeoutId);
          setRestartTimeoutId(null);
        }
        if (interimStabilityTimeoutRef.current) {
          clearTimeout(interimStabilityTimeoutRef.current);
          interimStabilityTimeoutRef.current = null;
        }
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
          watchdogTimeoutRef.current = null;
        }
      }
    }
  }, [isRecording, recognition]);

  const handleToggleRecording = () => {
    onRecordingToggle();
  };
  const clearTranscript = useCallback(() => {
    setTranscript('');
    transcriptRef.current = '';
    lastInterimTextRef.current = '';
    lastSentContentRef.current = '';
    processedResultsRef.current = 0; 
    if (interimStabilityTimeoutRef.current) {
      clearTimeout(interimStabilityTimeoutRef.current);
      interimStabilityTimeoutRef.current = null;
    }
    if (watchdogTimeoutRef.current) {
      clearTimeout(watchdogTimeoutRef.current);
      watchdogTimeoutRef.current = null;
    }
    onTranscriptUpdateRef.current('');
  }, []);
  useEffect(() => {
    if (!isRecording) {
      if (conversationText === '' && transcriptRef.current !== '') {
        setTranscript('');
        transcriptRef.current = '';
        lastInterimTextRef.current = '';
        lastSentContentRef.current = '';
        processedResultsRef.current = 0;
        if (interimStabilityTimeoutRef.current) {
          clearTimeout(interimStabilityTimeoutRef.current);
          interimStabilityTimeoutRef.current = null;
        }
        if (watchdogTimeoutRef.current) {
          clearTimeout(watchdogTimeoutRef.current);
          watchdogTimeoutRef.current = null;
        }
      }
      else if (conversationText !== '' && transcript === '' && conversationText !== transcriptRef.current) {
        setTranscript(conversationText);
        transcriptRef.current = conversationText;
        lastInterimTextRef.current = '';
        lastSentContentRef.current = conversationText;
      }
    } else {
    }
  }, [conversationText, transcript, isRecording]);

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
