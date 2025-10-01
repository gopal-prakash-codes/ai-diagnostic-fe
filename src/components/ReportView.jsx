import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { radiologyApi } from '../api/radiologyApi';
import './ReportView.css';

const ReportView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [scanRecords, setScanRecords] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    loadReportData();
  }, [reportId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      if (reportId && !reportId.startsWith('new-')) {
        console.log('Loading existing report:', reportId);
        const response = await radiologyApi.getReport(reportId);
        
        if (response.success && response.data) {
          const { report, scanRecords: records } = response.data;
          
          setReportData(report);
          setPatientData(report.patient);
          setScanRecords(records || []);
          
          // Extract analysis results from scan records
          const results = records
            ?.filter(record => record.analysisResult)
            ?.map(record => record.analysisResult) || [];
          setAnalysisResults(results);
          
          console.log('Report data loaded:', report);
          console.log('Scan records loaded:', records);
        }
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = async (result) => {
    try {
      if (result._id) {
        console.log('Fetching detailed analysis result for:', result._id);
        const detailedResult = await radiologyApi.getAnalysisResult(result._id);
        
        if (detailedResult.success && detailedResult.data) {
          setSelectedResult({
            ...result,
            data: detailedResult.data
          });
        } else {
          setSelectedResult(result);
        }
      } else {
        setSelectedResult(result);
      }
    } catch (error) {
      console.error('Error fetching detailed result:', error);
      setSelectedResult(result);
    }
  };

  const handleDownloadResult = async (scanRecord, type = 'original') => {
    try {
      const fileKey = type === 'original' ? scanRecord.originalFileKey : scanRecord.analyzedFileKey;
      if (!fileKey) {
        alert('File not available for download');
        return;
      }

      const response = await radiologyApi.generateDownloadUrl(fileKey);
      if (response.success && response.data?.downloadUrl) {
        // Create temporary link and trigger download
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = scanRecord.originalFileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Failed to generate download link');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getTableData = () => {
    const combinedData = [];
    
    // Add analysis results
    analysisResults.forEach(result => {
      const scanRecord = scanRecords.find(record => 
        record.analysisResult && record.analysisResult._id === result._id
      );
      
      combinedData.push({
        id: result._id || `result-${combinedData.length}`,
        type: result.analysisType || 'Analysis',
        status: result.analysisStatus || 'unknown',
        date: result.analysisCompletedAt || result.createdAt,
        scanRecord,
        analysisResult: result,
        hasDetailedData: !!result._id
      });
    });
    
    // Add scan records without analysis results
    scanRecords.forEach(record => {
      if (!record.analysisResult) {
        combinedData.push({
          id: record._id,
          type: record.fileType || 'Scan',
          status: record.analysisStatus || 'pending',
          date: record.createdAt,
          scanRecord: record,
          analysisResult: null,
          hasDetailedData: false
        });
      }
    });
    
    return combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'failed': return '#F44336';
      case 'pending': return '#2196F3';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="report-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="report-detail-container">
        <div className="error-message">
          <h3>Report Not Found</h3>
          <p>The requested report could not be found.</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tableData = getTableData();

  return (
    <div className="report-detail-container">
      {/* Header with Back Button */}
      <div className="report-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Reports
        </button>
        <h2>Medical Report Details</h2>
      </div>

      {/* Patient Information */}
      <div className="patient-info-section">
        <h3>Patient Information</h3>
        <div className="patient-details">
          <div className="detail-row">
            <span className="label">Name:</span>
            <span className="value">{patientData?.name || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Age:</span>
            <span className="value">{patientData?.age || 'N/A'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Gender:</span>
            <span className="value">{patientData?.gender || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Report Information */}
      <div className="report-info-section">
        <h3>Report Information</h3>
        <div className="report-details">
          <div className="detail-row">
            <span className="label">Report ID:</span>
            <span className="value">{reportData.reportId}</span>
          </div>
          <div className="detail-row">
            <span className="label">Doctor:</span>
            <span className="value">{reportData.doctor}</span>
          </div>
          <div className="detail-row">
            <span className="label">Clinic:</span>
            <span className="value">{reportData.clinicName}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{formatDate(reportData.date)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className="value status-badge" style={{ backgroundColor: getStatusColor(reportData.status) }}>
              {reportData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Clinical Information */}
      <div className="clinical-info-section">
        <h3>Clinical Information</h3>
        <div className="clinical-details">
          <div className="detail-group">
            <h4>Symptoms</h4>
            <div className="symptoms-list">
              {reportData.symptoms?.map((symptom, index) => (
                <span key={index} className="symptom-tag">{symptom}</span>
              )) || <span>No symptoms recorded</span>}
            </div>
          </div>
          
          <div className="detail-group">
            <h4>Diagnosis</h4>
            <p className="diagnosis-text">{reportData.diagnosis || 'No diagnosis available'}</p>
          </div>
          
          {reportData.confidence && (
            <div className="detail-group">
              <h4>Confidence Level</h4>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${reportData.confidence}%` }}
                ></div>
                <span className="confidence-text">{reportData.confidence}%</span>
              </div>
            </div>
          )}
          
          <div className="detail-group">
            <h4>Treatment Plan</h4>
            <p className="treatment-text">{reportData.treatment || 'No treatment plan available'}</p>
          </div>
        </div>
      </div>

      {/* Analysis Results Table */}
      <div className="results-section">
        <h3>Analysis Results</h3>
        {tableData.length > 0 ? (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(row.status) }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{formatDate(row.date)}</td>
                    <td>
                      <div className="action-buttons">
                        {row.hasDetailedData && (
                          <button 
                            onClick={() => handleViewResult(row.analysisResult)}
                            className="action-btn view-btn"
                          >
                            View
                          </button>
                        )}
                        {row.scanRecord && (
                          <button 
                            onClick={() => handleDownloadResult(row.scanRecord)}
                            className="action-btn download-btn"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-results">
            <p>No analysis results available for this report.</p>
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="modal-overlay" onClick={() => setSelectedResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Analysis Result Details</h3>
              <button 
                className="close-button" 
                onClick={() => setSelectedResult(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedResult.analysisStatus === 'completed' && selectedResult.data ? (
                <div className="analysis-details">
                  <div className="detail-section">
                    <h4>Analysis Information</h4>
                    <p><strong>Type:</strong> {selectedResult.data.analysisType || 'N/A'}</p>
                    <p><strong>Status:</strong> {selectedResult.data.analysisStatus || 'N/A'}</p>
                    <p><strong>Started:</strong> {formatDate(selectedResult.data.analysisStartedAt)}</p>
                    <p><strong>Completed:</strong> {formatDate(selectedResult.data.analysisCompletedAt)}</p>
                  </div>
                  
                  {selectedResult.data.modality && (
                    <div className="detail-section">
                      <h4>Medical Findings</h4>
                      <p><strong>Modality:</strong> {selectedResult.data.modality}</p>
                      {selectedResult.data.urgency && (
                        <p><strong>Urgency:</strong> {selectedResult.data.urgency}</p>
                      )}
                      {selectedResult.data.findings && (
                        <div>
                          <strong>Findings:</strong>
                          <pre className="findings-text">{selectedResult.data.findings}</pre>
                        </div>
                      )}
                      {selectedResult.data.diagnosis && (
                        <div>
                          <strong>Diagnosis:</strong>
                          <p>{selectedResult.data.diagnosis}</p>
                        </div>
                      )}
                      {selectedResult.data.treatmentPlan && (
                        <div>
                          <strong>Treatment Plan:</strong>
                          <p>{selectedResult.data.treatmentPlan}</p>
                        </div>
                      )}
                      {selectedResult.data.confidence && (
                        <p><strong>Confidence:</strong> {selectedResult.data.confidence}%</p>
                      )}
                    </div>
                  )}
                </div>
              ) : selectedResult.analysisStatus === 'failed' ? (
                <div className="error-details">
                  <h4>Analysis Failed</h4>
                  <p><strong>Error:</strong> {selectedResult.errorMessage || 'Unknown error occurred'}</p>
                  <p><strong>Status:</strong> {selectedResult.analysisStatus}</p>
                  <p><strong>Time:</strong> {formatDate(selectedResult.analysisCompletedAt)}</p>
                </div>
              ) : selectedResult.analysisStatus === 'processing' ? (
                <div className="processing-details">
                  <h4>Analysis In Progress</h4>
                  <p>The analysis is currently being processed. Please check back later.</p>
                  <p><strong>Started:</strong> {formatDate(selectedResult.analysisStartedAt)}</p>
                </div>
              ) : (
                <div className="no-data">
                  <p>No detailed analysis data available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
