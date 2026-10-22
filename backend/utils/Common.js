import moment from "moment-timezone";
import { CashbookTransactionSource } from "../enums/cashbookk.enum.js";
import { Roles } from "../enums/Roles.js";
import { StitchType } from "../enums/StitchType.js";

export const getTodayDate = () => {
  return moment().tz("Asia/Karachi").format("YYYY-MM-DD");
};

export const getBusinessDateObject = (date, timezone = "Asia/Karachi") => {
  const businessDate = moment.tz(date, timezone);
  const currentTime = moment.tz(timezone);

  return businessDate
    .hour(currentTime.hour())
    .minute(currentTime.minute())
    .second(currentTime.second())
    .millisecond(currentTime.millisecond())
    .toDate();
};

export const buildDateRangeQuery = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return null;

  const from = dateFrom || dateTo;
  const to = dateTo || dateFrom;
  const [startDate, endDate] = [from, to].sort();

  return {
    $gte: startDate,
    $lte: endDate,
  };
};

export const DEFAULT_PAGE_LIMIT = 30;

export const PAGE_LIMIT_OPTIONS = [30, 50, 100];

export const getPaginationParams = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const requestedLimit = parseInt(query.limit, 10);
  const limit = PAGE_LIMIT_OPTIONS.includes(requestedLimit)
    ? requestedLimit
    : DEFAULT_PAGE_LIMIT;

  return { page, limit };
};

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const stockNameQuery = (value) => ({
  $regex: `^\\s*${escapeRegex(String(value ?? "").trim())}\\s*$`,
  $options: "i",
});

export const skuSearchQuery = (search) => ({
  sku: { $regex: escapeRegex(String(search).trim()), $options: "i" },
});

export const toStitchType = (value) => {
  const stitchType = value || StitchType.UNSTITCHED;
  if (!Object.values(StitchType).includes(stitchType)) {
    throw new Error("Invalid stitch type");
  }
  return stitchType;
};

export const stitchTypeQuery = (stitchType) =>
  stitchType === StitchType.STITCHED
    ? StitchType.STITCHED
    : { $ne: StitchType.STITCHED };

export const verifyPastDate = (date) => {
  const futureDate = moment.tz(date, "Asia/Karachi").startOf("day");
  const now = moment.tz("Asia/Karachi").startOf("day");
  const isFutureDate = futureDate.isAfter(now);
  if (isFutureDate) {
    throw new Error("Date cannot be in the future");
  }
  const pastDate = futureDate.isBefore(now);
  return pastDate;
};

export const canDeleteRecord = (data) => {
  const { role, date, transactionFrom, cashBookCase = true } = data;
  if (!role || !date || !transactionFrom) throw new Error("Missing arguments");
  const threshold = new Date("2026-01-23T00:00:00.000Z");
  if (cashBookCase) {
    return (
      role === Roles.SUPER_ADMIN &&
      new Date(date) >= threshold &&
      [
        CashbookTransactionSource.CASH_IN,
        CashbookTransactionSource.CASH_OUT,
      ].includes(transactionFrom)
    );
  } else if (!cashBookCase) {
    if(transactionFrom === CashbookTransactionSource.BUYERS){
      return role === Roles.SUPER_ADMIN && new Date(date) >= threshold;
    }
  }
};
