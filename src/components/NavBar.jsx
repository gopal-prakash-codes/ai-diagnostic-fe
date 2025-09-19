import { useState } from "react";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoMicOutline } from "react-icons/io5";
import { IoNotificationsOutline } from "react-icons/io5";
import { MdArrowDropDown } from "react-icons/md";
import { HiOutlineLogout } from "react-icons/hi";
import { Button } from "./UI";
import userImg from "../assets/avatar.png";

export default function Navbar({ toggleSidebar, user, logout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 sm:h-24 items-center">
          {/* Menu button */}
          <div>
            <button
              onClick={toggleSidebar}
              className="text-gray-600 hover:bg-gray-100 rounded-md p-2"
            >
              <HiMenuAlt2 className="text-3xl sm:text-4xl" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Ask AI Anything */}
            <Button className="hidden sm:flex bg-gradient-to-r from-green-400 to-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <IoMicOutline className="w-4 h-4" />
              Ask AI Anything
            </Button>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <IoNotificationsOutline className="w-5 sm:w-6 h-5 sm:h-6 text-gray-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>

            {/* User dropdown with image */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 focus:outline-none"
              >
                <img
                  src={userImg}
                  alt="Doctor"
                  className="w-7 sm:w-8 h-7 sm:h-8 rounded-full border"
                />
                <span className="text-sm text-gray-700 hidden sm:inline">
                  Dr. John Doe
                </span>
                <MdArrowDropDown className="w-5 h-5" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <HiOutlineLogout className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
