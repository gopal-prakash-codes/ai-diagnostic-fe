import React, { useEffect, useRef, useState } from 'react';
import { IoCloseOutline, IoExpand, IoContract, IoRefresh, IoCube, IoLayers, IoArchive } from 'react-icons/io5';
import { toast } from 'react-toastify';
import JSZip from 'jszip';

// Use the existing cornerstone-core that's already installed
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

const Enhanced3DViewer = ({ 
  dicomUrl, 
  fileName, 
  fileType = 'original',
  onClose 
}) => {
  const viewportRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('2d'); // '2d', 'enhanced'
  const [isInitialized, setIsInitialized] = useState(false);
  const [isZipFile, setIsZipFile] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Function to check file type
  const checkFileType = async (url) => {
    try {
      // Check file extension first
      const urlLower = url.toLowerCase();
      
      // Check for ZIP files
      if (urlLower.includes('.zip')) {
        return 'zip';
      }
      
      // Check for DICOM files
      if (urlLower.includes('.dcm') || urlLower.includes('.dicom')) {
        return 'dicom';
      }
      
      // Check if it's likely a regular image format
      if (urlLower.includes('.png') || urlLower.includes('.jpg') || 
          urlLower.includes('.jpeg') || urlLower.includes('.gif') || 
          urlLower.includes('.bmp') || urlLower.includes('.webp')) {
        return 'image';
      }

      // Try to fetch the first few bytes to check for file type
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: { 'Range': 'bytes=0-200' }
        });
        
        // If we can't do a HEAD request, assume it might be DICOM
        if (!response.ok) {
          return 'dicom'; // Default to DICOM if we can't check
        }
        
        // Check content type
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('image/')) {
          return 'image'; // It's a regular image
        }
        if (contentType.includes('zip') || contentType.includes('application/zip')) {
          return 'zip'; // It's a ZIP file
        }
        
        return 'dicom'; // Assume DICOM if not a regular image or ZIP
      } catch (fetchError) {
        console.warn('Could not check file type, assuming DICOM:', fetchError);
        return 'dicom'; // Default to DICOM if we can't check
      }
    } catch (error) {
      console.warn('Error checking file type:', error);
      return 'dicom'; 
    }
  };
  const displayRegularImage = (imageUrl) => {
    try {
      // Disable cornerstone for this element since we'll use regular img
      if (viewportRef.current) {
        cornerstone.disable(viewportRef.current);
      }

      // Create an img element and display it
      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.style.cursor = 'grab';
      
      // Clear the viewport and add the image
      viewportRef.current.innerHTML = '';
      viewportRef.current.appendChild(img);

      // Add basic zoom and pan functionality
      let scale = 1;
      let translateX = 0;
      let translateY = 0;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;

      const updateTransform = () => {
        img.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
      };

      // Mouse wheel for zoom
      const handleImageWheel = (e) => {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        scale *= scaleFactor;
        scale = Math.max(0.1, Math.min(5, scale)); // Limit zoom range
        updateTransform();
      };

      // Mouse drag for pan
      const handleImageMouseDown = (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        img.style.cursor = 'grabbing';
        e.preventDefault();
      };

      const handleImageMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        translateX += deltaX / scale;
        translateY += deltaY / scale;
        
        updateTransform();
        
        lastX = e.clientX;
        lastY = e.clientY;
      };

      const handleImageMouseUp = () => {
        isDragging = false;
        img.style.cursor = 'grab';
      };

      // Add event listeners
      viewportRef.current.addEventListener('wheel', handleImageWheel);
      img.addEventListener('mousedown', handleImageMouseDown);
      document.addEventListener('mousemove', handleImageMouseMove);
      document.addEventListener('mouseup', handleImageMouseUp);

      // Store cleanup function
      viewportRef.current._imageCleanup = () => {
        viewportRef.current.removeEventListener('wheel', handleImageWheel);
        img.removeEventListener('mousedown', handleImageMouseDown);
        document.removeEventListener('mousemove', handleImageMouseMove);
        document.removeEventListener('mouseup', handleImageMouseUp);
      };

      img.onload = () => {
        setIsLoading(false);
        toast.success('Enhanced image viewer loaded successfully');
      };

      img.onerror = () => {
        setError('Failed to load image file');
        setIsLoading(false);
      };

    } catch (err) {
      console.error('Error displaying regular image:', err);
      setError(`Failed to display image: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Function to extract ZIP file and find DICOM files
  const extractZipFile = async (zipUrl) => {
    const toastId = toast.loading('Preparing ZIP download...', {
      autoClose: false,
      closeButton: false
    });
    
    try {
      setIsLoading(true);

      // Fetch the ZIP file with retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          response = await fetch(zipUrl, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            break; // Success, exit retry loop
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (fetchError) {
          retryCount++;
          console.warn(`ZIP fetch attempt ${retryCount} failed:`, fetchError);
          
          if (retryCount >= maxRetries) {
            throw new Error(`Failed to fetch ZIP file after ${maxRetries} attempts: ${fetchError.message}`);
          }
          
          // Update toast for retry
          toast.update(toastId, {
            render: `🔄 Retrying ZIP download... (${retryCount}/${maxRetries})`,
            type: 'info',
            isLoading: true
          });
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Get the content length for progress tracking
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;

      let zipData;
      if (totalSize > 0) {
        // Use ReadableStream for large files with progress
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;
        let lastUpdate = 0;
        const updateThrottle = 200; // Update toast max every 200ms

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          // Throttle toast updates to avoid UI jank
          const now = Date.now();
          if (now - lastUpdate > updateThrottle || receivedLength === totalSize) {
            const progress = Math.round((receivedLength / totalSize) * 100);
            const loadedMB = (receivedLength / (1024 * 1024)).toFixed(1);
            const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
            
            toast.update(toastId, {
              render: `📥 Downloading ZIP: ${progress}% (${loadedMB}/${totalMB} MB)`,
              type: 'info',
              isLoading: true
            });
            
            lastUpdate = now;
          }
        }

        // Combine chunks
        toast.update(toastId, {
          render: '📦 Processing ZIP data...',
          type: 'info',
          isLoading: true
        });
        
        zipData = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          zipData.set(chunk, position);
          position += chunk.length;
        }
      } else {
        // Fallback for unknown content length
        toast.update(toastId, {
          render: '📥 Downloading ZIP file...',
          type: 'info',
          isLoading: true
        });
        zipData = await response.arrayBuffer();
      }
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(zipData);

      const dicomFiles = [];
      const imageFiles = [];

      // Process each file in the ZIP
      for (const [filename, file] of Object.entries(zipContents.files)) {
        if (file.dir) continue; // Skip directories

        const filenameLower = filename.toLowerCase();
        
        // Check if it's a DICOM file
        if (filenameLower.endsWith('.dcm') || 
            filenameLower.endsWith('.dicom') ||
            filenameLower.includes('dicom') ||
            !filenameLower.includes('.')) { // Many DICOM files have no extension
          
          try {
            const fileData = await file.async('arraybuffer');
            
            // Create a blob URL for the DICOM file
            const blob = new Blob([fileData], { type: 'application/dicom' });
            const blobUrl = URL.createObjectURL(blob);
            
            dicomFiles.push({
              filename,
              url: blobUrl,
              type: 'dicom',
              size: fileData.byteLength
            });
          } catch (err) {
            console.warn(`Failed to extract ${filename}:`, err);
          }
        }
        // Check if it's a regular image file
        else if (filenameLower.endsWith('.png') || 
                 filenameLower.endsWith('.jpg') || 
                 filenameLower.endsWith('.jpeg') ||
                 filenameLower.endsWith('.gif') ||
                 filenameLower.endsWith('.bmp')) {
          
          try {
            const fileData = await file.async('arraybuffer');
            
            // Determine MIME type
            let mimeType = 'image/jpeg';
            if (filenameLower.endsWith('.png')) mimeType = 'image/png';
            else if (filenameLower.endsWith('.gif')) mimeType = 'image/gif';
            else if (filenameLower.endsWith('.bmp')) mimeType = 'image/bmp';
            
            // Create a blob URL for the image file
            const blob = new Blob([fileData], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            
            imageFiles.push({
              filename,
              url: blobUrl,
              type: 'image',
              size: fileData.byteLength
            });
          } catch (err) {
            console.warn(`Failed to extract ${filename}:`, err);
          }
        }
      }

      // Combine DICOM and image files, prioritizing DICOM
      const allFiles = [...dicomFiles, ...imageFiles];
      
      if (allFiles.length === 0) {
        throw new Error('No DICOM or image files found in the ZIP archive');
      }

      setExtractedFiles(allFiles);
      setIsZipFile(true);
      setCurrentImageIndex(0);

      // Update toast to success
      toast.update(toastId, {
        render: `✅ Extracted ${allFiles.length} files from ZIP archive`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true
      });
      
      // Load the first file
      if (allFiles.length > 0) {
        await loadExtractedFile(allFiles[0]);
      }

    } catch (err) {
      console.error('Error extracting ZIP file:', err);
      
      // Update toast to error
      let errorMessage = 'Failed to extract ZIP file';
      
      // Check if it's a network/download error
      if (err.message.includes('Failed to fetch') || 
          err.message.includes('ERR_CONTENT_LENGTH_MISMATCH') ||
          err.message.includes('HTTP 403') ||
          err.message.includes('HTTP 404')) {
        
        errorMessage = 'ZIP file download failed - please try again';
        setError(`ZIP file download failed: The file may be expired, corrupted, or temporarily unavailable. Please try refreshing the page or contact support if the issue persists.`);
      } else {
        setError(`Failed to extract ZIP file: ${err.message}`);
      }
      
      toast.update(toastId, {
        render: `❌ ${errorMessage}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });
      
      setIsLoading(false);
    }
  };

  // Function to load an extracted file
  const loadExtractedFile = async (file) => {
    try {
      setIsLoading(true);
      
      if (file.type === 'dicom') {
        await loadDicomFile(file.url);
      } else {
        displayRegularImage(file.url);
      }
      
    } catch (err) {
      console.error('Error loading extracted file:', err);
      setError(`Failed to load ${file.filename}: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Function to load DICOM file
  const loadDicomFile = async (dicomUrl) => {
    try {
      // Enable the viewport
      cornerstone.enable(viewportRef.current);

      // Prepare image ID
      let imageId;
      if (dicomUrl.startsWith('wadouri:')) {
        imageId = dicomUrl;
      } else {
        imageId = `wadouri:${dicomUrl}`;
      }

      // Load and display DICOM image
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(viewportRef.current, image);

      // Enable mouse and touch interactions for DICOM
      const element = viewportRef.current;
      
      // Enable mouse wheel for zooming
      element.addEventListener('wheel', handleWheel);
      
      // Enable mouse interactions
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
      
      // Touch events for mobile
      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchmove', handleTouchMove);
      element.addEventListener('touchend', handleTouchEnd);

      setIsLoading(false);
      toast.success('DICOM file loaded successfully');

    } catch (err) {
      console.error('Error loading DICOM file:', err);
      throw err;
    }
  };

  // Initialize Cornerstone
  useEffect(() => {
    const initializeCornerstone = async () => {
      try {
        // Configure WADO Image Loader
        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
        
        // Configure web workers
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
        
        cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
        
        setIsInitialized(true);
        console.log('Enhanced Cornerstone viewer initialized successfully');
      } catch (err) {
        console.error('Failed to initialize Cornerstone:', err);
        setError('Failed to initialize enhanced viewer');
      }
    };

    if (!isInitialized) {
      initializeCornerstone();
    }
  }, [isInitialized]);

  // Load and display image (DICOM or regular image)
  useEffect(() => {
    if (!dicomUrl || !viewportRef.current || !isInitialized) return;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Enable the viewport
        cornerstone.enable(viewportRef.current);

        // Check the file type
        const fileType = await checkFileType(dicomUrl);
        
        if (fileType === 'zip') {
          // Handle ZIP file
          await extractZipFile(dicomUrl);
        } else if (fileType === 'dicom') {
          // Handle DICOM file
          await loadDicomFile(dicomUrl);
        } else {
          // Handle regular image files
          displayRegularImage(dicomUrl);
        }

      } catch (err) {
        console.error('Error loading DICOM:', err);
        setError(`Failed to load medical image: ${err.message}`);
        setIsLoading(false);
        toast.error('Failed to load enhanced viewer');
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      if (viewportRef.current) {
        try {
          const element = viewportRef.current;
          
          // Clean up regular image event listeners if they exist
          if (element._imageCleanup) {
            element._imageCleanup();
          }
          
          // Clean up DICOM event listeners
          element.removeEventListener('wheel', handleWheel);
          element.removeEventListener('mousedown', handleMouseDown);
          element.removeEventListener('mousemove', handleMouseMove);
          element.removeEventListener('mouseup', handleMouseUp);
          element.removeEventListener('touchstart', handleTouchStart);
          element.removeEventListener('touchmove', handleTouchMove);
          element.removeEventListener('touchend', handleTouchEnd);
          
          // Try to disable cornerstone (may fail if not enabled)
          try {
            cornerstone.disable(element);
          } catch (disableErr) {
            // Ignore disable errors - element might not be cornerstone-enabled
          }
        } catch (err) {
          console.warn('Error during cleanup:', err);
        }
      }
    };
  }, [dicomUrl, isInitialized, viewMode]);

  // Keyboard navigation for ZIP files
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isZipFile || extractedFiles.length <= 1) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPreviousFile();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isZipFile, extractedFiles.length, currentImageIndex]);

  // Mouse interaction handlers
  let isMouseDown = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  const handleWheel = (e) => {
    e.preventDefault();
    if (!viewportRef.current) return;

    const viewport = cornerstone.getViewport(viewportRef.current);
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    viewport.scale *= scaleFactor;
    cornerstone.setViewport(viewportRef.current, viewport);
  };

  const handleMouseDown = (e) => {
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !viewportRef.current) return;

    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    const viewport = cornerstone.getViewport(viewportRef.current);

    if (e.button === 2 || e.ctrlKey) {
      // Right click or Ctrl+drag for window/level
      viewport.voi.windowWidth += deltaX * 4;
      viewport.voi.windowCenter += deltaY * 4;
    } else {
      // Left click for pan
      viewport.translation.x += deltaX / viewport.scale;
      viewport.translation.y += deltaY / viewport.scale;
    }

    cornerstone.setViewport(viewportRef.current, viewport);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };

  const handleMouseUp = () => {
    isMouseDown = false;
  };

  // Touch handlers for mobile
  let lastTouchDistance = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!viewportRef.current) return;

    const viewport = cornerstone.getViewport(viewportRef.current);

    if (e.touches.length === 1) {
      // Single touch - pan
      const deltaX = e.touches[0].clientX - lastTouchX;
      const deltaY = e.touches[0].clientY - lastTouchY;
      
      viewport.translation.x += deltaX / viewport.scale;
      viewport.translation.y += deltaY / viewport.scale;
      
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // Two finger pinch - zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (lastTouchDistance > 0) {
        const scaleFactor = distance / lastTouchDistance;
        viewport.scale *= scaleFactor;
      }
      
      lastTouchDistance = distance;
    }

    cornerstone.setViewport(viewportRef.current, viewport);
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      lastTouchDistance = 0;
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle reset view
  const resetView = () => {
    if (viewportRef.current) {
      try {
        // Try cornerstone reset first (for DICOM images)
        cornerstone.reset(viewportRef.current);
        cornerstone.fitToWindow(viewportRef.current);
      } catch (err) {
        // If cornerstone reset fails, try regular image reset
        const img = viewportRef.current.querySelector('img');
        if (img) {
          img.style.transform = 'scale(1) translate(0px, 0px)';
        }
      }
    }
  };

  // Navigation functions for ZIP files
  const navigateToFile = async (index) => {
    if (!isZipFile || !extractedFiles[index]) return;
    
    setCurrentImageIndex(index);
    await loadExtractedFile(extractedFiles[index]);
  };

  const goToPreviousFile = () => {
    if (!isZipFile || extractedFiles.length <= 1) return;
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : extractedFiles.length - 1;
    navigateToFile(newIndex);
  };

  const goToNextFile = () => {
    if (!isZipFile || extractedFiles.length <= 1) return;
    const newIndex = currentImageIndex < extractedFiles.length - 1 ? currentImageIndex + 1 : 0;
    navigateToFile(newIndex);
  };

  // Handle preset adjustments
  const applyPreset = (preset) => {
    if (!viewportRef.current) return;

    const presets = {
      ctBone: { windowWidth: 1500, windowCenter: 400 },
      ctSoft: { windowWidth: 400, windowCenter: 40 },
      ctLung: { windowWidth: 2000, windowCenter: -500 },
      mrDefault: { windowWidth: 200, windowCenter: 100 },
    };

    const { windowWidth, windowCenter } = presets[preset] || presets.ctSoft;
    
    try {
      // Try to apply DICOM presets
      const viewport = cornerstone.getViewport(viewportRef.current);
      viewport.voi.windowWidth = windowWidth;
      viewport.voi.windowCenter = windowCenter;
      cornerstone.setViewport(viewportRef.current, viewport);
      toast.success(`Applied ${preset} preset`);
    } catch (err) {
      // For regular images, presets don't apply
      toast.info('Presets are only available for DICOM images');
      console.warn('Presets not available for regular images:', err);
    }
  };

  if (error) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${isFullscreen ? 'z-[9999]' : ''}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Enhanced Viewer</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <IoCloseOutline />
            </button>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex justify-end space-x-2">
            {error && error.includes('download failed') && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-95 flex flex-col z-50 ${isFullscreen ? 'z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              {isZipFile && <IoArchive className="text-yellow-400" />}
              <span>Enhanced Medical Viewer - {fileName} ({fileType})</span>
            </h2>
            {isZipFile && extractedFiles.length > 0 && (
              <div className="text-sm text-gray-300 flex items-center space-x-2">
                <span>ZIP Archive: {extractedFiles.length} files</span>
                <span>•</span>
                <span>Current: {extractedFiles[currentImageIndex]?.filename}</span>
                <span>({currentImageIndex + 1}/{extractedFiles.length})</span>
              </div>
            )}
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm">
                {isZipFile ? 'Processing ZIP file...' : 'Loading Enhanced Viewer...'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* ZIP Navigation Controls */}
          {isZipFile && extractedFiles.length > 1 && (
            <div className="flex items-center space-x-1 mr-4 bg-gray-800 rounded px-2 py-1">
              <button
                onClick={goToPreviousFile}
                className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                title="Previous file"
              >
                ←
              </button>
              <span className="text-xs text-gray-300 px-2">
                {currentImageIndex + 1}/{extractedFiles.length}
              </span>
              <button
                onClick={goToNextFile}
                className="p-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
                title="Next file"
              >
                →
              </button>
            </div>
          )}

          {/* View Mode Selector */}
          <div className="flex space-x-1 mr-4">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                viewMode === '2d' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="2D Enhanced View"
            >
              <IoLayers />
              <span>2D+</span>
            </button>
            <button
              onClick={() => setViewMode('enhanced')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                viewMode === 'enhanced' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Enhanced Medical View"
            >
              <IoCube />
              <span>Enhanced</span>
            </button>
          </div>

          {/* Presets */}
          <div className="flex space-x-1">
            <button
              onClick={() => applyPreset('ctSoft')}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              title="CT Soft Tissue"
            >
              Soft
            </button>
            <button
              onClick={() => applyPreset('ctBone')}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              title="CT Bone"
            >
              Bone
            </button>
            <button
              onClick={() => applyPreset('ctLung')}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              title="CT Lung"
            >
              Lung
            </button>
          </div>

          {/* Control buttons */}
          <button
            onClick={resetView}
            className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            title="Reset View"
          >
            <IoRefresh />
          </button>
          
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

      {/* Viewer Container */}
      <div className="flex-1 relative bg-black">
        <div 
          ref={viewportRef}
          className="w-full h-full cursor-crosshair"
          style={{ 
            minHeight: '400px',
            background: '#000000'
          }}
          onContextMenu={(e) => e.preventDefault()} // Disable right-click menu
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">
                {isZipFile ? 'Processing ZIP Archive...' : 'Loading Enhanced Medical Viewer...'}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                {isZipFile 
                  ? 'Extracting and processing medical files' 
                  : 'Initializing Cornerstone Engine'
                }
              </p>
              {isZipFile && (
                <p className="text-xs text-gray-400 mt-1">
                  This may take a moment for large archives
                </p>
              )}
            </div>
          </div>
        )}

        {/* View Mode Info */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          {isZipFile && '📦 ZIP Archive View • '}
          {viewMode === '2d' && '📐 Enhanced 2D Medical View'}
          {viewMode === 'enhanced' && '🎯 Enhanced Medical Viewer'}
          {isZipFile && extractedFiles[currentImageIndex] && (
            <div className="text-xs text-gray-300 mt-1">
              {extractedFiles[currentImageIndex].filename} 
              ({extractedFiles[currentImageIndex].type.toUpperCase()})
            </div>
          )}
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="bg-gray-900 text-white p-2 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <span>🖱️ Left Click + Drag: Pan</span>
            <span>🖱️ Right Click + Drag: Window/Level</span>
            <span>🖱️ Scroll: Zoom</span>
            <span>📱 Touch: Pan & Pinch to Zoom</span>
            {isZipFile && extractedFiles.length > 1 && (
              <span>⬅️➡️ Arrow Buttons: Navigate Files</span>
            )}
          </div>
          <div className="text-gray-400">
            Powered by Cornerstone Medical Imaging | Mode: {viewMode.toUpperCase()}
            {isZipFile && ` | ZIP: ${extractedFiles.length} files`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enhanced3DViewer;
