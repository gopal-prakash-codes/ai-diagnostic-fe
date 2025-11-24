import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getProfile, inviteMember } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUser, HiOutlineMail, HiOutlineUserGroup, HiOutlineX, HiCheck } from 'react-icons/hi';
import SidebarLayout from './SideBar';
import Navbar from './NavBar';
import { Modal } from './UI';

export default function ProfileDashboard() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [profile, setProfile] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviting, setInviting] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      if (response.success && response.data) {
        setProfile(response.data.user);
        setTeamMembers(response.data.teamMembers || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setInviting(true);
      const response = await inviteMember(inviteEmail.trim());
      if (response.success) {
        toast.success('Invitation sent successfully!');
        setInviteEmail('');
        setShowInviteForm(false);
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <SidebarLayout isOpen={isOpen}>
        <Navbar toggleSidebar={toggleSidebar} user={authUser} logout={logout} />
        <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout isOpen={isOpen}>
      <Navbar toggleSidebar={toggleSidebar} user={authUser} logout={logout} />
      
      <div className="h-[calc(100vh_-_96px)] bg-[#F8FAFC] p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-col gap-4 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-gabarito)]">Profile & Team</h1>
              <p className="text-gray-500 text-xs mt-0.5">Manage your account and team members</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-red-700 px-4 py-3 text-white font-semibold text-base rounded-t-lg">
              Your Profile
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white text-lg font-bold">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-gabarito)]">
                      {profile?.firstName} {profile?.lastName}
                    </h2>
                    {profile?.role === 'admin' && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded-full border border-red-200">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center text-gray-700 text-sm">
                      <HiOutlineMail className="w-3.5 h-3.5 mr-2 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{profile?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="bg-red-700 px-4 py-3 text-white font-semibold text-base rounded-t-lg flex items-center justify-between">
              <span>Team Members</span>
              <span className="text-xs font-normal opacity-90">
                {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-600">
                  Manage your organization members
                </p>
                {profile?.role === 'admin' && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-1.5 text-xs font-medium"
                  >
                    <HiOutlineUser className="w-3.5 h-3.5" />
                    <span>Invite Member</span>
                  </button>
                )}
              </div>

              {/* Invite Modal */}
              <Modal
                isOpen={showInviteForm}
                onClose={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                }}
                title="Invite Team Member"
              >
                <form onSubmit={handleInviteMember} className="space-y-3">
                  <div>
                    <label htmlFor="inviteEmail" className="block text-xs font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="inviteEmail"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                      autoFocus
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      An invitation email will be sent to this address
                    </p>
                  </div>
                  <div className="flex space-x-2 pt-1">
                    <button
                      type="submit"
                      disabled={inviting}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 text-sm font-medium"
                    >
                      {inviting ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <HiCheck className="w-3.5 h-3.5" />
                          <span>Send Invitation</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteEmail('');
                      }}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Modal>

              {/* Team Members List */}
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <HiOutlineUserGroup className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium text-sm mb-0.5">No team members yet</p>
                  {profile?.role === 'admin' && (
                    <p className="text-xs text-gray-500">Invite members to collaborate</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div
                      key={member._id || member.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-red-200 transition-all"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-white font-semibold text-xs">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap mb-0.5">
                            <span className="font-semibold text-sm text-gray-900 font-[family-name:var(--font-gabarito)]">
                              {member.firstName} {member.lastName}
                            </span>
                            {member.role === 'admin' && (
                              <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                                Admin
                              </span>
                            )}
                            {member.isActive === false && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {member.email}
                          </div>
                          {member.lastLogin && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              Last: {formatDate(member.lastLogin)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

