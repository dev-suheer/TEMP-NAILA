import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgetuserAsync } from "../features/authSlice";
import { useDispatch, useSelector } from "react-redux";
import "./auth.css";
import ButtonSpinner from "../Component/Common/button/ButtonSpinner";

const ForgetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
  });

  const { ForgetPassloading } = useSelector((state) => state.auth);

  console.log(ForgetPassloading);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgetuserAsync(formData)).then((res) => {
      if (res.payload.message === "OTP has been sent to your email") {
        navigate("/otp");
        setFormData({
          email: "",
        });
      }
    });
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
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                Forget Password
              </h1>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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

                {ForgetPassloading ? (
                  <button
                    disabled
                    type="button"
                    className="text-white cursor-not-allowed bg-gray-500  font-medium rounded text-sm px-5 py-2.5 text-center mx-auto flex items-center gap-2 justify-center w-full"
                  >
                    <ButtonSpinner />
                    Submit
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full text-white bg-gray-900 hover:bg-gray-700  focus:outline-none font-medium rounded-md text-sm px-5 h-10 text-center"
                  >
                    Submit
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

export default ForgetPassword;
