import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPatients, createPatient } from '../api/api';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from "../context/AuthContext";
import { Button, Card, CardHeader, CardContent, Input, Select, Modal } from './UI';

const PatientRecords = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const hasLoadedPatients = useRef(false);
  const isLoadingPatients = useRef(false);
  
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: ''
  });

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Load patients on component mount
  useEffect(() => {
    if (!hasLoadedPatients.current) {
      hasLoadedPatients.current = true;
      loadPatients();
    }
  }, []);

  const loadPatients = useCallback(async () => {
    if (isLoadingPatients.current) return; 
    
    try {
      isLoadingPatients.current = true;
      setLoading(true);
      
      const response = await getPatients();
      if (response.success && response.data) {
        const patientsData = response.data.patients || response.data;
        const validPatients = Array.isArray(patientsData) ? patientsData : [];
        setPatients(validPatients);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients. Please refresh the page.');
      setPatients([]);
    } finally {
      setLoading(false);
      isLoadingPatients.current = false;
    }
  }, []);

  const handleCreatePatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.gender) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(newPatient.name.trim())) {
      toast.error('Patient name can only contain letters and spaces');
      return;
    }

    const age = parseInt(newPatient.age);
    if (isNaN(age) || age < 1 || age > 150) {
      toast.error('Please enter a valid age between 1 and 150');
      return;
    }

    try {
      const response = await createPatient({
        name: newPatient.name.trim(),
        age: age,
        gender: newPatient.gender
      });

      if (response.success && response.data) {
        const newPatientData = response.data.patient || response.data;
        if (newPatientData && (newPatientData.id || newPatientData._id)) {
          setPatients([...patients, newPatientData]);
          setNewPatient({ name: '', age: '', gender: '' });
          setShowCreatePatient(false);
          toast.success(`Patient "${newPatient.name}" created successfully!`);
        }
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(error.message || 'Failed to create patient. Please try again.');
    }
  };

  const handleViewRecord = (patient) => {
    if (patient && (patient.id || patient._id)) {
      navigate(`/patient/${patient.id || patient._id}/history`, { 
        state: { patient: patient } 
      });
    } else {
      toast.error('Unable to view patient record. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No visits yet';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Generate avatar URL based on gender and name
  const getAvatarUrl = (patient, index) => {
    const genderPath = patient.gender === 'female' ? 'women' : 'men';
    const seedNumber = (index % 99) + 1; // Use index to ensure consistent avatars
    return `https://randomuser.me/api/portraits/${genderPath}/${seedNumber}.jpg`;
  };

  // Get patient condition (placeholder - you might want to derive this from consultation history)
  const getPatientCondition = (patient) => {
    // This is a placeholder. You might want to get the most recent diagnosis
    // from the patient's consultation history via another API call
    return 'General Consultation';
  };

  // Check if patient has alerts (placeholder logic)
  const getPatientAlerts = (patient) => {
    // This is placeholder logic. You might want to implement actual alert logic
    // based on patient's medical history, overdue appointments, etc.
    if (patient.age > 65) return Math.floor(Math.random() * 3); // Random alerts for demo
    return Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : null;
  };

  return (
    <SidebarLayout isOpen={isOpen}>
      <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />

      <div className="h-[calc(100vh_-_96px)] bg-[#DCE1EE] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Header */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pb-1 sm:pb-2">Patient Record & EMR</h1>
              <p className="text-gray-500 text-md">Electronic Medical Records Management</p>
            </div>
            <button 
              onClick={() => setShowCreatePatient(true)}
  className="w-full sm:w-auto bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition-colors"
            >
              + New Record
            </button>
          </div>

          {/* Patient Records Card */}
          <div className="bg-white rounded-lg shadow">
            {/* Card Header */}
            <div className="bg-teal-500 px-4 py-3 text-white font-semibold text-lg rounded-t-lg flex items-center justify-between">
              <span>Patient Records</span>
              <span className="text-sm font-normal opacity-90">
                {loading ? 'Loading...' : `${patients.length} patients`}
              </span>
            </div>

            {/* List */}
            <div className="divide-y">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                  <span className="ml-3 text-gray-600">Loading patient records...</span>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">No patient records found</div>
                  <p className="text-gray-500">Create your first patient record to get started</p>
                </div>
              ) : (
                patients.map((patient, index) => {
                  const alerts = getPatientAlerts(patient);
                  const condition = getPatientCondition(patient);
                  const avatarUrl = getAvatarUrl(patient, index);
                  const lastVisit = formatDate(patient.updatedAt || patient.createdAt);

                  return (
                    <div
                      key={patient.id || patient._id || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 hover:bg-gray-50 gap-3"
                    >
                      {/* Left: Avatar + Info */}
                   <div className="flex items-start sm:items-center gap-3 flex-1">
                        <img
                          src={avatarUrl}
                          alt={`${patient.name} avatar`}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0d9488&color=fff`;
                          }}
                        />
                        <div>
                          <div className="font-semibold text-gray-800">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                         {patient.gender}, {patient.age}y
                          </div>
                        </div>
                      </div>

                      {/* Right: Alert + Button */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        {alerts && (
                          <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-md font-semibold">
                            {alerts} Alert{alerts > 1 ? 's' : ''}
                          </span>
                        )}
                        <button 
                          onClick={() => handleViewRecord(patient)}
                          className="border border-gray-300 text-gray-700 text-sm px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          View Record
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Create Patient Modal */}
        <Modal
          isOpen={showCreatePatient}
          onClose={() => setShowCreatePatient(false)}
          title="Create New Patient Record"
        >
          <div className="space-y-4">
            <Input
              label="Patient Name"
              value={newPatient.name}
              onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
              placeholder="Enter patient name"
            />
            
            <Input
              label="Age"
              type="number"
              value={newPatient.age}
              onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
              placeholder="Enter age"
              min="1"
              max="150"
            />
            
            <Select
              label="Gender"
              value={newPatient.gender}
              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
              placeholder="Select gender"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            
<div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleCreatePatient}
                disabled={!newPatient.name || !newPatient.age || !newPatient.gender}
                className="flex-1"
              >
                Create Patient
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreatePatient(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </SidebarLayout>
  );
};

export default PatientRecords;