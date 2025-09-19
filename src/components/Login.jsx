import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { MdOutlineEmail } from 'react-icons/md';
import { RiLockPasswordLine } from 'react-icons/ri';
import doctorImg from "../assets/nurse.png"
import logo from "../assets/logo.png"
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

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.signupSuccess) {
      setSignupSuccess(true);
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
    if (error) setError('');
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
      email: true,
      password: true
    });
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const errors = {
      email: emailError,
      password: passwordError
    };

    setFieldErrors(errors);
    if (emailError || passwordError) {
      setError('Please fix the errors above');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser(formData.email, formData.password);
      login(response.user);
      toast.success('Successfully logged in!');
      navigate('/appointments');
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password &&
    !fieldErrors.email && !fieldErrors.password;

  return (
    <div className="flex ">
      {/* Left half: Image container */}
      <div className='p-6 w-1/2'>
        {/* <img
          src={doctorImg}
          alt="A female doctor smiling"
          className='w-full h-full object-fill '
        /> */}
        <img
          src={doctorImg}
          alt="A female doctor smiling"
          className=' '
        />
      </div>

      {/* Right half: Login form container */}
      <div className="flex items-center justify-center w-full p-20 lg:w-1/2">
        <div className="w-full  p-8 bg-white rounded-lg">
          {/* Logo and title */}
          <div className="flex flex-col items-center mb-6 text-center">
              <img src={logo} alt="Arogya AI Logo" />
            <h1 className="text-2xl mb-3 font-bold text-[#000000]">Arogya AI</h1>
            <p className="mb-3 text-xl text-[#000000] font-semibold">LOGIN WITH US</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-3 border-red-400 text-red-700 px-4 py-3 rounded-r-lg text-xs font-medium">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-md font-medium text-[#000000] sr-only">Email Address</label>
              <div className="relative border border-[#AFAFAF] rounded-lg">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={"w-full px-3 py-3 pl-13 pr-10 border rounded-lg shadow-sm placeholder-[#000000] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-gray-900"}
                  placeholder="Johndoe@gmail.com"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ">
                  <MdOutlineEmail className="text-2xl text-[#000000]" />
                </div>
                {touched.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {fieldErrors.email ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : formData.email ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
              </div>
              {touched.email && fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#000000] sr-only">Password</label>
              <div className="relative border border-[#AFAFAF] rounded-lg">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={"w-full px-3 py-3 pl-13 pr-20 border rounded-lg shadow-sm placeholder-[#000000] text-gray-900"} 
                  placeholder="*** *** ***"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <RiLockPasswordLine className="text-2xl text-[#000000]" />
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>
            <div className="mt-2 text-sm text-right">
              <a href="#" className=" text-[#000000] underline">Forgot Password</a>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`
                  w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isFormValid && !isLoading
                    ? 'bg-[#2EB4B4]'
                    : 'bg-[#2EB4B4] cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'LOGIN'
                )}
              </button>
            </div>
          </form>

          {/* Switch to Signup */}
          <div className="mt-4 text-md text-center">
            <p className="text-[#000000]">Don't have an account? <a href="/signup" className="font-semibold text-red-500 hover:text-red-600">Signup</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
