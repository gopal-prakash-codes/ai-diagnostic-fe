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
        <div className="flex items-center py-4 justify-center border-b h-20 sm:h-24">
          {isOpen ? (
            <div className="flex space-x-5 items-center p-2">
              <img src={logo} alt="" className="w-14 h-14" />
              <span className="text-xl sm:text-2xl font-semibold text-gray-800">Aarogya AI</span>
            </div>
          ) : (
            <img src={logo} alt="" className="w-10 h-10" />
          )}
        </div>

        {/* Sidebar items */}
        <nav className="mt-4 pl-2 sm:pl-3 flex flex-col gap-y-6">
          <Link to={"/appointments"} className={`${location.pathname === "/appointments" ? `text-[#2EB4B4]` : `text-black`} flex items-center justify-center sm:justify-start w-full font-[family-name:var(--font-gabarito)]`}>
            <div className='flex items-center gap-2 w-full px-1.5 text-xl'>
              <span className='text-2xl'><FaCalendarPlus /></span>
              {isOpen && <span className="text-base">Appointments</span>}
            </div>
          </Link>

          <Link to={"/patient-record"} className={`${location.pathname === "/patient-record" ? `text-[#2EB4B4]` : `text-black`} flex items-center justify-center sm:justify-start w-full font-[family-name:var(--font-gabarito)]`}>
            <div className='flex items-center gap-2 w-full px-1.5 text-xl'>
              <span className='text-3xl'><MdOutlineContactPage /></span>
              {isOpen && <span className="text-base">Patient Records</span>}
            </div>
          </Link>

          <Link to={"/radiology"} className={`${location.pathname === "/radiology" ? `text-[#2EB4B4]` : `text-black`} flex items-center justify-center sm:justify-start w-full font-[family-name:var(--font-gabarito)]`}>
            <div className='flex items-center gap-2 w-full px-1.5 text-xl'>
              <span className='text-2xl'><IoIosFlask /></span>
              {isOpen && <span className="text-base">Radiology</span>}
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
