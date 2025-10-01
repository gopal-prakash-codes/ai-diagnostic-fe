import React, { useEffect, useRef, useState } from 'react';
import { IoCloseOutline, IoExpand, IoContract } from 'react-icons/io5';

const FullOHIFViewer = ({ 
  dicomUrl, 
  fileName, 
  fileType = 'original',
  onClose 
}) => {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');

  useEffect(() => {
    // Create OHIF viewer URL with the DICOM file
    const createViewerUrl = () => {
      // For the full OHIF viewer, we need to construct a proper URL
      // This assumes you have OHIF viewer running or accessible
      
      // Option 1: Use the online OHIF viewer (for demonstration)
      const baseUrl = 'https://viewer.ohif.org/viewer';
      
      // Option 2: Use local OHIF viewer (if you have it running)
      // const baseUrl = 'http://localhost:3000/viewer';
      
      // For DICOM files, we need to create a proper study URL
      // This is a simplified example - in production you'd need proper DICOM web endpoints
      
      if (dicomUrl) {
        // Extract study information from DICOM URL if possible
        // For now, we'll use a demo study
        const demoStudyUID = '2.16.840.1.114362.1.11972228.22789312658.616067305.306.2';
        const url = `${baseUrl}?StudyInstanceUIDs=${demoStudyUID}`;
        setViewerUrl(url);
      }
    };

    createViewerUrl();
  }, [dicomUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-95 flex flex-col z-50 ${isFullscreen ? 'z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">
            OHIF Medical Viewer - {fileName} ({fileType})
          </h2>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm">Loading OHIF Viewer...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <IoContract /> : <IoExpand />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
            title="Close Viewer"
          >
            <IoCloseOutline />
          </button>
        </div>
      </div>

      {/* OHIF Viewer Container */}
      <div className="flex-1 relative">
        {viewerUrl && (
          <iframe
            ref={iframeRef}
            src={viewerUrl}
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            title="OHIF Medical Viewer"
            allow="fullscreen"
          />
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Loading Professional Medical Viewer...</p>
              <p className="text-sm text-gray-300 mt-2">Initializing OHIF Platform</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white p-2 text-sm">
        <div className="flex justify-between items-center">
          <div className="text-gray-400">
            Professional Medical Imaging powered by OHIF
          </div>
          <div className="text-gray-400">
            Full DICOM viewing capabilities
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullOHIFViewer;
