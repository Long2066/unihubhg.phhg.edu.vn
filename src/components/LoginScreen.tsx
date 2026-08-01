import React, { useState, useEffect, useMemo } from "react";
import { useUniHub } from "../state";
import { UserRole, convertGoogleDriveUrlToDirectUrl } from "../types";
import { SEED_ACTIVITIES } from "../data";
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
  Phone,
  Newspaper,
  Calendar,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";

interface NewsFeedItem {
  id: string;
  title: string;
  content: string;
  dateStr: string;
  orgName: string;
  imageUrl?: string;
  type: "ANNOUNCEMENT" | "ACTIVITY";
}



export const LoginScreen: React.FC = () => {
  const { login, users, themeConfig, announcements, activities } = useUniHub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsFeedItem | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isCarouselTransitioning, setIsCarouselTransitioning] = useState(true);

  const bgList = useMemo(() => {
    const configuredImages = themeConfig?.loginBgUrls && themeConfig.loginBgUrls.length > 0
      ? themeConfig.loginBgUrls
      : (themeConfig?.loginBgUrl ? [themeConfig.loginBgUrl] : []);

    return configuredImages
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      .map(url => convertGoogleDriveUrlToDirectUrl(url));
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

  const newsList = useMemo(() => {
    const items: NewsFeedItem[] = [];

    (announcements || []).forEach((ann) => {
      let dateStr = "";
      if (ann.createdAt) {
        try {
          const d = new Date(ann.createdAt);
          if (!isNaN(d.getTime())) {
            dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
          }
        } catch {}
      }
      items.push({
        id: ann.id,
        title: ann.title,
        content: ann.content || "",
        dateStr: dateStr,
        orgName: ann.orgName || "Thông báo Phân hiệu",
        imageUrl: convertGoogleDriveUrlToDirectUrl(ann.imageUrl),
        type: "ANNOUNCEMENT"
      });
    });

    const sourceActivities = (activities && activities.length > 0) ? activities : SEED_ACTIVITIES;

    sourceActivities.forEach((act) => {
      let dateStr = "";
      if (act.dateTime) {
        try {
          const cleanStr = act.dateTime.replace(/-/g, "/");
          const d = new Date(cleanStr);
          if (!isNaN(d.getTime())) {
            dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
          } else {
            dateStr = act.dateTime.split(" ")[0] || act.dateTime;
          }
        } catch {
          dateStr = act.dateTime;
        }
      }
      items.push({
        id: act.id,
        title: act.title,
        content: act.description || "",
        dateStr: dateStr,
        orgName: act.orgName || "Hoạt động Phong trào",
        imageUrl: convertGoogleDriveUrlToDirectUrl(act.imageUrl),
        type: "ACTIVITY"
      });
    });

    return items;
  }, [announcements, activities]);

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
      className="h-screen h-dvh max-h-screen flex flex-col justify-between py-4 px-4 sm:px-8 selection:bg-indigo-500 selection:text-white relative bg-white font-sans text-slate-800 overflow-hidden max-sm:h-auto max-sm:min-h-screen max-sm:overflow-y-auto" 
      id="unihub-login-screen"
    >
      {/* 1. Top Header Navigation Bar (Transparent, Aligned Left Logo/Title & Right Login) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 py-2 shrink-0">
        {/* Left Side: Brand Logo Badge & Title */}
        <div className="flex items-center gap-2 sm:gap-4 text-left min-w-0 flex-1">
          {/* Institution Logo Badge */}
          <div className="w-10 h-10 sm:w-18 md:w-22 sm:h-18 md:h-22 bg-white rounded-full shadow-md border border-slate-200/90 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
            {themeConfig?.logoUrl ? (
              <img 
                src={convertGoogleDriveUrlToDirectUrl(themeConfig.logoUrl)} 
                alt="Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            ) : (
              <TnuLogo size={48} />
            )}
          </div>

          {/* Institutional Divider line */}
          <div className="hidden md:block w-px h-12 bg-slate-200/80 shrink-0 mx-0.5"></div>

          {/* Typography Header Block */}
          <div className="flex flex-col justify-center min-w-0 flex-1">
            {/* Top Institutional Identity Tagline (100% full text, no ellipsis) */}
            <span className="text-[10px] sm:text-xs font-bold text-blue-950 uppercase font-sans leading-tight block">
              PHÂN HIỆU ĐHTN TẠI HÀ GIANG
            </span>

            {/* Main Portal Title (100% full text, no ellipsis) */}
            <h1 className="text-xs sm:text-xl md:text-3xl font-black text-slate-900 leading-tight font-sans mt-0.5">
              {themeConfig?.loginTitle ? (
                themeConfig.loginTitle
              ) : (
                <>
                  CỔNG THÔNG TIN <span className="text-blue-900">UNIHUBHG</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="hidden md:block text-xs sm:text-sm text-slate-600 font-medium mt-0.5 leading-normal max-w-2xl font-sans">
              {themeConfig?.loginSubtitle || "Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang - Tra cứu ngay thông tin của bạn"}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Login Modal Trigger Button */}
        <div className="shrink-0">
          <button 
            onClick={() => setShowLoginModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] sm:text-sm py-1.5 px-2.5 sm:py-3 sm:px-7 rounded-lg sm:rounded-xl shadow-md hover:shadow-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer transform hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <LogIn size={14} />
            <span>Đăng nhập</span>
          </button>
        </div>
      </header>

      {/* 2. Middle Section: Split 2-Column Desktop Layout (Left: 16:9 Banner Slider, Right: News Feed) */}
      <main className="relative z-10 w-full max-w-7xl mx-auto my-3 flex-1 flex flex-col justify-center min-h-0 overflow-hidden max-lg:my-4 max-lg:flex-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch h-full max-h-full min-h-0 w-full">
          
          {/* Left Column (lg:col-span-7): Widescreen 16:9 Banner Slider Box */}
          <div className="lg:col-span-7 flex flex-col justify-center min-h-0 h-full max-h-full">
            {hasBg ? (
              <div className="h-full max-h-full aspect-video w-auto max-w-full rounded-[24px] sm:rounded-[32px] shadow-lg border border-slate-200 relative bg-white mx-auto p-1.5 sm:p-2 max-lg:w-full max-lg:h-auto">
                <div className="relative h-full w-full overflow-hidden rounded-[18px] sm:rounded-[24px] bg-slate-50">
                  {/* Seamless horizontal filmstrip */}
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
                        className="h-full w-full object-contain flex-shrink-0 select-none p-0.5"
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

                  {/* Dark Tint & Blur Overlay */}
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
              <div className="w-full aspect-[16/9] bg-slate-100 rounded-[24px] border border-slate-200 flex items-center justify-center">
                <span className="text-slate-400 text-sm">Chưa có ảnh nền nào được tải lên.</span>
              </div>
            )}
          </div>

          {/* Right Column (lg:col-span-5): "Tin tức và các hoạt động phong trào" News Board */}
          <div className="lg:col-span-5 flex flex-col min-h-0 h-full max-h-full bg-white backdrop-blur-md rounded-[24px] sm:rounded-[32px] border border-slate-200 p-4 sm:p-5 shadow-lg text-left overflow-hidden">
            {/* Header Title */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Newspaper size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-wide leading-tight">
                    Tin tức và các hoạt động phong trào
                  </h3>
                  <span className="text-[11px] text-slate-600 font-medium">CLB, Đoàn Thanh niên, Hội Sinh viên & Phân hiệu</span>
                </div>
              </div>
            </div>

            {/* News Items Scrollable List */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 custom-scrollbar min-h-0">
              {newsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="p-4 bg-blue-50 rounded-2xl mb-4 text-blue-900 border border-blue-100">
                    <Calendar size={36} className="text-blue-900" />
                  </div>
                  <p className="text-base font-bold text-[#0f172a]">Chưa có hoạt động, sự kiện diễn ra</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Các hoạt động và sự kiện sẽ hiển thị tại đây khi được tạo mới.</p>
                </div>
              ) : (
                newsList.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedNews(item)}
                    className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    {/* News Thumbnail Image or Icon Badge (Left side of card) */}
                    {item.imageUrl ? (
                      <div className="w-20 sm:w-24 aspect-[4/3] rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative">
                        <img 
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                        {item.type === "ANNOUNCEMENT" ? <Newspaper size={20} /> : <Calendar size={20} />}
                      </div>
                    )}

                    {/* News Details (Right side of card) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate max-w-[140px] text-indigo-500 font-medium">{item.orgName}</span>
                        <span className="shrink-0">{item.dateStr}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* 3. Lower Section: Contact Info & Footer (Dynamic parameters from Admin) */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-3 border-t border-slate-200 flex flex-col gap-3 shrink-0">
        {/* Contact details row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left text-sm text-slate-700">
          <div className="flex items-start gap-2.5">
            <MapPin className="text-blue-700 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="block font-bold text-[#0f172a] mb-0.5 text-xs">Địa chỉ</span>
              <span className="text-[11px] leading-snug text-slate-800 font-semibold">{themeConfig?.contactAddress || "Tổ 10, Phường Nguyễn Trãi, Thành phố Hà Giang, Tỉnh Hà Giang"}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5">
            <Mail className="text-blue-700 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="block font-bold text-[#0f172a] mb-0.5 text-xs">Email liên hệ</span>
              <span className="text-[11px] leading-snug text-slate-800 font-semibold">{themeConfig?.contactEmail || "phhagiang@tnu.edu.vn"}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="text-blue-700 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="block font-bold text-[#0f172a] mb-0.5 text-xs">Điện thoại</span>
              <span className="text-[11px] leading-snug text-slate-800 font-semibold">{themeConfig?.contactPhone || "0219.386.1234"}</span>
            </div>
          </div>
        </div>

        {/* Footer legal brand line */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-1 text-[11px] text-slate-700 font-medium border-t border-slate-200 pt-2">
          <div>
            Hệ thống UniHub Rèn luyện © 2026. Phiên bản 1.0 - Phân hiệu Đại học Thái Nguyên tại Hà Giang.
          </div>
          <div className="font-mono text-slate-800 font-semibold">
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
                        <img src={convertGoogleDriveUrlToDirectUrl(themeConfig.logoUrl)} alt="Logo" className="w-full h-full object-contain rounded-full p-0.5" />
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
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="••••••••" 
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all text-slate-800"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={showPassword ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
      {/* News Detail View Modal */}
      {selectedNews && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left"
          onClick={() => setSelectedNews(null)}
        >
          <div 
            className="bg-slate-900 border border-white/15 text-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                <Newspaper size={14} />
                <span>{selectedNews.orgName}</span>
                <span>•</span>
                <span>{selectedNews.dateStr}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                {selectedNews.title}
              </h2>

              {selectedNews.imageUrl && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                  <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line border-t border-white/10 pt-4">
                {selectedNews.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
