import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from '../context/AuthContext';
import { IoIosFlask } from "react-icons/io"
import { IoCloudUploadOutline, IoEyeOutline, IoDocumentTextOutline, IoTrashOutline, IoCloseOutline, IoCube } from 'react-icons/io5';
import radiologyApi from '../api/radiologyApi';
import { getPatients, getPatientById, API_BASE_URL, getAuthHeaders } from '../api/api';
import Enhanced3DViewer from './Enhanced3DViewer';
import ProfessionalDICOMViewer from './ProfessionalDICOMViewer';


const RadiologyReportDetail = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedZipFile, setUploadedZipFile] = useState(null);
    const [selectedScanType, setSelectedScanType] = useState('');
    const [isAnalyzing2D, setIsAnalyzing2D] = useState(false);
    const [isAnalyzing3D, setIsAnalyzing3D] = useState(false);
    const [deletingItems, setDeletingItems] = useState(new Set());
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: null });
    const [analysisResults, setAnalysisResults] = useState([]);
    const [jobStatuses, setJobStatuses] = useState({});
    const [selectedResult, setSelectedResult] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [show3DViewer, setShow3DViewer] = useState(false);
    const [viewerType, setViewerType] = useState('basic'); // 'basic', '3d', 'volume', 'professional'
    
    // New state for database integration
    const [reportData, setReportData] = useState(null);
    const [scanRecords, setScanRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [patientReports, setPatientReports] = useState([]);
    const loadingRef = useRef(false);
    const currentReportIdRef = useRef(null);
    
    const toggleSidebar = () => setIsOpen(!isOpen);
    const { user, logout } = useAuth();
    const { reportId } = useParams();
    const navigate = useNavigate();
    
    // Analysis is now handled through Node.js backend - no direct API calls needed
    

    const loadReportData = useCallback(async (forceReload = false) => {
        if (loadingRef.current || (!forceReload && currentReportIdRef.current === reportId)) {
            return;
        }
        
        loadingRef.current = true;
        currentReportIdRef.current = reportId;
        try {
            setLoading(true);
            
            if (!reportId.startsWith('new-')) {
                try {
                    const response = await radiologyApi.getReport(reportId);
                    if (response.success) {
                        
                        // Update with real data if report exists
                        setReportData(response.data.report);
                        setPatientData(response.data.report.patient);
                        setScanRecords(response.data.scanRecords || []);
                        setSelectedScanType(response.data.report.reportType);
                        
                        // Load analysis results from scan records
                        const results = response.data.scanRecords.map(scan => ({
                            id: scan._id,
                            scanType: scan.scanType,
                            fileName: scan.originalFileName,
                            type: scan.fileType,
                            success: scan.analysisStatus === 'completed',
                            status: scan.analysisStatus,
                            jobId: scan.analysisJobId,
                            analysisResult: scan.analysisResult,
                            scanRecord: scan
                        }));
                        
                        setAnalysisResults(results);
                    }
                } catch (reportError) {
                    
                    // If report doesn't exist, check if this is a patient ID
                    // and try to load the most recent report for this patient
                    try {
                        const patientReportsResponse = await radiologyApi.getPatientReports(reportId, { page: 1, limit: 1 });
                        if (patientReportsResponse.success && patientReportsResponse.data.reports.length > 0) {
                            const latestReport = patientReportsResponse.data.reports[0];
                            
                            // Redirect to the actual report ID
                            navigate(`/radiology-report/${latestReport.reportId}`, { replace: true });
                            return;
                        }
                    } catch (patientError) {
                        // No existing reports found for patient, will create new report
                    }
                    
                    // If no existing reports, initialize for new report creation
                    setScanRecords([]);
                    setAnalysisResults([]);
                    
                    if (/^[0-9a-fA-F]{24}$/.test(reportId)) {
                        try {
                            const patientResult = await getPatientById(reportId);
                            if (patientResult.success) {
                                const patient = patientResult.data.patient || patientResult.data;
                                setPatientData(patient);
                                setReportData({
                                    reportId: `new-${reportId}`,
                                    patient: patient,
                                    reportType: "Report",
                                    date: new Date().toISOString(),
                                    status: 'draft'
                                });
                                
                                // Also load existing reports for this patient
                                try {
                                    const reportsResponse = await radiologyApi.getPatientReports(reportId, { page: 1, limit: 10 });
                                    if (reportsResponse.success && reportsResponse.data.reports) {
                                        setPatientReports(reportsResponse.data.reports);
                                    }
                                } catch (reportsError) {
                                    setPatientReports([]);
                                }
                            } else {
                                throw new Error('Patient not found');
                            }
                        } catch (patientError) {
                            console.error('Error loading patient data:', patientError);
                            // Set fallback data
                            setReportData({
                                reportId: `new-${reportId}`,
                                patient: { _id: reportId, name: 'Loading...', age: 0, gender: 'male' },
                                reportType: "Report",
                                date: new Date().toISOString(),
                                status: 'draft'
                            });
                        }
                    }
                }
            } else {
                // For new reports, initialize empty arrays
                setScanRecords([]);
                setAnalysisResults([]);
            }
        } catch (error) {
            console.error('Error loading report data:', error);
            // Don't redirect on error - let user continue with dummy data
            toast.warn('Using default report template');
        } finally {
            setLoading(false);
            loadingRef.current = false; // Reset loading flag
        }
    }, [reportId, navigate]); // Dependencies for useCallback

    // Load report data when reportId changes
    useEffect(() => {
        // Reset refs when reportId changes
        if (currentReportIdRef.current !== reportId) {
            loadingRef.current = false;
            currentReportIdRef.current = null;
        }
        loadReportData();
    }, [reportId, loadReportData]);

    const dummyReport = reportData || {
        reportId: reportId,
        patient: { name: "Loading...", age: 0, gender: "male" },
        reportType: selectedScanType || "Report",
        date: new Date().toISOString(),
        doctor: "Dr. [To be filled]",
        clinicName: "Clinic [To be filled]",
        clinicAddress: "Address [To be filled]",
        symptoms: ["Pending Analysis"],
        diagnosis: "Pending Analysis - Upload and analyze medical images to generate diagnosis",
        confidence: 0,
        treatment: "Treatment plan will be generated after image analysis"
    };

    // Helper function to ensure report exists in database
    const ensureReportExists = async () => {
        // Only create report if it doesn't exist yet
        if (!reportData || !reportData._id) {
            try {
                
                let patientResponse;
                if (reportData?.patient?._id) {
                    try {
                        const patientResult = await getPatientById(reportData.patient._id);
                        if (patientResult.success) {
                            patientResponse = { data: patientResult.data.patient }; // Backend returns data.patient
                        } else {
                            throw new Error('Patient not found');
                        }
                    } catch (error) {
                        console.error('Error fetching patient:', error);
                        // Fallback to creating a default patient
                        patientResponse = await radiologyApi.getOrCreatePatient({
                            name: "New Patient",
                            age: 30,
                            gender: "male"
                        });
                    }
                } else {
                    // Fallback to creating a default patient
                    patientResponse = await radiologyApi.getOrCreatePatient({
                        name: patientData?.name || "New Patient",
                        age: patientData?.age || 30,
                        gender: patientData?.gender || "male"
                    });
                }

                if (!patientResponse.data || !patientResponse.data._id) {
                    throw new Error('Failed to create or find patient');
                }

                // Create report
                const reportPayload = {
                    patientId: patientResponse.data._id,
                    reportType: selectedScanType || 'Report',
                    doctor: reportData?.doctor || "Dr. [To be filled]",
                    clinicName: reportData?.clinicName || "Clinic [To be filled]",
                    clinicAddress: reportData?.clinicAddress || "Address [To be filled]",
                    symptoms: reportData?.symptoms || ["Pending Analysis"],
                    diagnosis: reportData?.diagnosis || "Pending Analysis - Upload and analyze medical images to generate diagnosis",
                    confidence: reportData?.confidence || 0,
                    treatment: reportData?.treatment || "Treatment plan will be generated after image analysis"
                };

                const reportResponse = await radiologyApi.createReport(reportPayload);
                
                if (reportResponse.success) {
                    const newReport = reportResponse.data;
                    setReportData(newReport);
                    setPatientData(patientResponse.data);
                    
                    // Update URL to use the real report ID (but don't reload page)
                    const newReportId = newReport.reportId;
                    window.history.replaceState(null, null, `/radiology-report/${newReportId}`);
                    return newReport;
                } else {
                    throw new Error('Failed to create report');
                }
            } catch (error) {
                console.error('Error creating report:', error);
                toast.error('Failed to create report in database');
                throw error;
            }
        }
        return reportData;
    };
    
    // Poll for analysis results
    const pollAnalysisResult = (analysisId, resultId) => {
        let attempts = 0;
        const maxAttempts = 20; // ~10 minutes max with 30s interval 
        
        const pollInterval = setInterval(async () => {
            attempts += 1;
            
            if (attempts > maxAttempts) {
                clearInterval(pollInterval);
                setAnalysisResults(prev => prev.map(result => 
                    result.id === resultId 
                        ? { ...result, status: 'timeout', success: false }
                        : result
                ));
                toast.error('Analysis timed out');
                return;
            }
            
            try {
                const response = await radiologyApi.getAnalysisResult(analysisId);
                
                if (response.success) {
                    const analysisData = response.data;
                    
                    if (analysisData.analysisStatus === 'completed') {
                clearInterval(pollInterval);
                
                setAnalysisResults(prev => prev.map(result => 
                            result.id === resultId 
                                ? { 
                                    ...result, 
                                    status: 'completed', 
                success: true,
                                    data: analysisData,
                                    analysisResult: analysisData
                                }
                        : result
                ));
                
                        toast.success('Analysis completed successfully!');
                        
                    } else if (analysisData.analysisStatus === 'failed') {
                clearInterval(pollInterval);
                
                setAnalysisResults(prev => prev.map(result => 
                            result.id === resultId 
                                ? { 
                                    ...result, 
                                    status: 'failed', 
                success: false,
                                    error: analysisData.errorMessage || 'Analysis failed'
                                }
                        : result
                ));
                
                        toast.error('Analysis failed');
                    }
                }
        } catch (error) {
                console.error('Error polling analysis result:', error);
                // Continue polling despite errors
            }
        }, 30000); // Poll every 30 seconds
    };

    // Old API functions removed - now using Node.js backend integration

    // Handle file uploads - single file only, replaces existing
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedImage(file);
            toast.success(`Image uploaded: ${file.name}`);
        }
    };

    const handleZipUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedZipFile(file);
            toast.success(`ZIP file uploaded: ${file.name}`);
        }
    };

    const handleScanTypeChange = (event) => {
        const scanType = event.target.value;
        setSelectedScanType(scanType);
        
        if (scanType) {
            if (uploadedImage || uploadedZipFile) {
                toast.success(`Ready to analyze ${scanType} scans`);
            } else {
                toast.info(`Please upload files to analyze ${scanType} scans`);
            }
        }
    };
    
    const removeImage = () => {
        setUploadedImage(null);
        toast.info('Image removed');
    };
    
    const removeZipFile = () => {
        setUploadedZipFile(null);
        toast.info('ZIP file removed');
    };

    const handleAnalyze2D = async () => {
        if (!uploadedImage) {
            toast.error('Please upload an image to analyze.');
            return;
        }
        
        if (!selectedScanType) {
            toast.error('Please select a scan type.');
            return;
        }
        
        setIsAnalyzing2D(true);
        
        try {
            // First, ensure we have a saved report
            const currentReport = await ensureReportExists();
            
            // Upload the file to the database and storage
            const formData = new FormData();
            formData.append('image', uploadedImage);
            formData.append('scanType', selectedScanType);
            const uploadResponse = await radiologyApi.uploadScanFiles(currentReport.reportId, formData);
            
            if (uploadResponse.success && uploadResponse.data.length > 0) {
                const uploadResult = uploadResponse.data.find(result => result.type === '2D');
                
                if (uploadResult) {
                    
                    // Start analysis
                    const analysisResponse = await radiologyApi.startAnalysis(
                        uploadResult.scanRecord._id, 
                        '2D'
                    );
                    
                    if (analysisResponse.success) {
                        // Add to analysis results for UI tracking
                        const newResult = {
                            id: uploadResult.scanRecord._id,
                            scanType: selectedScanType,
                            fileName: uploadedImage.name,
                            type: '2D',
                            success: false,
                            status: 'processing',
                            scanRecord: uploadResult.scanRecord
                        };
                        
                        setAnalysisResults(prev => [...prev, newResult]);
                        setScanRecords(prev => [...prev, uploadResult.scanRecord]);
                        
                        toast.success('2D Analysis started successfully!');
                        
                        const pollForCompletion = setInterval(async () => {
                            try {
                                const reportResponse = await radiologyApi.getReport(currentReport.reportId);
                                if (reportResponse.success) {
                                    const updatedScanRecords = reportResponse.data.scanRecords || [];
                                    const updatedScan = updatedScanRecords.find(scan => scan._id === uploadResult.scanRecord._id);
                                    
                                    console.log('🔍 3D Polling Debug:', {
                                        reportResponse: reportResponse,
                                        updatedScanRecords: updatedScanRecords,
                                        updatedScan: updatedScan,
                                        uploadResultScanId: uploadResult.scanRecord._id
                                    });
                                    
                                    if (updatedScan && updatedScan.analysisStatus === 'completed') {
                                        clearInterval(pollForCompletion);
                                        
                                        // Update the result in state
                                        setAnalysisResults(prev => prev.map(result => 
                                            result.id === uploadResult.scanRecord._id 
                                                ? { 
                                                    ...result, 
                                                    status: 'completed', 
                                                    success: true,
                                                    analysisResult: updatedScan.analysisResult,
                                                    scanRecord: updatedScan
                                                }
                                                : result
                                        ));
                                        
                                        setScanRecords(prev => prev.map(scan => 
                                            scan._id === uploadResult.scanRecord._id ? updatedScan : scan
                                        ));
                                        
                                        toast.success('2D Analysis completed!');
                                    } else if (updatedScan && updatedScan.analysisStatus === 'failed') {
                                        clearInterval(pollForCompletion);
                                        
                                        setAnalysisResults(prev => prev.map(result => 
                                            result.id === uploadResult.scanRecord._id 
                                                ? { ...result, status: 'failed', success: false }
                                                : result
                                        ));
                                        
                                        // Get error message from analysis result
                                        const errorMsg = updatedScan.analysisResult?.errorMessage || 'Analysis failed';
                                        const shortError = errorMsg.length > 100 ? 
                                            errorMsg.substring(0, 100) + '...' : errorMsg;
                                        
                                        toast.error(`2D Analysis failed: ${shortError}. Please try again.`);
                                    }
                                }
                            } catch (pollError) {
                                console.error('Polling error:', pollError);
                            }
                        }, 30000); // Poll every 30 seconds
                        
                        // Stop polling after 10 minutes
                        setTimeout(() => {
                            clearInterval(pollForCompletion);
                        }, 600000);
                    }
                }
            }
            
        } catch (error) {
            console.error('2D Analysis error:', error);
            toast.error(error.message || 'An error occurred during 2D analysis. Please try again.');
        } finally {
            setIsAnalyzing2D(false);
        }
    };
    

    const handleAnalyze3D = async () => {
        if (!uploadedZipFile) {
            toast.error('Please upload a ZIP file to analyze.');
            return;
        }
        
        if (!selectedScanType) {
            toast.error('Please select a scan type.');
            return;
        }
        
        setIsAnalyzing3D(true);
        
        try {
            // First, ensure we have a saved report
            const currentReport = await ensureReportExists();
            
            // Upload the file to the database and storage
            const formData = new FormData();
            formData.append('zipFile', uploadedZipFile);
            formData.append('scanType', selectedScanType);
            const uploadResponse = await radiologyApi.uploadScanFiles(currentReport.reportId, formData);
            
            if (uploadResponse.success && uploadResponse.data.length > 0) {
                const uploadResult = uploadResponse.data.find(result => result.type === '3D');
                
                if (uploadResult) {
                    
                    // Start analysis
                    const analysisResponse = await radiologyApi.startAnalysis(
                        uploadResult.scanRecord._id, 
                        '3D'
                    );
                    
                    if (analysisResponse.success) {
                        // Add to analysis results for UI tracking
                        const newResult = {
                            id: uploadResult.scanRecord._id,
                            scanType: selectedScanType,
                            fileName: uploadedZipFile.name,
                            type: '3D',
                            success: false,
                            status: 'processing',
                            jobId: analysisResponse.data.jobId,
                            scanRecord: uploadResult.scanRecord
                        };
                        
                        setAnalysisResults(prev => [...prev, newResult]);
                        setScanRecords(prev => [...prev, uploadResult.scanRecord]);
                        
                toast.success('3D Analysis started successfully!');
                        
                        // Start polling for completion (check every 5 seconds for 3D)
                        const pollForCompletion = setInterval(async () => {
                            try {
                                const reportResponse = await radiologyApi.getReport(currentReport.reportId);
                                if (reportResponse.success) {
                                    const updatedScanRecords = reportResponse.data.scanRecords || [];
                                    const updatedScan = updatedScanRecords.find(scan => scan._id === uploadResult.scanRecord._id);
                                    
                                    
                                    if (updatedScan && updatedScan.analysisStatus === 'completed') {
                                        clearInterval(pollForCompletion);
                                        
                                        // Update the result in state
                                        setAnalysisResults(prev => prev.map(result => 
                                            result.id === uploadResult.scanRecord._id 
                                                ? { 
                                                    ...result, 
                                                    status: 'completed', 
                                                    success: true,
                                                    analysisResult: updatedScan.analysisResult,
                                                    scanRecord: updatedScan
                                                }
                                                : result
                                        ));
                                        
                                        setScanRecords(prev => prev.map(scan => 
                                            scan._id === uploadResult.scanRecord._id ? updatedScan : scan
                                        ));
                                        
                                        toast.success('3D Analysis completed!');
                                    } else if (updatedScan && updatedScan.analysisStatus === 'failed') {
                                        clearInterval(pollForCompletion);
                                        
                                        setAnalysisResults(prev => prev.map(result => 
                                            result.id === uploadResult.scanRecord._id 
                                                ? { ...result, status: 'failed', success: false }
                                                : result
                                        ));
                                        
                                        // Get error message from analysis result
                                        const errorMsg = updatedScan.analysisResult?.errorMessage || 'Analysis failed';
                                        const shortError = errorMsg.length > 100 ? 
                                            errorMsg.substring(0, 100) + '...' : errorMsg;
                                        
                                        toast.error(`3D Analysis failed: ${shortError}. Please try again.`);
                                    }
                                }
                            } catch (pollError) {
                                console.error('3D Polling error:', pollError);
                            }
                        }, 5000);
                        
                        // Stop polling after 15 minutes (3D takes longer)
                        setTimeout(() => {
                            clearInterval(pollForCompletion);
                        }, 900000);
                    }
                }
            }
            
        } catch (error) {
            console.error('3D Analysis error:', error);
            toast.error(error.message || 'An error occurred during 3D analysis. Please try again.');
        } finally {
            setIsAnalyzing3D(false);
        }
    };
    
    
    const handleViewImage = async (scanRecordId, fileName, fileType = 'original', viewerType = 'basic') => {
        try {
            const response = await radiologyApi.generateDownloadUrl(scanRecordId, fileType);
            
            if (response.success) {
                setSelectedImage({
                    url: response.data.downloadUrl,
                    fileName: fileName,
                    fileType: fileType
                });
                setViewerType(viewerType);
                
                if (viewerType === '3d' || viewerType === 'volume' || viewerType === 'professional') {
                    setShow3DViewer(true);
                } else {
                    setShowImageModal(true);
                }
            } else {
                toast.error('Failed to load image.');
            }
        } catch (error) {
            console.error('Image viewing error:', error);
            toast.error('Failed to load image.');
        }
    };

    const openDeleteModal = (type, id, name) => {
        setDeleteModal({ isOpen: true, type, id, name });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, type: null, id: null, name: null });
    };

    const handleDeleteReport = async (reportId) => {
        const report = patientReports.find(r => r.reportId === reportId);
        openDeleteModal('report', reportId, report?.reportId || 'Report');
    };

    const confirmDeleteReport = async (reportId) => {
        closeDeleteModal();
        setDeletingItems(prev => new Set(prev).add(reportId));

        try {
            await radiologyApi.deleteReport(reportId);
            toast.success('Report deleted successfully');
            
            // Remove the report from patient reports list immediately
            setPatientReports(prev => prev.filter(report => report.reportId !== reportId));
            
            // If this is the current report being viewed, navigate away
            if (reportData?.reportId === reportId) {
                navigate('/radiology');
                return;
            }
        } catch (error) {
            console.error('Delete report error:', error);
            toast.error('Failed to delete report');
        } finally {
            setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(reportId);
                return newSet;
            });
        }
    };

    const handleDeleteScanRecord = async (scanRecordId) => {
        const scanRecord = scanRecords.find(scan => scan._id === scanRecordId);
        const fileName = scanRecord?.originalFileName || 'Scan Record';
        openDeleteModal('scanRecord', scanRecordId, fileName);
    };

    const confirmDeleteScanRecord = async (scanRecordId) => {
        closeDeleteModal();
        setDeletingItems(prev => new Set(prev).add(scanRecordId));

        try {
            await radiologyApi.deleteScanRecord(scanRecordId);
            toast.success('Scan record deleted successfully');
            
            // Remove the scan record from state immediately for instant UI update
            setScanRecords(prev => prev.filter(scan => scan._id !== scanRecordId));
            setAnalysisResults(prev => prev.filter(result => result.id !== scanRecordId));
        } catch (error) {
            console.error('Delete scan record error:', error);
            toast.error('Failed to delete scan record');
        } finally {
            setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(scanRecordId);
                return newSet;
            });
        }
    };

    const close3DViewer = () => {
        setShow3DViewer(false);
        setSelectedImage(null);
        setViewerType('basic');
    };
    
    const handleViewResult = async (result) => {
        try {
            let resultData = result;
            
            // If we have an analysisResult from database, use that data
            if (result.analysisResult && result.analysisResult._id) {
                const analysisResponse = await radiologyApi.getAnalysisResult(result.analysisResult._id);
                if (analysisResponse.success) {
                    resultData = {
                        ...result,
                        data: {
                            modality: analysisResponse.data.modality,
                            urgency: analysisResponse.data.urgency,
                            findings: analysisResponse.data.findings,
                            diagnosis: analysisResponse.data.diagnosis,
                            treatment_plan: analysisResponse.data.treatmentPlan,
                            confidence_summary: analysisResponse.data.confidenceSummary,
                            limitations: analysisResponse.data.limitations
                        },
                        analysisResult: analysisResponse.data
                    };
                }
            }
            
            setSelectedResult(resultData);
            setShowResultModal(true);
        } catch (error) {
            console.error('Error loading analysis result:', error);
            // Still show the modal with available data
        setSelectedResult(result);
        setShowResultModal(true);
            toast.error('Could not load detailed analysis data');
        }
    };
    
    const closeResultModal = () => {
        setShowResultModal(false);
        setSelectedResult(null);
    };
    
    // Generate table data from analysis results
    const getTableData = () => {
        if (analysisResults.length === 0 && scanRecords.length === 0) {
            // Return empty array if no results - don't show sample data
            return [];
        }
        
        // Combine analysis results with scan records
        const combinedData = [];
        
        // Add analysis results
        analysisResults.forEach((result) => {
            const tableRow = {
                id: result.id,
                scanType: result.scanType,
                fileName: result.fileName,
                type: result.type,
                originalDicom: "available",
                analysedDicom: result.status === 'processing' ? 'processing' : 
                              result.status === 'completed' ? 'available' : 
                              result.status === 'failed' ? 'failed' : 'pending',
                report: result.status === 'completed' ? 'available' : 
                       result.status === 'failed' ? 'failed' : 'pending',
                result: result,
                scanRecord: result.scanRecord
            };
            
            
            combinedData.push(tableRow);
        });
        
        // Add scan records that don't have analysis results yet
        scanRecords.forEach((scanRecord) => {
            const existingResult = analysisResults.find(r => r.id === scanRecord._id);
            
            if (!existingResult) {
                const tableRow = {
                    id: scanRecord._id,
                    scanType: scanRecord.scanType,
                    fileName: scanRecord.originalFileName,
                    type: scanRecord.fileType,
                    originalDicom: "available",
                    analysedDicom: scanRecord.analysisStatus === 'processing' ? 'processing' : 
                                  scanRecord.analysisStatus === 'completed' ? 'available' : 
                                  scanRecord.analysisStatus === 'failed' ? 'failed' : 'pending',
                    report: scanRecord.analysisStatus === 'completed' ? 'available' : 
                           scanRecord.analysisStatus === 'failed' ? 'failed' : 'pending',
                    scanRecord: scanRecord
                };
                
                combinedData.push(tableRow);
            }
        });
        
        return combinedData;
    };


    if (loading) {
    return (
        <SidebarLayout isOpen={isOpen}>
            <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
            <div className="h-[calc(100vh_-_96px)] bg-[#DCE1EE] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto relative pb-20">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EB4B4] mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading report data...</p>
                        </div>
                    </div>
                </div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout isOpen={isOpen}>
            <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
            <div className={`h-[calc(100vh_-_96px)] bg-[#F8FAFC] font-sans overflow-y-auto relative pb-20 ${show3DViewer ? 'p-1' : 'p-4 sm:p-6 md:p-8'}`}>
                {/* Enhanced 3D Viewer - Replaces main content */}
                {show3DViewer && selectedImage ? (
                    <div className="bg-white rounded-lg shadow-lg p-0 h-[calc(100vh_-_110px)]">
                        {/* Viewer content */}
                        <div className="relative h-full">
                            {viewerType === 'professional' ? (
                                <ProfessionalDICOMViewer
                                    dicomUrl={selectedImage.url}
                                    fileName={selectedImage.fileName}
                                    fileType={selectedImage.fileType}
                                    onClose={close3DViewer}
                                    isIntegrated={true}
                                />
                            ) : (
                                <Enhanced3DViewer
                                    dicomUrl={selectedImage.url}
                                    fileName={selectedImage.fileName}
                                    fileType={selectedImage.fileType}
                                    onClose={close3DViewer}
                                    isIntegrated={true}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Original reports content - only show when viewer is not active */}

                {/* Report Detail - 2D Analysis Section */}
                <div className="flex flex-col">
                    <div className="flex flex-col">
                        <div className="">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                        {patientData?.name || dummyReport.patient?.name || "Loading..."}
                                    </h2>
                                    <p className="text-black text-md">
                                        Age: <span className="font-semibold">{patientData?.age || dummyReport.patient?.age || 0}</span> • Gender: <span className="font-semibold">{patientData?.gender?.toUpperCase() || dummyReport.patient?.gender?.toUpperCase() || "N/A"}</span>
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {/* Type Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                        <select 
                                            value={selectedScanType}
                                            onChange={handleScanTypeChange}
                                            className="w-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent appearance-none"
                                            style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Report">Report</option>
                                            <option value="MRI">MRI</option>
                                            <option value="CT-SCAN">CT-SCAN</option>
                                            <option value="X-RAY">X-RAY</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Existing Reports Table */}
                        {patientReports.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Reports for this Patient</h3>
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {patientReports.map((report) => (
                                                <tr key={report._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {report.reportId}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {report.reportType}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(report.date || report.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            report.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            report.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => navigate(`/radiology-report/${report.reportId}`)}
                                                            className="text-[#2EB4B4] hover:text-[#2EB4B4]/80 mr-3"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/report-view/${report.reportId}`)}
                                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                                        >
                                                            Details
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReport(report.reportId)}
                                                            disabled={deletingItems.has(report.reportId)}
                                                            className={`${deletingItems.has(report.reportId) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
                                                        >
                                                            {deletingItems.has(report.reportId) ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Document Pickers */}
                        <div className="flex flex-col sm:flex-row gap-6 mb-6">
                            {/* Image Document Picker */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload 2D Images (Reports)</label>
                                <div 
                                    className="bg-white rounded-lg shadow-sm p-6 border-dashed border-2 border-gray-300 text-center cursor-pointer hover:border-gray-400 transition-colors"
                                    onClick={() => document.getElementById('imageUpload').click()}
                                >
                                    <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                                        className="hidden" 
                                        id="imageUpload" 
                                        onChange={handleImageUpload}
                                    />
                                    <IoCloudUploadOutline className="mx-auto text-4xl text-gray-400 mb-2" />
                                    {uploadedImage ? (
                                        <div>
                                            <p className="text-sm font-semibold text-[#2EB4B4] mb-1">{uploadedImage.name}</p>
                                            <p className="text-xs text-gray-500 mb-2">Click to replace • JPG, PNG, JPEG only</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage();
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                                            >
                                                <IoTrashOutline size={12} /> Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Click to Upload Image</p>
                                            <p className="text-xs text-gray-500">JPG, PNG, JPEG only</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* ZIP Document Picker */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload 3D DICOM Files (ZIP)</label>
                                <div 
                                    className="bg-white rounded-lg shadow-sm p-6 border-dashed border-2 border-gray-300 text-center cursor-pointer hover:border-gray-400 transition-colors"
                                    onClick={() => document.getElementById('zipUpload').click()}
                                >
                                    <input 
                                        type="file" 
                                        accept=".zip,application/zip" 
                                        className="hidden" 
                                        id="zipUpload" 
                                        onChange={handleZipUpload}
                                    />
                                    <IoCloudUploadOutline className="mx-auto text-4xl text-gray-400 mb-2" />
                                    {uploadedZipFile ? (
                                        <div>
                                            <p className="text-sm font-semibold text-[#2EB4B4] mb-1">{uploadedZipFile.name}</p>
                                            <p className="text-xs text-gray-500 mb-2">Click to replace • ZIP files only</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeZipFile();
                                                }}
                                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                                            >
                                                <IoTrashOutline size={12} /> Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Click to Upload ZIP</p>
                                            <p className="text-xs text-gray-500">ZIP files only</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                       {/* Action Buttons */}
<div className="space-y-4 mb-8">
    {/* Download Buttons */}
    <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button 
            onClick={handleAnalyze2D}
            disabled={isAnalyzing2D || !uploadedImage || !selectedScanType}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                isAnalyzing2D || !uploadedImage || !selectedScanType
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100'
            }`}
        >
            {isAnalyzing2D ? 'Analyzing 2D...' : 'Analyze 2D'}
        </button>
        
        <button 
            onClick={handleAnalyze3D}
            disabled={isAnalyzing3D || !uploadedZipFile || !selectedScanType}
            className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors ${
                isAnalyzing3D || !uploadedZipFile || !selectedScanType
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100'
            }`}
        >
            {isAnalyzing3D ? 'Analyzing 3D...' : 'Analyze DICOM'}
        </button>
    </div>
</div>


                        {/* Data Table */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-8">
                            <div className="px-6 py-4 bg-red-700 text-white ">
                                <h3 className="text-lg font-semibold">Scan Records</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Scan Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                View Original DICOM
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                View Analysed DICOM
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                View Report
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getTableData().length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="text-gray-500">
                                                        <IoDocumentTextOutline className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                        <h3 className="text-lg font-medium mb-2">No Analysis Results Yet</h3>
                                                        <p className="text-sm">Upload medical images above to start analysis and see results here.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            getTableData().map((scan) => (
                                            <tr key={scan.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-small text-[#172B4C] mb-0">
                                                            {scan.type === '3D' ? 'DICOM' : '2D'}
                                                        </span>
                                                        {scan.fileName && (
                                                            <span className="text-sm text-gray-700 truncate max-w-32" title={scan.fileName}>
                                                                {scan.fileName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {scan.scanType === 'DICOM' ? (
                                                        scan.originalDicom === 'available' ? (
                                                            <button 
                                                                onClick={() => handleViewImage(
                                                                    scan.scanRecord?._id || scan.id, 
                                                                    scan.fileName,
                                                                    'original'
                                                                )}
                                                                className="inline-flex items-center px-3 py-1 rounded-md text-sm border border-[black] text-[black] hover:bg-gray-100 transition-colors"
                                                            >
                                                                <IoEyeOutline className="mr-1" /> View
                                                            </button>
                                                        ) : scan.isSample ? (
                                                            <span className="text-gray-400 text-sm">Upload files to analyze</span>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">Not Available</span>
                                                        )
                                                    ) : scan.scanType === 'Report' ? (
                                                        scan.originalDicom === 'available' ? (
                                                            <button 
                                                                onClick={() => handleViewImage(
                                                                    scan.scanRecord?._id || scan.id, 
                                                                    scan.fileName,
                                                                    'original',
                                                                    'professional'
                                                                )}
                                                                className="inline-flex items-center px-3 py-1 rounded-md text-sm border border-[black] text-[black] hover:bg-gray-100 transition-colors"
                                                                title="Professional Medical Viewer"
                                                            >
                                                                <IoEyeOutline className="mr-1" /> View Medical Images
                                                            </button>
                                                        ) : scan.isSample ? (
                                                            <span className="text-gray-400 text-sm">Upload files to analyze</span>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">Not Available</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {scan.scanType === 'DICOM' || scan.scanType === 'Report' ? (
                                                        scan.analysedDicom === 'available' ? (
                                                            <button 
                                                                onClick={() => handleViewImage(
                                                                    scan.scanRecord?._id || scan.id, 
                                                                    scan.fileName,
                                                                    'analyzed',
                                                                    'professional'
                                                                )}
                                                                className="inline-flex items-center px-3 py-1 rounded-md text-sm border border-[black] text-[black] hover:bg-gray-100 transition-colors"
                                                                title="View Processed Medical Images"
                                                            >
                                                                <IoEyeOutline className="mr-1" /> View Processed Images
                                                            </button>
                                                        ) : scan.analysedDicom === 'processing' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                Processing
                                                            </span>
                                                        ) : scan.analysedDicom === 'failed' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Failed
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">Pending</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {scan.scanType === 'Report' ? (
                                                        scan.report === 'available' ? (
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleViewResult(scan.result)}
                                                                    className="inline-flex items-center px-3 py-1 rounded-md text-sm border border-[black] text-[black] hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <IoDocumentTextOutline className="mr-1" /> View Report
                                                                </button>
                                                            </div>
                                                        ) : scan.report === 'pending' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                Pending
                                                            </span>
                                                        ) : scan.report === 'failed' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Failed
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">Not Available</span>
                                                        )
                                                    ) : scan.scanType === 'DICOM' ? (
                                                        scan.report === 'available' ? (
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleViewResult(scan.result)}
                                                                    className="inline-flex items-center px-3 py-1 rounded-md text-sm border border-[black] text-[black] hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <IoDocumentTextOutline className="mr-1" /> View Report
                                                                </button>
                                                            </div>
                                                        ) : scan.report === 'pending' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                Pending
                                                            </span>
                                                        ) : scan.report === 'failed' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Failed
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">Not Available</span>
                                                        )
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleDeleteScanRecord(scan.scanRecord?._id || scan.id)}
                                                        disabled={deletingItems.has(scan.scanRecord?._id || scan.id)}
                                                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm border transition-colors ${
                                                            deletingItems.has(scan.scanRecord?._id || scan.id)
                                                                ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                                                                : 'border-red-300 text-red-600 hover:bg-red-50'
                                                        }`}
                                                        title="Delete Scan Record"
                                                    >
                                                        <IoTrashOutline className="mr-1" /> 
                                                        {deletingItems.has(scan.scanRecord?._id || scan.id) ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                
                {/* Result Modal */}
                {showResultModal && selectedResult && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Analysis Result - {selectedResult.fileName}
                                </h2>
                                <button 
                                    onClick={closeResultModal}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="p-6">
                                {(selectedResult.type === '2D' || selectedResult.fileType === '2D') && 
                                 (selectedResult.data || selectedResult.analysisResult) && 
                                 selectedResult.status === 'completed' ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="font-semibold text-gray-800 mb-2">Modality</h3>
                                                <p className="text-gray-700">
                                                    {selectedResult.data?.modality || 
                                                     selectedResult.analysisResult?.modality || 
                                                     'Not available'}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="font-semibold text-gray-800 mb-2">Urgency</h3>
                                                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                                    (selectedResult.data?.urgency || selectedResult.analysisResult?.urgency) === 'Emergency' ? 'bg-red-100 text-red-800' :
                                                    (selectedResult.data?.urgency || selectedResult.analysisResult?.urgency) === 'Priority' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {selectedResult.data?.urgency || 
                                                     selectedResult.analysisResult?.urgency || 
                                                     'Normal'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-800 mb-2">Findings</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {selectedResult.data?.findings || 
                                                 selectedResult.analysisResult?.findings || 
                                                 'No findings available'}
                                            </p>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-800 mb-2">Diagnosis</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {selectedResult.data?.diagnosis || 
                                                 selectedResult.analysisResult?.diagnosis || 
                                                 'No diagnosis available'}
                                            </p>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-800 mb-2">Treatment Plan</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {selectedResult.data?.treatment_plan || 
                                                 selectedResult.analysisResult?.treatmentPlan || 
                                                 'No treatment plan available'}
                                            </p>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-800 mb-2">Confidence Summary</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {selectedResult.data?.confidence_summary || 
                                                 selectedResult.analysisResult?.confidenceSummary || 
                                                 'No confidence summary available'}
                                            </p>
                                        </div>
                                        
                                        {(selectedResult.data?.limitations || selectedResult.analysisResult?.limitations) && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="font-semibold text-gray-800 mb-2">Limitations</h3>
                                                <p className="text-gray-700 whitespace-pre-wrap">
                                                    {selectedResult.data?.limitations || 
                                                     selectedResult.analysisResult?.limitations}
                                                </p>
                                            </div>
                                        )}
                                        
                                    </div>
                                ) : selectedResult.type === '3D' ? (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-800 mb-2">Job Status</h3>
                                            <p className="text-gray-700">
                                                Job ID: {selectedResult.jobId}<br/>
                                                Status: {selectedResult.status || 'Processing'}<br/>
                                                Type: 3D DICOM Analysis
                                            </p>
                                        </div>
                                        
                                        {selectedResult.statusData && (
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="font-semibold text-gray-800 mb-2">Status Details</h3>
                                                <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-x-auto">
                                                    {JSON.stringify(selectedResult.statusData, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        
                                        {selectedResult.status === 'completed' && (
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <h3 className="font-semibold text-green-800 mb-2">Analysis Complete</h3>
                                                <p className="text-green-700 mb-3">Your 3D DICOM analysis has been completed successfully.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : selectedResult.status === 'processing' ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2EB4B4] mx-auto mb-4"></div>
                                        <p className="text-gray-600">Analysis in progress...</p>
                                        <p className="text-sm text-gray-500 mt-2">Please wait while we process your {selectedResult.type || selectedResult.fileType} scan</p>
                                    </div>
                                ) : selectedResult.status === 'failed' ? (
                                    <div className="text-center py-8">
                                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                                        <p className="text-red-600 font-semibold">Analysis Failed</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {selectedResult.error || 'The analysis could not be completed. Please try uploading the file again.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-4xl mb-4">📊</div>
                                        <p className="text-gray-600">Analysis not yet available</p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            {selectedResult.status === 'pending' ? 
                                                'Analysis has not been started yet' : 
                                                'No analysis data available for this scan'}
                                        </p>
                                    </div>
                                )}
                                
                                {selectedResult.error && (
                                    <div className="bg-red-50 p-4 rounded-lg mt-4">
                                        <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                                        <p className="text-red-700">{selectedResult.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Viewing Modal */}
                {showImageModal && selectedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h2 className="text-xl font-semibold">
                                    {selectedImage.fileName} ({selectedImage.fileType})
                                </h2>
                                <button 
                                    onClick={() => setShowImageModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    <IoCloseOutline />
                                </button>
                            </div>
                            <div className="p-4 flex justify-center items-center bg-gray-50" style={{maxHeight: 'calc(95vh - 80px)'}}>
                                <img 
                                    src={selectedImage.url} 
                                    alt={selectedImage.fileName}
                                    className="max-w-full max-h-full object-contain cursor-zoom-in"
                                    style={{maxHeight: 'calc(95vh - 120px)'}}
                                    onClick={(e) => {
                                        if (e.target.style.transform === 'scale(2)') {
                                            e.target.style.transform = 'scale(1)';
                                            e.target.style.cursor = 'zoom-in';
                                        } else {
                                            e.target.style.transform = 'scale(2)';
                                            e.target.style.cursor = 'zoom-out';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                                    <IoTrashOutline className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Delete {deleteModal.type === 'report' ? 'Report' : 'Scan Record'}?
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Are you sure you want to delete <strong>"{deleteModal.name}"</strong>? 
                                    This action cannot be undone.
                                </p>
                                
                                <div className="flex justify-center space-x-3">
                                    <button
                                        onClick={closeDeleteModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (deleteModal.type === 'report') {
                                                confirmDeleteReport(deleteModal.id);
                                            } else {
                                                confirmDeleteScanRecord(deleteModal.id);
                                            }
                                        }}
                                        disabled={deletingItems.has(deleteModal.id)}
                                        className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                            deletingItems.has(deleteModal.id)
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                        }`}
                                    >
                                        {deletingItems.has(deleteModal.id) ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                    </>
                )}
            </div>
        </SidebarLayout>
    );
};

export default RadiologyReportDetail;