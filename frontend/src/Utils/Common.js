import moment from "moment-timezone";

export const buildQueryParams = (params) => {
  return Object.entries(params)
    .filter(([_, value]) => value)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
};

export const DEFAULT_PAGE_LIMIT = 30;

export const PAGE_LIMIT_OPTIONS = [30, 50, 100];

export const getPageLimit = (searchParams) => {
  const limit = parseInt(searchParams.get("limit") || DEFAULT_PAGE_LIMIT, 10);
  return PAGE_LIMIT_OPTIONS.includes(limit) ? limit : DEFAULT_PAGE_LIMIT;
};

export const buildPaginationQuery = (searchParams, updates = {}) => {
  const params = new URLSearchParams(searchParams);
  const page = updates.page ?? params.get("page") ?? 1;
  const limit = updates.limit ?? params.get("limit") ?? DEFAULT_PAGE_LIMIT;

  params.set("page", page);
  params.set(
    "limit",
    PAGE_LIMIT_OPTIONS.includes(Number(limit)) ? Number(limit) : DEFAULT_PAGE_LIMIT,
  );

  return `?${params.toString()}`;
};

const EMPTY_RECORD = {};

export const getRecordForId = (record, id) =>
  record?.id === id ? record : EMPTY_RECORD;

export const getTodayDate = () => {
  return moment().tz("Asia/Karachi").format("YYYY-MM-DD");
};

export const toUtcISOString = (value) => value ? moment(value).toISOString() : value;

export const formatReadableDate = (value) => {
  if (!value) return "--";

  const date = moment(value);
  if (!date.isValid()) return "--";

  return date.tz("Asia/Karachi").format("ddd, DD MMM YYYY");
};


export const accountStatusOptions = [
  { value: "", label: "All" },
  { value: "Unpaid", label: "Unpaid" },
  { value: "Paid", label: "Paid" },
  { value: "Advance Paid", label: "Advance Paid" },
];

export const buyerStatusOptions = [
  ...accountStatusOptions.slice(0, 3),
  { value: "Partially Paid", label: "Partially Paid" },
  accountStatusOptions[3],
];

export const BILL_TYPES = Object.freeze({
  MAIN: "MAIN",
  B_PAIR: "B_PAIR",
});

export const STITCH_TYPES = Object.freeze({
  UNSTITCHED: "Unstitched",
  STITCHED: "Stitched",
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: "Cash",
});

//SAME VALUES AS THE SERVER (backend/enums/PackingStatus.js)
export const PACKING_STATUS = Object.freeze({
  NOT_PACKED: "Not Packed",
  PARTIALLY_PACKED: "Partially Packed",
  PACKED: "Packed",
});

export const STITCH_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All" },
  ...Object.values(STITCH_TYPES).map((stitchType) => ({
    value: stitchType,
    label: stitchType,
  })),
];

export const getStockOptionLabel = (item, quantity) =>
  [`${item.color} · ${item.stitch_type} (${quantity})`, item.sku]
    .filter(Boolean)
    .join(" · ");

export const getStatusVariant = (status) => {
  switch (status) {
    case "Paid":
    case "Completed":
    case "Sold":
    case "Approved":
      return "success";
    case "Partially Paid":
    case "Pending":
    case "Partially Sold":
      return "warning";
    case "Unpaid":
    case "UnSold":
    case "Rejected":
      return "danger";
    case "Advance Paid":
      return "primary";
    default:
      return "muted";
  }
};

export const getDateOnlyTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const formatAmount = (value) => `${Number(value || 0).toLocaleString()} Rs`;

export const toColorKey = (color) => String(color || "").trim().toLowerCase();

export const getAvailableColors = (availability) =>
  (availability?.byColor || []).filter((item) => item.available > 0);

export const getColorOptionLabel = (item) =>
  item.available === undefined ? item.color : `${item.color} (${item.available})`;

export const getColorLimitError = (availability, rows, quantityKey) => {
  const byColor = availability?.byColor || [];
  if (!byColor.length) return "";

  const requested = new Map();
  rows.forEach((row) => {
    const key = toColorKey(row.color);
    const entry = requested.get(key) || { color: row.color, quantity: 0 };
    entry.quantity += Number(row[quantityKey]) || 0;
    requested.set(key, entry);
  });

  for (const [key, entry] of requested) {
    const colorAvailability = byColor.find((item) => toColorKey(item.color) === key);
    if (!colorAvailability) return `${entry.color} was not received in previous step`;
    if (entry.quantity > colorAvailability.available) {
      return `Invalid quantity for ${colorAvailability.color}. Available quantity is ${colorAvailability.available}`;
    }
  }
  return "";
};
