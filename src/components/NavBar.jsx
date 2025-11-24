import { useNavigate } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";
import { HiOutlineLogout } from "react-icons/hi";

export default function Navbar({ toggleSidebar, user, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          {/* Menu button */}
          <div>
            <button
              onClick={toggleSidebar}
              className="text-gray-700 hover:bg-gray-100 rounded-md p-2 border border-gray-200"
            >
              <HiMenuAlt2 className="text-2xl sm:text-3xl" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <HiOutlineLogout className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
