import { useEffect } from "react";
import { Link } from 'react-router-dom';
import { FaCalendarPlus } from "react-icons/fa";
import { MdOutlineContactPage } from "react-icons/md";
import { HiClipboardList } from "react-icons/hi";
import { useLocation } from 'react-router-dom';
import { IoIosFlask } from "react-icons/io";

import logo from "../assets/logo.png"

export default function SidebarLayout({ isOpen, children }) {
  const location = useLocation();

  useEffect(() => {
    console.log(location.pathname);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-white transition-all duration-300 z-50 fixed top-0 left-0 h-full overflow-hidden
          ${isOpen ? "w-64" : "w-14"} 
          sm:relative sm:block
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-center border-b border-gray-200 bg-gray-50 h-14 sm:h-16">
          {isOpen ? (
            <div className="flex space-x-3 items-center px-4">
              <img src={logo} alt="" className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-lg sm:text-xl font-semibold text-gray-800">Aarogya AI</span>
            </div>
          ) : (
            <img src={logo} alt="" className="w-6 h-6 sm:w-8 sm:h-8" />
          )}
        </div>

        {/* Sidebar items */}
        <nav className="mt-4 pl-2 sm:pl-3 flex flex-col gap-y-6">
          <Link to={"/appointments"} className={`${location.pathname === "/appointments" ? `text-[#2EB4B4]` : `text-gray-700 hover:text-[#2EB4B4]`} flex items-center justify-center sm:justify-start w-full font-[family-name:var(--font-gabarito)] transition-colors duration-200`}>
            <div className='flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50'>
              <span className='text-xl'><FaCalendarPlus /></span>
              {isOpen && <span className="text-sm font-medium">Appointments</span>}
            </div>
          </Link>

          <Link to={"/patient-record"} className={`${location.pathname === "/patient-record" ? `text-[#2EB4B4]` : `text-gray-700 hover:text-[#2EB4B4]`} flex items-center justify-center sm:justify-start w-full font-[family-name:var(--font-gabarito)] transition-colors duration-200`}>
            <div className='flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50'>
              <span className='text-xl'><MdOutlineContactPage /></span>
              {isOpen && <span className="text-sm font-medium">Patient Records</span>}
            </div>
          </Link>

          <Link to={"/radiology"} className={`${location.pathname === "/radiology" ? `text-[#2EB4B4]` : `text-gray-700 hover:text-[#2EB4B4]`} flex items-center justify-center sm:justify-start w-full font-[family-name:var(--font-gabarito)] transition-colors duration-200`}>
            <div className='flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-50'>
              <span className='text-xl'><IoIosFlask /></span>
              {isOpen && <span className="text-sm font-medium">Radiology</span>}
            </div>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 transition-all duration-300 overflow-hidden 
          ${isOpen ? "ml-64" : "ml-14"}
          sm:ml-0
        `}
      >
        {children}
      </div>
    </div>
  );
}
