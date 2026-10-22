import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginuserAsync } from "../features/authSlice";
import { useDispatch, useSelector } from "react-redux";
import "./auth.css";
import { getAllPaymentMetodsForTransactionAsync } from "../features/PaymentMethodsSlice";
import { GetAllBranches } from "../features/InStockSlice";
import { useEffect } from "react";
import ButtonSpinner from "../Component/Common/button/ButtonSpinner";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // HANDLE SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginuserAsync(formData)).then((res) => {
      if (res?.payload?.login) {
        localStorage.setItem("isAuthenticated","true")
        dispatch(getAllPaymentMetodsForTransactionAsync());
        dispatch(GetAllBranches());
        navigate("/dashboard")
        setFormData({
          email: "",
          password: "",
        });
      }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(formData.email.trim());
    const isPasswordValid = formData.password.trim().length > 8;
    const formValid = isEmailValid && isPasswordValid;
    setIsFormValid(formValid);
  }, [formData]);

  return (
    <>
      <section className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
        <div className="flex flex-col items-center justify-center w-full max-w-4xl bg-white rounded-lg shadow-lg dark:bg-gray-800 dark:border dark:border-gray-700 md:flex-row overflow-hidden">
          {/* LEFT SECTION */}
          <div className="flex flex-col items-center justify-center bg-white text-gray-900 p-8 md:w-1/2">
            <h1 className="text-4xl font-semibold mb-4">NAILA ARTS</h1>
            <img
              src="https://cdn.shopify.com/s/files/1/0704/6378/2946/files/Untitled_design_2.png?v=1723727238"
              alt="Retail Management System"
              className="w-3/4 max-w-xs rounded-lg mb-6"
            />
            <p className="text-md uppercase font-bold text-center mb-2">
              The ultimate retail management system
            </p>
            <p className="text-sm text-gray-500">
              © 2025 NAILA ARTS. All rights reserved.
            </p>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8 md:w-1/2 mr-2">
            <div className="w-full max-w-md">
              <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md"
              >
                {/* EMAIL */}
                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="email"
                  >
                    Your email
                  </label>
                  <input
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    type="email"
                    id="email"
                    name="email"
                    placeholder="name@gmail.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>

                {/* TOGGLE PASSWORD VISIBILITY */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center">
                    <input
                      aria-describedby="remember"
                      className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-0 dark:bg-gray-700 dark:border-gray-600"
                      id="remember"
                      type="checkbox"
                      onChange={togglePasswordVisibility}
                    />
                    <label
                      className="ml-2 text-sm text-gray-500 dark:text-gray-300 select-none cursor-pointer"
                      htmlFor="remember"
                    >
                      Show password
                    </label>
                  </div>
                  <Link
                    to="/forget"
                    className="text-sm font-medium text-gray-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* BUTTON */}
                {loading ? (
                  <button
                    disabled
                    type="button"
                    className="w-full text-white cursor-not-allowed bg-gray-800 focus:outline-none font-medium rounded-md text-sm px-5 h-10 flex items-center gap-2 justify-center"
                  >
                    <ButtonSpinner />
                    Sign in
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className="w-full text-white bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70 font-medium rounded-md text-sm px-5 h-10 text-center"
                  >
                    Sign in
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Login;
