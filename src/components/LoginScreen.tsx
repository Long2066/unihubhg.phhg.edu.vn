import React, { useState, useEffect } from "react";
import { useUniHub } from "../state";
import { UserRole } from "../types";
import { TnuLogo } from "./TnuLogo";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  UserCheck, 
  School, 
  ShieldAlert, 
  Settings, 
  ArrowRight,
  Info,
  X,
  LogIn
} from "lucide-react";

export const LoginScreen: React.FC = () => {
  const { login, users, themeConfig } = useUniHub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const bgList = themeConfig?.loginBgUrls && themeConfig.loginBgUrls.length > 0
    ? themeConfig.loginBgUrls
    : (themeConfig?.loginBgUrl ? [themeConfig.loginBgUrl] : []);

  useEffect(() => {
    if (bgList.length <= 1) return;
    const intervalTime = (themeConfig?.bgTransitionInterval || 5) * 1000;
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgList.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [bgList.length, themeConfig?.bgTransitionInterval]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Vui lòng nhập tên đăng nhập hoặc mã số.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const success = await login(email, password);
      if (success) {
        setErrorMsg("");
      } else {
        setErrorMsg("Tên đăng nhập hoặc mật khẩu không chính xác. Thử lại hoặc dùng số CCCD làm mật khẩu nếu đăng nhập lần đầu.");
      }
    } catch (err) {
      setErrorMsg("Lỗi hệ thống khi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const hasBg = bgList.length > 0;

  return (
    <div 
      className="min-h-screen min-h-dvh flex flex-col justify-between py-4 px-4 sm:px-6 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-500" 
      id="unihub-login-screen"
      style={{
        backgroundColor: hasBg ? "transparent" : "#f8fafc"
      }}
    >
      {/* Background Image Slider Frame with offset margins */}
      {hasBg && (
        <div className="absolute inset-3 sm:inset-5 md:inset-6 z-0 overflow-hidden pointer-events-none rounded-[24px] sm:rounded-[32px] md:rounded-[40px] shadow-2xl border border-white/10">
          {bgList.map((bgUrl, index) => {
            const isActive = index === currentBgIndex;
            const isPrev = index === (currentBgIndex - 1 + bgList.length) % bgList.length;

            let translateStyle: React.CSSProperties = {
              transform: "translateX(100%)",
              opacity: 0,
              zIndex: 0,
            };

            if (isActive) {
              translateStyle = {
                transform: "translateX(0)",
                opacity: 1,
                zIndex: 10,
              };
            } else if (isPrev) {
              translateStyle = {
                transform: "translateX(-100%)",
                opacity: 1,
                zIndex: 5,
              };
            }

            return (
              <div 
                key={index}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
                style={{ 
                  backgroundImage: `url("${bgUrl}")`,
                  ...translateStyle
                }}
              />
            );
          })}

          {/* Dynamic Overlay: dims and blurs when login modal is active */}
          <div 
            className="absolute inset-0 bg-slate-950 transition-all duration-500 z-20"
            style={{ 
              opacity: showLoginModal ? 0.35 : (themeConfig?.bgOverlayOpacity ?? 0.3),
              backdropFilter: showLoginModal ? "blur(6px)" : "none",
              WebkitBackdropFilter: showLoginModal ? "blur(6px)" : "none"
            }}
          />
        </div>
      )}

      {/* Top Header Navigation Bar (Left: Logo & Info, Right: Login Button) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between py-3 px-4 sm:px-6 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl transition-all">
        {/* Left Side: Brand Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-4 text-left">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-full shadow-md border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
            {themeConfig?.logoUrl ? (
              <img 
                src={themeConfig.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <TnuLogo size={40} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="font-mono text-[10px] sm:text-xs font-black text-indigo-400 tracking-wider uppercase leading-none mb-1">
              Phân hiệu ĐHTN tại Hà Giang
            </h4>
            <h1 className="text-sm sm:text-lg md:text-xl font-black text-white tracking-tight leading-none">
              {themeConfig?.loginTitle || "CỔNG THÔNG TIN UNIHUBHG"}
            </h1>
            <p className="hidden sm:block text-[11px] text-slate-300 mt-1 leading-tight max-w-xl">
              {themeConfig?.loginSubtitle || "Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang - Tra cứu ngay thông tin của bạn"}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Login Modal Trigger Button */}
        <div className="shrink-0">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 sm:px-6 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </button>
        </div>
      </header>

      {/* Center Subtitle on Mobile if header is truncated */}
      <div className="sm:hidden relative z-10 text-center my-2 px-2">
        <p className="text-xs text-slate-200 drop-shadow">
          {themeConfig?.loginSubtitle || "Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang"}
        </p>
      </div>

      {/* Main Showcase Empty Space (Lets the background photo / announcement take center stage) */}
      <div className="flex-1 min-h-[300px]" />

      {/* Login Modal Popup */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/25 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          {/* Modal Card */}
          <div 
            className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative flex flex-col justify-between transform transition-all animate-scale-up" 
            id="manual-login-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Modal Button */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100 cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>

            <div>
              <div className="mb-6 text-left">
                <div className="inline-flex items-center gap-2 text-indigo-600 mb-1">
                  {themeConfig?.logoUrl ? (
                    <div className="w-7 h-7 bg-white rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={themeConfig.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                  ) : (
                    <TnuLogo size={24} />
                  )}
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">UniHub System</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Đăng nhập tài khoản</h2>
                <p className="text-xs text-slate-400 mt-1">Sử dụng Email hoặc Mã định danh cán bộ/sinh viên</p>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tên đăng nhập / Email / Mã sinh viên</label>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Nhập tài khoản hoặc mã số..." 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all text-slate-800"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Mật khẩu</label>
                    <span className="text-xs text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors">Quên mật khẩu?</span>
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all text-slate-800"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex gap-2 items-start text-xs text-rose-600">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 hover:cursor-pointer"} text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 text-sm mt-4`}
                >
                  <span>{loading ? "Đang xử lý..." : "Đăng nhập ngay"}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding info */}
      <footer className={`relative z-10 max-w-7xl mx-auto w-full text-center border-t ${hasBg ? 'border-white/15 text-slate-200' : 'border-slate-200 text-slate-400'} pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs`}>
        <div>
          Hệ thống UniHub Rèn luyện © 2026. Phiên bản 1.0 - Phân hiệu ĐHTN tại Hà Giang.
        </div>
        <div className="font-mono text-[10px]">
          Dùng chung Cơ sở dữ liệu, API & Thang điểm quy chuẩn liên thông.
        </div>
      </footer>
    </div>
  );
};

