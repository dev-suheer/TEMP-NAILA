import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createuserAsync } from "../features/authSlice";

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [passwordValid, setPasswordValid] = useState({
    minLength: false,
    hasSymbol: false,
    hasUpperLower: false,
  });

  const handlePasswordChange = (password) => {
    const minLength = password.length >= 8;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);

    setPasswordValid({ minLength, hasSymbol, hasUpperLower });
    setFormData({ ...formData, password });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    dispatch(createuserAsync(formData)).then((res) => {
      if (res.payload.message === "Sign Up Successful!") {
        setFormData({
          name: "",
          email: "",
          password: "",
        });
        navigate("/");
      }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <section className="bg">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
          <div className="flex items-center mb-6 text-4xl font-semibold tracking-wider text-gray-100 dark:text-white">
            NAILA ARTS
          </div>
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* NAME */}
                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="name"
                  >
                    Your name
                  </label>
                  <input
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-black dark:focus:border-black"
                    type="name"
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="email"
                  >
                    Your email
                  </label>
                  <input
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-black focus:border-black block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-black dark:focus:border-black"
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
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-black focus:border-black block w-full p-2.5"
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
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

                {/* TOGGLE PASSWORD VISIBILITY */}
                <div className="flex items-start">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        aria-describedby="remember"
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-0 dark:bg-gray-700 dark:border-gray-600"
                        id="remember"
                        type="checkbox"
                        onChange={togglePasswordVisibility}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        className="text-gray-500 dark:text-gray-300 select-none cursor-pointer"
                        htmlFor="remember"
                      >
                        show password
                      </label>
                    </div>
                  </div>
                </div>

           
                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={
                    !passwordValid.minLength ||
                    !passwordValid.hasSymbol ||
                    !passwordValid.hasUpperLower ||
                    loading
                  }
                  className={`w-full text-white font-medium rounded-md text-sm px-5 py-2.5 ${
                    passwordValid.minLength &&
                    passwordValid.hasSymbol &&
                    passwordValid.hasUpperLower
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Loading..." : "Create an account"}
                </button>

                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    to="/"
                    className="font-medium text-gray-800 hover:underline "
                  >
                    Login here
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Signup;
