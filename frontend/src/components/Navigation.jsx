import { useUserInfo } from "@/store";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ArrowRight,
  LayoutDashboard,
  Lock,
  LogOut,
  FileText,
  AlertCircle,
  Info,
  LogIn,
  BarChart3,
  Package,
  Users,
  CreditCard,
  Receipt,
  Tags,
  Percent,
  Ticket,
  ShoppingCart,
  Truck,
  Wallet,
  Store,
  Zap,
  Settings,
  UserCircle,
  Mail,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/api/authApi";
import toast from "react-hot-toast";
import { renderIcon } from "@/lib/utils";

const LG_BREAKPOINT = 1300;

const SideDrawer = ({ children }) => {
  const { userInfo, clearUserInfo } = useUserInfo();
  const [activeMenu, setActiveMenu] = useState();
  const [nosidebar, setNosidebar] = useState(false);
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();
  const [isShowSidebar, setIsShowSidebar] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= LG_BREAKPOINT,
  );

  const { mutate: handleLogout } = useMutation({
    mutationKey: ["userInfo"],
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries(["userInfo"]);
      clearUserInfo();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Session expired");
    },
  });

  const menuItems = [
    {
      title: "REPORTS",
      icon: BarChart3,
      items: [
        { name: "SALES REPORT.", icon: BarChart3 },
        { name: "INVOICES", icon: FileText },
        { name: "STACK TRACE.", icon: Package },
      ],
    },
    {
      title: "LIBRARY",
      icon: Package,
      items: [
        { name: "ITEM LIBRARY", icon: Package },
        { name: "PROMO.", icon: Percent },
        { name: "DISKON", icon: Tags },
        { name: "VOUCHER.", icon: Ticket },
      ],
    },
    {
      title: "INVENTORY",
      icon: ShoppingCart,
      items: [
        { name: "PURCHASE ORDER CREATE", icon: ShoppingCart },
        { name: "PURCHASE ORDER RECEIVE", icon: Truck },
      ],
    },
    {
      title: "CUSTOMER",
      icon: Users,
      items: [{ name: "CUSTOMER LIST", icon: Users }],
    },
    {
      title: "ACCOUNTS",
      icon: Wallet,
      items: [{ name: "ALL ACCOUNT", icon: Wallet }],
    },
    {
      title: "TRANSACTION SETTINGS",
      icon: Settings,
      items: [
        { name: "OUTLET LIST", icon: Store },
        { name: "PAYMENT METHOD", icon: CreditCard },
        { name: "KWITANSI PEMBAYARAN TERTUNDA", icon: Receipt },
      ],
    },
    {
      title: "APPLICATION SETTINGS",
      icon: Zap,
      items: [
        { name: "SUMBER THIRDPARTY", icon: Zap },
        { name: "PROFILE", icon: UserCircle },
        { name: "EMAIL CONFIG", icon: Mail },
      ],
    },
  ];

  const getMenuPath = (name) =>
    `/${name
      .replace(".", "")
      .replace("nosidebar", "")
      .replace(" ", "_")
      .replace(" ", "_")
      .replace(" ", "_")
      .replace("-", "")
      .toLowerCase()}`;

  const getMenuLabel = (name) =>
    name.replace("nosidebar", "").replace(".", "").replace("-", "");

  function navigatTo(menu) {
    setActiveMenu(menu);
    const navigation = menu
      .toLowerCase()
      .split(" ")
      .join("_")
      .replace("nosidebar", "")
      .replace(".", "")
      .replace("-", "");

    queryClient.invalidateQueries(["userInfo"]);
    navigate(`/${navigation}`);
  }

  const handleMenuClick = (menu) => {
    if (menu.includes("nosidebar")) {
      setNosidebar(true);
      navigatTo(menu);
    } else {
      setNosidebar(false);
      navigatTo(menu);
    }
  };

  // large/desktop = sidebar penuh, tablet/mobile = icon saja
  useEffect(() => {
    const syncSidebarMode = () => {
      setIsShowSidebar(window.innerWidth >= LG_BREAKPOINT);
    };

    syncSidebarMode();
    window.addEventListener("resize", syncSidebarMode);
    return () => window.removeEventListener("resize", syncSidebarMode);
  }, []);

  useEffect(() => {
    setNosidebar(pathname.includes("login"));
    if (!pathname.includes("login")) {
      queryClient.invalidateQueries(["userInfo"]);
    }
  }, [pathname, queryClient]);

  const sidebarWidth = isShowSidebar ? "w-64 lg:w-72" : "w-20";

  return (
    <div className="flex max-h-screen min-h-screen relative">
      <div
        id="sidebar"
        className={`${
          nosidebar ? "hidden" : ""
        } ${sidebarWidth} max-h-screen bg-gradient-to-b from-blue-600 to-blue-400 text-white flex flex-col h-full shrink-0 shadow-2xl transition-all duration-300`}
      >
        <div
          onClick={() => navigate("/")}
          className="p-4 bg-gradient-to-r from-blue-100 to-blue-300 border-b border-blue-300 sticky top-0 z-10 flex items-center justify-between shadow-md cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0">
              <img
                src="./internal-pos.png"
                alt="Internal POS CSI Logo"
                className="w-10 h-10 object-contain rounded-xl"
              />
            </div>
            {isShowSidebar && (
              <span className="text-lg font-bold text-blue-900">
                Internal POS CSI
              </span>
            )}
          </div>
          {isShowSidebar && userInfo && (
            <span className="text-xs bg-white text-blue-800 px-3 py-1 rounded-full font-semibold border border-blue-200 shadow-sm">
              {userInfo.roleName}
            </span>
          )}
        </div>

        {userInfo ? (
          <div
            className={`px-4 hover:bg-blue-700 cursor-pointer py-4 flex items-center gap-3 transition-colors duration-200 ${!isShowSidebar ? "justify-center" : ""}`}
            onClick={() => navigate("/profile")}
          >
            <div className="avatar placeholder shrink-0">
              <div className="bg-white text-blue-800 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                <span>{userInfo.username.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            {isShowSidebar && (
              <div>
                <p className="text-sm font-medium text-white truncate max-w-[160px]">
                  {userInfo.username}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="text-xs bg-white text-red-600 hover:bg-red-50 px-2 py-1 rounded-full font-bold mt-1 flex items-center gap-1"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 bg-blue-900">
            <button
              onClick={() => navigate("/login")}
              className={`btn bg-white text-blue-800 hover:bg-blue-100 font-bold flex items-center justify-center gap-2 ${isShowSidebar ? "w-full mx-auto" : "btn-circle btn-sm"}`}
            >
              <LogIn size={16} />
              {isShowSidebar && "Login"}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-hidden p-2">
          <div className="flex items-center justify-center">
            <div
              role="alert"
              className={`alert mt-2 bg-white text-blue-800 ${isShowSidebar ? "w-full" : "justify-center px-1"}`}
            >
              <div
                className={`flex items-center ${isShowSidebar ? "gap-x-4" : "flex-col gap-1"}`}
              >
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                  <LayoutDashboard size={20} />
                </div>
                {isShowSidebar && <span className="font-bold">Dashboard</span>}
                <button
                  name="go to dashboard"
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200 shrink-0"
                  title="Dashboard"
                >
                  <ArrowRight color="white" size={20} />
                </button>
              </div>
            </div>
          </div>

          {menuItems.map((group, idx) => (
            <div key={idx} className="mt-3">
              {isShowSidebar && (
                <h2 className="px-4 py-2 text-sm font-bold bg-blue-600 border-b border-blue-300 flex items-center gap-2">
                  {renderIcon(group.icon, 16)}
                  <span>{group.title}</span>
                </h2>
              )}
              <ul className="mt-1">
                {group.items.map((item, i) =>
                  !item.name.includes("-") ? (
                    <li
                      key={i}
                      className={`px-4 py-3 text-sm cursor-pointer hover:bg-blue-700 transition-colors duration-200 ${
                        activeMenu === item.name ? "bg-blue-700 font-bold" : ""
                      } ${isShowSidebar ? "flex items-center justify-between" : "flex justify-center"}`}
                      onClick={() => handleMenuClick(item.name)}
                      title={!isShowSidebar ? getMenuLabel(item.name) : ""}
                    >
                      <div className="shrink-0">
                        {renderIcon(item.icon, isShowSidebar ? 20 : 24)}
                      </div>
                      {isShowSidebar && (
                        <span className="flex-1 ml-3">
                          {getMenuLabel(item.name)}
                        </span>
                      )}
                      {isShowSidebar && (
                        <div className="flex items-center gap-2">
                          {userInfo?.blockedAccess?.includes(
                            getMenuPath(item.name),
                          ) ? (
                            <Lock size={16} className="text-red-400" />
                          ) : null}
                          {item.name.includes(".") && (
                            <span className="badge bg-white text-blue-800 badge-xs font-bold">
                              New
                            </span>
                          )}
                        </div>
                      )}
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-blue-600 text-blue-200 text-xs bg-blue-600">
          {isShowSidebar ? (
            <>
              <h2 className="font-bold mb-2 text-white">Help & Support</h2>
              <p className="flex gap-2 flex-wrap">
                <a
                  href="/artikel_documentation"
                  className="text-white hover:underline flex items-center gap-1"
                >
                  <FileText size={14} /> Docs
                </a>
                <span>•</span>
                <button
                  onClick={() =>
                    document.getElementById("report_modal")?.showModal()
                  }
                  className="text-white hover:underline flex items-center gap-1"
                >
                  <AlertCircle size={14} /> Report
                </button>
                <span>•</span>
                <a
                  href="/about"
                  className="text-white hover:underline flex items-center gap-1"
                >
                  <Info size={14} /> About
                </a>
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <a href="/artikel_documentation" title="Docs">
                <FileText size={16} />
              </a>
              <button
                onClick={() =>
                  document.getElementById("report_modal")?.showModal()
                }
                title="Report"
              >
                <AlertCircle size={16} />
              </button>
              <a href="/about" title="About">
                <Info size={16} />
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6 overflow-auto min-w-0">
        {children}
      </div>
    </div>
  );
};

export default SideDrawer;
