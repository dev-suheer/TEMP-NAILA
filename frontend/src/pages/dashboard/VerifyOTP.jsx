import { useEffect, useState ,useRef} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "../../auth/auth.css";
import {
  sendDashBoardAccessOTPAsync,
  verifyOtpForDasboardDataAsync,
} from "../../features/DashboardSlice";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const VerifyOTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { otpLoading } = useSelector((state) => state?.dashboard);
  const { user } = useSelector((state) => state.auth);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const endTime = localStorage.getItem("dashboardTimer");
      if (endTime) {
        const now = new Date().getTime();
        const timeLeft = Math.max(endTime - now, 0);
        setTimer(timeLeft);
        if (timeLeft === 0) {
          localStorage.removeItem("dashboardTimer");
        }
      }
    };
    const timeInterval = setInterval(updateTime, 1000);
    updateTime();
    return () => clearInterval(timeInterval);
  }, []);

  const [formData, setFormData] = useState({
    otp: "",
    userId: user?.user?.id,
  });

  const [otpData, setOtpData] = useState({
    first: "",
    second: "",
    third: "",
    fourth: "",
  });

  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const thirdRef = useRef(null);
  const fourthRef = useRef(null);

  const handleChange = (e,nextInput,previousInput) => {
    e.preventDefault();
    const { name, value } = e.target;
    if(value.length === 1 && nextInput){
        nextInput.current.focus();
    };
    if( value === "" && previousInput){
        previousInput.current.focus();
    }
    setOtpData((prev) => {
      const newOtpData = {
        ...prev,
        [name]: value,
      };

      setFormData((prev) => ({
        ...prev,
         otp: `${newOtpData.first}${newOtpData.second}${newOtpData.third}${newOtpData.fourth}`,
      }));
      return newOtpData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(verifyOtpForDasboardDataAsync(formData)).then((res) => {
      if (res?.payload?.OtpVerified === true) {
        const endTime = new Date().getTime() + 60 * 60 * 1000;
        localStorage.setItem("dashboardAccessTime", endTime);
        localStorage.removeItem("dashboardTimer");
        navigate("/dashboard");
      }
    });
  };

  const resendOTP = (e) => {
    e.preventDefault();
    dispatch(sendDashBoardAccessOTPAsync()).then(() => {
      const endTime = new Date().getTime() + 1 * 60 * 1000;
      localStorage.setItem("dashboardTimer", endTime);
      setOtpData({
        first: "",
        second: "",
        third: "",
        fourth: "",
      })
    });
  };

  return (
    <>
      <section >
        <div className="flex flex-col items-center bottom-4 border-r-slate-900 justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
          <div className="w-full bg-white border-4 rounded-lg   border-red-600 shadow dark:border md:mt-0 sm:max-w-md xl:p-0 ">
            <div className="p-6 items-center space-y-4 md:space-y-6 sm:p-8">
              <div className="unauthorized text-center space-y-4 md:space-y-6 sm:p-4 text-4xl font-semibold tracking-wider text-red-600">
                VERIFY OTP
              </div>
              <div className="space-y-4 md:space-y-6">
                <div className="max-w-md mx-auto border mt-6 rounded">
                  <form onSubmit={handleSubmit} className="shadow-md px-4 py-3">
                    <div className="flex justify-center gap-2 mb-6">
                      <input
                        className="w-12 h-12 text-center border rounded-md shadow-sm focus:border-[#545964] focus:ring-[#545964]"
                        type="text"
                        name="first"
                        maxLength={1}
                        pattern="[0-9]"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        onChange={(e) => handleChange(e,secondRef)}
                        value={otpData.first}
                        ref={firstRef}
                      />
                      <input
                        className="w-12 h-12 text-center border rounded-md shadow-sm focus:border-[#545964] focus:ring-[#545964]"
                        type="text"
                        name="second"
                        maxLength={1}
                        pattern="[0-9]"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        onChange={(e) => handleChange(e,thirdRef,firstRef)}
                        value={otpData.second}
                        ref={secondRef}
                      />
                      <input
                        className="w-12 h-12 text-center border rounded-md shadow-sm focus:border-[#545964] focus:ring-[#545964]"
                        type="text"
                        name="third"
                        maxLength={1}
                        pattern="[0-9]"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        onChange={(e) => handleChange(e,fourthRef,thirdRef)}
                        value={otpData.third}
                        ref={thirdRef}
                      />
                      <input
                        className="w-12 h-12 text-center border rounded-md shadow-sm focus:border-[#545964] focus:ring-[#545964]"
                        type="text"
                        name="fourth"
                        maxLength={1}
                        pattern="[0-9]"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        onChange={(e) => handleChange(e,null,thirdRef)}
                        value={otpData.fourth}
                        ref={fourthRef}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      {otpLoading ? (
                        <button
                          disabled
                          className="inline-flex items-center justify-center gap-2 bg-green-300 cursor-not-allowed text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                          <ButtonSpinner />
                          Verify
                        </button>
                      ) : (
                        <button
                          className="bg-[#6CD572] hover:bg-green-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          type="submit"
                        >
                          Verify
                        </button>
                      )}

                      {timer === 0 ? (
                        <button
                          style={{ minWidth: "135px" }}
                          className="inline-block align-baseline font-bold text-sm text-[#6CD572] hover:text-green-400 ml-4"
                          type="button"
                          onClick={resendOTP}
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <div
                          style={{ minWidth: "135px" }}
                          className="inline-block align-baseline font-bold text-sm  ml-4 text-red-600"
                        >
                          Resend OTP in : {Math.round(timer / 1000)}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default VerifyOTP;
