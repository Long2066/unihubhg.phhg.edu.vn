import React, { useState, useEffect, useMemo } from "react";
import { useUniHub } from "../state";
import { convertGoogleDriveUrlToDirectUrl } from "../types";
import { TnuLogo } from "./TnuLogo";
import { 
  LogIn,
  MapPin,
  Mail,
  Phone,
  Newspaper,
  Calendar,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  X,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Award,
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  Menu
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

type NavModalType = "ABOUT" | "DEGREE" | "GUIDE" | null;

export const LoginScreen: React.FC = () => {
  const { login, themeConfig, announcements, activities, organizations } = useUniHub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsFeedItem | null>(null);
  const [activeNavModal, setActiveNavModal] = useState<NavModalType>(null);
  const [newsFilter, setNewsFilter] = useState<"ALL" | "ANNOUNCEMENT" | "ACTIVITY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Background carousel state
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const bgList = useMemo(() => {
    const configuredImages = themeConfig?.loginBgUrls && themeConfig.loginBgUrls.length > 0
      ? themeConfig.loginBgUrls
      : (themeConfig?.loginBgUrl ? [themeConfig.loginBgUrl] : []);

    const validUrls = configuredImages
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      .map(url => convertGoogleDriveUrlToDirectUrl(url));

    // Fallback if none provided
    if (validUrls.length === 0) {
      return ["/logo.png.png"];
    }
    return validUrls;
  }, [themeConfig?.loginBgUrl, themeConfig?.loginBgUrls]);

  // Auto slide timer
  useEffect(() => {
    if (bgList.length <= 1) return;
    const intervalTime = (themeConfig?.bgTransitionInterval || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgList.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [bgList.length, themeConfig?.bgTransitionInterval]);

  const handlePrevSlide = () => {
    setCurrentBgIndex((prev) => (prev === 0 ? bgList.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentBgIndex((prev) => (prev + 1) % bgList.length);
  };

  // B3: Helper sanitize imageUrl — chỉ chấp nhận http:// hoặc https://, loại bỏ javascript:
  const sanitizeImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed) && !/javascript:/i.test(trimmed)) {
      return trimmed;
    }
    return undefined;
  };

  const newsList = useMemo(() => {
    const items: NewsFeedItem[] = [];
    // B2: Tạo biến todayStr để kiểm tra expiryDate
    const todayStr = new Date().toISOString().split("T")[0];

    (announcements || []).forEach((ann) => {
      // B2: Kiểm tra expiryDate — bỏ qua nếu đã hết hạn
      if (ann.expiryDate && todayStr > ann.expiryDate) return;

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
        orgName: ann.orgName || "Phân hiệu ĐHTN tại Hà Giang",
        imageUrl: sanitizeImageUrl(convertGoogleDriveUrlToDirectUrl(ann.imageUrl)),
        type: "ANNOUNCEMENT"
      });
    });

    const sourceActivities = activities || [];

    sourceActivities.forEach((act) => {
      // B2: Kiểm tra expiryDate — bỏ qua nếu đã hết hạn
      if (act.expiryDate && todayStr > act.expiryDate) return;

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
      const matchedOrg = (organizations || []).find(o => o.id === act.orgId);
      let resolvedOrgName = matchedOrg?.name;
      if (!resolvedOrgName) {
        if (act.orgId === "DOANTN") resolvedOrgName = "Đoàn TNCS Phân hiệu Hà Giang";
        else if (act.orgId === "HOISV") resolvedOrgName = "Hội Sinh viên Phân hiệu Hà Giang";
        else if (act.orgId === "DOAN_HOI") resolvedOrgName = "Đoàn - Hội Sinh viên";
        else resolvedOrgName = act.orgName || "Hoạt động Phong trào";
      }

      items.push({
        id: act.id,
        title: act.title,
        content: act.description || "",
        dateStr: dateStr,
        orgName: resolvedOrgName,
        imageUrl: sanitizeImageUrl(convertGoogleDriveUrlToDirectUrl(act.imageUrl)),
        type: "ACTIVITY"
      });
    });

    // B6: Sort theo ngày mới nhất trước
    items.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    return items;
  }, [announcements, activities, organizations]);

  const filteredNews = useMemo(() => {
    return newsList.filter(item => {
      const matchType = newsFilter === "ALL" || item.type === newsFilter;
      const matchSearch = searchQuery.trim() === "" || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orgName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [newsList, newsFilter, searchQuery]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Vui lòng nhập tên đăng nhập, email hoặc mã số.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const success = await login(email, password);
      if (success) {
        setErrorMsg("");
      } else {
        setErrorMsg("Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin đăng nhập.");
      }
    } catch (err) {
      setErrorMsg("Lỗi hệ thống khi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between bg-slate-50/70 font-sans text-slate-800 selection:bg-red-600 selection:text-white"
      id="unihub-portal-landing"
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER NAVIGATION (Sắc nét, Đúng nhận diện trường) */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3.5">
          
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 w-full">
            {/* Left: Brand Identity (Tối ưu cỡ chữ nhỏ gọn & giãn dòng cho dấu tiếng Việt hiển thị 100% không bị cắt) */}
            <div className="flex items-center gap-1.5 sm:gap-3.5 min-w-0 flex-1 overflow-hidden pr-1">
              <div className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 flex items-center justify-center">
                {themeConfig?.logoUrl ? (
                  <img 
                    src={convertGoogleDriveUrlToDirectUrl(themeConfig.logoUrl)} 
                    alt="Logo TNU HGC" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <TnuLogo size={48} className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-14 sm:h-14 md:w-16 md:h-16" />
                )}
              </div>

              <div className="flex flex-col min-w-0 justify-center py-0.5">
                <span className="text-[6.5px] min-[340px]:text-[7px] min-[370px]:text-[7.8px] min-[400px]:text-[8.5px] sm:text-xs md:text-sm font-bold text-[#0c529c] uppercase tracking-normal leading-normal whitespace-nowrap block">
                  PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI HÀ GIANG
                </span>
                <h1 className="text-[8px] min-[340px]:text-[8.8px] min-[370px]:text-[9.8px] min-[400px]:text-[10.5px] sm:text-base md:text-lg lg:text-xl font-extrabold text-[#0c529c] uppercase tracking-normal leading-snug whitespace-nowrap block mt-0.5">
                  {themeConfig?.loginTitle || "CỔNG THÔNG TIN SINH VIÊN"}
                </h1>
              </div>
            </div>

            {/* Desktop Right: Search Box Centered on Top + Navigation Menu & Login Below (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
              {/* Search input pill */}
              <div className="w-72 sm:w-80 md:w-96 max-w-full">
                <div className="relative w-full">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-4 pr-10 py-1.5 text-xs sm:text-sm rounded-full border border-slate-300 focus:outline-none focus:border-[#0c529c] focus:ring-1 focus:ring-[#0c529c] transition-all bg-slate-50/50"
                  />
                  <button 
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0c529c] text-white flex items-center justify-center hover:bg-blue-800 transition-colors cursor-pointer"
                    title="Tìm kiếm"
                  >
                    <Search size={12} />
                  </button>
                </div>
              </div>

              {/* Navigation Links + Blue Login Button */}
              <div className="flex items-center gap-2">
                <nav className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                  <button 
                    onClick={() => { setNewsFilter("ALL"); setSearchQuery(""); }}
                    className="px-3 py-1 rounded-full border border-[#0c529c] text-[#0c529c] font-bold hover:bg-blue-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    TRANG CHỦ
                  </button>
                  <button 
                    onClick={() => setActiveNavModal("ABOUT")}
                    className="px-2.5 py-1 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    GIỚI THIỆU
                  </button>
                  <button 
                    onClick={() => setActiveNavModal("DEGREE")}
                    className="px-2.5 py-1 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    TRA CỨU VĂN BẰNG
                  </button>
                  <button 
                    onClick={() => setActiveNavModal("GUIDE")}
                    className="px-2.5 py-1 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    HƯỚNG DẪN
                  </button>
                </nav>

                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-[#0c529c] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm py-1.5 px-4 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95 whitespace-nowrap"
                >
                  <LogIn size={15} />
                  <span>Đăng nhập</span>
                </button>
              </div>
            </div>

            {/* Mobile Actions: Fast Login Button + Hamburger Menu (Visible on Mobile only) */}
            <div className="flex items-center gap-1 sm:gap-1.5 lg:hidden shrink-0">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-[#0c529c] hover:bg-blue-800 text-white font-bold text-[10px] min-[360px]:text-xs py-1.5 px-2 min-[360px]:px-2.5 rounded-full shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              >
                <LogIn size={12} className="shrink-0" />
                <span>Đăng nhập</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 sm:p-1.5 text-slate-700 hover:text-[#0c529c] hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
                title="Menu"
                aria-label="Mở menu điều hướng"
              >
                <div className={`transition-transform duration-300 ${mobileMenuOpen ? "rotate-90" : "rotate-0"}`}>
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </div>
              </button>
            </div>

          </div>

          {/* Mobile Navigation Drawer / Dropdown (Hiệu ứng trượt mở mượt mà, không giật đột ngột) */}
          <div 
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen 
                ? "max-h-96 opacity-100 pt-3 pb-1 border-t border-slate-150 mt-2.5" 
                : "max-h-0 opacity-0 pt-0 pb-0 border-t-0 mt-0 pointer-events-none"
            }`}
          >
            <div className={`space-y-2.5 transition-all duration-300 ease-out transform ${
              mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            }`}>
              {/* Mobile Search Box */}
              <div className="relative w-full">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tin tức, sự kiện..."
                  className="w-full pl-4 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#0c529c] focus:ring-1 focus:ring-[#0c529c] transition-all bg-slate-50"
                />
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#0c529c] text-white flex items-center justify-center hover:bg-blue-800 transition-colors"
                  title="Tìm kiếm"
                >
                  <Search size={13} />
                </button>
              </div>

              {/* Mobile Quick Link Grid (Không icon emoji theo yêu cầu) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button 
                  onClick={() => { setNewsFilter("ALL"); setSearchQuery(""); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-[#0c529c] text-center flex items-center justify-center transition-all hover:bg-blue-100 active:scale-98 cursor-pointer"
                >
                  <span>TRANG CHỦ</span>
                </button>
                <button 
                  onClick={() => { setActiveNavModal("ABOUT"); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-center flex items-center justify-center transition-all active:scale-98 cursor-pointer"
                >
                  <span>GIỚI THIỆU</span>
                </button>
                <button 
                  onClick={() => { setActiveNavModal("DEGREE"); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-center flex items-center justify-center transition-all active:scale-98 cursor-pointer"
                >
                  <span>VĂN BẰNG</span>
                </button>
                <button 
                  onClick={() => { setActiveNavModal("GUIDE"); setMobileMenuOpen(false); }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-center flex items-center justify-center transition-all active:scale-98 cursor-pointer"
                >
                  <span>HƯỚNG DẪN</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT (BỐ CỤC 2 CỘT TỰ NHIÊN - KHÔNG BÓ KHUNG) */}
      {/* ========================================================= */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 flex flex-col justify-start">
        
        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ------------------------------------------------------------- */}
          {/* CỘT TRÁI (7 Cột): BANNER TOÀN CẢNH KHUÔN VIÊN TRƯỜNG SLIDER   */}
          {/* Hiển thị tự nhiên, 100% trọn vẹn không bị cắt chữ slogan       */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Banner Container */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-sm bg-slate-900 group flex items-center justify-center">
              {/* Image Slide */}
              <div className="relative w-full h-full">
                {bgList.map((bgUrl, index) => (
                  <div
                    key={`${bgUrl}-${index}`}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${
                      index === currentBgIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img 
                      src={bgUrl} 
                      alt={`Ảnh khuôn viên trường ${index + 1}`}
                      className="w-full h-full object-contain select-none"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>

              {/* Slider Controls (Left & Right Arrows) */}
              {bgList.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-md flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-105 cursor-pointer"
                    title="Ảnh trước"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button 
                    onClick={handleNextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-md flex items-center justify-center backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-105 cursor-pointer"
                    title="Ảnh tiếp theo"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-y-0 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-xs">
                    {bgList.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setCurrentBgIndex(dotIdx)}
                        className={`transition-all rounded-full ${
                          dotIdx === currentBgIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                        }`}
                        title={`Xem ảnh ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>


          </div>

          {/* ------------------------------------------------------------- */}
          {/* CỘT PHẢI (5 Cột): BẢNG TIN TỨC & HOẠT ĐỘNG PHONG TRÀO          */}
          {/* Dạng phẳng, phân tách thanh lịch, không đóng hộp viền xám dày   */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col">
            
            {/* Header Title & Filter Tabs */}
            <div className="pb-3 border-b border-slate-200 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#d32f2f]" />
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                    Tin tức & Hoạt động phong trào
                  </h2>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {filteredNews.length} tin
                </span>
              </div>

              {/* Filter Pills (Scrollable on small mobile without wrapping breakage) */}
              <div className="flex items-center gap-1.5 text-xs font-medium overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                <button
                  onClick={() => setNewsFilter("ALL")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    newsFilter === "ALL"
                      ? "bg-[#0c529c] text-white font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setNewsFilter("ANNOUNCEMENT")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    newsFilter === "ANNOUNCEMENT"
                      ? "bg-[#0c529c] text-white font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Thông báo Phân hiệu
                </button>
                <button
                  onClick={() => setNewsFilter("ACTIVITY")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    newsFilter === "ACTIVITY"
                      ? "bg-[#0c529c] text-white font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Đoàn - Hội Sinh viên
                </button>
              </div>
            </div>

            {/* News Articles List (Thoáng đãng, phân tách nhẹ nhàng) */}
            <div className="divide-y divide-slate-100 max-h-[460px] sm:max-h-[520px] overflow-y-auto custom-scrollbar pr-1 mt-1">
              {filteredNews.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Newspaper className="mx-auto mb-2 opacity-40" size={32} />
                  <p className="text-sm font-medium">Không tìm thấy thông tin phù hợp.</p>
                </div>
              ) : (
                filteredNews.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => setSelectedNews(item)}
                    className="py-3.5 sm:py-4 flex gap-3 sm:gap-3.5 items-start hover:bg-white/90 p-2 rounded-xl transition-all cursor-pointer group"
                  >
                    {/* Thumbnail Image */}
                    {item.imageUrl ? (
                      <div className="w-20 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 relative">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 text-[#0c529c] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                        {item.type === "ANNOUNCEMENT" ? <Newspaper size={18} /> : <Calendar size={18} />}
                      </div>
                    )}

                    {/* Article Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Tag */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-sm uppercase ${
                            item.type === "ANNOUNCEMENT" 
                              ? "bg-red-50 text-[#d32f2f] border border-red-100" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {item.type === "ANNOUNCEMENT" ? "Thông báo" : "Hoạt động"}
                          </span>
                          <span className="text-[10.5px] sm:text-[11px] text-slate-400">{item.dateStr}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0c529c] transition-colors line-clamp-2 leading-snug break-words">
                          {item.title}
                        </h3>
                      </div>

                      {/* Organization Name */}
                      <p className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium truncate mt-1.5">
                        {item.orgName}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>

          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. FOOTER (THÔNG TIN LIÊN HỆ PHÂN HIỆU ĐHTN HÀ GIANG)       */}
      {/* ========================================================= */}
      <footer className="w-full bg-white border-t border-slate-200/80 mt-6 pt-5 pb-16 sm:pb-5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 pb-4 border-b border-slate-100 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <MapPin className="text-[#0c529c] shrink-0 mt-0.5" size={16} />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 block mb-0.5">Địa chỉ</span>
                <span className="break-words">{themeConfig?.contactAddress || "Tổ 10, Phường Nguyễn Trãi, TP. Hà Giang, Tỉnh Hà Giang"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="text-[#0c529c] shrink-0 mt-0.5" size={16} />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 block mb-0.5">Email liên hệ</span>
                <span className="break-all">{themeConfig?.contactEmail || "phhagiang@tnu.edu.vn"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="text-[#0c529c] shrink-0 mt-0.5" size={16} />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 block mb-0.5">Điện thoại / Hotline</span>
                <span>{themeConfig?.contactPhone || "0219.386.1234"}</span>
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-slate-500 text-center sm:text-left">
            <div>
              © 2026 <strong>Phân hiệu Đại học Thái Nguyên tại Hà Giang</strong>. Cổng thông tin Sinh viên UniHubHG.
            </div>
            <div className="flex items-center gap-3">
              <span className="hover:text-[#0c529c] cursor-pointer" onClick={() => setActiveNavModal("GUIDE")}>Điều khoản sử dụng</span>
              <span>•</span>
              <span className="hover:text-[#0c529c] cursor-pointer" onClick={() => setActiveNavModal("GUIDE")}>Hỗ trợ kỹ thuật</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 4. LOGIN MODAL POPUP                                      */}
      {/* ========================================================= */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-7 relative flex flex-col text-left" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>

            {/* Modal Header (Căn giữa toàn bộ, không có logo theo yêu cầu) */}
            <div className="mb-5 text-center">
              <div className="text-center mb-2 space-y-0.5">
                <span className="text-[11px] sm:text-xs font-extrabold text-[#d32f2f] uppercase tracking-wider block">
                  PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI HÀ GIANG
                </span>
                <span className="text-xs sm:text-sm font-mono font-black uppercase tracking-wider text-[#0c529c] block">
                  {themeConfig?.loginTitle || "CỔNG THÔNG TIN SINH VIÊN"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2.5">Đăng nhập hệ thống</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Dành cho Sinh viên, Giảng viên và Cán bộ Phân hiệu</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập / Email / Mã SV / CCCD
                </label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Nhập mã sinh viên hoặc email..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0c529c]/20 focus:border-[#0c529c] text-sm transition-all text-slate-800"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
                  <button
                    type="button" 
                    onClick={() => alert("Nếu quên mật khẩu hoặc đăng nhập lần đầu, vui lòng nhập số CCCD hoặc liên hệ Phòng Đào tạo & Quản lý Sinh viên.")}
                    className="text-xs text-[#0c529c] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
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
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0c529c]/20 focus:border-[#0c529c] text-sm transition-all text-slate-800"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
                    title={showPassword ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex gap-2 items-start text-xs text-red-600">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className={`w-full ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-[#0c529c] hover:bg-blue-800 cursor-pointer"} text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-2`}
              >
                <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Assistance note */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center space-y-1">
              <p>Hỗ trợ tài khoản: <strong>Phòng Đào tạo & Quản lý Sinh viên</strong></p>
              <p className="text-[10px] text-slate-400">Điện thoại hỗ trợ: {themeConfig?.contactPhone || "0219.386.1234"}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. NEWS ARTICLE DETAIL MODAL                              */}
      {/* ========================================================= */}
      {selectedNews && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in text-left"
          onClick={() => setSelectedNews(null)}
        >
          <div 
            className="bg-white text-slate-800 w-full max-w-2xl rounded-2xl p-4 sm:p-7 relative max-h-[90dvh] max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto pr-1 sm:pr-2 custom-scrollbar space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 text-[#0c529c] text-[11px] sm:text-xs font-bold uppercase tracking-wider flex-wrap">
                <span className="px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-100">{selectedNews.orgName}</span>
                <span>•</span>
                <span className="text-slate-500">{selectedNews.dateStr}</span>
              </div>

              <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 leading-snug break-words">
                {selectedNews.title}
              </h2>

              {selectedNews.imageUrl && (
                <div className="w-full aspect-[16/9] max-h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative flex items-center justify-center">
                  <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-contain" />
                </div>
              )}

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3 break-words">
                {selectedNews.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. NAVIGATION INFO MODALS (Chương trình đào tạo, Lịch, v.v) */}
      {/* ========================================================= */}
      {activeNavModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in text-left"
          onClick={() => setActiveNavModal(null)}
        >
          <div 
            className="bg-white text-slate-800 w-full max-w-xl max-h-[90dvh] max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-7 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveNavModal(null)}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-[#0c529c] font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>Phân hiệu Đại học Thái Nguyên tại Hà Giang</span>
            </div>

            {activeNavModal === "ABOUT" && (
              <div className="space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0c529c] uppercase tracking-wide border-b border-blue-100 pb-1.5 mb-2">
                    Giới thiệu Phân hiệu Đại học Thái Nguyên tại Hà Giang
                  </h3>
                  <p className="leading-relaxed text-slate-600">
                    <strong>Phân hiệu Đại học Thái Nguyên tại Hà Giang</strong> (tên tiếng Anh: <em>Thai Nguyen University Campus in Ha Giang - TNU HGC</em>) được thành lập theo <strong>Quyết định số 416/QĐ-BGDĐT</strong> ngày 10/02/2023 của Bộ trưởng Bộ Giáo dục và Đào tạo, là cơ sở giáo dục đại học công lập trực thuộc Đại học Thái Nguyên – Đại học Vùng trọng điểm Quốc gia.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-[#0c529c] text-xs uppercase mb-1 flex items-center gap-1.5">
                      🎯 Sứ mạng
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Đào tạo nguồn nhân lực trình độ cao, chất lượng cao, đa ngành, đa lĩnh vực; nghiên cứu khoa học, chuyển giao công nghệ và hợp tác quốc tế; phục vụ trực tiếp cho sự phát triển kinh tế - xã hội, bảo đảm quốc phòng - an ninh của tỉnh Hà Giang và khu vực Trung du, Miền núi phía Bắc.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-800 text-xs uppercase mb-1 flex items-center gap-1.5">
                      🔭 Tầm nhìn
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Xây dựng Phân hiệu trở thành trung tâm đào tạo đại học, sau đại học, nghiên cứu ứng dụng khoa học công nghệ và đổi mới sáng tạo có uy tín hàng đầu tại vùng biên cương địa đầu Tổ quốc.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase mb-1.5">
                    🎓 Các ngành đào tạo Đại học chính quy tiêu biểu
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="font-semibold text-[#0c529c] block mb-1">📚 Khối Sư phạm & Giáo dục:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        <li>Giáo dục Tiểu học</li>
                        <li>Giáo dục Mầm non</li>
                        <li>Sư phạm Tiếng Anh</li>
                      </ul>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="font-semibold text-[#0c529c] block mb-1">💻 Khối Kỹ thuật, Kinh tế & Xã hội:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                        <li>Công nghệ Thông tin</li>
                        <li>Quản trị Dịch vụ Du lịch và Lữ hành</li>
                        <li>Ngôn ngữ Trung Quốc</li>
                        <li>Luật Kinh tế & Quản lý Đất đai</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 text-xs mb-1">📍 Thông tin liên hệ chính thức:</div>
                  <div>• <strong>Địa chỉ:</strong> Tổ 16, Phường Nguyễn Trãi, Thành phố Hà Giang, Tỉnh Hà Giang</div>
                  <div>• <strong>Điện thoại / Hotline:</strong> 0219.386.1234 — 0988.xxx.xxx</div>
                  <div>• <strong>Email:</strong> phhagiang@tnu.edu.vn | banbientap@phhg.edu.vn</div>
                  <div>• <strong>Cổng thông tin:</strong> phhg.tnu.edu.vn | sinhvien-phhg.tnu.edu.vn</div>
                </div>
              </div>
            )}

            {activeNavModal === "DEGREE" && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Tra cứu Văn bằng & Chứng chỉ</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Hệ thống hỗ trợ cơ quan, doanh nghiệp và sinh viên tra cứu, xác thực thông tin văn bằng tốt nghiệp, chứng chỉ đào tạo do Phân hiệu cấp.
                </p>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-800">
                  Để tra cứu chính thức, vui lòng liên hệ trực tiếp Phòng Đào tạo & Quản lý Sinh viên hoặc đăng nhập tài khoản cổng thông tin.
                </div>
              </div>
            )}

            {activeNavModal === "GUIDE" && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Hướng dẫn Sử dụng Cổng thông tin</h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 mb-4">
                  <li><strong>Tên đăng nhập:</strong> Sử dụng Email công vụ (@hg.edu.vn / @phhg.edu.vn), Mã sinh viên hoặc số CCCD.</li>
                  <li><strong>Mật khẩu lần đầu:</strong> Nhập số CCCD của bạn nếu chưa đổi mật khẩu.</li>
                  <li><strong>Chức năng:</strong> Đánh giá rèn luyện trực tuyến, đăng ký tham gia sự kiện Đoàn - Hội, xem bảng điểm học tập, nộp minh chứng rèn luyện.</li>
                </ul>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  Hỗ trợ kỹ thuật: <strong>{themeConfig?.contactEmail || "phhagiang@tnu.edu.vn"}</strong> | Hotline: <strong>{themeConfig?.contactPhone || "0219.386.1234"}</strong>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button 
                onClick={() => { setActiveNavModal(null); setShowLoginModal(true); }}
                className="bg-[#0c529c] hover:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn size={14} />
                <span>Đăng nhập ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
