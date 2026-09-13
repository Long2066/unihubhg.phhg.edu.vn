# Dual Git Repository Workflow Rule

Dự án này bao gồm 2 Repository Git độc lập:

1. **Main Portal (`unihubhg`)**:
   - Thư mục: `d:\HỆ THỐNG QUẢN LÍ SINH VIÊN PHHG\unihubhg`
   - Remote: `https://github.com/Long2066/unihubhg.phhg.edu.vn`
   - Vercel URL: `unihubhg.vercel.app`

2. **Admin Portal (`unihub-admin`)**:
   - Thư mục: `d:\HỆ THỐNG QUẢN LÍ SINH VIÊN PHHG\unihubhg\unihub-admin`
   - Remote: `https://github.com/Long2066/admin-unihubhg-phhg`
   - Vercel URL: `unihub-admin.vercel.app`

## Quy tắc bắt buộc khi Deploy:
1. **Đồng bộ cả Web PC và Mobile**:
   - Mọi lần deploy phải đảm bảo phiên bản mới hiển thị đồng thời trên cả trình duyệt Web PC lẫn thiết bị di động (Mobile).
   - Tệp `vercel.json` ở cả 2 dự án phải cấu hình `Cache-Control: public, max-age=0, must-revalidate` cho tài liệu HTML để trình duyệt di động (Safari iOS, Chrome Android, Zalo browser) không lưu cache cũ và lập tức tải bản cập nhật mới nhất.
   - Các tài nguyên băm `/assets/*` sử dụng `Cache-Control: public, max-age=31536000, immutable`.

2. **Đồng bộ cả 2 Repository Git**:
   - Khi thực hiện thay đổi code hoặc deploy, **BẮT BUỘC** phải commit và push lên cả 2 Git Repositories:
     - `unihubhg` (root): `git add -A && git commit -m "..." && git push origin main`
     - `unihub-admin` (sub-repo): `git -C unihub-admin add -A && git -C unihub-admin commit -m "..." && git -C unihub-admin push origin main`
   - Tuyệt đối không được bỏ sót `unihub-admin` để cả 2 hệ thống trên Vercel luôn cùng phiên bản.
