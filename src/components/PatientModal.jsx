import React, { useState } from 'react';
import { Button } from './UI';

// Icon components
const X = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const User = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Calendar = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Phone = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Mail = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MapPin = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PatientModal = ({ isOpen, onClose, patient, onSave, simpleMode = false }) => {
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    age: patient?.age || '',
    gender: patient?.gender || '',
    phone: patient?.phone || '',
    email: patient?.email || '',
    address: patient?.address || '',
    emergencyContact: patient?.emergencyContact || '',
    bloodGroup: patient?.bloodGroup || '',
    allergies: patient?.allergies || [],
    medicalHistory: patient?.medicalHistory || ''
  });

  const [newAllergy, setNewAllergy] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (allergyToRemove) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(allergy => allergy !== allergyToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#FAFAFA] px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#FAFAFA] border border-gray-200 rounded-full flex items-center justify-center">
              <span className="text-[#172B4C] text-lg font-bold">
                {formData.name ? getInitials(formData.name) : <User className="w-6 h-6" />}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {patient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <p className="text-gray-600 text-sm">
                {patient ? 'Update patient information' : 'Create a new patient record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200 border border-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {simpleMode ? (
            // Simple mode - only basic fields
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#172B4C]" />
                  Patient Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                        placeholder="Age"
                        min="1"
                        max="150"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Personal Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#172B4C]" />
                  Personal Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      placeholder="Enter patient's full name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                        placeholder="Age"
                        min="0"
                        max="120"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-[#172B4C]" />
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      placeholder="Enter address"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                      placeholder="Emergency contact number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Medical Information */}
            <div className="space-y-6">
              {/* Allergies */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-[#172B4C]" />
                  Allergies
                </h3>
                
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                      placeholder="Add allergy"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                    />
                    <Button
                      type="button"
                      onClick={handleAddAllergy}
                      className="px-4 py-2 bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-[#172B4C]" />
                  Medical History
                </h3>
                
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                  placeholder="Enter relevant medical history, chronic conditions, previous surgeries, etc."
                  rows="8"
                />
              </div>
            </div>
          </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              {patient ? 'Update Patient' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientModal;
