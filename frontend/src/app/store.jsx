import { configureStore } from "@reduxjs/toolkit";
import authSlice from "../features/authSlice";
import ShopSlice from "../features/ShopSlice";
import PurchaseBillsSlice from "../features/PurchaseBillsSlice";
import InStockSlice from "../features/InStockSlice";
import EmbroiderySlice from "../features/EmbroiderySlice";
import CalenderSlice from "../features/CalenderSlice";
import CuttingSlice from "../features/CuttingSlice";
import stoneslice from "../features/stoneslice";
import stitching from "../features/stitching";
import AccountSlice from "../features/AccountSlice";
import DailySaleSlice from "../features/DailySaleSlice";
import BuyerSlice from "../features/BuyerSlice";
import GenerateBillSlice from "../features/GenerateBillSlice";
import SellerSlice from "../features/SellerSlice";
import CashInOutSlice from "../features/CashInOutSlice";
import ProcessBillSlice from "../features/ProcessBillSlice";
import DashboardSlice from "../features/DashboardSlice";
import B_pairSlice from "../features/B_pairSlice";
import ReturnSlice from "../features/ReturnSlice";
import OtherSale from "../features/OtherSale";
import PaymentMethodsSlice from "../features/PaymentMethodsSlice";
import CashBookSlice from "../features/CashBookSlice";
import OtherAccountsSlice from '../features/OtherAccountsSlice'
import PackingSlice from "../features/PackingSlice";



export const store = configureStore({
  reducer: {
    dashboard: DashboardSlice,
    auth: authSlice,
    Shop: ShopSlice,
    PurchaseBills: PurchaseBillsSlice,
    InStock: InStockSlice,
    Embroidery: EmbroiderySlice,
    Calender: CalenderSlice,
    Cutting: CuttingSlice,
    stone: stoneslice,
    stitching: stitching,
    Account: AccountSlice,
    DailySale: DailySaleSlice,
    Buyer: BuyerSlice,
    BuyerBills: GenerateBillSlice,
    Seller: SellerSlice,
    CashInOut: CashInOutSlice,
    ProcessBill: ProcessBillSlice,
    B_Pair:B_pairSlice,
    Return:ReturnSlice,
    OtherBills:OtherSale,
    PaymentMethods:PaymentMethodsSlice,
    CashBook:CashBookSlice,
    OtherAccounts:OtherAccountsSlice,
    Packing: PackingSlice,
  
  },
});