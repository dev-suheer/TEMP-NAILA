
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import  MongoDBStore  from "connect-mongodb-session";
import session from "express-session";
import userRouter from "./routes/UserRoutes.js";
import branchRouter from "./routes/BranchRoutes.js";
import baseRouter from "./routes/Stock/BaseRoutes.js";
import suitsRouter from "./routes/Stock/SuitsRoutes.js";
import laceRouter from "./routes/Stock/LaceRoutes.js";
import bagsAndBoxRouter from "./routes/Stock/BagsAndBoxRoutes.js";
import accessoriesRouter from "./routes/Stock/AccesssoriesRoutes.js";
import expenseRouter from "./routes/Stock/ExpenseRoutes.js";
import embrioderyRouter from "./routes/Process/EmbroideryRoutes.js";
import calenderRouter from "./routes/Process/CalenderRoutes.js";
import cuttingRouter from "./routes/Process/CuttingRoutes.js";
import stoneRouter from "./routes/Process/StoneRoutes.js";
import stitchingRouter from "./routes/Process/StitchingRoutes.js";
import employRouter from "./routes/EmployRoutes.js";
import dailySaleRouter from "./routes/DailySaleRoutes.js";
import buyerRouter from "./routes/BuyersRoutes.js";
import cashInOutRouter from "./routes/CashInOutRoutes.js";
import sellerRouter from "./routes/Sellers/SellerRoutes.js";
import processBillRouter from "./routes/Process/ProcessBillRoutes.js";
import dashboardRouter from "./routes/Dashboard Data/DashboardRoutes.js";
import b_PairRouter from "./routes/Process/B_PairRoutes.js";
import returnRouter from "./routes/Returns/ReturnRoutes.js";
import pictureRouter from "./routes/Process/PictureRoutes.js";
import packingRouter from "./routes/Process/PackingRoutes.js";
import { AppErrorHandler } from './config/exceptionHandlers/handler.js';
import checkRouter from "./routes/Checks/CheckRoutes.js";
import otherSaleRouter from "./routes/OtherSaleRoutes.js";
import paymentMethodRouter from "./routes/PaymentMethods/PaymentMethodRoutes.js";
import cashBookRouter from "./routes/CashBook/CashBookRoutes.js";
import otherAccountsRouter from "./routes/OtherAccounts/OtherAccountsRoutes.js";
import { scheduler } from "./jobs/scheduler.js";

const app = express();
app.use(cookieParser());
app.use(cors({
    credentials:true,
    origin:['http://localhost:5173']
  }));

app.use(express.json({limit:'5mb'}));
const MongoDBStoreSession = MongoDBStore(session);

const store = new MongoDBStoreSession({
  uri: process.env.MONGODB_URI,
  collection: 'sessions'
});


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: false,
    store:store,
    cookie:{
      secure: 'auto',
      httpOnly:true,
      maxAge:1000 * 60 * 60 * 12,
    }
  }));

  app.use("/api/users",userRouter);
  app.use("/api/branches",branchRouter);
  app.use("/api/stock/base",baseRouter);
  app.use("/api/stock/suits",suitsRouter);
  app.use("/api/stock/lace",laceRouter);
  app.use("/api/stock/bags",bagsAndBoxRouter);
  app.use("/api/stock/accessories",accessoriesRouter);
  app.use("/api/stock/expense",expenseRouter);
  app.use("/api/process/embriodery",embrioderyRouter);
  app.use("/api/process/calender",calenderRouter);
  app.use("/api/process/cutting",cuttingRouter);
  app.use("/api/process/stone",stoneRouter);
  app.use("/api/process/stitching",stitchingRouter);
  app.use("/api/employ",employRouter);
  app.use("/api/dailysale",dailySaleRouter);
  app.use("/api/buyers",buyerRouter);
  app.use("/api/cashInOut",cashInOutRouter);
  app.use("/api/sellerRouter",sellerRouter);
  app.use("/api/processBillRouter",processBillRouter);
  app.use("/api/dashboardRouter",dashboardRouter);
  app.use("/api/b_PairRouter",b_PairRouter);
  app.use("/api/returns",returnRouter);
  app.use("/api/process/pictures",pictureRouter);
  app.use("/api/process/packing",packingRouter);
  app.use("/api/buyers/checks",checkRouter);
  app.use("/api/otherSale",otherSaleRouter);
  app.use("/api/paymentMethods",paymentMethodRouter);
  app.use("/api/cashBook",cashBookRouter);
  app.use("/api/otheraccounts",otherAccountsRouter)

  app.use(AppErrorHandler);
  scheduler();
 
mongoose
.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("Database Connected");
    app.listen(process.env.PORT,console.log(`Server is running on http://localhost:${process.env.PORT}`))
})
.catch((error)=>{
    console.log('something went wrong',error)
});
