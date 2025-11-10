
// Support both VITE_NEXT_PUBLIC_API_BASE_URL and VITE_API_BASE_URL for flexibility
export const API_BASE_URL = import.meta.env.VITE_NEXT_PUBLIC_API_BASE_URL || 
                            import.meta.env.VITE_API_BASE_URL || 
                            import.meta.env.VITE_API_BASE || 
                            'http://localhost:5042/';


export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.success) {
    const token = data.data?.token;
    const user = data.data?.user;
    
    if (token && user) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return {
        token,
        user,
        message: data.message
      };
    } else {
      throw new Error('Invalid response structure: missing token or user data');
    }
  } else {
    throw new Error(data.message || 'Login failed');
  }
};

export const registerUser = async (email, password, firstName, lastName) => {
  const response = await fetch(`${API_BASE_URL}api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Registration failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.success) {
    return {
      message: data.message,
      user: data.data?.user || null
    };
  } else {
    throw new Error(data.message || 'Registration failed');
  }
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }
  return null;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getStoredUser();
  return !!(token && user);
};

export const createPatient = async (patientData) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/patients`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to create patient: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

export const getPatients = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/patients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch patients: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

export const getPatientById = async (patientId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/patients/${patientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch patient: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

export const transcribe = async (formData) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }
  
  const res = await fetch(`${API_BASE_URL}api/diagnosis/transcribe`, {
    method: "POST",
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Transcription failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Transcription failed');
  }
  
  return data;
}

export const transcribeWithSpeakers = async (formData) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }
  
  const res = await fetch(`${API_BASE_URL}api/diagnosis/transcribe-speakers`, {
    method: "POST",
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Speaker transcription failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Speaker transcription failed');
  }
  
  return data;
}

export const fetchLiveSuggestions = async (payload, signal) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  };

  if (signal) {
    options.signal = signal;
  }

  const response = await fetch(`${API_BASE_URL}api/diagnosis/suggestions`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to fetch suggestions: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

export const analyzeDiagnosis = async (patientId, conversationText, updateExisting = false) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/diagnosis/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId,
      conversationText,
      updateExisting
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Diagnosis failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

export const getPatientHistory = async (patientId, page = 1, limit = 10) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/diagnosis/patient/${patientId}?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch patient history: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

// Radiology Reports API functions
export const getRadiologyReports = async (page = 1, limit = 10) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/diagnosis?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch radiology reports: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

export const getRadiologyReportById = async (reportId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}api/diagnosis/${reportId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch radiology report: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};