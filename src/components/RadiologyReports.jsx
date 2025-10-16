import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from '../context/AuthContext';
import { IoIosFlask } from "react-icons/io";
import { RiTempColdLine } from "react-icons/ri";
import { getPatients } from '../api/api';
import { toast } from 'react-toastify';

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-[#FAFAFA] text-[#172B4C] border border-gray-200';
    case 'In Progress':
      return 'bg-[#FFC658] text-[#7E653A]';
    default:
      return 'bg-gray-300';
  }
};

const RadiologyReports = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toggleSidebar = () => setIsOpen(!isOpen);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Just fetch patients data
        const patientsResponse = await getPatients();

        if (patientsResponse.success) {
          const patientsData = patientsResponse.data?.patients || [];
          
          // Transform patients data to match the expected report format
          const transformedReports = patientsData.map(patient => {
            return {
              id: patient._id,
              name: patient.name || 'Unknown Patient',
              status: 'Completed', // Default status
              date: new Date(patient.createdAt).toLocaleDateString(),
              reportType: 'Medical Report',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name || 'Unknown')}&background=FAFAFA&color=172B4C`,
              alert: false,
              patientData: patient
            };
          });

          setReports(transformedReports);
        } else {
          throw new Error('Failed to fetch patients data');
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err.message);
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <SidebarLayout isOpen={isOpen}>
        <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
        <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading radiology reports...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout isOpen={isOpen}>
        <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
        <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">Error loading radiology reports: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-[#6B7280] text-white px-4 py-2 rounded-md hover:bg-[#4B5563] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout isOpen={isOpen}>
      <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />

      <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
        <div className="flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 pb-2">Radiology Reports</h1>
              <p className="text-black text-md">Complete Medical History And Visit</p>
            </div>
            <button className="bg-[#FAFAFA] text-[#172B4C] px-4 py-2 rounded-md flex items-center gap-3 border border-gray-200 hover:bg-gray-100 transition-colors">
              <RiTempColdLine className='text-2xl' />
              Order Radiology Test
            </button>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 bg-[#FAFAFA] px-4 py-3 text-[#172B4C] font-semibold text-lg rounded-t-lg">
              <IoIosFlask className="text-3xl" />
              Recent Radiology Reports ({reports.length})
            </div>

            {/* List */}
            <div className="flex flex-col gap-4 p-4 max-h-[36rem] overflow-y-auto">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <IoIosFlask className="text-4xl mx-auto mb-4 opacity-50" />
                  <p>No radiology reports found</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    {/* Avatar + Info */}
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      <img src={report.avatar} alt="avatar" className="w-15 h-15 rounded-full" />
                      <div>
                        <div className="font-semibold text-md text-[#172B4C] flex items-center gap-2">
                          {report.name}
                          {report.alert && (
                            <span className="text-xs px-2 py-1 bg-[#FF5B61] text-white rounded-md font-semibold">
                              Low Confidence
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-[#172B4C]">
                          {report.reportType} -- Ordered -- {report.date}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Age: {report.patientData.age} | Gender: {report.patientData.gender}
                        </div>
                      </div>
                    </div>

                    {/* Status + View */}
                    <div className="flex flex-wrap gap-3 items-center justify-start sm:justify-end">
                      <span
                        className={`text-md px-3 py-3 rounded-md font-semibold ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                      <Link to={`/radiology-report/${report.id}`}>
                        <button className="border border-[black] text-[black] text-md px-3 py-2 rounded hover:bg-gray-100 transition-colors">
                          View Report
                        </button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default RadiologyReports;