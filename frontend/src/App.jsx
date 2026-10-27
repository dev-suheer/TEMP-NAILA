import { useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authUserAsync, logoutUserAsync } from "./features/authSlice";
import { LoginProtected, UserProtected } from "./Component/Protected/Protected";
import axios from "axios";
import './App.css';
import Login from "./auth/Login";
import ForgetPassword from "./auth/ForgetPassword";
import ResetPassword from "./auth/ResetPassword";
import OtpChecker from "./auth/OtpChecker";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardStats from "./pages/dashboard/DashboardStats";
import SuitsStock from "./pages/inStock/suits/SuitsStock";
import Base from "./pages/inStock/base/Base";
import Lace from "./pages/inStock/lace/Lace";
import Accessories from "./pages/inStock/accessories/Accessories";
import Bag from "./pages/inStock/bag/Bag";
import Expense from "./pages/inStock/expense/Expense";
import ExpenseStats from "./pages/inStock/expense/ExpenseStats";
import AssignStock from "./pages/inStock/assignstocks/AssignStock";
import AssignedStockHistory from "./pages/inStock/assignstocks/AssignedStockHistory";
import PurchaseBills from "./pages/bills/PurchaseBills";
import ProcessBills from "./pages/bills/ProcessBills";
import ProcessDetails from "./pages/bills/ProcessDetails";
import NailaArtsBuyer from "./pages/bills/NailaArtsBuyer";
import BuyerReturn from "./pages/bills/BuyerReturn";
import OtherSaleBills from "./pages/bills/OtherSaleBills";
import GenerateBill from "./pages/generateBills/GenerateBill";
import OldBuyerGenerateBill from "./pages/generateBills/OldBuyerGenerateBill";
import AccountsDashboard from "./pages/accounts/AccountsDashboard";
import Buyers from "./pages/accounts/Buyers";
import BuyersDetails from "./pages/accounts/BuyersDetails";
import BuyersChecks from "./pages/checks/BuyerChecks";
import Sellers from "./pages/accounts/Sellers";
import SellersDetails from "./pages/accounts/SellersDetails";
import OtherAccounts from "./pages/accounts/OtherAccounts/OtherAccounts";
import OtherAccountsDetails from "./pages/accounts/OtherAccounts/OtherAccountDetails";
import CashInOut from "./pages/cash/CashInOut";
import CashBook from "./pages/cashBook/CashBook";
import DailySale from "./pages/dailySale/DailySale";
import DailySaleDetail from "./pages/dailySale/DailySaleDetail";
import ProcessAnalytics from "./pages/process/ProcessAnalytics";
import Embroidery from "./pages/process/embroidery/Embroidery";
import EmbroideryDetails from "./pages/process/embroidery/EmbroideryDetails";
import UpdateEmbroidery from "./pages/process/embroidery/UpdateEmbroidery";
import Calendar from "./pages/process/calendar/Calendar";
import CalendarDetails from "./pages/process/calendar/CalendarDetails";
import Cutting from "./pages/process/cutting/Cutting";
import CuttingDetails from "./pages/process/cutting/CuttingDetails";
import Stitching from "./pages/process/stitching/Stitching";
import StitchingDetails from "./pages/process/stitching/StitchingDetails";
import Stones from "./pages/process/stones/Stones";
import StonesDetails from "./pages/process/stones/StonesDetails";
import PackingDetails from "./pages/process/Packing/PackingDetails";
import Packings from "./pages/process/Packing/Packings";
import B_Pair from "./pages/process/b_pair/B_Pair";
import BPairGenerateBill from "./pages/process/b_pair/BPairGenerateBill";
import VerifyOTP from "./pages/dashboard/VerifyOTP";
import Shop from "./pages/Shop/Shop";
import PendingRequest from "./pages/Shop/PendingRequest";
import PaymentMethods from "./pages/paymentMethods/PaymentMethods";
import Employee from "./pages/employe/Employee";
import EmployeeDetails from "./pages/employe/EmployeeDetails";
import Attendance from "./pages/employe/Attendance";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    axios.defaults.timeout = 5 * 60 * 1000;
    axios.defaults.withCredentials = true;

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401 && !isLoggingOutRef.current) {
          isLoggingOutRef.current = true;
          dispatch(logoutUserAsync()).then((res) => {
            isLoggingOutRef.current = false;
            if (res.payload?.success) {
              navigateRef.current("/");
            }
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(authUserAsync()).then((res) => {
        if (res.payload === undefined) {
          navigate("/");
          dispatch(logoutUserAsync());
        }
      });
    }
  }, [dispatch, isAuthenticated]);

  return (
    <>
      <Routes>
        {/* AUTH ROUTE */}
        <Route path="/" element={<LoginProtected><Login /></LoginProtected>} />
        <Route path="/forget" element={<LoginProtected><ForgetPassword /></LoginProtected>} />
        <Route path="/reset" element={<LoginProtected><ResetPassword /></LoginProtected>} />
        <Route path="/otp" element={<LoginProtected><OtpChecker /></LoginProtected>} />

        {/* DASHBOARD ROUTE */}
        <Route path="/dashboard" element={<UserProtected><Dashboard /></UserProtected>}>
          <Route index element={<DashboardStats />} />
          <Route path="suits" element={<SuitsStock />} />
          <Route path="base" element={<Base />} />
          <Route path="lace" element={<Lace />} />
          <Route path="bag" element={<Bag />} />
          <Route path="accessories" element={<Accessories />} />
          <Route path="expense" element={<Expense />} />
          <Route path="expense-stats" element={<ExpenseStats />} />
          <Route path="assignstocks" element={<AssignStock />} />
          <Route path="AssignedStockHistory" element={<AssignedStockHistory />} />
          <Route path="generate-bill" element={<GenerateBill />} />
          <Route path="old-buyer-generate-bill/:id" element={<OldBuyerGenerateBill />} />
          <Route path="purchasebills" element={<PurchaseBills />} />
          <Route path="processbills" element={<ProcessBills />} />
          <Route path="process-details/:id/:category" element={<ProcessDetails />} />
          <Route path="naila-arts-buyer" element={<NailaArtsBuyer />} />
          <Route path="buyer-return/:buyerId" element={<BuyerReturn />} />
          <Route path="other-sale" element={<OtherSaleBills />} />
          <Route path="accounts-dashboard" element={<AccountsDashboard />} />
          <Route path="buyers" element={<Buyers />} />
          <Route path="buyers-checks/:id" element={<BuyersChecks />} />
          <Route path="buyers-details/:id" element={<BuyersDetails />} />
          <Route path="sellers" element={<Sellers />} />
          <Route path="sellers-details/:id" element={<SellersDetails />} />
          <Route path="employee" element={<Employee />} />
          <Route path="employee-details/:id" element={<EmployeeDetails />} />
          <Route path="other-accounts" element={<OtherAccounts />} />
          <Route path="other-accounts/:id" element={<OtherAccountsDetails />} />
          <Route path="cash" element={<CashInOut />} />
          <Route path="dailySale" element={<DailySale />} />
          <Route path="dailySale-details/:id" element={<DailySaleDetail />} />
          <Route path="process-analytics" element={<ProcessAnalytics />} />
          <Route path="embroidery" element={<Embroidery />} />
          <Route path="embroidery-details/:id" element={<EmbroideryDetails />} />
          <Route path="embroidery-update/:id" element={<UpdateEmbroidery />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="calendar-details/:id" element={<CalendarDetails />} />
          <Route path="cutting" element={<Cutting />} />
          <Route path="cutting-details/:id" element={<CuttingDetails />} />
          <Route path="stitching" element={<Stitching />} />
          <Route path="stitching-details/:id" element={<StitchingDetails />} />
          <Route path="stones" element={<Stones />} />
          <Route path="stones-details/:id" element={<StonesDetails />} />
          <Route path="packing-details/:id" element={<PackingDetails />} />
          <Route path="packings" element={<Packings />} />
          <Route path="bpair" element={<B_Pair />} />
          <Route path="bpair-bill" element={<BPairGenerateBill />} />
          <Route path="bpair-bill/:id" element={<BPairGenerateBill />} />
          <Route path="cash-book" element={<CashBook />} />
          <Route path="verifyOtp" element={<VerifyOTP />} />
          <Route path="Shop" element={<Shop />} />
          <Route path="PendingRequest" element={<PendingRequest />} />
          <Route path="paymentMethods" element={<PaymentMethods />} />
          <Route path="employee-attendance" element={<Attendance />} />
        </Route>

        {/* WILD CARD */}
        <Route path="*" element={<Navigate to={"/"} />} />
      </Routes>

      <Toaster position="top-right" reverseOrder={false} />
    </>
  );
}

export default App;
