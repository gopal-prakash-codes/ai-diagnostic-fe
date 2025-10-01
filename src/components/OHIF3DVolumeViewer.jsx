import React, { useEffect, useRef, useState } from 'react';
import { IoCloseOutline, IoExpand, IoContract, IoRefresh, IoSettings, IoCube, IoLayers } from 'react-icons/io5';
import { toast } from 'react-toastify';

// Cornerstone and OHIF imports
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

const OHIF3DVolumeViewer = ({ 
  dicomUrl, 
  fileName, 
  fileType = 'original',
  onClose 
}) => {
  const viewportRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'mpr', 'stack'
  const [viewportId] = useState(`viewport-3d-${Date.now()}`);
  const [renderingEngine, setRenderingEngine] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [volume, setVolume] = useState(null);

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
        
        // Add tools to Cornerstone3D
        cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);
        cornerstoneTools.addTool(cornerstoneTools.VolumeRotateMouseWheelTool);
        
        console.log('Cornerstone 3D initialized successfully');
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
      if (volume) {
        cornerstone.cache.removeVolumeLoadObject(volume.volumeId);
      }
    };
  }, []);

  // Load and display DICOM in 3D
  useEffect(() => {
    if (!dicomUrl || !viewportRef.current) return;

    const load3DDicom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create rendering engine
        const engine = new cornerstone.RenderingEngine(viewportId);
        setRenderingEngine(engine);

        // Determine viewport type based on view mode
        let viewportType;
        switch (viewMode) {
          case '3d':
            viewportType = cornerstone.Enums.ViewportType.VOLUME_3D;
            break;
          case 'mpr':
            viewportType = cornerstone.Enums.ViewportType.ORTHOGRAPHIC;
            break;
          default:
            viewportType = cornerstone.Enums.ViewportType.STACK;
        }

        // Create viewport
        const viewportInput = {
          viewportId,
          type: viewportType,
          element: viewportRef.current,
        };

        engine.enableElement(viewportInput);
        const createdViewport = engine.getViewport(viewportId);
        setViewport(createdViewport);

        // Prepare image ID
        let imageId;
        if (dicomUrl.startsWith('wadouri:')) {
          imageId = dicomUrl;
        } else {
          imageId = `wadouri:${dicomUrl}`;
        }

        if (viewMode === '3d' || viewMode === 'mpr') {
          // Create volume for 3D/MPR viewing
          const volumeId = `volume-${Date.now()}`;
          
          // For single DICOM file, we'll create a volume with one slice
          // In a real scenario, you'd have multiple slices for true 3D
          const volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, {
            imageIds: [imageId],
          });
          
          setVolume(volume);

          // Set volume on viewport
          await createdViewport.setVolumes([
            {
              volumeId,
              callback: ({ volumeActor }) => {
                // Configure volume rendering properties
                if (viewMode === '3d') {
                  const volumeMapper = volumeActor.getMapper();
                  volumeMapper.setSampleDistance(1.0);
                  
                  // Set up volume rendering properties
                  const property = volumeActor.getProperty();
                  property.setInterpolationTypeToLinear();
                  property.setUseGradientOpacity(0, true);
                  
                  // Set opacity and color transfer functions
                  const opacityFunction = property.getScalarOpacity(0);
                  opacityFunction.addPoint(-1000, 0.0);
                  opacityFunction.addPoint(-500, 0.0);
                  opacityFunction.addPoint(40, 0.4);
                  opacityFunction.addPoint(80, 0.8);
                  opacityFunction.addPoint(120, 1.0);
                  
                  const colorFunction = property.getRGBTransferFunction(0);
                  colorFunction.addRGBPoint(-1000, 0.3, 0.3, 1.0);
                  colorFunction.addRGBPoint(-500, 0.0, 0.0, 1.0);
                  colorFunction.addRGBPoint(40, 1.0, 0.0, 0.0);
                  colorFunction.addRGBPoint(80, 1.0, 1.0, 0.0);
                  colorFunction.addRGBPoint(120, 1.0, 1.0, 1.0);
                }
              },
            },
          ]);

          // Load the volume
          volume.load();
        } else {
          // Stack viewing for 2D
          await createdViewport.setStack([imageId]);
        }

        // Set up tool group
        const toolGroupId = `toolGroup-${viewportId}`;
        const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
        
        if (toolGroup) {
          // Add tools to tool group
          toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
          toolGroup.addTool(cornerstoneTools.PanTool.toolName);
          toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
          
          if (viewMode === '3d') {
            toolGroup.addTool(cornerstoneTools.VolumeRotateMouseWheelTool.toolName);
          } else {
            toolGroup.addTool(cornerstoneTools.StackScrollMouseWheelTool.toolName);
          }

          // Set tool modes
          toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }],
          });
          toolGroup.setToolActive(cornerstoneTools.PanTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary }],
          });
          toolGroup.setToolActive(cornerstoneTools.ZoomTool.toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
          });
          
          if (viewMode === '3d') {
            toolGroup.setToolActive(cornerstoneTools.VolumeRotateMouseWheelTool.toolName);
          } else {
            toolGroup.setToolActive(cornerstoneTools.StackScrollMouseWheelTool.toolName);
          }

          // Add viewport to tool group
          toolGroup.addViewport(viewportId, engine.id);
        }

        // Render
        createdViewport.render();

        setIsLoading(false);
        toast.success(`${viewMode.toUpperCase()} viewer loaded successfully`);

      } catch (err) {
        console.error('Error loading 3D DICOM:', err);
        setError(`Failed to load 3D DICOM file: ${err.message}`);
        setIsLoading(false);
        toast.error('Failed to load 3D viewer');
      }
    };

    load3DDicom();
  }, [dicomUrl, viewportId, viewMode]);

  // Handle view mode change
  const changeViewMode = (newMode) => {
    if (newMode !== viewMode) {
      setViewMode(newMode);
      // The useEffect will handle reloading with new mode
    }
  };

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

  // Handle preset adjustments
  const applyPreset = (preset) => {
    if (!viewport) return;

    const presets = {
      ctBone: { windowWidth: 1500, windowCenter: 400 },
      ctSoft: { windowWidth: 400, windowCenter: 40 },
      ctLung: { windowWidth: 2000, windowCenter: -500 },
      mrDefault: { windowWidth: 200, windowCenter: 100 },
    };

    const { windowWidth, windowCenter } = presets[preset] || presets.ctSoft;
    
    try {
      const properties = viewport.getProperties();
      viewport.setProperties({
        ...properties,
        voiRange: {
          upper: windowCenter + windowWidth / 2,
          lower: windowCenter - windowWidth / 2,
        },
      });
      viewport.render();
    } catch (err) {
      console.error('Error applying preset:', err);
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
              <span className="text-sm text-gray-600">Loading {viewMode.toUpperCase()}...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Selector */}
          <div className="flex space-x-1 mr-4">
            <button
              onClick={() => changeViewMode('3d')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                viewMode === '3d' ? 'bg-[#2EB4B4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="3D Volume Rendering"
            >
              <IoCube />
              <span>3D</span>
            </button>
            <button
              onClick={() => changeViewMode('mpr')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                viewMode === 'mpr' ? 'bg-[#2EB4B4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Multi-Planar Reconstruction"
            >
              <IoLayers />
              <span>MPR</span>
            </button>
            <button
              onClick={() => changeViewMode('stack')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                viewMode === 'stack' ? 'bg-[#2EB4B4] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="2D Stack View"
            >
              <IoLayers />
              <span>2D</span>
            </button>
          </div>

          {/* Presets */}
          <div className="flex space-x-1">
            <button
              onClick={() => applyPreset('ctSoft')}
              className="px-2 py-1 bg-[#2EB4B4] text-white text-xs rounded hover:bg-[#2A9A9A]"
              title="CT Soft Tissue"
            >
              Soft
            </button>
            <button
              onClick={() => applyPreset('ctBone')}
              className="px-2 py-1 bg-[#2EB4B4] text-white text-xs rounded hover:bg-[#2A9A9A]"
              title="CT Bone"
            >
              Bone
            </button>
            <button
              onClick={() => applyPreset('ctLung')}
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
              <p className="text-lg">Loading {viewMode.toUpperCase()} Medical Viewer...</p>
              <p className="text-sm text-gray-300 mt-2">Initializing Cornerstone3D Engine</p>
              {viewMode === '3d' && (
                <p className="text-xs text-gray-400 mt-1">Setting up volume rendering...</p>
              )}
            </div>
          </div>
        )}

        {/* View Mode Info */}
        <div className="absolute top-4 left-4 bg-[#2EB4B4] text-white px-3 py-1 rounded text-sm shadow-sm">
          {viewMode === '3d' && '🎯 3D Volume Rendering'}
          {viewMode === 'mpr' && '📐 Multi-Planar Reconstruction'}
          {viewMode === 'stack' && '📄 2D Stack View'}
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="bg-white border-t border-gray-200 p-3 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 text-gray-600">
            {viewMode === '3d' ? (
              <>
                <span>🖱️ Left Click: Rotate</span>
                <span>🖱️ Right Click: Window/Level</span>
                <span>🖱️ Scroll: Zoom</span>
                <span>🖱️ Middle Click: Pan</span>
              </>
            ) : (
              <>
                <span>🖱️ Left Click: Zoom</span>
                <span>🖱️ Right Click: Window/Level</span>
                <span>🖱️ Scroll: Navigate</span>
                <span>🖱️ Middle Click: Pan</span>
              </>
            )}
          </div>
          <div className="text-gray-500">
            Powered by Cornerstone3D & OHIF | Mode: {viewMode.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OHIF3DVolumeViewer;
