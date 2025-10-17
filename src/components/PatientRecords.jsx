import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPatients, createPatient } from '../api/api';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from "../context/AuthContext";
import { Button, Card, CardHeader, CardContent, Input, Select, Modal } from './UI';
import PatientModal from './PatientModal';

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


  const handlePatientModalSave = async (patientData) => {
    try {
      const response = await createPatient({
        name: patientData.name.trim(),
        age: parseInt(patientData.age),
        gender: patientData.gender
      });

      if (response.success && response.data) {
        const newPatientData = response.data.patient || response.data;
        if (newPatientData && (newPatientData.id || newPatientData._id)) {
          setPatients([...patients, newPatientData]);
          toast.success(`Patient "${newPatientData.name}" created successfully!`);
          
          // Auto-navigate to patient history
          setTimeout(() => {
            navigate(`/patient/${newPatientData.id || newPatientData._id}/history`, { 
              state: { patient: newPatientData } 
            });
          }, 1000);
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


  return (
    <SidebarLayout isOpen={isOpen}>
      <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />

      <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Header */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 pb-1 sm:pb-2">Patient Record & EMR</h1>
              <p className="text-gray-500 text-md">Electronic Medical Records Management</p>
            </div>
            <button 
              onClick={() => setShowCreatePatient(true)}
  className="w-full sm:w-auto bg-[#FAFAFA] text-[#172B4C] px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              + New Record
            </button>
          </div>

          {/* Patient Records Card */}
          <div className="bg-white rounded-lg shadow">
            {/* Card Header */}
            <div className="bg-red-700 px-4 py-3 text-white font-semibold text-lg rounded-t-lg flex items-center justify-between">
              <span>Patient Records</span>
              <span className="text-sm font-normal opacity-90">
                {loading ? 'Loading...' : `${patients.length} patients`}
              </span>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4 p-4 max-h-[36rem] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  <span className="ml-3 text-gray-600">Loading patient records...</span>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">No patient records found</div>
                  <p className="text-gray-500">Create your first patient record to get started</p>
                </div>
              ) : (
                patients.map((patient, index) => {
                  const condition = getPatientCondition(patient);
                  const avatarUrl = getAvatarUrl(patient, index);
                  const lastVisit = formatDate(patient.updatedAt || patient.createdAt);

                  return (
                    <div
                      key={patient.id || patient._id || index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      {/* Left: Avatar + Info */}
                   <div className="flex items-start sm:items-center gap-3 flex-1">
                        <img
                          src={avatarUrl}
                          alt={`${patient.name} avatar`}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=FAFAFA&color=172B4C`;
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

                      {/* Right: Button */}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <button 
                          onClick={() => handleViewRecord(patient)}
                          className="border border-[black] text-[black] text-sm px-3 py-1 rounded hover:bg-gray-100 transition-colors"
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
        <PatientModal
          isOpen={showCreatePatient}
          onClose={() => setShowCreatePatient(false)}
          patient={null}
          onSave={handlePatientModalSave}
          simpleMode={true}
        />
      </div>
    </SidebarLayout>
  );
};

export default PatientRecords;