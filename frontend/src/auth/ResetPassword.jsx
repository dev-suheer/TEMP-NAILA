import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassAsync } from "../features/authSlice";
import { useDispatch, useSelector } from "react-redux";
import "./auth.css";
import toast from "react-hot-toast";
import ButtonSpinner from "../Component/Common/button/ButtonSpinner";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { loading } = useSelector((state) => state.auth);
  const id = useSelector((state) => state.auth.userId);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const { password, confirmPassword } = formData;

  const [passwordValid, setPasswordValid] = useState({
    minLength: false,
    hasSymbol: false,
    hasUpperLower: false,
    passwordsMatch: false,
  });

  const handlePasswordChange = (name, value) => {
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    if (name === "password") {
      const minLength = value.length >= 8;
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const hasUpperLower = /[a-z]/.test(value) && /[A-Z]/.test(value);

      setPasswordValid((prev) => ({
        ...prev,
        minLength,
        hasSymbol,
        hasUpperLower,
        passwordsMatch: value === updatedFormData.confirmPassword,
      }));
    }

    if (name === "confirmPassword") {
      setPasswordValid((prev) => ({
        ...prev,
        passwordsMatch: updatedFormData.password === value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordValid.passwordsMatch) {
      const resetPassword = password;
      try {
        await dispatch(resetPassAsync({ id, resetPassword })).then((res) => {
          if (res.payload.message === "Password Updated") {
            navigate("/");
            setFormData({
              password: "",
              confirmPassword: "",
            });
          }
        });
      } catch (error) {
        console.error("Error resetting password:", error);
      }
    } else {
      toast.error("Passwords do not match");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <section className="bg">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
        <div className="flex items-center mb-6 text-4xl font-semibold tracking-wider text-gray-100 dark:text-white">
          NAILA ARTS
        </div>
        <div className="w-full bg-white rounded-lg shadow dark:border sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Reset Password
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Password */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Password:
                </label>
                <input
                  className="bg-gray-50 border text-gray-900 sm:text-sm rounded-lg focus:ring-0 focus:border-gray-300 block w-full p-2.5"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    handlePasswordChange("password", e.target.value)
                  }
                  required
                />
                <div className="mt-4">
                  <p
                    className={`text-sm ${
                      passwordValid.minLength
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    ✔ Must be at least 8 characters
                  </p>
                  <p
                    className={`text-sm ${
                      passwordValid.hasSymbol
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    ✔ Must contain a special character (e.g., @, #, $)
                  </p>
                  <p
                    className={`text-sm ${
                      passwordValid.hasUpperLower
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    ✔ Must contain uppercase and lowercase letters
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Confirm Password:
                </label>
                <input
                  className="bg-gray-50 border text-gray-900 sm:text-sm rounded-lg focus:ring-0 focus:border-gray-300 block w-full p-2.5"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) =>
                    handlePasswordChange("confirmPassword", e.target.value)
                  }
                  required
                />
                <p
                  className={`mt-2 text-sm ${
                    passwordValid.passwordsMatch
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {passwordValid.passwordsMatch
                    ? "✔ Passwords match"
                    : "✖ Passwords do not match"}
                </p>
              </div>

              {/* Toggle Password Visibility */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  onChange={togglePasswordVisibility}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-500">
                  Show Password
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  !passwordValid.minLength ||
                  !passwordValid.hasSymbol ||
                  !passwordValid.hasUpperLower ||
                  !passwordValid.passwordsMatch ||
                  loading
                }
                className={`flex w-full items-center justify-center gap-2 text-white font-medium rounded-md text-sm px-5 py-2.5 ${
                  passwordValid.minLength &&
                  passwordValid.hasSymbol &&
                  passwordValid.hasUpperLower &&
                  passwordValid.passwordsMatch
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {loading && <ButtonSpinner />}
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
