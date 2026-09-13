# UI/UX Design Mastery - Core Rules & Guidelines

Tài liệu quy tắc thiết kế giao diện người dùng (UI/UX) chuẩn mực cao cấp, tổng hợp từ các trường phái thiết kế hàng đầu: *Refactoring UI* (Adam Wathan & Steve Schoger), *Tailwind UI*, *Apple Human Interface Guidelines (HIG)* và *Material Design 3*.

Áp dụng bắt buộc cho tất cả các màn hình, component, layout và tương tác trong dự án.

---

## 1. Visual Hierarchy (Phân cấp thị giác) - Nguyên tắc tối thượng

- **Không chỉ dựa vào kích thước (Font Size)**:
  - Phân cấp bằng độ đậm (Font Weight) và độ tương phản màu sắc (Color Contrast).
  - Tiêu đề chính: `text-slate-900 font-bold` hoặc `font-semibold`.
  - Nội dung phụ: `text-slate-500 font-normal`.
  - Nhãn/metadata: `text-xs uppercase tracking-wider text-slate-400 font-medium`.
- **De-emphasize để làm nổi bật**: Giảm độ chói của các chi tiết thứ cấp thay vì làm mọi thứ to lên hoặc bôi đậm tất cả.
- **Hạn chế nhãn rườm rà (Label Diet)**:
  - Thay vì hiển thị `Email: user@example.com`, hiển thị trực tiếp icon + `user@example.com`.
  - Định dạng rõ ràng khiến người dùng tự nhận diện mà không cần nhãn chữ thừa thãi.
- **Hệ thống cấp bậc nút bấm (Button Hierarchy)**:
  - **Primary**: Chỉ 1 nút chính nổi bật nhất trên mỗi khu vực (Solid color, ví dụ `bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20`).
  - **Secondary**: Nền nhạt hoặc viền nhẹ (`bg-slate-100 hover:bg-slate-200 text-slate-700` hoặc `border border-slate-200 bg-white hover:bg-slate-50 text-slate-700`).
  - **Tertiary / Ghost**: Không nền, không viền, chỉ có chữ và icon (`text-slate-600 hover:bg-slate-100 hover:text-slate-900`).
  - **Destructive**: Dành cho tác vụ xóa/nguy hiểm (`bg-rose-50 hover:bg-rose-100 text-rose-600` hoặc `bg-rose-600 text-white`).

---

## 2. Layout, Spacing & Border Diet (Khoảng cách & Giảm viền)

- **Hệ thống khoảng cách bội số 4px/8px**:
  - Spacing nội bộ component: `p-3`, `p-4`, `p-6` (12px, 16px, 24px).
  - Khoảng cách giữa các khối lớn: `gap-6`, `gap-8`, `space-y-6`.
  - Khoảng cách bên trong luôn nhỏ hơn khoảng cách giữa các phần tử bên ngoài (Law of Proximity).
- **Giảm viền (Border Diet)**:
  - Tránh vẽ viền đen/xám cứng ở khắp mọi nơi.
  - Phân tách các khối bằng:
    1. Khoảng trắng tự nhiên (`padding`/`margin`).
    2. Nền tương phản nhẹ (`bg-slate-50` bao ngoài thẻ `bg-white`).
    3. Đổ bóng mềm (`shadow-sm`, `shadow-md border border-slate-100`).
  - Nếu bắt buộc dùng viền, dùng viền mờ tinh tế: `border-slate-100` hoặc `border-slate-200/70`.

---

## 3. Typography (Nghệ thuật chữ)

- **Type Scale chuẩn**:
  - Caption / Badge: `text-xs` (12px)
  - Secondary / Body nhỏ: `text-sm` (14px)
  - Body chuẩn: `text-base` (16px)
  - Subtitle / H3: `text-lg` (18px)
  - Card Title / H2: `text-xl` hoặc `text-2xl` (20px - 24px)
  - Page Title / H1: `text-3xl` hoặc `text-4xl` (30px - 36px)
- **Line-height tỉ lệ nghịch với font-size**:
  - Tiêu đề chữ to: `leading-tight` hoặc `leading-snug` để tránh thưa chữ.
  - Nội dung đọc (Body text): `leading-relaxed` hoặc `leading-normal` để đọc không mỏi mắt.
- **Letter-spacing**:
  - Chữ in hoa (ALL CAPS) **bắt buộc** phải tăng khoảng cách: `uppercase tracking-wider` hoặc `tracking-widest text-xs`.
  - Tiêu đề rất to có thể giảm nhẹ khoảng cách: `tracking-tight`.
- **Căn lề chuẩn mực**:
  - Văn bản đọc: Căn trái (`text-left`), không căn giữa các đoạn văn dài quá 2 dòng.
  - Dữ liệu số trong bảng: Căn phải (`text-right`) kèm `tabular-nums font-mono` để thẳng hàng cột.
  - Icon + Text: Căn giữa theo chiều dọc (`flex items-center gap-2`).

---

## 4. Color Palette & Contrast (Bảng màu & Tương phản)

- **Không bao giờ dùng màu đen tuyệt đối (#000000)**:
  - Thay bằng màu đen dịu: Slate 900 (`#0f172a`), Zinc 900 (`#18181b`) hoặc Gray 900 (`#111827`).
- **Bảng màu ngữ nghĩa (Semantic Roles)**:
  - **Primary**: Màu chủ đạo thương hiệu (Blue / Indigo / Emerald).
  - **Success**: Emerald / Green (`bg-emerald-50 text-emerald-700 border-emerald-200`).
  - **Warning**: Amber / Yellow (`bg-amber-50 text-amber-700 border-amber-200`).
  - **Danger / Error**: Rose / Red (`bg-rose-50 text-rose-700 border-rose-200`).
  - **Info**: Sky / Cyan (`bg-sky-50 text-sky-700 border-sky-200`).
- **Đảm bảo độ tương phản tiếp cận (WCAG AA)**:
  - Tối thiểu tỉ lệ tương phản 4.5:1 cho văn bản thường.
  - Không đặt chữ xám nhạt (`text-slate-300`) trên nền trắng.

---

## 5. Depth, Shadows & Elevation (Chiều sâu & Đổ bóng)

- **Nguồn sáng giả lập từ trên xuống (Top-down Light Source)**:
  - Đổ bóng nhẹ theo trục Y: `shadow-sm`, `shadow`, `shadow-lg`.
  - Kết hợp bóng với viền mờ cao cấp: `ring-1 ring-slate-900/5 shadow-sm rounded-2xl bg-white`.
- **Phân tầng bề mặt (Surface Elevations)**:
  - Tầng 0 (Background): `bg-slate-50` hoặc `bg-zinc-50`.
  - Tầng 1 (Cards, Tables): `bg-white rounded-xl shadow-sm border border-slate-100`.
  - Tầng 2 (Dropdowns, Popovers): `bg-white rounded-xl shadow-lg ring-1 ring-slate-900/10`.
  - Tầng 3 (Modals, Dialogs): `bg-white rounded-2xl shadow-2xl backdrop-blur-sm bg-black/40 (overlay)`.

---

## 6. Micro-interactions & Component States (Tương tác vi mô)

- **Đủ 5 trạng thái cho mọi phần tử tương tác**:
  1. **Default**: Trực quan, dễ hiểu.
  2. **Hover**: Đổi màu nền hoặc độ sáng nhẹ (`hover:bg-blue-700 transition-colors duration-150`).
  3. **Focus**: Vòng sáng rõ nét, thẩm mỹ (`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`).
  4. **Active**: Hiệu ứng bấm nhẹ (`active:scale-[0.98] transition-transform`).
  5. **Disabled**: Mờ và cấm trỏ chuột (`disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none`).
- **Empty States (Trạng thái rỗng) chuẩn chỉ**:
  - Không bao giờ để bảng trống hoặc màn hình trắng xóa khi chưa có dữ liệu.
  - Luôn có: Icon minh họa nhạt màu + Tiêu đề ngắn gọn + Lời mô tả hướng dẫn + Nút hành động chính (CTA).
- **Loading States**:
  - Dùng Skeleton (`animate-pulse bg-slate-200 rounded`) mô phỏng hình dáng khối nội dung thay vì spinner toàn trang gây khó chịu.

---

## 7. Responsive & Touch First (Tương thích Web PC & Mobile)

- **Kích thước vùng chạm (Touch Targets)**:
  - Nút bấm và icon trên di động phải đạt kích thước tối thiểu **44x44px** để bấm dễ dàng không bị nhầm.
- **Bố cục linh hoạt**:
  - Chuyển đổi mượt mà giữa Grid nhiều cột trên PC (`lg:grid-cols-3 md:grid-cols-2`) sang 1 cột trên Mobile (`grid-cols-1`).
  - Thanh công cụ / Action bar: cuộn ngang (`overflow-x-auto no-scrollbar`) hoặc xếp dọc (`flex-col sm:flex-row`).
- **Chống giật khung hình (Layout Shifts)**:
  - Cố định kích thước icon: `w-5 h-5 flex-shrink-0`.
  - Định rõ aspect-ratio hoặc chiều cao tối thiểu cho avatar, ảnh, thumbnail.
