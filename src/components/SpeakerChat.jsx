import React, { useEffect, useRef } from 'react';

const SpeakerChat = ({ speakers = [], isRecording, className = "" }) => {
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  useEffect(() => {
    if (chatEndRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [speakers]);

  const getSpeakerName = (speakerLabel) => {
    switch (speakerLabel) {
      case 'A':
        return 'Doctor';
      case 'B':
        return 'Patient';
      case 'C':
        return 'Speaker C';
      case 'D':
        return 'Speaker D';
      default:
        return `Speaker ${speakerLabel}`;
    }
  };

  const getSpeakerColor = (speakerLabel) => {
    switch (speakerLabel) {
      case 'A':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-800',
          name: 'text-blue-600'
        };
      case 'B':
        return {
          bg: 'bg-green-100',
          border: 'border-green-200',
          text: 'text-green-800',
          name: 'text-green-600'
        };
      case 'C':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-200',
          text: 'text-purple-800',
          name: 'text-purple-600'
        };
      case 'D':
        return {
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          text: 'text-orange-800',
          name: 'text-orange-600'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-800',
          name: 'text-gray-600'
        };
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!speakers || speakers.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Speaker Conversation
            {isRecording && (
              <div className="ml-3 flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium">Live Recording</span>
              </div>
            )}
          </h3>
        </div>
        
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
            <p className="text-sm">
              {isRecording 
                ? "Recording live conversation... Speaker messages will appear here in real-time"
                : "Start recording to see live speaker conversation"
              }
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Speaker Conversation
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            {isRecording && (
              <div className="flex items-center text-green-600 mr-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="font-medium">Live</span>
              </div>
            )}
            <span>{speakers.length} message{speakers.length !== 1 ? 's' : ''}</span>
          </div>
        </h3>
      </div>

      <div ref={chatContainerRef} className="p-4 max-h-80 overflow-y-auto space-y-4">
        {speakers.map((segment, index) => {
          const colors = getSpeakerColor(segment.speaker);
          const isDoctor = segment.speaker === 'A';
          
          return (
            <div
              key={index}
              className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${colors.bg} ${colors.border} border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${colors.name}`}>
                    {getSpeakerName(segment.speaker)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(segment.start)}
                  </span>
                </div>
                
                <p className={`text-sm ${colors.text} leading-relaxed`}>
                  {segment.text}
                </p>
              </div>
            </div>
          );
        })}
        
        {/* Auto-scroll anchor */}
        <div ref={chatEndRef} />
      </div>

      
    </div>
  );
};

export default SpeakerChat;
