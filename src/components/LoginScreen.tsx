import React, { useState, useEffect, useMemo } from "react";
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
  LogIn,
  MapPin,
  Mail,
  Phone
} from "lucide-react";

export const LoginScreen: React.FC = () => {
  const { login, users, themeConfig } = useUniHub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isCarouselTransitioning, setIsCarouselTransitioning] = useState(true);

  const bgList = useMemo(() => {
    const configuredImages = themeConfig?.loginBgUrls && themeConfig.loginBgUrls.length > 0
      ? themeConfig.loginBgUrls
      : (themeConfig?.loginBgUrl ? [themeConfig.loginBgUrl] : []);

    return configuredImages.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  }, [themeConfig?.loginBgUrl, themeConfig?.loginBgUrls]);

  const carouselSlides = bgList.length > 1 ? [...bgList, bgList[0]] : bgList;
  const carouselSlideWidth = carouselSlides.length > 0 ? 100 / carouselSlides.length : 100;

  useEffect(() => {
    setCurrentBgIndex(0);
    setIsCarouselTransitioning(false);
    const frame = window.requestAnimationFrame(() => setIsCarouselTransitioning(true));
    return () => window.cancelAnimationFrame(frame);
  }, [bgList.length]);

  useEffect(() => {
    if (bgList.length <= 1) return;
    const intervalTime = (themeConfig?.bgTransitionInterval || 5) * 1000;
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => prev + 1);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [bgList.length, themeConfig?.bgTransitionInterval]);

  const handleCarouselTransitionEnd = () => {
    if (bgList.length <= 1 || currentBgIndex !== bgList.length) return;

    setIsCarouselTransitioning(false);
    setCurrentBgIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsCarouselTransitioning(true));
    });
  };

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
      className="h-screen h-dvh max-h-screen flex flex-col justify-between py-4 px-4 sm:px-8 selection:bg-indigo-500 selection:text-white relative bg-slate-950 font-sans text-white overflow-hidden max-sm:h-auto max-sm:min-h-screen max-sm:overflow-y-auto" 
      id="unihub-login-screen"
    >
      {/* 1. Top Header Navigation Bar (Transparent, Aligned Left Logo/Title & Right Login) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between py-2 shrink-0">
        {/* Left Side: Brand Logo (doubled size!) & Title */}
        <div className="flex items-center gap-4 sm:gap-6 text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-2xl border border-white/20 flex items-center justify-center overflow-hidden shrink-0 transition-transform transform hover:scale-105">
            {themeConfig?.logoUrl ? (
              <img 
                src={themeConfig.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full p-1"
              />
            ) : (
              <TnuLogo size={80} />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="font-mono text-xs sm:text-sm font-bold text-indigo-400 tracking-widest uppercase leading-none mb-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Phân hiệu ĐHTN tại Hà Giang
            </h4>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {themeConfig?.loginTitle || "CỔNG THÔNG TIN UNIHUBHG"}
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed max-w-2xl drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {themeConfig?.loginSubtitle || "Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang - Tra cứu ngay thông tin của bạn"}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Login Modal Trigger Button */}
        <div className="shrink-0">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm py-3 px-5 sm:px-8 rounded-xl shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <LogIn size={16} />
            <span>Đăng nhập</span>
          </button>
        </div>
      </header>

      {/* 2. Middle Section: Widescreen 16:9 Banner Slider Box (Positioned 1/3 from top) */}
      <main className="relative z-10 w-full max-w-7xl mx-auto my-3 flex-1 flex flex-col justify-center min-h-0 overflow-hidden max-sm:my-4 max-sm:flex-none">
        {hasBg ? (
          <div className="h-full max-h-full aspect-video w-auto max-w-full rounded-[24px] sm:rounded-[36px] shadow-2xl border border-white/10 relative bg-gradient-to-br from-white/10 via-white/5 to-slate-950/60 mx-auto p-2 sm:p-3 max-sm:w-full max-sm:h-auto">
            <div className="relative h-full w-full overflow-hidden rounded-[18px] sm:rounded-[28px] bg-slate-950/80">
              {/* Seamless horizontal filmstrip: no zoom, no fade, no image recompression. */}
              <div 
                className="flex flex-row h-full will-change-transform"
                onTransitionEnd={handleCarouselTransitionEnd}
                style={{ 
                  width: `${carouselSlides.length * 100}%`,
                  transform: `translate3d(-${currentBgIndex * carouselSlideWidth}%, 0, 0)`,
                  transition: isCarouselTransitioning
                    ? "transform 1400ms cubic-bezier(0.22, 1, 0.36, 1)"
                    : "none"
                }}
              >
                {carouselSlides.map((bgUrl, index) => (
                  <img 
                    key={`${bgUrl}-${index}`}
                    src={bgUrl}
                    alt={`Ảnh nền đăng nhập ${index % bgList.length + 1}`}
                    className="h-full object-cover flex-shrink-0 select-none"
                    style={{ 
                      width: `${carouselSlideWidth}%`,
                      objectPosition: "center center",
                      imageRendering: "auto"
                    }}
                    draggable={false}
                    loading={index <= 1 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ))}
              </div>

              {/* Dark Tint & Blur Overlay (active only when Modal is open) */}
              <div 
                className="absolute inset-0 bg-slate-950 transition-all duration-500 z-20 pointer-events-none"
                style={{ 
                  opacity: showLoginModal ? 0.6 : 0,
                  backdropFilter: showLoginModal ? "blur(6px)" : "none",
                  WebkitBackdropFilter: showLoginModal ? "blur(6px)" : "none"
                }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[16/9] md:max-h-[500px] bg-slate-900 rounded-[24px] sm:rounded-[36px] border border-white/5 flex items-center justify-center">
            <span className="text-slate-400 text-sm">Chưa có ảnh nền nào được tải lên.</span>
          </div>
        )}
      </main>

      {/* 3. Lower Section: Contact Info & Footer (Dynamic parameters from Admin) */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-3 border-t border-white/10 flex flex-col gap-3 shrink-0">
        {/* Contact details row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left text-sm text-slate-300">
          <div className="flex items-start gap-2.5">
            <MapPin className="text-indigo-400 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="block font-bold text-white mb-0.5 text-xs">Địa chỉ</span>
              <span className="text-[11px] leading-snug">{themeConfig?.contactAddress || "Tổ 10, Phường Nguyễn Trãi, Thành phố Hà Giang, Tỉnh Hà Giang"}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5">
            <Mail className="text-indigo-400 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="block font-bold text-white mb-0.5 text-xs">Email liên hệ</span>
              <span className="text-[11px] leading-snug">{themeConfig?.contactEmail || "phhagiang@tnu.edu.vn"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="text-indigo-400 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="block font-bold text-white mb-0.5 text-xs">Điện thoại</span>
              <span className="text-[11px] leading-snug">{themeConfig?.contactPhone || "0219.386.1234"}</span>
            </div>
          </div>
        </div>

        {/* Footer legal brand line */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-1 text-[10px] text-slate-500 border-t border-white/5 pt-2">
          <div>
            Hệ thống UniHub Rèn luyện © 2026. Phiên bản 1.0 - Phân hiệu Đại học Thái Nguyên tại Hà Giang.
          </div>
          <div className="font-mono">
            Dùng chung Cơ sở dữ liệu, API & Thang điểm quy chuẩn liên thông.
          </div>
        </div>
      </footer>

      {/* Login Modal Popup */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm animate-fade-in"
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
                        <img src={themeConfig.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-full p-0.5" />
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
    </div>
  );
};
