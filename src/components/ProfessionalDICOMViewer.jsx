import React, { useEffect, useRef, useState } from 'react';
import { 
  IoCloseOutline, 
  IoExpand, 
  IoContract, 
  IoRefresh, 
  IoArchive,
  IoMove,
  IoSearch,
  IoContrast,
  IoResize,
  IoTriangle,
  IoSquareOutline,
  IoRefreshOutline,
  IoGridOutline,
  IoCamera,
  IoSettings,
  IoArrowBack
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import JSZip from 'jszip';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

const ProfessionalDICOMViewer = ({ 
  dicomUrl, 
  fileName, 
  fileType = 'original',
  onClose,
  isIntegrated = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [isZipFile, setIsZipFile] = useState(false);
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(1);
  const [cornerstoneInitialized, setCornerstoneInitialized] = useState(false);
  const [activeTool, setActiveTool] = useState('pan');
  const [viewportLayout, setViewportLayout] = useState('single'); // 'single' or 'quad'
  const [preloadedImages, setPreloadedImages] = useState(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const scrollTimeoutRef = useRef(null); // Stores last scroll timestamp for throttling
  const loadingRef = useRef(false);
  const currentIndexRef = useRef(0); // Track current index to avoid stale closures
  const navigationSetupRef = useRef(false); // Track if navigation is already set up
  const eventListenersRef = useRef([]); // Track event listeners for cleanup

  
  const mainViewportRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentIndexRef.current = currentImageIndex;
  }, [currentImageIndex]);

  // Cleanup function for navigation listeners
  const cleanupNavigationListeners = () => {
    const viewport = mainViewportRef.current;
    if (!viewport) return;

    // Remove all tracked event listeners
    eventListenersRef.current.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (e) {
        console.warn('Failed to remove event listener:', e);
      }
    });

    // Clear the tracking array
    eventListenersRef.current = [];
    navigationSetupRef.current = false;
    
    console.log('🧹 Cleaned up navigation listeners');
  };

  // Reset navigation setup (useful for re-initialization)
  const resetNavigationSetup = () => {
    cleanupNavigationListeners();
    console.log('🔄 Navigation setup reset');
  };

  const checkIfZipFile = (url) => {
    const urlLower = url.toLowerCase();
    return urlLower.includes('.zip') || urlLower.includes('zip');
  };

  // Initialize Cornerstone
  const initializeCornerstone = () => {
    if (cornerstoneInitialized) return;

    try {
      // Configure WADO Image Loader
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      
      cornerstoneWADOImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: {
          convertFloatPixelDataToInt: false,
        },
      });

      setCornerstoneInitialized(true);
      console.log('Cornerstone initialized successfully');
    } catch (err) {
      console.error('Failed to initialize Cornerstone:', err);
    }
  };

  // Load medical image into viewport (DICOM or regular image)
  const loadDicomIntoViewport = async (imageUrl, viewportElement, viewportName, imageIndex = null) => {
    try {
      if (!viewportElement) {
        console.error('No viewport element provided');
        return;
      }

      // Use provided index or current
      const indexToUse = imageIndex !== null ? imageIndex : currentImageIndex;
      const currentFile = extractedFiles[indexToUse];
      const preloaded = preloadedImages.get(indexToUse);
      
      // Remove existing overlays first
      const existingOverlays = viewportElement.querySelectorAll('.viewport-overlay');
      existingOverlays.forEach(el => el.remove());
      
      // Clear content based on what we're about to display
      if (currentFile && currentFile.type === 'image') {
        // Switching to regular image - remove any Cornerstone canvas
        const existingCanvases = viewportElement.querySelectorAll('canvas');
        existingCanvases.forEach(el => el.remove());
      } else {
        // Switching to DICOM - remove any img tags
        const existingImgs = viewportElement.querySelectorAll('img:not(.viewport-overlay *)');
        existingImgs.forEach(el => el.remove());
      }
      
      if (currentFile && currentFile.type === 'image') {
        // Handle regular image (PNG/JPG/WEBP)
        const img = document.createElement('img');
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        `;
        
        if (preloaded && preloaded.loaded) {
          // Use preloaded image
          img.src = preloaded.url;
          console.log(`⚡ Instant display from cache: ${indexToUse + 1} (${currentFile.type})`);
        } else {
          // Load on demand
          img.src = imageUrl;
          console.log(`📥 Loaded on demand: ${indexToUse + 1} (${currentFile.type})`);
        }
        
        viewportElement.appendChild(img);
        
      } else {
        // Handle DICOM image with Cornerstone
        try {
          cornerstone.enable(viewportElement);
        } catch (e) {
          // Element might already be enabled
          console.log('Viewport already enabled');
        }

        if (preloaded && preloaded.loaded && preloaded.type === 'dicom') {
          // Use preloaded DICOM image
          await cornerstone.displayImage(viewportElement, preloaded.image);
          console.log(`⚡ Instant display from cache: ${indexToUse + 1} (DICOM)`);
        } else {
          // Fallback to regular DICOM loading
          const imageId = `wadouri:${imageUrl}`;
          const image = await cornerstone.loadImage(imageId);
          await cornerstone.displayImage(viewportElement, image);
          console.log(`📥 Loaded on demand: ${indexToUse + 1} (DICOM)`);
        }

        // Fit to window
        cornerstone.reset(viewportElement);
      }
      
      // Add viewport info overlay
      const overlay = document.createElement('div');
      overlay.className = 'viewport-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        color: #00ff00;
        font-family: monospace;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.7);
        padding: 5px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 10;
      `;
      overlay.innerHTML = `
        <div>${viewportName}</div>
        <div>Image: ${indexToUse + 1}/${totalImages}</div>
        <div>Type: ${currentFile?.type || 'unknown'}</div>
      `;
      
      viewportElement.appendChild(overlay);
      
      console.log(`✅ Loaded image into ${viewportName}`);
      
    } catch (err) {
      console.error(`❌ Failed to load image into ${viewportName}:`, err);
    }
  };

  // Function to extract ZIP file and get all medical images (DICOM and regular images)
  const extractZipFile = async (zipUrl) => {
    try {
      toast.info('Processing ZIP file...');
      
      const response = await fetch(zipUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ZIP file: ${response.status}`);
      }

      const zipData = await response.arrayBuffer();
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(zipData);

      const imageFiles = [];
      
      for (const [filename, file] of Object.entries(zipContents.files)) {
        if (file.dir) continue;

        const filenameLower = filename.toLowerCase();
        
        // Check if it's a medical image file (DICOM or regular image)
        const isDicom = filenameLower.endsWith('.dcm') || 
                        filenameLower.endsWith('.dicom') ||
                        filenameLower.includes('dicom') ||
                        (!filenameLower.includes('.') && !filenameLower.includes('__macosx'));
        
        const isRegularImage = filenameLower.endsWith('.png') ||
                               filenameLower.endsWith('.jpg') ||
                               filenameLower.endsWith('.jpeg') ||
                               filenameLower.endsWith('.webp');
        
        if (isDicom || isRegularImage) {
          try {
            const fileData = await file.async('arraybuffer');
            
            let blobType = 'application/dicom';
            let fileType = 'dicom';
            
            // Determine file type
            if (filenameLower.endsWith('.png')) {
              blobType = 'image/png';
              fileType = 'image';
            } else if (filenameLower.endsWith('.jpg') || filenameLower.endsWith('.jpeg')) {
              blobType = 'image/jpeg';
              fileType = 'image';
            } else if (filenameLower.endsWith('.webp')) {
              blobType = 'image/webp';
              fileType = 'image';
            }
            
            const blob = new Blob([fileData], { type: blobType });
            const blobUrl = URL.createObjectURL(blob);
            
            imageFiles.push({
              filename,
              url: blobUrl,
              type: fileType,
              size: fileData.byteLength
            });
          } catch (err) {
            console.warn(`Failed to extract ${filename}:`, err);
          }
        }
      }

      if (imageFiles.length === 0) {
        throw new Error('No medical image files found in ZIP archive');
      }

      // Sort files by name with natural numeric sorting (CT000001 < CT000002 < CT000010)
      imageFiles.sort((a, b) => {
        // Extract numbers from filenames for proper numeric sorting
        const numA = a.filename.match(/\d+/g);
        const numB = b.filename.match(/\d+/g);
        
        if (numA && numB) {
          // Compare each number sequence
          for (let i = 0; i < Math.min(numA.length, numB.length); i++) {
            const diff = parseInt(numA[i]) - parseInt(numB[i]);
            if (diff !== 0) return diff;
          }
        }
        
        // Fallback to alphabetical if no numbers or numbers are equal
        return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      console.log('Sorted files:', imageFiles.map(f => f.filename));
      
      setExtractedFiles(imageFiles);
      setIsZipFile(true);
      setTotalImages(imageFiles.length);
      setCurrentImageIndex(0);

      const dicomCount = imageFiles.filter(f => f.type === 'dicom').length;
      const imageCount = imageFiles.filter(f => f.type === 'image').length;
      
      toast.success(`ZIP extracted: ${imageFiles.length} files`);
      return imageFiles;

    } catch (err) {
      console.error('Error extracting ZIP file:', err);
      throw err;
    }
  };

  // Preload all medical images for instant navigation (OHIF behavior)
  const preloadAllImages = async (files) => {
    if (files.length === 0) return;
    
    setIsPreloading(true);
    const preloadMap = new Map();
    
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        
        if (file.type === 'dicom') {
          // Preload DICOM using Cornerstone
          const imageId = `wadouri:${file.url}`;
          const image = await cornerstone.loadImage(imageId);
          preloadMap.set(i, { imageId, image, loaded: true, type: 'dicom' });
        } else if (file.type === 'image') {
          // Preload regular image
          const img = new Image();
          img.crossOrigin = 'anonymous'; // Handle CORS for S3 images
          await new Promise((resolve, reject) => {
            img.onload = () => {
              console.log(`Image loaded successfully: ${file.filename}`);
              resolve();
            };
            img.onerror = (e) => {
              console.error(`Image load error for ${file.filename}:`, e);
              reject(new Error(`Failed to load image: ${e.type || 'unknown error'}`));
            };
            img.src = file.url;
          });
          preloadMap.set(i, { image: img, loaded: true, type: 'image', url: file.url });
        }
        
        const progress = Math.round(((i + 1) / files.length) * 100);
        setPreloadProgress(progress);
        
        console.log(`✅ Preloaded ${i + 1}/${files.length}: ${file.filename} (${file.type})`);
      } catch (err) {
        const errorMsg = err?.message || String(err) || 'Unknown error';
        console.error(`❌ Failed to preload ${files[i]?.filename}:`, errorMsg);
        preloadMap.set(i, { loaded: false, error: errorMsg });
      }
    }
    
    setPreloadedImages(preloadMap);
    setIsPreloading(false);
    
    return preloadMap;
  };

  // Function to load current image into main viewport
  const loadCurrentImageIntoViewport = async (imageIndex = null) => {
    if (extractedFiles.length === 0) {
      console.warn('⚠️ No extracted files available');
      return;
    }
    
    // Use provided index or current index
    const indexToLoad = imageIndex !== null ? imageIndex : currentImageIndex;
    const currentFile = extractedFiles[indexToLoad];
    
    if (!currentFile) {
      console.error(`No file found at index ${indexToLoad}`);
      return;
    }

    console.log(`🖼️ Loading image ${indexToLoad + 1}/${totalImages}: ${currentFile.filename}`);

    // Ensure viewport is ready
    if (!mainViewportRef.current) {
      console.warn('⚠️ Viewport not ready, retrying...');
      setTimeout(() => loadCurrentImageIntoViewport(imageIndex), 100);
      return;
    }

    try {
      await loadDicomIntoViewport(currentFile.url, mainViewportRef.current, 'Main View', indexToLoad);
      console.log(`✅ Successfully loaded image ${indexToLoad + 1}`);
    } catch (error) {
      console.error(`❌ Failed to load image ${indexToLoad + 1}:`, error);
      throw error;
    }
  };

  // Function to select image and update viewport
  const selectImage = async (index) => {
    if (index < 0 || index >= totalImages) return;
    if (loadingRef.current) return; // Prevent overlapping loads
    
    loadingRef.current = true;
    currentIndexRef.current = index; // Update ref immediately
    setCurrentImageIndex(index);
    
    try {
      // Pass the index directly to avoid race condition
      await loadCurrentImageIntoViewport(index);
    } finally {
      loadingRef.current = false;
    }
  };

  // Tool selection handlers with actual Cornerstone manipulation
  const handleToolSelect = (toolName) => {
    setActiveTool(toolName);
    
    const viewport = mainViewportRef.current;
    if (!viewport) {
      console.warn('Viewport not available');
      return;
    }

    // Check if current file is DICOM (tools only work on DICOM)
    const currentFile = extractedFiles[currentImageIndex];
    if (!currentFile || currentFile.type !== 'dicom') {
      return;
    }

    try {
      // Remove existing mouse event listeners to avoid conflicts
      viewport.removeEventListener('mousedown', viewport._panStart);
      viewport.removeEventListener('mousemove', viewport._panMove);
      viewport.removeEventListener('mouseup', viewport._panEnd);
      viewport.removeEventListener('wheel', viewport._zoomWheel);
      
      switch (toolName) {
        case 'pan':
          // Pan: Click and drag to move image
          viewport._panStart = (e) => {
            if (e.button !== 0) return;
            const startX = e.pageX;
            const startY = e.pageY;
            const currentViewport = cornerstone.getViewport(viewport);
            const initialTranslation = { ...currentViewport.translation };

            const panMove = (moveEvent) => {
              const deltaX = moveEvent.pageX - startX;
              const deltaY = moveEvent.pageY - startY;
              
              cornerstone.setViewport(viewport, {
                ...currentViewport,
                translation: {
                  x: initialTranslation.x + deltaX,
                  y: initialTranslation.y + deltaY
                }
              });
            };

            const panEnd = () => {
              document.removeEventListener('mousemove', panMove);
              document.removeEventListener('mouseup', panEnd);
            };

            document.addEventListener('mousemove', panMove);
            document.addEventListener('mouseup', panEnd);
          };
          viewport.addEventListener('mousedown', viewport._panStart);
          break;

        case 'zoom':
          // Zoom: Scroll wheel to zoom in/out
          viewport._zoomWheel = (e) => {
            e.preventDefault();
            const currentViewport = cornerstone.getViewport(viewport);
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            
            cornerstone.setViewport(viewport, {
              ...currentViewport,
              scale: currentViewport.scale * zoomFactor
            });
          };
          viewport.addEventListener('wheel', viewport._zoomWheel);
          break;

        case 'windowLevel':
          // Window/Level: Click and drag to adjust brightness/contrast
          viewport._wlStart = (e) => {
            if (e.button !== 0) return;
            const startX = e.pageX;
            const startY = e.pageY;
            const currentViewport = cornerstone.getViewport(viewport);
            const initialVoi = currentViewport.voi || { windowWidth: 400, windowCenter: 40 };

            const wlMove = (moveEvent) => {
              const deltaX = moveEvent.pageX - startX;
              const deltaY = moveEvent.pageY - startY;
              
              cornerstone.setViewport(viewport, {
                ...currentViewport,
                voi: {
                  windowWidth: Math.max(1, initialVoi.windowWidth + deltaX),
                  windowCenter: initialVoi.windowCenter + deltaY
                }
              });
            };

            const wlEnd = () => {
              document.removeEventListener('mousemove', wlMove);
              document.removeEventListener('mouseup', wlEnd);
            };

            document.addEventListener('mousemove', wlMove);
            document.addEventListener('mouseup', wlEnd);
          };
          viewport.addEventListener('mousedown', viewport._wlStart);
          break;

        case 'length':
        case 'angle':
        case 'roi':
          // Measurement tools - would require cornerstone-tools library
          break;

        default:
          break;
      }
      
      const toolNameDisplay = toolName.charAt(0).toUpperCase() + toolName.slice(1);
      
    } catch (err) {
      console.error('Error applying tool:', err);
    }
  };

  const resetView = () => {
    if (mainViewportRef.current && cornerstoneInitialized) {
      try {
        cornerstone.reset(mainViewportRef.current);
      } catch (err) {
        console.error('Error resetting view:', err);
      }
    }
  };

  const toggleLayout = () => {
    setViewportLayout(viewportLayout === 'single' ? 'quad' : 'single');
  };

  const setupMouseCursorSliding = () => {
    
    if (navigationSetupRef.current) {
      console.log('⚠️ Navigation already set up, skipping duplicate setup');
      return;
    }

    const viewport = mainViewportRef.current;
    
    if (totalImages < 1) {
      console.warn('⚠️ Skipping navigation setup: no images');
      return;
    }

    if (!viewport) {
      console.warn('⚠️ Viewport not available for navigation setup');
      return;
    }

    // Clean up any existing listeners first
    cleanupNavigationListeners();

    let isMouseDown = false;
    let lastMouseY = 0;
    const mouseSensitivity = 15;

    const handleMouseDown = (e) => {
      const dragTools = ['pan', 'windowLevel']; 
      const allowNavigation = e.shiftKey || !dragTools.includes(activeTool);
      
      if (e.button === 0 && allowNavigation) {
        isMouseDown = true;
        lastMouseY = e.clientY;
        viewport.style.cursor = 'ns-resize';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (!isMouseDown || totalImages <= 1) return;
      
      const deltaY = e.clientY - lastMouseY;
      
      if (Math.abs(deltaY) >= mouseSensitivity) {
        let newIndex = currentImageIndex;
        
        if (deltaY > 0) {
          // Mouse moved down - next image
          newIndex = (currentImageIndex + 1) % totalImages;
        } else {
          // Mouse moved up - previous image
          newIndex = currentImageIndex === 0 ? totalImages - 1 : currentImageIndex - 1;
        }
        
        if (newIndex !== currentImageIndex) {
          selectImage(newIndex);
          lastMouseY = e.clientY;
        }
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      viewport.style.cursor = 'crosshair';
    };

    const handleWheel = (e) => {
      // Use ref for current index to avoid stale closures
      const currentIdx = currentIndexRef.current;
      
      console.log('🖱️ WHEEL EVENT FIRED!', {
        deltaY: e.deltaY,
        totalImages,
        currentIndex: currentIdx,
        currentIndexState: currentImageIndex, // For comparison
        activeTool,
        targetClass: e.target.className
      });
      
      // If zoom tool is active, let the zoom handler take care of it
      if (activeTool === 'zoom') {
        console.log('🔍 Zoom tool active - letting zoom handler process');
        return;
      }
      
      if (totalImages <= 1) {
        console.log('⚠️ Blocked: only 1 image (totalImages:', totalImages, ')');
        return;
      }
      
      e.preventDefault();
      e.stopPropagation(); 
      
      const now = Date.now();
      if (scrollTimeoutRef.current && now - scrollTimeoutRef.current < 50) {
        console.log('⚠️ Blocked: throttled');
        return;
      }
      scrollTimeoutRef.current = now;
      
      const scrollDelta = Math.sign(e.deltaY);
      
      if (scrollDelta === 0) {
        console.log('⚠️ Blocked: deltaY is 0');
        return;
      }
      
      let newIndex;
      if (scrollDelta > 0) {
        newIndex = (currentIdx + 1) % totalImages;
      } else {
        newIndex = currentIdx === 0 ? totalImages - 1 : currentIdx - 1;
      }
      
      console.log(`✅ NAVIGATING: ${currentIdx} → ${newIndex}`);
      selectImage(newIndex);
    };

    const addTrackedListener = (element, event, handler, options = {}) => {
      element.addEventListener(event, handler, options);
      eventListenersRef.current.push({ element, event, handler, options });
    };

    addTrackedListener(viewport, 'mousedown', handleMouseDown);
    addTrackedListener(viewport, 'mousemove', handleMouseMove);
    addTrackedListener(viewport, 'mouseup', handleMouseUp);
    addTrackedListener(viewport, 'mouseleave', handleMouseUp);
    addTrackedListener(viewport, 'wheel', handleWheel, { passive: false }); 

    navigationSetupRef.current = true;
    console.log('✅ Navigation event listeners attached to viewport');

    const handleKeyDown = (e) => {
      if (totalImages <= 1) return;
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const newIndex = currentImageIndex === 0 ? totalImages - 1 : currentImageIndex - 1;
        selectImage(newIndex);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const newIndex = (currentImageIndex + 1) % totalImages;
        selectImage(newIndex);
      }
    };

    addTrackedListener(document, 'keydown', handleKeyDown);
    return cleanupNavigationListeners;
  };

  useEffect(() => {
    const loadOHIFViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadingTimeout = setTimeout(() => {
          console.error('Loading timeout - viewer taking too long to load');
          setError('Viewer is taking too long to load. Please check your network connection and try again.');
          setIsLoading(false);
        }, 500000); 

        // Initialize Cornerstone
        initializeCornerstone();

        // Check if it's a ZIP file
        const isZip = checkIfZipFile(dicomUrl);
        let filesToProcess = [];
        
        if (isZip) {
          filesToProcess = await extractZipFile(dicomUrl);
          // extractZipFile already sets totalImages, extractedFiles, and isZipFile
          console.log('🔍 ZIP extracted, totalImages should be set to:', filesToProcess.length);
        } else {
          // Single file - determine type
          const filenameLower = fileName.toLowerCase();
          let fileType = 'dicom';
          
          if (filenameLower.endsWith('.png') || 
              filenameLower.endsWith('.jpg') || 
              filenameLower.endsWith('.jpeg') || 
              filenameLower.endsWith('.webp')) {
            fileType = 'image';
          }
          
          filesToProcess = [{ 
            filename: fileName, 
            url: dicomUrl, 
            type: fileType,
            size: 0
          }];
          setTotalImages(1);
          setExtractedFiles(filesToProcess);
          setIsZipFile(false);
          
        }

        // PRELOAD ALL IMAGES for instant navigation (OHIF behavior)
        if (filesToProcess.length > 0) {
          try {
            await preloadAllImages(filesToProcess);
          } catch (preloadError) {
            console.warn('Preloading failed, continuing with regular loading:', preloadError);
          }
          
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          
          // Load first image immediately after preloading
          const loadFirstImage = async () => {
            try {
              console.log('🖼️ Loading first image...');
              await loadCurrentImageIntoViewport(0);
              console.log('✅ First image loaded successfully');
            } catch (loadError) {
              console.error('❌ Failed to load first image:', loadError);
              setError(`Failed to load first image: ${loadError.message}`);
              setIsLoading(false);
            }
          };
          
          // Try to load immediately, then retry if needed
          loadFirstImage();
          
          // Fallback retry mechanism
          const checkAndLoadImage = () => {
            if (mainViewportRef.current && extractedFiles.length > 0) {
              loadCurrentImageIntoViewport(0).then(() => {
                console.log('✅ First image loaded via retry mechanism');
              }).catch((loadError) => {
                console.error('Failed to load first image via retry:', loadError);
              });
            } else {
              setTimeout(checkAndLoadImage, 100);
            }
          };
          setTimeout(checkAndLoadImage, 500);
        } else {
          console.error('No files to process - this should not happen');
          setError('No valid files found to display');
          clearTimeout(loadingTimeout);
          setIsLoading(false);
        }

      } catch (err) {
        console.error('Error loading OHIF viewer:', err);
        setError(`Failed to load professional viewer: ${err.message}`);
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        toast.error('Failed to load viewer');
      }
    };

    loadOHIFViewer();

    // Cleanup
    return () => {
      cleanupNavigationListeners();
      if (mainViewportRef.current) cornerstone.disable(mainViewportRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [dicomUrl]);

  useEffect(() => {
    console.log('🔍 Navigation useEffect triggered:', {
      totalImages,
      extractedFilesLength: extractedFiles.length,
      isZipFile,
      navigationSetup: navigationSetupRef.current
    });
    
    if (isZipFile && totalImages > 1 && extractedFiles.length > 0 && !navigationSetupRef.current) {
      console.log('🔧 Setting up navigation after ZIP extraction complete');
      let retryCount = 0;
      const maxRetries = 50;
      
      const setupWithRetry = () => {
        if (mainViewportRef.current) {
          console.log('✅ Viewport ready, setting up navigation');
          setupMouseCursorSliding();
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(setupWithRetry, 5000);
        } 
      };
      
      setupWithRetry();
    }
  }, [totalImages, extractedFiles, isZipFile]);

  // Ensure first image loads when viewport is ready
  useEffect(() => {
    if (extractedFiles.length > 0 && mainViewportRef.current && !isLoading) {
      console.log('🖼️ Ensuring first image is loaded...');
      loadCurrentImageIntoViewport(0).then(() => {
        console.log('✅ First image ensured loaded');
      }).catch((error) => {
        console.warn('⚠️ Failed to ensure first image load:', error);
      });
    }
  }, [extractedFiles.length, isLoading]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#DCE1EE] bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Error Loading Medical Viewer</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#2EB4B4] text-white rounded hover:bg-[#2A9A9A]"
            >
              <IoRefresh className="inline mr-2" />
              Refresh Page
            </button>
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

  // If integrated mode, render without fixed positioning
  if (isIntegrated) {
    return (
      <div className="bg-[#DCE1EE] flex flex-col h-full">

        {/* Professional Viewer Container */}
        <div className="flex-1 flex">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center text-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EB4B4] mx-auto mb-4"></div>
                <p className="text-lg">Loading Medical Viewer...</p>
                <p className="text-sm text-gray-600 mt-2">
                  {isZipFile ? 'Processing Archive...' : 'Initializing Viewer'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Main Viewport Area - Full Width */}
              <div className="flex-grow flex flex-col w-full">
                {/* Professional Toolbar */}
                <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    {/* Left side - Main tools */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToolSelect('pan')}
                        className={`p-3 rounded-lg transition-colors ${
                          activeTool === 'pan' 
                            ? 'bg-[#2EB4B4] text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                        }`}
                        title="Pan Tool"
                      >
                        <IoMove size={20} />
                      </button>
                      
                      <button
                        onClick={() => handleToolSelect('zoom')}
                        className={`p-3 rounded-lg transition-colors ${
                          activeTool === 'zoom' 
                            ? 'bg-[#2EB4B4] text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                        }`}
                        title="Zoom Tool"
                      >
                        <IoSearch size={20} />
                      </button>
                      
                      <button
                        onClick={() => handleToolSelect('windowLevel')}
                        className={`p-3 rounded-lg transition-colors ${
                          activeTool === 'windowLevel' 
                            ? 'bg-[#2EB4B4] text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                        }`}
                        title="Window/Level Tool"
                      >
                        <IoContrast size={20} />
                      </button>
                      
                      <button
                        onClick={() => handleToolSelect('reset')}
                        className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                        title="Reset View"
                      >
                        <IoRefresh size={20} />
                      </button>
                    </div>
                    
                    {/* Right side - Layout, settings and back button */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setViewportLayout(viewportLayout === 'single' ? 'quad' : 'single')}
                        className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                        title={`Switch to ${viewportLayout === 'single' ? 'Quad' : 'Single'} View`}
                      >
                        <IoGridOutline size={20} />
                      </button>
                      
                      <button
                        onClick={() => toast.info('Settings panel coming soon!')}
                        className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                        title="Settings"
                      >
                        <IoSettings size={20} />
                      </button>
                      
                      <button
                        onClick={onClose}
                        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                        title="Back to Reports"
                      >
                        <IoArrowBack className="w-4 h-4 mr-2" />
                        Back
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Viewport */}
                <div className="flex-1 relative bg-black">
                  <div
                    ref={mainViewportRef}
                    className="w-full h-full"
                    style={{ minHeight: '500px' }}
                  />
                  
                  {/* Navigation controls for multi-image files */}
                  {totalImages > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => selectImage(Math.max(0, currentImageIndex - 1))}
                          disabled={currentImageIndex === 0}
                          className="p-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          ←
                        </button>
                        <span className="text-xs">
                          {currentImageIndex + 1} / {totalImages}
                        </span>
                        <button
                          onClick={() => selectImage(Math.min(totalImages - 1, currentImageIndex + 1))}
                          disabled={currentImageIndex === totalImages - 1}
                          className="p-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    );
  }

  // Original full-screen mode
  return (
    <div className={`fixed inset-0 bg-[#DCE1EE] flex flex-col z-50 ${isFullscreen ? 'z-[9999]' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {fileName}
          </h2>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2EB4B4]"></div>
              <span className="text-sm text-gray-600">
                {isZipFile ? 'Processing Archive...' : 'Loading Viewer...'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
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
            title="Back to Reports"
          >
            <IoArrowBack />
          </button>
        </div>
      </div>

      {/* Professional Viewer Container */}
      <div className="flex-1 flex">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center text-gray-800">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EB4B4] mx-auto mb-4"></div>
              <p className="text-lg">Loading Medical Viewer...</p>
              <p className="text-sm text-gray-600 mt-2">
                {isZipFile ? 'Processing Archive...' : 'Initializing Viewer'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Viewport Area - Full Width */}
            <div className="flex-grow flex flex-col w-full">
              {/* Professional Toolbar */}
              <div className="bg-white border-b border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  {/* Left side - Main tools */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToolSelect('pan')}
                      className={`p-3 rounded-lg transition-colors ${
                        activeTool === 'pan' 
                          ? 'bg-[#2EB4B4] text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title="Pan Tool"
                    >
                      <IoMove size={20} />
                    </button>
                    
                    <button
                      onClick={() => handleToolSelect('zoom')}
                      className={`p-3 rounded-lg transition-colors ${
                        activeTool === 'zoom' 
                          ? 'bg-[#2EB4B4] text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title="Zoom Tool"
                    >
                      <IoSearch size={20} />
                    </button>
                    
                    <button
                      onClick={() => handleToolSelect('windowLevel')}
                      className={`p-3 rounded-lg transition-colors ${
                        activeTool === 'windowLevel' 
                          ? 'bg-[#2EB4B4] text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title="Window/Level Tool"
                    >
                      <IoContrast size={20} />
                    </button>
                    
                    <button
                      onClick={() => handleToolSelect('reset')}
                      className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                      title="Reset View"
                    >
                      <IoRefresh size={20} />
                    </button>
                  </div>
                  
                  {/* Right side - Layout and settings */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewportLayout(viewportLayout === 'single' ? 'quad' : 'single')}
                      className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                      title={`Switch to ${viewportLayout === 'single' ? 'Quad' : 'Single'} View`}
                    >
                      <IoGridOutline size={20} />
                    </button>
                    
                    <button
                      onClick={() => toast.info('Settings panel coming soon!')}
                      className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                      title="Settings"
                    >
                      <IoSettings size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Viewport */}
              <div className="flex-1 relative bg-black">
                <div
                  ref={mainViewportRef}
                  className="w-full h-full"
                  style={{ minHeight: '400px' }}
                />
                
                {/* Navigation controls for multi-image files */}
                {totalImages > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => selectImage(Math.max(0, currentImageIndex - 1))}
                        disabled={currentImageIndex === 0}
                        className="p-2 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="text-sm">
                        {currentImageIndex + 1} / {totalImages}
                      </span>
                      <button
                        onClick={() => selectImage(Math.min(totalImages - 1, currentImageIndex + 1))}
                        disabled={currentImageIndex === totalImages - 1}
                        className="p-2 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Image navigation hint */}
                {totalImages > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                    Use mouse wheel or arrow keys to navigate
                  </div>
                )}
                
                {/* Mouse cursor sliding hint */}
                {totalImages > 1 && (
                  <div className="absolute bottom-4 right-4 bg-[#2EB4B4] bg-opacity-90 text-white p-2 rounded text-xs shadow-sm">
                    {activeTool === 'zoom' ? (
                      '🖱️ Scroll=Zoom | Drag=Navigate'
                    ) : activeTool === 'pan' || activeTool === 'windowLevel' ? (
                      '🖱️ Scroll or Shift+Drag to navigate'
                    ) : (
                      '🖱️ Scroll or Drag to navigate'
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-3 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 text-gray-600">
            <span>Medical Imaging Interface</span>
            {totalImages > 1 && (
              <>
                <span>•</span>
                <span>🖱️ Drag or Shift+Drag: Navigate</span>
                <span>•</span>
                <span>🖱️ Scroll: Change Images</span>
                <span>•</span>
                <span>⌨️ Arrows: Navigate</span>
              </>
            )}
          </div>
          <div className="text-gray-500">
            {isZipFile ? `Archive: ${extractedFiles.length} files` : 'Single file'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDICOMViewer;
