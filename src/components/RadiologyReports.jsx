// import React, { useState } from 'react';
// import SidebarLayout from "./SideBar";
// import Navbar from "./NavBar";
// import { useAuth } from '../context/AuthContext';
// import { IoIosFlask } from "react-icons/io";
// import { RiTempColdLine } from "react-icons/ri";
// import { Link } from 'react-router-dom'; 


// // Mock data for radiology reports
// const radiologyReports = [
//   {
//     name: 'John Smith',
//     status: 'Completed',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
//     alert: false,
//   },
//   {
//     name: 'John Smith',
//     status: 'In Progress',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
//     alert: false,
//   },
//   {
//     name: 'Sarah Davis',
//     status: 'Completed',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
//     alert: true,
//   },
//   {
//     name: 'John Smith',
//     status: 'Completed',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
//     alert: false,
//   },
//   {
//     name: 'John Smith',
//     status: 'In Progress',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
//     alert: false,
//   },
//   {
//     name: 'Sarah Davis',
//     status: 'Completed',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
//     alert: true,
//   },
//   {
//     name: 'Sarah Davis',
//     status: 'Completed',
//     date: '2025-11-09',
//     reportType: 'Complete Blood Count',
//     avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
//     alert: true,
//   },
// ];

// const getStatusClass = (status) => {
//   switch (status) {
//     case 'Completed':
//       return 'bg-[#2EB4B4] text-white';
//     case 'In Progress':
//       return 'bg-[#FFC658] text-[#7E653A]';
//     default:
//       return 'bg-gray-300';
//   }
// };

// const RadiologyReports = () => {
//   const [isOpen, setIsOpen] = useState(true);
//   const toggleSidebar = () => setIsOpen(!isOpen);
//   const { user, logout } = useAuth();

//   return (
//     <SidebarLayout isOpen={isOpen}>
//       <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />

//       <div className="h-[calc(100vh_-_96px)] bg-[#DCE1EE] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
//         <div className="flex flex-col overflow-y-auto">
//           {/* Header */}
//           <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-800 pb-2">Radiology Reports</h1>
//               <p className="text-black text-md">Complete Medical History And Visit</p>
//             </div>
//             <button className="bg-[#2EB4B4] text-white px-4 py-2 rounded-md flex items-center gap-3 hover:bg-[#258B8B] transition-colors">
//               <RiTempColdLine className='text-2xl' />
//               Order Radiology Test
//             </button>
//           </div>

//           {/* Reports Card */}
//           <div className="bg-white rounded-lg shadow">
//             <div className="flex items-center gap-2 bg-[#2EB4B4] px-4 py-3 text-white font-semibold text-lg rounded-t-lg">
//               <IoIosFlask className="text-3xl" />
//               Recent Radiology Reports
//             </div>

//             {/* List */}
//             <div className="flex flex-col gap-4 p-4">
//               {radiologyReports.map((report, index) => (
//                 <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 bg-white rounded-lg border border-gray-200">
//                   {/* Avatar + Info */}
//                   <div className="flex-1 flex flex-wrap items-center gap-3">
//                     <img src={report.avatar} alt="avatar" className="w-15 h-15 rounded-full" />
//                     <div>
//                       <div className="font-semibold text-md text-[#172B4C] flex items-center gap-2">
//                         {report.name}
//                         {report.alert && (
//                           <span className="text-xs px-2 py-1 bg-[#FF5B61] text-white rounded-md font-semibold">
//                             2 Alert
//                           </span>
//                         )}
//                       </div>
//                       <div className="text-sm text-[#172B4C]">
//                         {report.reportType} -- Ordered --{report.date}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Status + View */}
//                   <div className="flex flex-wrap gap-3 items-center justify-start sm:justify-end">
//                     <span
//                       className={`text-md px-3 py-3 rounded-md font-semibold ${getStatusClass(
//                         report.status
//                       )}`}
//                     >
//                       {report.status}
//                     </span>
//                     <Link to={`/radiology-report`}>
//                       <button className="border border-[black] text-[black] text-md px-3 py-2 rounded hover:bg-gray-100 transition-colors">
//                         View Report
//                       </button>
//                     </Link>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// };

// export default RadiologyReports;