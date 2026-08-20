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
  ChevronDown
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

type NavModalType = "TRAINING" | "SCHEDULE" | "DEGREE" | "GUIDE" | null;

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
  const [showToast, setShowToast] = useState(true);

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
        orgName: ann.orgName || "Phân hiệu ĐHTN tại Hà Giang",
        imageUrl: convertGoogleDriveUrlToDirectUrl(ann.imageUrl),
        type: "ANNOUNCEMENT"
      });
    });

    const sourceActivities = activities || [];

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
        imageUrl: convertGoogleDriveUrlToDirectUrl(act.imageUrl),
        type: "ACTIVITY"
      });
    });

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
        setErrorMsg("Tên đăng nhập hoặc mật khẩu không chính xác. Thử lại hoặc dùng số CCCD làm mật khẩu nếu đăng nhập lần đầu.");
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 flex items-center justify-center">
              {themeConfig?.logoUrl ? (
                <img 
                  src={convertGoogleDriveUrlToDirectUrl(themeConfig.logoUrl)} 
                  alt="Logo TNU HGC" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <TnuLogo size={56} className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-[#d32f2f] uppercase tracking-wide leading-tight truncate">
                PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI TỈNH HÀ GIANG
              </span>
              <h1 className="text-xs sm:text-base md:text-xl font-black text-[#0c529c] uppercase tracking-wide leading-tight mt-0.5">
                {themeConfig?.loginTitle || "CỔNG THÔNG TIN SINH VIÊN"}
              </h1>
            </div>
          </div>

          {/* Right: Quick Search + Nav items + Login Button */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Search Pill Input (Desktop) */}
            <div className="hidden xl:flex items-center relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-48 lg:w-56 pl-4 pr-9 py-1.5 text-xs rounded-full border border-slate-300 focus:outline-none focus:border-[#0c529c] focus:ring-1 focus:ring-[#0c529c] transition-all bg-slate-50/50"
              />
              <button 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0c529c] text-white flex items-center justify-center hover:bg-blue-800 transition-colors cursor-pointer"
                title="Tìm kiếm"
              >
                <Search size={12} />
              </button>
            </div>

            {/* Navigation links (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
              <button 
                onClick={() => { setNewsFilter("ALL"); setSearchQuery(""); }}
                className="px-3.5 py-1.5 rounded-full border border-[#0c529c] text-[#0c529c] font-bold hover:bg-blue-50 transition-colors cursor-pointer"
              >
                TRANG CHỦ
              </button>
              <button 
                onClick={() => setActiveNavModal("TRAINING")}
                className="px-2.5 py-1.5 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
              >
                CHƯƠNG TRÌNH ĐÀO TẠO
              </button>
              <button 
                onClick={() => setActiveNavModal("SCHEDULE")}
                className="px-2.5 py-1.5 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
              >
                LỊCH ĐĂNG KÝ
              </button>
              <button 
                onClick={() => setActiveNavModal("DEGREE")}
                className="px-2.5 py-1.5 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
              >
                TRA CỨU VĂN BẰNG
              </button>
              <button 
                onClick={() => setActiveNavModal("GUIDE")}
                className="px-2.5 py-1.5 hover:text-[#0c529c] transition-colors whitespace-nowrap cursor-pointer"
              >
                HƯỚNG DẪN
              </button>
            </nav>

            {/* Login Red Button */}
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs sm:text-sm py-2 px-3.5 sm:px-5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer transform active:scale-95"
            >
              <LogIn size={15} />
              <span>Đăng nhập</span>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT (BỐ CỤC 2 CỘT TỰ NHIÊN - KHÔNG BÓ KHUNG) */}
      {/* ========================================================= */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1 flex flex-col justify-start">
        
        {/* Search for mobile */}
        <div className="xl:hidden mb-4">
          <div className="relative w-full">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thông báo, sự kiện..."
              className="w-full pl-4 pr-10 py-2 text-sm rounded-full border border-slate-300 focus:outline-none focus:border-[#0c529c] bg-white shadow-xs"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0c529c] text-white flex items-center justify-center">
              <Search size={14} />
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ------------------------------------------------------------- */}
          {/* CỘT TRÁI (7 Cột): BANNER TOÀN CẢNH KHUÔN VIÊN TRƯỜNG SLIDER   */}
          {/* Hiển thị tự nhiên, không đóng khung hộp dày                    */}
          {/* ------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Banner Container */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden shadow-sm bg-slate-900 group">
              {/* Image Slide */}
              <div className="relative w-full h-full">
                {bgList.map((bgUrl, index) => (
                  <div
                    key={`${bgUrl}-${index}`}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      index === currentBgIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img 
                      src={bgUrl} 
                      alt={`Ảnh khuôn viên trường ${index + 1}`}
                      className="w-full h-full object-cover select-none"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    {/* Subtle bottom gradient for readability if needed */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
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

            {/* Quick Portal Feature Cards under Banner (Phẳng, Tự nhiên) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div 
                onClick={() => setActiveNavModal("TRAINING")}
                className="p-3 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200/80 transition-all cursor-pointer group flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c529c] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <BookOpen size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-[#0c529c]">Đào tạo</span>
                <span className="text-[10px] text-slate-500">Chương trình học</span>
              </div>

              <div 
                onClick={() => setActiveNavModal("SCHEDULE")}
                className="p-3 bg-white hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 transition-all cursor-pointer group flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Clock size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Lịch đăng ký</span>
                <span className="text-[10px] text-slate-500">Học phần & thi</span>
              </div>

              <div 
                onClick={() => setActiveNavModal("DEGREE")}
                className="p-3 bg-white hover:bg-amber-50/60 rounded-xl border border-slate-200/80 transition-all cursor-pointer group flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Award size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-amber-700">Tra cứu văn bằng</span>
                <span className="text-[10px] text-slate-500">Xác thực chứng chỉ</span>
              </div>

              <div 
                onClick={() => setActiveNavModal("GUIDE")}
                className="p-3 bg-white hover:bg-rose-50/60 rounded-xl border border-slate-200/80 transition-all cursor-pointer group flex flex-col items-center text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <HelpCircle size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-rose-700">Hướng dẫn</span>
                <span className="text-[10px] text-slate-500">Thủ tục & hỗ trợ</span>
              </div>
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

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <button
                  onClick={() => setNewsFilter("ALL")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    newsFilter === "ALL"
                      ? "bg-[#0c529c] text-white font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setNewsFilter("ANNOUNCEMENT")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    newsFilter === "ANNOUNCEMENT"
                      ? "bg-[#0c529c] text-white font-bold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  Thông báo Phân hiệu
                </button>
                <button
                  onClick={() => setNewsFilter("ACTIVITY")}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
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
                    className="py-3.5 sm:py-4 flex gap-3.5 items-start hover:bg-white/90 p-2 rounded-xl transition-all cursor-pointer group"
                  >
                    {/* Thumbnail Image */}
                    {item.imageUrl ? (
                      <div className="w-24 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 relative">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0c529c] flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
                        {item.type === "ANNOUNCEMENT" ? <Newspaper size={20} /> : <Calendar size={20} />}
                      </div>
                    )}

                    {/* Article Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Tag */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase ${
                            item.type === "ANNOUNCEMENT" 
                              ? "bg-red-50 text-[#d32f2f] border border-red-100" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {item.type === "ANNOUNCEMENT" ? "Thông báo" : "Hoạt động"}
                          </span>
                          <span className="text-[11px] text-slate-400">{item.dateStr}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0c529c] transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      {/* Organization Name */}
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-1.5">
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
      <footer className="w-full bg-white border-t border-slate-200/80 mt-6 pt-5 pb-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Contact Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <MapPin className="text-[#0c529c] shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Địa chỉ</span>
                <span>{themeConfig?.contactAddress || "Tổ 10, Phường Nguyễn Trãi, TP. Hà Giang, Tỉnh Hà Giang"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="text-[#0c529c] shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Email liên hệ</span>
                <span>{themeConfig?.contactEmail || "phhagiang@tnu.edu.vn"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="text-[#0c529c] shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Điện thoại / Hotline</span>
                <span>{themeConfig?.contactPhone || "0219.386.1234"}</span>
              </div>
            </div>
          </div>

          {/* Copyright Row */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div>
              © 2026 <strong>Phân hiệu Đại học Thái Nguyên tại tỉnh Hà Giang</strong>. Cổng thông tin Sinh viên UniHubHG.
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
      {/* 4. TOAST NOTIFICATION CORNER (Như trong ảnh mẫu thực tế)   */}
      {/* ========================================================= */}
      {showToast && (
        <aside 
          aria-label="Thông báo hoạt động mới"
          className="fixed bottom-4 right-4 z-30 max-w-xs sm:max-w-sm bg-white rounded-xl shadow-lg border border-slate-200/90 p-2.5 sm:p-3 flex items-center gap-3 animate-fade-in"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100/80 overflow-hidden shrink-0 flex items-center justify-center text-[#0c529c]">
            <Sparkles size={20} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <span className="block text-[11px] font-bold text-slate-800 truncate">
              Hoạt động sinh viên mới nhất
            </span>
            <span className="block text-[10px] text-slate-500 truncate">
              {newsList[0]?.title || "Hội thi phong trào học tập & rèn luyện Phân hiệu"}
            </span>
          </div>
          <button 
            onClick={() => setShowToast(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={14} />
          </button>
        </aside>
      )}

      {/* ========================================================= */}
      {/* 5. LOGIN MODAL POPUP                                      */}
      {/* ========================================================= */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-7 relative flex flex-col text-left" 
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

            {/* Modal Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[#0c529c] mb-1.5">
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <TnuLogo size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#d32f2f] uppercase tracking-wider block">
                    Phân hiệu ĐHTN tại Hà Giang
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0c529c]">
                    Cổng thông tin sinh viên
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">Đăng nhập hệ thống</h2>
              <p className="text-xs text-slate-500 mt-0.5">Dành cho Sinh viên, Giảng viên và Cán bộ Phân hiệu</p>
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
                className={`w-full ${loading ? "bg-red-400 cursor-not-allowed" : "bg-[#d32f2f] hover:bg-[#b71c1c] cursor-pointer"} text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-2`}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in text-left"
          onClick={() => setSelectedNews(null)}
        >
          <div 
            className="bg-white text-slate-800 w-full max-w-2xl rounded-2xl p-5 sm:p-7 relative max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div className="flex items-center gap-2 text-[#0c529c] text-xs font-bold uppercase tracking-wider">
                <span className="px-2 py-0.5 rounded-sm bg-blue-50 border border-blue-100">{selectedNews.orgName}</span>
                <span>•</span>
                <span className="text-slate-500">{selectedNews.dateStr}</span>
              </div>

              <h2 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                {selectedNews.title}
              </h2>

              {selectedNews.imageUrl && (
                <div className="w-full aspect-[16/9] max-h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative flex items-center justify-center">
                  <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-contain" />
                </div>
              )}

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in text-left"
          onClick={() => setActiveNavModal(null)}
        >
          <div 
            className="bg-white text-slate-800 w-full max-w-xl rounded-2xl p-5 sm:p-7 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveNavModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-[#0c529c] font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>Phân hiệu Đại học Thái Nguyên tại tỉnh Hà Giang</span>
            </div>

            {activeNavModal === "TRAINING" && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Chương trình Đào tạo</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Phân hiệu đào tạo đa ngành với các hệ chính quy, liên thông và vừa làm vừa học: Giáo dục Tiểu học, Giáo dục Mầm non, Sư phạm Tiếng Anh, Công nghệ Thông tin, Quản trị Dịch vụ Du lịch và Lữ hành, Ngôn ngữ Trung Quốc, v.v.
                </p>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-[#0c529c]">
                  Sinh viên đăng nhập vào hệ thống để tra cứu Khung chương trình đào tạo chi tiết và tiến độ tích lũy tín chỉ của lớp mình.
                </div>
              </div>
            )}

            {activeNavModal === "SCHEDULE" && (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Lịch Đăng ký Học phần & Kế hoạch Đào tạo</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Kế hoạch đăng ký học phần, lịch học, lịch thi kết thúc học phần được thông báo định kỳ theo từng học kỳ của năm học.
                </p>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-800">
                  Vui lòng đăng nhập tài khoản sinh viên để theo dõi lịch thi và thời hạn đăng ký học phần đúng hạn.
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
                className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-xs py-2 px-4 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
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
