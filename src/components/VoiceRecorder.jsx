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
      recognitionInstance.maxAlternatives = 3;
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
        console.log('Speech recognition result received');
        let finalTranscript = '';
        let interimTranscript = '';
        
        let allFinalText = '';
        let allInterimText = '';
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript.trim();
          console.log(`Result ${i}: "${transcriptPart}" (final: ${result.isFinal}, confidence: ${result[0].confidence})`);
          
          if (result.isFinal) {
            allFinalText += (allFinalText ? ' ' : '') + transcriptPart;
          } else {
            allInterimText += (allInterimText ? ' ' : '') + transcriptPart;
          }
        }
        
        
        if (allFinalText && allFinalText !== transcriptRef.current) {
          setTranscript(allFinalText);
          transcriptRef.current = allFinalText;
        }

        // Send combined final + interim content to parent
        let fullContent = transcriptRef.current;
        if (allInterimText) {
          if (fullContent && !fullContent.endsWith(' ')) {
            fullContent += ' ';
          }
          fullContent += allInterimText;
        }
        
        console.log('Sending full content:', fullContent);
        onTranscriptUpdateRef.current(fullContent);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        switch (event.error) {
          case 'network':
            console.log('Network error - will retry in 2 seconds');
            setTimeout(() => {
              if (isRecordingRef.current && recognitionInstance) {
                try {
                  recognitionInstance.start();
                } catch (error) {
                  console.error('Failed to restart after network error:', error);
                }
              }
            }, 2000);
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
            console.log('Speech recognition aborted');
            break;
          default:
            console.error('Unknown speech recognition error:', event.error);
        }
      };

      recognitionInstance.onend = () => {
        console.log('Recognition ended, isRecording from ref:', isRecordingRef.current);
        console.log('Current transcript when ended:', transcriptRef.current);
        
        if (isRecordingRef.current && !isInitializing) {
          const now = Date.now();
          const timeSinceLastRestart = now - lastRestartTime.current;
          const minRestartInterval = 500; 
          
          const restartDelay = Math.max(300, minRestartInterval - timeSinceLastRestart);
          
          console.log(`Restarting recognition after ${restartDelay}ms delay...`);
          
          const timeoutId = setTimeout(() => {
            if (isRecordingRef.current && recognitionInstance) {
              try {
                lastRestartTime.current = Date.now();
                recognitionInstance.start();
                console.log('Recognition restarted successfully');
              } catch (error) {
                console.error('Error restarting recognition:', error);
                
                // If restart fails, try again with a longer delay
                if (error.name === 'InvalidStateError') {
                  setTimeout(() => {
                    if (isRecordingRef.current) {
                      try {
                        lastRestartTime.current = Date.now();
                        recognitionInstance.start();
                        console.log('Recognition restarted on retry');
                      } catch (retryError) {
                        console.error('Failed to restart recognition on retry:', retryError);
                      }
                    }
                  }, 1000);
                }
              }
            }
          }, restartDelay);
          
          setRestartTimeoutId(timeoutId);
        } else {
          console.log('Not restarting - recording stopped or initializing');
        }
      };

      recognitionInstance.onstart = () => {
        console.log('Recognition started');
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
        setIsInitializing(true);
        try {
          recognition.start();
          console.log('Starting recognition...');
        } catch (error) {
          console.error('Error starting recognition:', error);
          setIsInitializing(false);
        }
      } else {
        console.log('Stopping recognition...');
        recognition.stop();
        setIsInitializing(false);
        if (restartTimeoutId) {
          clearTimeout(restartTimeoutId);
          setRestartTimeoutId(null);
        }
      }
    }
  }, [isRecording, recognition]);

  const handleToggleRecording = () => {
    onRecordingToggle();
  };
  const clearTranscript = useCallback(() => {
    console.log('Clearing transcript');
    setTranscript('');
    transcriptRef.current = '';
    onTranscriptUpdateRef.current('');
  }, []);
  useEffect(() => {
    if (conversationText === '' && transcriptRef.current !== '') {
      console.log('Parent cleared conversation, syncing internal state');
      setTranscript('');
      transcriptRef.current = '';
    }
    else if (conversationText !== '' && transcript === '') {
      console.log('Syncing transcript with parent conversation');
      setTranscript(conversationText);
      transcriptRef.current = conversationText;
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
