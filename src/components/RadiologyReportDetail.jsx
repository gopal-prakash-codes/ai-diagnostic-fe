import React, { useState } from 'react';
import SidebarLayout from "./SideBar";
import Navbar from "./NavBar";
import { useAuth } from '../context/AuthContext';
import { IoIosFlask } from "react-icons/io";
import { RiTempColdLine } from "react-icons/ri";
import { IoDocumentTextOutline, IoCloudUploadOutline, IoDownloadOutline } from 'react-icons/io5';
import { FaStethoscope, FaClipboardCheck, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';

// Mock data for radiology reports, now with unique IDs and detailed info
const radiologyReports = [
    {
        id: 1,
        name: 'John Smith',
        status: 'Completed',
        date: '2025-11-09',
        reportType: 'Complete Blood Count',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        alert: false,
        reportDetails: {
            panelName: "Lipid Panel",
            patientAgeSex: "32, F",
            reportId: "Lab-002",
            doctorName: "Mike Brown",
            clinicName: "Wellness Family Practice",
            clinicAddress: "70 Washington Square South, New York, NY 10012, United States",
            clinicalFindings: "There Is A Large 5.0 Cm Cavitary Mass Located In The Right Lower Lobe.No Consolidation, Ground-Glass Opacities, Pleural Effusion, Pneumothorax, Or Lymphadenopathy Are Identified.",
            diagnosis: "Suspicious Cavitary Mass In The Right Lower Lobe, Differential Includes Malignancy (e.g primary lung cancer) Or Infectious Etiologies Such A Abscess",
            urgencyLevel: "Priority",
            recommendedActions: "Recommend Further Evaluation With Tissue Biopsy And Microbiological Studies To Determine Aetiology. Consider PET-CT For Staging If Malignancy Is Suspected. Close Clinical Follow-Up And Possible Initiation Of Empiric Antibiotics If Infection Is Suspected"
        }
    },
    {
        id: 2,
        name: 'John Smith',
        status: 'In Progress',
        date: '2025-11-09',
        reportType: 'Complete Blood Count',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        alert: false,
        reportDetails: {
            panelName: "Complete Blood Count",
            patientAgeSex: "45, M",
            reportId: "Lab-001",
            doctorName: "Dr. Mike Brown",
            clinicName: "Wellness Family Practice",
            clinicAddress: "70 Washington Square South, New York, NY 10012, United States",
            clinicalFindings: "Initial lab work shows elevated white blood cell count and C-reactive protein.",
            diagnosis: "Inflammatory response of unknown origin.",
            urgencyLevel: "Routine",
            recommendedActions: "Monitor patient, perform further tests to determine the source of inflammation."
        }
    },
    {
        id: 3,
        name: 'Sarah Davis',
        status: 'Completed',
        date: '2025-11-09',
        reportType: 'Complete Blood Count',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        alert: true,
        reportDetails: {
            panelName: "Complete Blood Count",
            patientAgeSex: "32, F",
            reportId: "Lab-003",
            doctorName: "Dr. S. Williams",
            clinicName: "Community Medical Group",
            clinicAddress: "456 Oak Ave, Somewhere, USA",
            clinicalFindings: "No significant finding in the current radiology test.",
            diagnosis: "Clear, normal results.",
            urgencyLevel: "Routine",
            recommendedActions: "No further action required."
        }
    },
    {
        id: 4, name: 'John Smith', status: 'Completed', date: '2025-11-09', reportType: 'Complete Blood Count', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', alert: false, reportDetails: {
            panelName: "Lipid Panel", patientAgeSex: "45, M", reportId: "Lab-004", doctorName: "Dr. Mike Brown", clinicName: "Wellness Family Practice", clinicAddress: "70 Washington Square South, New York, NY 10012, United States", clinicalFindings: "A detailed report...", diagnosis: "Normal results.", urgencyLevel: "Routine", recommendedActions: "No further action required."
        }
    },
    {
        id: 5, name: 'Sarah Davis', status: 'Completed', date: '2025-11-09', reportType: 'Complete Blood Count', avatar: 'https://randomuser.me/api/portraits/women/4.jpg', alert: true, reportDetails: {
            panelName: "X-Ray", patientAgeSex: "32, F", reportId: "Lab-007", doctorName: "Dr. Mike Brown", clinicName: "Wellness Family Practice", clinicAddress: "70 Washington Square South, New York, NY 10012, United States", clinicalFindings: "Small fracture in the left radius.", diagnosis: "Left forearm fracture.", urgencyLevel: "Priority", recommendedActions: "Apply cast and schedule a follow-up appointment."
        }
    },
];

const getStatusClass = (status) => {
    switch (status) {
        case 'Completed':
            return 'bg-[#2EB4B4] text-white';
        case 'In Progress':
            return 'bg-[#FFC658] text-white';
        default:
            return 'bg-gray-300';
    }
};

const RadiologyDashboard = () => {
    const [isOpen, setIsOpen] = useState(true);
    const toggleSidebar = () => setIsOpen(!isOpen);
    const { user, logout } = useAuth();
    const [selectedReport, setSelectedReport] = useState(null);

    const handleViewReport = (report) => {
        setSelectedReport(report);
    };

    return (
        <SidebarLayout isOpen={isOpen}>
            <Navbar toggleSidebar={toggleSidebar} user={user} logout={logout} />
            <div className="h-[calc(100vh_-_96px)] bg-[#DCE1EE] p-4 sm:p-6 md:p-8 font-sans overflow-y-auto relative pb-20">
                {selectedReport ? (
                    <div className="flex flex-col">
                        <div className="">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                          {selectedReport.reportDetails.panelName}
                                        <span className={`ml-3 text-sm px-3 py-1 rounded-full font-semibold ${getStatusClass(selectedReport.status)}`}>
                                            {selectedReport.status}
                                        </span>
                                    </h2>
                                    <p className="text-black text-md">
                                        Patient: <span className="font-semibold text-[#2EB4B4]">{selectedReport.name} ({selectedReport.reportDetails.patientAgeSex})</span> • ReportID: <span className="font-medium">{selectedReport.reportDetails.reportId}</span>
                                    </p>
                                </div>
                                <div className="text-right text-black text-sm">
                                    <p className="font-semibold">{selectedReport.reportDetails.doctorName}</p>
                                    <p>{selectedReport.reportDetails.clinicName}</p>
                                    <p>{selectedReport.reportDetails.clinicAddress}</p>
                                </div>
                            </div>
                        </div>

                        {/* File Upload / Drag & Drop Area */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-dashed border-2 border-gray-300 text-center">
                            <IoCloudUploadOutline className="mx-auto text-5xl text-gray-400 mb-3" />
                            <p className="text-md sm:text-lg font-semibold text-gray-700 mb-1">Drag & Drop Files Here Or Click To Upload</p>
                            <p className="text-sm text-gray-500">PDFs, CAD Exports, Excel Schedules, Specs</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                            <button className="bg-[#2EB4B4] text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-[#258B8B] transition-colors">
                                <IoDownloadOutline className="text-xl" /> Download Dicom Image
                            </button>
                            <button className="bg-white text-[#2EB4B4] px-6 py-3 rounded-md flex items-center gap-2 hover:bg-gray-100 transition-colors border border-[#2EB4B4]">
                                <IoDownloadOutline className="text-xl" /> Download Generated Report
                            </button>
                        </div>

                        {/* Analysis Section Header */}
                        <div className="flex items-center gap-2 bg-[#2EB4B4] px-4 py-3 text-white font-semibold text-lg rounded-t-lg">
                            <IoIosFlask className="text-2xl" /> Analysis
                        </div>

                        {/* Analysis Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-b-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaStethoscope className="text-blue-600" /> Clinical Findings
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{selectedReport.reportDetails.clinicalFindings}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaClipboardCheck className="text-blue-600" /> Diagnosis
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{selectedReport.reportDetails.diagnosis}</p>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaExclamationTriangle className="text-[#ff5b61]" /> Urgency Level
                                </h3>
                                <span className="bg-[#ff5b61] text-white text-xs px-3 py-1 rounded-md font-semibold">{selectedReport.reportDetails.urgencyLevel}</span>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaLightbulb className="text-yellow-500" /> Recommended Actions
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">{selectedReport.reportDetails.recommendedActions}</p>
                            </div>
                        </div>

                        {/* Floating button */}
                        <div className="p-4 flex justify-center sm:justify-end">
                            <button className="bg-[#2EB4B4] text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-[#258B8B] transition-colors">
                                Add To Patient Record
                            </button>
                        </div>
                    </div>
                ) : (
                    // Radiology Reports List View (Matches the first provided image)
                    <div className="flex flex-col overflow-y-auto">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 pb-2">Radiology Reports</h1>
                                <p className="text-black text-md">Complete Medical History And Visit</p>
                            </div>
                            <button className="bg-[#2EB4B4] text-white px-4 py-2 rounded-md flex items-center gap-3 hover:bg-[#258B8B] transition-colors">
                                <RiTempColdLine className='text-2xl' />
                                Order Radiology Test
                            </button>
                        </div>

                        <div className="bg-white rounded-lg shadow">
                            <div className="flex items-center gap-2 bg-[#2EB4B4] px-4 py-3 text-white font-semibold text-lg rounded-t-lg">
                                <IoIosFlask className="text-3xl" />
                                Recent Radiology Reports
                            </div>

                            <div className="flex flex-col gap-4 p-4">
                                {radiologyReports.map((report) => (
                                    <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 bg-white rounded-lg border border-gray-200">
                                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                                    <img src={report.avatar} alt="avatar" className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover" />
                                            <div>
                                                <div className="font-semibold text-md text-[#172B4C] flex items-center gap-2">
                                                    {report.name}
                                                    {report.alert && (
                                                        <span className="text-xs px-2 py-1 bg-[#FF5B61] text-white rounded-md font-semibold">
                                                            2 Alert
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-[#172B4C]">
                                                    {report.reportType} -- Ordered --{report.date}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 items-center justify-start sm:justify-end">
                                        <span className={`text-sm sm:text-md px-3 py-2 rounded-md font-semibold ${getStatusClass(report.status)}`}>
                                                {report.status}
                                            </span>
                                            <button className="border border-[black] text-[black] text-sm sm:text-md px-3 py-2 rounded hover:bg-gray-100 transition-colors"

                                                onClick={() => handleViewReport(report)}
                                            >
                                                View Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
};

export default RadiologyDashboard;