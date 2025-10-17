import React, { useState, useEffect, useCallback, useRef } from 'react';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from '../context/AuthContext';
import { getPatients } from '../api/api';
import { toast } from 'react-toastify';

// Generate appointment times
const generateAppointmentTime = (index) => {
  const baseHour = 9;
  const slot = Math.floor(index / 2);
  const isHalfHour = index % 2 === 1;
  const hour = baseHour + slot;
  const minute = isHalfHour ? 30 : 0;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')}${period}`;
};

const getAppointmentStatus = () => {
  const statuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Scheduled': return '#3B82F6'; // blue
    case 'In Progress': return '#FFC658'; // yellow
    case 'Completed': return '#2EB4B4'; // teal
    case 'Cancelled': return '#FF5B61'; // red
    default: return '#6B7280'; // gray
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-[#2EB4B4] text-white';
    case 'In Progress':
      return 'bg-[#FFC658] text-white';
    case 'Scheduled':
      return 'bg-[#3B82F6] text-white';
    case 'Cancelled':
      return 'bg-[#FF5B61] text-white';
    default:
      return 'bg-gray-300';
  }
};

const AppointmentManagement = () => {
  const [isOpen, setIsOpen] = useState(true); 
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedPatients = useRef(false);
  const isLoadingPatients = useRef(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const { user, logout } = useAuth();

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
        console.error('Failed to load patients:', response.message);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients. Please try again.');
      setPatients([]);
    } finally {
      setLoading(false);
      isLoadingPatients.current = false;
    }
  }, []);

  // Generate avatar URL for patient
  const getAvatarUrl = (patient, index) => {
    const genderParam = patient.gender === 'female' ? 'women' : 'men';
    return `https://randomuser.me/api/portraits/${genderParam}/${(index % 50) + 1}.jpg`;
  };

  return (
    <SidebarLayout isOpen={isOpen}>
     <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
    
<div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
       
    <div className="flex flex-col overflow-y-auto ">
<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 pb-2">Appointment Management</h1>
          <p className="text-black text-md">AI-Powered Scheduling And Management System</p>
        </div>
        <button className="bg-[#FAFAFA] text-[#172B4C] px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-100">
          + New Appointments
        </button>
      </div>

      {/* Appointments Card */}
      <div className="bg-white rounded-lg shadow ">
        <div className="bg-red-700  px-4 py-3 text-white font-semibold text-lg rounded-t-lg">
          Today's Appointments
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 p-4 max-h-[36rem] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
              <span className="ml-3 text-gray-600">Loading appointments...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No appointments scheduled</div>
              <p className="text-gray-500">Schedule appointments with your patients</p>
            </div>
          ) : (
            patients.map((patient, index) => {
              const appointmentTime = generateAppointmentTime(index);
              const status = getAppointmentStatus();
              const statusColor = getStatusColor(status);
              const avatarUrl = getAvatarUrl(patient, index);

              return (
                <div key={patient.id || patient._id || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                  {/* Time */}
                  <div className="w-full sm:w-24 text-sm text-gray-600">
                    <div>{appointmentTime}</div>
                    <div className="text-xs">30 Mins</div>
                  </div>

                  {/* Avatar + Info */}
                  <div className="flex-1 flex flex-wrap items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full`}
                      style={{ backgroundColor: statusColor }}
                    ></span>
                    <img 
                      src={avatarUrl} 
                      alt={`${patient.name} avatar`} 
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=FAFAFA&color=172B4C`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-gray-800">{patient.name}</div>
                      <div className="text-sm text-gray-500">
                        Consultation -- Room 1 | {patient.gender}, {patient.age}y
                      </div>
                    </div>
                  </div>

                  {/* Status + View */}
                  <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                    <span
                      className={`text-xs px-3 py-2 rounded-md font-semibold ${getStatusClass(status)}`}
                    >
                      {status}
                    </span>
                    <button className="border border-black text-black text-sm px-3 py-1 rounded hover:bg-gray-100">
                      View Detail
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
    </div>
      {/* Header */}
    </SidebarLayout>
    
  );
};

export default AppointmentManagement;
