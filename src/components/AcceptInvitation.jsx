import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getInvitationByToken, acceptInvitation, loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Eye = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOff = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const Stethoscope = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26 2.438.775 2.413 1.073" />
  </svg>
);

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await getInvitationByToken(token);
      if (response.success && response.data) {
        setInvitation(response.data.invitation);
        // Prefill email is already in invitation object
      } else {
        toast.error('Invalid or expired invitation');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast.error(error.message || 'Invalid or expired invitation');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const validateName = (name, fieldName) => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[A-Za-z\s]+$/.test(name.trim())) return `${fieldName} can only contain letters and spaces`;
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    const fieldError = name === 'firstName' ? validateName(value, 'First name') :
                      name === 'lastName' ? validateName(value, 'Last name') :
                      name === 'password' ? validatePassword(value) :
                      name === 'confirmPassword' ? validateConfirmPassword(value, formData.password) : '';

    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));

    if (name === 'password' && formData.confirmPassword) {
      const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, value);
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: confirmPasswordError
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      firstName: true,
      lastName: true,
      password: true,
      confirmPassword: true
    });

    const firstNameError = validateName(formData.firstName, 'First name');
    const lastNameError = validateName(formData.lastName, 'Last name');
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    const errors = {
      firstName: firstNameError,
      lastName: lastNameError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    };

    setFieldErrors(errors);

    if (firstNameError || lastNameError || passwordError || confirmPasswordError) {
      toast.error('Please fix the errors above');
      return;
    }

    setSubmitting(true);

    try {
      // Accept invitation (creates user as member with role 'user', not admin)
      const response = await acceptInvitation(
        token,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      if (response.success) {
        // Check if user was just created or already existed
        const userData = response.data?.user;
        
        if (userData) {
          toast.success('Account created successfully! Logging you in...');

          // Automatically log in the newly created user
          try {
            const loginResponse = await loginUser(
              invitation.email,
              formData.password
            );

            if (loginResponse.token && loginResponse.user) {
              login(loginResponse.user);
              localStorage.setItem('authToken', loginResponse.token);
              localStorage.setItem('user', JSON.stringify(loginResponse.user));
              
              toast.success('Welcome! You have been added to the organization as a member.');
              navigate('/patient-record');
              return;
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            toast.info('Account created! Please log in with your credentials.');
            navigate('/login', { state: { email: invitation.email } });
            return;
          }
        } else {
          // User already existed and was added to organization
          toast.success('You have been added to the organization! Please log in.');
          navigate('/login', { state: { email: invitation.email } });
        }
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isFormValid = formData.firstName && formData.lastName && formData.password && 
                     formData.confirmPassword && !fieldErrors.firstName && !fieldErrors.lastName &&
                     !fieldErrors.password && !fieldErrors.confirmPassword;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-full shadow-md border border-gray-200">
              <Stethoscope className="w-7 h-7 text-gray-700" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Accept Invitation
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join {invitation.organization?.name || 'an organization'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Email: {invitation.email}
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white py-6 px-6 shadow-sm rounded-xl border border-gray-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-800 mb-2">
                First Name
              </label>
              <div className="relative">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-3 pr-10 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-gray-900 ${
                    touched.firstName && fieldErrors.firstName
                      ? 'border-red-300 focus:ring-red-200 bg-red-50'
                      : touched.firstName && !fieldErrors.firstName && formData.firstName
                      ? 'border-green-400 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:ring-gray-200 hover:border-gray-400'
                  }`}
                  placeholder="John"
                />
                {touched.firstName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {fieldErrors.firstName ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : formData.firstName ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
              {touched.firstName && fieldErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-800 mb-2">
                Last Name
              </label>
              <div className="relative">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-3 pr-10 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-gray-900 ${
                    touched.lastName && fieldErrors.lastName
                      ? 'border-red-300 focus:ring-red-200 bg-red-50'
                      : touched.lastName && !fieldErrors.lastName && formData.lastName
                      ? 'border-green-400 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:ring-gray-200 hover:border-gray-400'
                  }`}
                  placeholder="Doe"
                />
                {touched.lastName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {fieldErrors.lastName ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : formData.lastName ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
              {touched.lastName && fieldErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-3 pr-20 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-gray-900 ${
                    touched.password && fieldErrors.password
                      ? 'border-red-300 focus:ring-red-200 bg-red-50'
                      : touched.password && !fieldErrors.password && formData.password
                      ? 'border-green-400 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:ring-gray-200 hover:border-gray-400'
                  }`}
                  placeholder="Create a strong password"
                />
                {touched.password && (
                  <div className="absolute inset-y-0 right-10 pr-2 flex items-center">
                    {fieldErrors.password ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : formData.password ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-3 pr-20 border rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-gray-900 ${
                    touched.confirmPassword && fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200 bg-red-50'
                      : touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword
                      ? 'border-green-400 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:ring-gray-200 hover:border-gray-400'
                  }`}
                  placeholder="Confirm your password"
                />
                {touched.confirmPassword && (
                  <div className="absolute inset-y-0 right-10 pr-2 flex items-center">
                    {fieldErrors.confirmPassword ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : formData.confirmPassword ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className={`
                  w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 focus:outline-none
                  ${isFormValid && !submitting
                    ? 'bg-[#FAFAFA] text-[#172B4C] border border-gray-200 hover:bg-gray-100'
                    : 'bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }
                `}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Accept Invitation & Create Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

