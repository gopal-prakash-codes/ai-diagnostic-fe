import React, { useEffect, useRef, useState } from 'react';
import { IoCloseOutline, IoExpand, IoContract, IoRefresh, IoSettings } from 'react-icons/io5';
import { toast } from 'react-toastify';

// Cornerstone and OHIF imports
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

const OHIF3DViewer = ({ 
  dicomUrl, 
  fileName, 
  fileType = 'original',
  onClose 
}) => {
  const viewportRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportId] = useState(`viewport-${Date.now()}`);
  const [renderingEngine, setRenderingEngine] = useState(null);
  const [viewport, setViewport] = useState(null);

  // Initialize Cornerstone
  useEffect(() => {
    const initializeCornerstone = async () => {
      try {
        // Initialize cornerstone core
        await cornerstone.init();
        
        // Configure DICOM image loader
        cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
        cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
        
        // Configure web workers for DICOM loading
        const config = {
          maxWebWorkers: navigator.hardwareConcurrency || 1,
          startWebWorkersOnDemand: true,
          taskConfiguration: {
            decodeTask: {
              initializeCodecsOnStartup: false,
              usePDFJS: false,
              strict: false,
            },
          },
        };
        
        cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);
        
        // Initialize tools
        cornerstoneTools.init();
        
        console.log('Cornerstone initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Cornerstone:', err);
        setError('Failed to initialize 3D viewer');
      }
    };

    initializeCornerstone();

    // Cleanup on unmount
    return () => {
      if (renderingEngine) {
        renderingEngine.destroy();
      }
    };
  }, []);

  // Load and display DICOM
  useEffect(() => {
    if (!dicomUrl || !viewportRef.current) return;

    const loadDicom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create rendering engine
        const engine = new cornerstone.RenderingEngine(viewportId);
        setRenderingEngine(engine);

        // Create viewport
        const viewportInput = {
          viewportId,
          type: cornerstone.Enums.ViewportType.STACK,
          element: viewportRef.current,
        };

        engine.enableElement(viewportInput);
        const stackViewport = engine.getViewport(viewportId);
        setViewport(stackViewport);

        // Load image
        let imageId;
        if (dicomUrl.startsWith('wadouri:')) {
          imageId = dicomUrl;
        } else {
          imageId = `wadouri:${dicomUrl}`;
        }

        // Set the stack
        await stackViewport.setStack([imageId]);

        // Render
        stackViewport.render();

        setIsLoading(false);
        toast.success('3D viewer loaded successfully');

      } catch (err) {
        console.error('Error loading DICOM:', err);
        setError(`Failed to load DICOM file: ${err.message}`);
        setIsLoading(false);
        toast.error('Failed to load 3D viewer');
      }
    };

    loadDicom();
  }, [dicomUrl, viewportId]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle reset view
  const resetView = () => {
    if (viewport) {
      viewport.resetCamera();
      viewport.render();
    }
  };

  // Handle window/level adjustment
  const adjustWindowLevel = (windowWidth, windowCenter) => {
    if (viewport) {
      const properties = viewport.getProperties();
      viewport.setProperties({
        ...properties,
        voiRange: {
          upper: windowCenter + windowWidth / 2,
          lower: windowCenter - windowWidth / 2,
        },
      });
      viewport.render();
    }
  };

  if (error) {
    return (
      <div className={`fixed inset-0 bg-[#DCE1EE] bg-opacity-95 flex items-center justify-center z-50 ${isFullscreen ? 'z-[9999]' : ''}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Medical Viewer</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <IoCloseOutline />
            </button>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#2EB4B4] text-white rounded hover:bg-[#2A9A9A]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-[#DCE1EE] flex flex-col z-50 ${isFullscreen ? 'z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Medical Viewer - {fileName} ({fileType})
          </h2>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2EB4B4]"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Window/Level Presets */}
          <div className="flex space-x-1">
            <button
              onClick={() => adjustWindowLevel(400, 40)}
              className="px-2 py-1 bg-[#2EB4B4] text-white text-xs rounded hover:bg-[#2A9A9A]"
              title="CT Soft Tissue"
            >
              Soft
            </button>
            <button
              onClick={() => adjustWindowLevel(1500, 400)}
              className="px-2 py-1 bg-[#2EB4B4] text-white text-xs rounded hover:bg-[#2A9A9A]"
              title="CT Bone"
            >
              Bone
            </button>
            <button
              onClick={() => adjustWindowLevel(2000, -500)}
              className="px-2 py-1 bg-[#2EB4B4] text-white text-xs rounded hover:bg-[#2A9A9A]"
              title="CT Lung"
            >
              Lung
            </button>
          </div>

          {/* Control buttons */}
          <button
            onClick={resetView}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            title="Reset View"
          >
            <IoRefresh />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <IoContract /> : <IoExpand />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Close Viewer"
          >
            <IoCloseOutline />
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 relative bg-white border border-gray-200 m-4 rounded-lg shadow-sm">
        <div 
          ref={viewportRef}
          className="w-full h-full rounded-lg"
          style={{ 
            minHeight: '400px',
            background: '#000000'
          }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EB4B4] mx-auto mb-4"></div>
              <p className="text-lg">Loading Medical Image...</p>
              <p className="text-sm text-gray-300 mt-2">Initializing Cornerstone 3D Engine</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with instructions */}
      <div className="bg-white border-t border-gray-200 p-3 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 text-gray-600">
            <span>🖱️ Left Click: Pan</span>
            <span>🖱️ Right Click: Window/Level</span>
            <span>🖱️ Scroll: Zoom</span>
          </div>
          <div className="text-gray-500">
            Powered by Cornerstone3D & OHIF
          </div>
        </div>
      </div>
    </div>
  );
};

export default OHIF3DViewer;
