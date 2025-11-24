import { API_BASE_URL, getAuthHeaders } from './api';

export const radiologyApi = {
  // Create a new radiology report
  createReport: async (reportData) => {
    try {
      console.log('Creating report with data:', reportData);
      const headers = getAuthHeaders();
      console.log('Auth headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}api/radiology/reports`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(reportData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create report');
      }

      return data;
    } catch (error) {
      console.error('Create report error:', error);
      throw error;
    }
  },

  // Get radiology report by ID
  getReport: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/reports/${reportId}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get report');
      }

      return data;
    } catch (error) {
      console.error('Get report error:', error);
      throw error;
    }
  },

  // Upload scan files (with progress callback support)
  uploadScanFiles: async (reportId, formData, onProgress) => {
    try {
      // Prefer XMLHttpRequest to get reliable upload progress events
      const headers = getAuthHeaders();

      // Wrap XHR in a Promise with extended timeout for large files
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}api/radiology/reports/${reportId}/upload`, true);
        
        // Set timeout to 30 minutes for large file uploads (1800000ms)
        xhr.timeout = 30 * 60 * 1000;

        // Set auth headers (do not set Content-Type; browser will set correct multipart boundary)
        Object.entries(headers).forEach(([key, value]) => {
          try {
            if (key.toLowerCase() !== 'content-type') {
              xhr.setRequestHeader(key, value);
            }
          } catch (_) {
            // Safely ignore header setting issues
          }
        });

        if (xhr.upload && typeof onProgress === 'function') {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent, event.loaded, event.total);
            } else {
              onProgress(null, event.loaded, null);
            }
          };
        }

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(json);
              } else {
                reject(new Error(json.message || `Upload failed with status ${xhr.status}`));
              }
            } catch (e) {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true, data: [], raw: xhr.responseText });
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText || 'Unknown error'}`));
              }
            }
          }
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timeout: The file is too large or the connection is too slow. Please try again.'));
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload. Please check your connection and try again.'));
        };
        
        xhr.onabort = () => {
          reject(new Error('Upload aborted'));
        };

        xhr.send(formData);
      });

      return result;
    } catch (error) {
      console.error('Upload files error:', error);
      throw error;
    }
  },

  // Start analysis for a scan record
  startAnalysis: async (scanRecordId, analysisType) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/scans/${scanRecordId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ analysisType })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start analysis');
      }

      return data;
    } catch (error) {
      console.error('Start analysis error:', error);
      throw error;
    }
  },

  // Get analysis result
  getAnalysisResult: async (analysisId) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/analysis/${analysisId}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get analysis result');
      }

      return data;
    } catch (error) {
      console.error('Get analysis result error:', error);
      throw error;
    }
  },

  // Get scan record status (efficient endpoint for polling)
  getScanRecordStatus: async (scanRecordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/scans/${scanRecordId}/status`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get scan record status');
      }

      return data;
    } catch (error) {
      console.error('Get scan record status error:', error);
      throw error;
    }
  },

  // Generate download URL
  generateDownloadUrl: async (scanRecordId, fileType = 'original') => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/scans/${scanRecordId}/download?fileType=${fileType}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate download URL');
      }

      return data;
    } catch (error) {
      console.error('Generate download URL error:', error);
      throw error;
    }
  },

  // Get patient radiology reports
  getPatientReports: async (patientId, options = {}) => {
    try {
      const { page = 1, limit = 10, status } = options;
      let url = `${API_BASE_URL}api/radiology/patients/${patientId}/reports?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get patient reports');
      }

      return data;
    } catch (error) {
      console.error('Get patient reports error:', error);
      throw error;
    }
  },

  // Delete radiology report
  deleteReport: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/reports/${reportId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete report');
      }

      return data;
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  },

  deleteScanRecord: async (scanRecordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/scans/${scanRecordId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete scan record');
      }

      return data;
    } catch (error) {
      console.error('Delete scan record error:', error);
      throw error;
    }
  },

  // Get all reports for a specific patient
  getPatientReports: async (patientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/radiology/patients/${patientId}/reports`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get patient reports');
      }

      return await response.json();
    } catch (error) {
      console.error('Get patient reports error:', error);
      throw error;
    }
  },

  // Helper function to create a patient if needed
  createPatient: async (patientData) => {
    try {
      const response = await fetch(`${API_BASE_URL}api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(patientData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create patient');
      }

      return data;
    } catch (error) {
      console.error('Create patient error:', error);
      throw error;
    }
  },

  getOrCreatePatient: async (patientData) => {
    try {
      const searchResponse = await fetch(`${API_BASE_URL}api/patients?search=${encodeURIComponent(patientData.name)}`, {
        headers: getAuthHeaders()
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data && searchData.data.patients && searchData.data.patients.length > 0) {
          // Found existing patient
          return { data: searchData.data.patients[0], created: false };
        }
      }

      // Create new patient
      const createData = await radiologyApi.createPatient(patientData);
      return { data: createData.data, created: true };

    } catch (error) {
      console.error('Get or create patient error:', error);
      throw error;
    }
  }
};

export default radiologyApi;
