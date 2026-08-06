# Dual Git Repository Workflow Rule

Dự án này bao gồm 2 Repository Git độc lập:

1. **Main Portal (`unihubhg`)**:
   - Thư mục: `d:\HỆ THỐNG QUẢN LÍ SINH VIÊN PHHG\unihubhg`
   - Remote: `https://github.com/Long2066/unihubhg.phhg.edu.vn`
   - Vercel URL: `unihubhg-phhg.vercel.app`

2. **Admin Portal (`unihub-admin`)**:
   - Thư mục: `d:\HỆ THỐNG QUẢN LÍ SINH VIÊN PHHG\unihubhg\unihub-admin`
   - Remote: `https://github.com/Long2066/admin-unihubhg-phhg`
   - Vercel URL: `admin-unihubhg-phhg.vercel.app`

## Quy tắc bắt buộc:
- Khi thực hiện thay đổi code liên quan đến cả 2 portal (hoặc khi build/deploy), **BẮT BUỘC** phải chuyển tới từng thư mục repo tương ứng để commit và push lên cả 2 Git Repositories riêng biệt:
  1. `unihubhg` root -> `git add .` -> `git commit` -> `git push`
  2. `unihub-admin` subfolder -> `git add .` -> `git commit` -> `git push`
- Tuyệt đối không quên push repo `unihub-admin` để tránh Vercel admin bị bỏ sót bản build mới.
