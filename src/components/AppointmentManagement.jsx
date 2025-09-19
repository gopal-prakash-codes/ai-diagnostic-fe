import React, { useState} from 'react';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from '../context/AuthContext';

const appointments = [
  {
    time: '9:00AM',
    duration: '30 Mins',
    name: 'John Smith',
    type: 'Consultation -- Room 1',
    status: 'Completed',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    color: 'green',
  },
  {
    time: '10:00AM',
    duration: '30 Mins',
    name: 'Emma Wilson',
    type: 'Consultation -- Room 1',
    status: 'In Progress',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    color: 'yellow',
  },
  {
    time: '10:30AM',
    duration: '30 Mins',
    name: 'Michael Brown',
    type: 'Consultation -- Room 1',
    status: 'Cancel',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    color: 'red',
  },
  {
    time: '11:00AM',
    duration: '30 Mins',
    name: 'Sarah Davis',
    type: 'Consultation -- Room 1',
    status: 'Completed',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    color: 'teal',
  },
  {
    time: '10:00AM',
    duration: '30 Mins',
    name: 'Emma Wilson',
    type: 'Consultation -- Room 1',
    status: 'In Progress',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    color: 'blue',
  },
  {
    time: '10:30AM',
    duration: '30 Mins',
    name: 'Michael Brown',
    type: 'Consultation -- Room 1',
    status: 'Cancel',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    color: 'red',
  },
  {
    time: '10:30AM',
    duration: '30 Mins',
    name: 'Michael Brown',
    type: 'Consultation -- Room 1',
    status: 'Cancel',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    color: 'red',
  },
];

const getStatusClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-[#2EB4B4] text-white';
    case 'In Progress':
      return 'bg-[#FFC658] text-white';
    case 'Cancel':
      return 'bg-[#FF5B61] text-white';
    default:
      return 'bg-gray-300';
  }
};

const AppointmentManagement = () => {

const [isOpen, setIsOpen] = useState(true); 

const toggleSidebar = () => setIsOpen(!isOpen);
const { user, logout } = useAuth();

  return (
    <SidebarLayout isOpen={isOpen}>
     <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
    
<div className="h-[calc(100vh_-_96px)] bg-[#DCE1EE] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
       
    <div className="flex flex-col overflow-y-auto ">
<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 pb-2">Appointment Management</h1>
          <p className="text-black text-md">AI-Powered Scheduling And Management System</p>
        </div>
        <button className="bg-teal-500 text-white px-4 py-2 rounded-md">
          + New Appointments
        </button>
      </div>

      {/* Appointments Card */}
      <div className="bg-white rounded-lg shadow ">
        <div className="bg-teal-500 px-4 py-3 text-white font-semibold text-lg rounded-t-lg">
          Today's Appointments
        </div>

        {/* List */}
        <div className="divide-y">
          {appointments.map((appt, index) => (
<div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 hover:bg-gray-50">
              {/* Time */}
<div className="w-full sm:w-24 text-sm text-gray-600">
                <div>{appt.time}</div>
                <div className="text-xs">{appt.duration}</div>
              </div>

              {/* Avatar + Info */}
<div className="flex-1 flex flex-wrap items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full`}
                  style={{ backgroundColor: appt.color }}
                ></span>
                <img src={appt.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-semibold text-gray-800">{appt.name}</div>
                  <div className="text-sm text-gray-500">{appt.type}</div>
                </div>
              </div>

              {/* Status + View */}
<div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                <span
                  className={`text-xs px-3 py-2 rounded-md font-semibold ${getStatusClass(
                    appt.status
                  )}`}
                >
                  {appt.status}
                </span>
                <button className="border border-black text-black text-sm px-3 py-1 rounded hover:bg-gray-100">
                  View Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
    </div>
      {/* Header */}
    </SidebarLayout>
    
  );
};

export default AppointmentManagement;
