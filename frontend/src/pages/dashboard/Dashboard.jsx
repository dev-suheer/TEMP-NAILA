import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  IoBagHandleOutline,
  IoBookOutline,
  IoBriefcaseOutline,
  IoCashOutline,
  IoChevronDown,
  IoColorPaletteOutline,
  IoCubeOutline,
  IoGridOutline,
  IoLayersOutline,
  IoLogOutOutline,
  IoPeopleOutline,
  IoReceiptOutline,
  IoCutOutline,
  IoSettingsOutline,
  IoStatsChartOutline,
  IoStorefrontOutline,
  IoWalletOutline,
  IoPeople,
} from "react-icons/io5";
import { GiClothes, GiDiamondHard, GiSewingMachine } from "react-icons/gi";
import { LuPackageCheck } from "react-icons/lu";
import { logoutUserAsync } from "../../features/authSlice";
import { generateOtherSaleAsync } from "../../features/OtherSale";
import { FaBookOpen, FaFileInvoice, FaTags } from "react-icons/fa";
import { Roles } from "../../constants/Roles";
import { getTodayDate } from "../../Utils/Common";
import ThemedSelect from "../../Component/Common/select/ThemedSelect";
import { getStorage, setStorage } from "../../../hooks/use-local-storage";
import ButtonSpinner from "../../Component/Common/button/ButtonSpinner";

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";
const DESKTOP_QUERY = "(min-width: 780px)";

const baseNavItemClass =
  "flex w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors";
const parentNavItemClass = `${baseNavItemClass} h-10`;
const childNavItemClass = `${baseNavItemClass} h-9 pl-8`;
const activeNavItemClass =
  "bg-gray-900 text-white shadow-sm dark:bg-gray-100 dark:text-gray-900";
const inactiveNavItemClass =
  "text-gray-700 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-200 dark:hover:bg-gray-700";
const railItemClass =
  "mx-auto flex h-10 w-10 items-center justify-center rounded-md transition-colors";
const flyoutLinkClass = `${baseNavItemClass} h-9`;
const roleGroups = {
  all: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.BRANCH_USER],
  adminAndSuperAdmin: [Roles.SUPER_ADMIN, Roles.ADMIN],
  superAdminOnly: [Roles.SUPER_ADMIN],
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const today = getTodayDate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => getStorage(SIDEBAR_COLLAPSED_KEY) === true,
  );
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(DESKTOP_QUERY).matches,
  );
  const [flyout, setFlyout] = useState(null);
  const asideRef = useRef(null);
  const flyoutRef = useRef(null);
  const flyoutCloseTimer = useRef(null);
  const isPointerInFlyout = useRef(false);
  const isRail = isDesktop && isSidebarCollapsed;
  const { PaymentData } = useSelector((state) => state.PaymentMethods);
  const [openSection, setOpenSection] = useState("");
  const [othersaleModal, setOtherSaleModal] = useState(false);

  const [formData, setFormData] = useState({
    cash: "",
    amount: "",
    city: "",
    cargo: "",
    name: "",
    phone: "",
    category: "",
    color: "",
    quantity: "",
    branchId: "",
    payment_Method: "",
    date: today,
    note: "",
    bill_by: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const { user, logoutLoading } = useSelector((state) => state.auth);
  const { generateOtherSaleLoading } = useSelector((state) => state.OtherBills);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event) => setIsDesktop(event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    setStorage(SIDEBAR_COLLAPSED_KEY, isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setFlyout(null);
  }, [location.pathname, isRail]);

  useEffect(() => {
    if (!flyout && !isSidebarOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setFlyout(null);
        setIsSidebarOpen(false);
      }
    };
    const handleMouseDown = (event) => {
      if (!asideRef.current?.contains(event.target)) {
        setFlyout(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [flyout, isSidebarOpen]);

  useEffect(() => {
    if (!flyout) isPointerInFlyout.current = false;
  }, [flyout]);

  useEffect(() => () => clearTimeout(flyoutCloseTimer.current), []);

  useLayoutEffect(() => {
    const panel = flyoutRef.current;
    if (!flyout?.isMenu || !panel) return;

    const maxTop = window.innerHeight - panel.offsetHeight - 8;
    panel.style.top = `${Math.max(64, Math.min(flyout.top, maxTop))}px`;
    if (flyout.focusFirst) {
      panel.querySelector("a")?.focus();
    }
  }, [flyout]);

  const toggleSidebar = () => {
    if (isDesktop) {
      setIsSidebarCollapsed((prev) => !prev);
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  const cancelFlyoutClose = () => clearTimeout(flyoutCloseTimer.current);

  const scheduleFlyoutClose = () => {
    cancelFlyoutClose();
    flyoutCloseTimer.current = setTimeout(
      () =>
        setFlyout((prev) =>
          prev?.pinned || isPointerInFlyout.current ? prev : null,
        ),
      200,
    );
  };

  const openFlyout = (event, key, { isMenu = false, pin = false } = {}) => {
    cancelFlyoutClose();
    const rect = event.currentTarget.getBoundingClientRect();
    const next = {
      key,
      isMenu,
      pinned: pin,
      focusFirst: pin && event.detail === 0,
      top: isMenu ? rect.top : rect.top + rect.height / 2,
    };

    setFlyout((prev) => {
      if (prev?.key !== key) return next;
      if (pin) return prev.pinned ? null : next;
      return prev;
    });
  };

  const flyoutHandlers = (key, options) => ({
    onMouseEnter: (event) => openFlyout(event, key, options),
    onMouseLeave: scheduleFlyoutClose,
    onFocus: (event) => openFlyout(event, key, options),
    onBlur: scheduleFlyoutClose,
  });

  const handleLogout = () => {
    dispatch(logoutUserAsync()).then((res) => {
      if (res.payload.success) {
        navigate("/");
      }
    });
  };

  const handleMoveTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const closeModal = () => {
    document.body.style.overflow = "auto";
    setOtherSaleModal(false);
    setFormData({
      cash: "",
      amount: "",
      city: "",
      cargo: "",
      name: "",
      phone: "",
      category: "",
      color: "",
      quantity: "",
      branchId: "",
      payment_Method: "",
      date: today,
      note: "",
      bill_by: "",
    });
  };

  const openOtherSaleModal = () => {
    setOtherSaleModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleGenerateOtherSale = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      phone: formData.phone,
      amount: Number(formData.amount),
      city: formData.city,
      cargo: formData.cargo,
      date: formData.date,
      bill_by: formData.bill_by,
      payment_Method: formData.payment_Method,
      quantity: formData.quantity,
      note: formData.note,
    };
    dispatch(generateOtherSaleAsync(payload)).then((res) => {
      if (res.payload.success) {
        closeModal();
      }
    });
  };

  const enviroment = import.meta.env.VITE_APP_ENV;
  const userRole = user?.user?.role;
  const canAccess = (allowedRoles = roleGroups.all) =>
    allowedRoles.includes(userRole);

  const isRouteActive = (matches = []) =>
    matches.some((match) =>
      match.exact
        ? location.pathname === match.path
        : location.pathname.includes(match.path),
    );

  const closeSidebarAfterNavigation = () => {
    setIsSidebarOpen(false);
    if (isDesktop) setIsSidebarCollapsed(true);
    handleMoveTop();
  };

  const sidebarSections = [
    {
      type: "link",
      label: "Dashboard",
      to: "/dashboard",
      icon: IoGridOutline,
      allowedRoles: roleGroups.all,
      matches: [{ path: "/dashboard", exact: true }],
    },
    {
      key: "stock",
      label: "In Stock",
      icon: IoCubeOutline,
      allowedRoles: roleGroups.all,
      matches: [
        { path: "suits" },
        { path: "base" },
        { path: "lace" },
        { path: "bag" },
        { path: "accessories" },
      ],
      items: [
        {
          label: "Suits",
          to: "/dashboard/suits",
          icon: IoStorefrontOutline,
          allowedRoles: roleGroups.all,
          matches: [{ path: "/dashboard/suits", exact: true }],
        },
        {
          label: "Base",
          to: "/dashboard/base",
          icon: IoLayersOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "/dashboard/base", exact: true }],
        },
        {
          label: "Lace",
          to: "/dashboard/lace",
          icon: IoColorPaletteOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "/dashboard/lace", exact: true }],
        },
        {
          label: "Bag",
          to: "/dashboard/bag",
          icon: IoBagHandleOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "/dashboard/bag", exact: true }],
        },
        {
          label: "Accessories",
          to: "/dashboard/accessories",
          icon: IoSettingsOutline,
          allowedRoles: roleGroups.all,
          matches: [{ path: "/dashboard/accessories", exact: true }],
        },
      ].filter((item) => canAccess(item.allowedRoles)),
    },
    {
      key: "process",
      label: "Process",
      icon: IoBriefcaseOutline,
      allowedRoles: roleGroups.adminAndSuperAdmin,
      matches: [
        { path: "process-analytics" },
        { path: "embroidery" },
        { path: "calendar" },
        { path: "cutting" },
        { path: "stitching" },
        { path: "stones" },
        { path: "packings" },
      ],
      items: [
        {
          label: "Analytics",
          to: "/dashboard/process-analytics",
          icon: IoStatsChartOutline,
          allowedRoles: roleGroups.superAdminOnly,
          matches: [{ path: "process-analytics" }],
        },
        {
          label: "Embroidery",
          to: "/dashboard/embroidery",
          icon: IoColorPaletteOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "embroidery" }],
        },
        {
          label: "Calendar",
          to: "/dashboard/calendar",
          icon: GiClothes,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "calendar" }],
        },
        {
          label: "Cutting",
          to: "/dashboard/cutting",
          icon: IoCutOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "cutting" }],
        },
        {
          label: "Stones",
          to: "/dashboard/stones",
          icon: GiDiamondHard,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "stones" }],
        },
        {
          label: "Stitching",
          to: "/dashboard/stitching",
          icon: GiSewingMachine,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "stitching" }],
        },
        {
          label: "Packing",
          to: "/dashboard/packings",
          icon: LuPackageCheck,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "packings" }],
        },
      ].filter((item) => canAccess(item.allowedRoles)),
    },
    {
      key: "accounts",
      label: "Accounts",
      icon: IoPeopleOutline,
      allowedRoles: roleGroups.all,
      matches: [
        { path: "accounts-dashboard" },
        { path: "buyers" },
        { path: "sellers" },
        { path: "generate-bill" },
        { path: "other-accounts" },
        { path: "processbills" },
        { path: "process-details" },
      ],
      items: [
        {
          label: "Analytics",
          to: "/dashboard/accounts-dashboard",
          icon: IoStatsChartOutline,
          allowedRoles: roleGroups.superAdminOnly,
          matches: [{ path: "accounts-dashboard" }],
        },
        {
          label: "Buyers",
          to: "/dashboard/buyers",
          icon: IoPeopleOutline,
          allowedRoles: roleGroups.all,
          matches: [
            { path: "/dashboard/buyers", exact: true },
            { path: "buyers-details" },
            { path: "generate-bill" },
          ],
        },
        {
          label: "Sellers",
          to: "/dashboard/sellers",
          icon: IoPeopleOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "sellers" }],
        },
        {
          label: "Process",
          to: "/dashboard/processbills",
          icon: IoBookOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "processbills" }, { path: "process-details" }],
        },
        {
          label: "Other Accounts",
          to: "/dashboard/other-accounts",
          icon: IoWalletOutline,
          allowedRoles: roleGroups.superAdminOnly,
          matches: [{ path: "other-accounts" }],
        },
      ].filter((item) => canAccess(item.allowedRoles)),
    },
    {
      type: "link",
      label: "Employee",
      to: "/dashboard/employee",
      icon: IoPeopleOutline,
      allowedRoles: roleGroups.superAdminOnly,
      matches: [{ path: "/dashboard/employee", exact: true }],
    },
    {
      key: "bills",
      label: "Bills",
      icon: IoReceiptOutline,
      allowedRoles: roleGroups.all,
      matches: [
        { path: "naila-arts-buyer" },
        { path: "buyer-return" },
        { path: "purchasebills" },
      ],
      items: [
        {
          label: "Buyer Bills",
          to: "/dashboard/naila-arts-buyer",
          icon: IoReceiptOutline,
          allowedRoles: roleGroups.all,
          matches: [{ path: "naila-arts-buyer" }, { path: "buyer-return" }],
        },
        {
          label: "Purchase Bills",
          to: "/dashboard/purchasebills",
          icon: IoReceiptOutline,
          allowedRoles: roleGroups.adminAndSuperAdmin,
          matches: [{ path: "purchasebills" }],
        },
      ].filter((item) => canAccess(item.allowedRoles)),
    },
    {
      type: "link",
      label: "Expense",
      to: "/dashboard/expense",
      icon: IoCashOutline,
      allowedRoles: roleGroups.all,
      matches: [{ path: "expense" }],
    },
    {
      type: "link",
      label: "B Pair",
      to: "/dashboard/bpair",
      icon: IoLayersOutline,
      allowedRoles: roleGroups.adminAndSuperAdmin,
      matches: [
        { path: "/dashboard/bpair", exact: true },
        { path: "/dashboard/bpair-bill" },
      ],
    },
    {
      type: "link",
      label: "Cash",
      to: "/dashboard/cash",
      icon: IoCashOutline,
      allowedRoles: roleGroups.all,
      matches: [{ path: "/dashboard/cash", exact: true }],
    },
    {
      type: "link",
      label: "Daily Sale",
      to: "/dashboard/dailySale",
      icon: IoWalletOutline,
      allowedRoles: roleGroups.all,
      matches: [{ path: "dailySale" }],
    },
    {
      type: "link",
      label: "Shop",
      to: "/dashboard/Shop",
      icon: IoStorefrontOutline,
      allowedRoles: roleGroups.superAdminOnly,
      matches: [{ path: "/dashboard/Shop", exact: true }],
    },
    {
      type: "link",
      label: "Payment Methods",
      to: "/dashboard/paymentMethods",
      icon: IoWalletOutline,
      allowedRoles: roleGroups.superAdminOnly,
      matches: [{ path: "/dashboard/paymentMethods", exact: true }],
    },
  ].filter((section) => canAccess(section.allowedRoles));

  useEffect(() => {
    const activeSection = sidebarSections.find(
      (section) => section.items && isRouteActive(section.matches),
    );

    if (activeSection) {
      setOpenSection(activeSection.key);
    }
  }, [location.pathname]);

  const renderSidebarLink = (item, isChild = false) => {
    const Icon = item.icon;
    const isActive = isRouteActive(item.matches);

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={closeSidebarAfterNavigation}
        className={`${isChild ? childNavItemClass : parentNavItemClass} ${
          isActive ? activeNavItemClass : inactiveNavItemClass
        }`}
      >
        <Icon size={isChild ? 16 : 18} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const renderRailItem = (section) => {
    const Icon = section.icon;
    const isActive = isRouteActive(section.matches);
    const itemClass = `${railItemClass} ${
      isActive ? activeNavItemClass : inactiveNavItemClass
    }`;

    if (section.type === "link") {
      return (
        <Link
          key={section.to}
          to={section.to}
          aria-label={section.label}
          onClick={closeSidebarAfterNavigation}
          className={itemClass}
          {...flyoutHandlers(section.to)}
        >
          <Icon size={18} className="shrink-0" />
        </Link>
      );
    }

    return (
      <button
        key={section.key}
        type="button"
        aria-label={section.label}
        aria-haspopup="menu"
        aria-expanded={flyout?.key === section.key}
        onClick={(event) =>
          openFlyout(event, section.key, { isMenu: true, pin: true })
        }
        className={itemClass}
        {...flyoutHandlers(section.key, { isMenu: true })}
      >
        <Icon size={18} className="shrink-0" />
      </button>
    );
  };

  const sidebarToggleLabel = isDesktop
    ? isSidebarCollapsed
      ? "Expand sidebar"
      : "Collapse sidebar"
    : isSidebarOpen
      ? "Close menu"
      : "Open menu";

  const renderFlyout = () => {
    if (!isRail || !flyout) return null;

    const section = sidebarSections.find(
      (item) => (item.items ? item.key : item.to) === flyout.key,
    );
    let content;

    if (section?.items) {
      content = (
        <div
          role="menu"
          aria-label={section.label}
          className="w-52 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  onClick={() => {
                    setFlyout(null);
                    closeSidebarAfterNavigation();
                  }}
                  className={`${flyoutLinkClass} ${
                    isRouteActive(item.matches)
                      ? activeNavItemClass
                      : inactiveNavItemClass
                  }`}
                >
                  <ItemIcon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      );
    } else {
      const label =
        flyout.key === "user" ? (
          <>
            <span className="block">{user?.user?.name}</span>
            <span className="block font-normal capitalize opacity-75">
              {userRole}
            </span>
          </>
        ) : flyout.key === "signout" ? (
          "Sign out"
        ) : (
          section?.label
        );
      if (!label) return null;

      content = (
        <div className="whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {label}
        </div>
      );
    }

    return (
      <div
        ref={flyoutRef}
        style={{ top: flyout.top }}
        className={`absolute left-full z-50 ${
          flyout.isMenu
            ? "-ml-3 pl-5"
            : "pointer-events-none pl-2 -translate-y-1/2"
        }`}
        onMouseEnter={() => {
          isPointerInFlyout.current = true;
          cancelFlyoutClose();
        }}
        onMouseLeave={() => {
          isPointerInFlyout.current = false;
          scheduleFlyoutClose();
        }}
        onFocus={cancelFlyoutClose}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFlyout(null);
          }
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <>
      <div className="antialiased bg-gray-50 dark:bg-gray-900">
        {/* ---------------- NAVBAR ---------------- */}
        <nav className="bg-white border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
          <div className="flex flex-wrap justify-between items-center">
            {/* ---------------- NAVBAR - LEFT ---------------- */}
            <div className="flex justify-start items-center">
              <button
                type="button"
                aria-controls="sidebar-navigation"
                aria-expanded={isDesktop ? !isSidebarCollapsed : isSidebarOpen}
                aria-label={sidebarToggleLabel}
                title={sidebarToggleLabel}
                className="mr-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                onClick={toggleSidebar}
              >
                {!isDesktop ? (
                  <Menu size={22} />
                ) : isSidebarCollapsed ? (
                  <PanelLeftOpen size={22} />
                ) : (
                  <PanelLeftClose size={22} />
                )}
              </button>

              <Link
                to="/dashboard"
                className="hidden sm:flex items-center justify-between mr-4"
              >
                <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                  NAILA ARTS{" "}
                  {enviroment === "dev" ? (
                    <span>( DEV ENVIROMENT )</span>
                  ) : null}
                </span>
              </Link>
            </div>

            {/* ---------------- NAVBAR - RIGHT ---------------- */}
            <div className="flex items-center gap-2 lg:order-2">
              <Link
                to="/dashboard/cash-book"
                className=" flex items-center gap-2 rounded-md border border-gray-500 bg-white px-4 py-2 mx-2 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-600 focus:outline-none active:text-gray-500"
              >
                Cash Book
                <FaBookOpen size={18} />
              </Link>

              <Link
                to="/dashboard/generate-bill"
                className=" flex items-center gap-2 rounded-md border border-gray-500 bg-white px-4 py-2 mx-2 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-600 focus:outline-none active:text-gray-500"
              >
                Buyer Bill
                <FaFileInvoice size={18} />
              </Link>
              {user && user?.user?.role === Roles.SUPER_ADMIN && (
                <>
                  <button
                    onClick={openOtherSaleModal}
                    className=" flex items-center gap-2 rounded-md border border-gray-500 bg-white px-4 py-2 mx-2 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-600 focus:outline-none active:text-gray-500"
                  >
                    Other Sale
                    <FaTags size={18} />
                  </button>

                  <Link
                    to="/dashboard/employee-attendance"
                    className=" flex items-center gap-2 rounded-md border border-gray-500 bg-white px-4 py-2 mx-2 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-600 focus:outline-none active:text-gray-500"
                  >
                    Attendance
                    <IoPeople size={18} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ---------------- SIDEBAR ---------------- */}
        {isSidebarOpen && (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-30 bg-gray-900/40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <aside
          id="sidebar-navigation"
          ref={asideRef}
          aria-label="Sidenav"
          className={`fixed top-0 left-0 z-40 h-screen w-60 pt-14 transition-[width,transform] duration-200 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${
            isSidebarCollapsed ? "md:w-16" : "md:w-60"
          } border-r border-gray-200 bg-white md:translate-x-0 dark:border-gray-700 dark:bg-gray-800`}
        >
          <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-800">
            <nav
              className={`scrollable-content flex-1 space-y-1 overflow-y-auto overflow-x-hidden py-4 ${
                isRail ? "px-2" : "px-3"
              }`}
            >
              {sidebarSections.map((section) => {
                if (isRail) {
                  return renderRailItem(section);
                }

                if (section.type === "link") {
                  return renderSidebarLink(section);
                }

                const Icon = section.icon;
                const isOpen = openSection === section.key;
                const isActive = isRouteActive(section.matches);

                return (
                  <div key={section.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSection((prev) =>
                          prev === section.key ? "" : section.key,
                        )
                      }
                      className={`${parentNavItemClass} ${
                        isActive ? activeNavItemClass : inactiveNavItemClass
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="flex-1 truncate text-left">
                        {section.label}
                      </span>
                      <IoChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`grid overflow-hidden transition-all duration-300 ease-out ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0">
                        <div className="mt-1 space-y-1 border-l border-gray-200 pl-2 dark:border-gray-700">
                          {section.items.map((item) =>
                            renderSidebarLink(item, true),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {isRail ? (
              <div className="flex flex-col items-center gap-2 border-t border-gray-200 py-3 dark:border-gray-700">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold uppercase text-white dark:bg-gray-100 dark:text-gray-900"
                  {...flyoutHandlers("user")}
                >
                  {user?.user?.name?.[0]}
                </div>
                <button
                  type="button"
                  aria-label="Sign out"
                  disabled={logoutLoading}
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                  {...flyoutHandlers("signout")}
                >
                  <IoLogOutOutline size={18} />
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold uppercase text-white dark:bg-gray-100 dark:text-gray-900">
                    {user?.user?.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.user?.name}
                    </p>
                    <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-300">
                      {userRole}
                    </p>
                  </div>
                </div>

                <button
                  disabled={logoutLoading}
                  onClick={handleLogout}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
                >
                  {logoutLoading ? <ButtonSpinner /> : <IoLogOutOutline size={18} />}
                  Sign out
                </button>
              </div>
            )}
          </div>
          {renderFlyout()}
        </aside>
        {/* ---------------- DASHBOARD ---------------- */}
        <main
          className={`ml-0 h-auto bg-white pt-16 pb-10 transition-[margin] duration-200 ${
            isSidebarCollapsed ? "md:ml-16" : "md:ml-60"
          } dark:bg-gray-900`}
        >
          <Outlet />
        </main>
      </div>


      {/* OTHER SALE MODAL */}
      {othersaleModal && (
        <div
          aria-hidden="true"
          className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full h-screen bg-gray-800 bg-opacity-50"
        >
          <div className="relative py-4 px-3 w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-md shadow dark:bg-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generate Other Sale
              </h3>
              <div className="flex items-center space-x-4">
                {/* View All Button */}

                <Link
                  className="px-4 py-1.5 ml-1 text-sm rounded bg-[#252525] dark:bg-gray-200 text-white dark:text-gray-800"
                  to={"/dashboard/other-sale"}
                  onClick={closeModal}
                >
                  View All Bills
                </Link>

                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 14 14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 md:p-5">
              <form onSubmit={handleGenerateOtherSale}>
                <div className="grid grid-cols-3 gap-4">
                  {/* Name */}
                  <div>
                    <input
                      name="name"
                      type="text"
                      placeholder="Party Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <input
                      name="amount"
                      type="number"
                      placeholder="Amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* City */}
                  <div>
                    <input
                      name="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <input
                      name="cargo"
                      type="text"
                      placeholder="Cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <input
                      name="phone"
                      type="text"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <input
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Bill By */}
                  <div>
                    <input
                      name="bill_by"
                      type="text"
                      placeholder="Bill By"
                      value={formData.bill_by}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <input
                      name="quantity"
                      type="number"
                      placeholder="Quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <ThemedSelect className="w-full"
                      id="payment-method"
                      name="payment_Method"
                      value={formData.payment_Method}
                      required
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_Method: e.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Payment Method
                      </option>
                      {PaymentData?.map((item) => (
                        <option value={item.value} key={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </ThemedSelect>
                  </div>

                  {/* Note */}
                  <div className="col-span-3">
                    <input
                      name="note"
                      type="text"
                      placeholder="Enter Note"
                      value={formData.note}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-0 focus:border-gray-300 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-6">
                  {generateOtherSaleLoading ? (
                    <button
                      disabled
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 cursor-not-allowed rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
                    >
                      <ButtonSpinner />
                      Submit
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-block rounded border border-gray-600 bg-gray-600 px-10 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
