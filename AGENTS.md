# AGENTS.md - Quy định bắt buộc cho AI Assistant

## QUY TẮC THIẾT KẾ GIAO DIỆN (BẮT BUỘC VĨNH VIỄN 100%)

Từ bây giờ trở đi, **MỌI CÔNG VIỆC** liên quan đến giao diện (UI/UX), bao gồm:
- Tạo mới hoặc chỉnh sửa trang (page), portal, dashboard.
- Tạo hoặc refactor linh kiện (components: buttons, inputs, tables, cards, modals, dropdowns).
- Bố cục responsive trên cả **Web PC và Mobile**.
- Thông báo, empty states, loading skeletons, tương tác vi mô (micro-interactions).

👉 **BẮT BUỘC PHẢI ÁP DỤNG TRIỆT ĐỂ** quy chuẩn trong:
1. [`.agents/rules/ui-ux-design-mastery.md`](./.agents/rules/ui-ux-design-mastery.md)
2. [`skills/ui-ux-design-mastery/SKILL.md`](./skills/ui-ux-design-mastery/SKILL.md)

### 6 Tiêu chuẩn bắt buộc không được bỏ sót:
1. **Phân cấp thị giác**: Không chỉ phóng to chữ. Dùng font-weight (`font-semibold`) và màu (`text-slate-900` vs `text-slate-500`). Bớt nhãn thừa. Phân rõ 3 tầng nút (Primary / Secondary / Ghost).
2. **Hệ thống khoảng cách & Giảm viền (Border Diet)**: Lưới 4px/8px (`p-4`, `p-6`, `gap-6`). Không lạm dụng viền đen/xám cứng; thay bằng độ lệch nền (`bg-slate-50` / `bg-white`) và bóng đổ mềm (`ring-1 ring-slate-900/5 shadow-sm`).
3. **Typography**: Type scale đồng bộ. Line-height tỉ lệ nghịch với font-size (`leading-tight` cho tiêu đề, `leading-relaxed` cho body). Chữ in hoa bắt buộc `tracking-wider`. Dữ liệu số căn phải kèm `tabular-nums font-mono`.
4. **Màu sắc**: Không dùng đen tuyệt đối `#000000`. Chuẩn tương phản WCAG AA (tối thiểu 4.5:1).
5. **Tương tác**: Đủ 5 trạng thái (Hover, Focus ring, Active scale, Disabled, Loading skeleton). Luôn có Empty State có minh họa và nút CTA khi không có dữ liệu.
6. **Mobile First & Deploy đồng bộ**: Vùng chạm di động tối thiểu 44px. Luôn đảm bảo hiển thị hoàn hảo trên cả Web PC và Mobile. Luôn deploy đồng bộ cả 2 repo `unihubhg` và `unihub-admin`.
