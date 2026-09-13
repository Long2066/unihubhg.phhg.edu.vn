---
name: ui-ux-design-mastery
description: Comprehensive UI/UX design guide and patterns based on Refactoring UI, Tailwind UI, Apple HIG, and Material Design 3. Use whenever designing, building, or refactoring user interfaces, dashboards, tables, modals, responsive layouts, color schemes, typography, micro-interactions, and visual hierarchy.
---

# UI/UX Design Mastery

A battle-tested handbook for crafting stunning, clean, high-conversion web and mobile interfaces using Tailwind CSS and modern React components.

---

## 1. Core Philosophy: The Senior Designer Mindset

1. **Start with personality and constraints**:
   - Limit font choices (1 good sans-serif like Inter, SF Pro, or Plus Jakarta Sans).
   - Pick a curated palette (1 neutral slate/zinc, 1 primary brand, 4 semantic colors).
   - Use a discrete spacing scale (4px increments).
2. **Design without color first**:
   - Layout functionality in grayscale (`slate-100` to `slate-900`).
   - Add color only when purpose demands it (status, primary action, alert).
3. **De-emphasize to emphasize**:
   - Making everything bold or big ruins contrast.
   - To make something stand out, dim surrounding elements (`text-slate-400` or `text-slate-500`).

---

## 2. Visual Hierarchy & Contrast

### Text Hierarchy
```tsx
// Page Heading
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
  Tổng quan sinh viên
</h1>

// Section Heading
<h2 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-normal">
  Danh sách lớp học
</h2>

// Secondary Info
<p className="text-sm text-slate-500 mt-1">
  Cập nhật lần cuối: 10 phút trước
</p>

// Category / Micro Label
<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
  Khoa Công Nghệ Thông Tin
</span>
```

### Button Hierarchy (Strict 3-Tier)
```tsx
// 1. Primary Action (Max ONE per container)
<button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-500/20 transition-all duration-150">
  <Plus className="w-4 h-4" />
  Thêm sinh viên mới
</button>

// 2. Secondary Action
<button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] shadow-sm transition-all duration-150">
  <Download className="w-4 h-4 text-slate-500" />
  Xuất file Excel
</button>

// 3. Ghost / Subtle Action
<button className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150">
  Hủy bỏ
</button>
```

---

## 3. Layout, Spacing & The "Border Diet"

### The 4px/8px Spacing Grid
| Spacing Class | Pixels | Use Case |
| :--- | :--- | :--- |
| `gap-1` / `p-1` | 4px | Tight icon-label spacing |
| `gap-2` / `p-2` | 8px | Button internals, badge padding |
| `gap-3` / `p-3` | 12px | List item padding, compact cards |
| `gap-4` / `p-4` | 16px | Standard card padding (mobile) |
| `gap-6` / `p-6` | 24px | Desktop card padding, section gap |
| `gap-8` / `space-y-8` | 32px | Major section breaks |

### The Border Diet Rule
Instead of wrapping every single div in `border border-gray-300`, use:
1. **Background Tints**: Page background `bg-slate-50`, cards `bg-white`.
2. **Subtle Elevation**: `bg-white rounded-2xl shadow-sm ring-1 ring-slate-900/5`.
3. **Soft Dividers**: `divide-y divide-slate-100` or `border-t border-slate-100`.

---

## 4. High-End Component Patterns

### 1. Modern Dashboard Stat Card (Bento Style)
```tsx
<div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      Tổng sinh viên
    </span>
    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
      <Users className="w-5 h-5" />
    </div>
  </div>
  <div className="mt-4 flex items-baseline gap-2">
    <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
      1,248
    </span>
    <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      +12% so với kỳ trước
    </span>
  </div>
</div>
```

### 2. Modern Data Table
- **Header**: Light muted background (`bg-slate-50/80`), uppercase tiny text (`text-xs font-semibold tracking-wider text-slate-500`).
- **Rows**: Subtle hover (`hover:bg-slate-50/60`), transition colors.
- **Numbers**: Right-aligned (`text-right`), monospace/tabular nums (`tabular-nums font-mono`).
- **Actions**: Clean dropdown or subtle icon buttons (`opacity-0 group-hover:opacity-100 transition-opacity`).

### 3. Beautiful Empty State
```tsx
<div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center text-slate-400 mb-4">
    <FolderOpen className="w-6 h-6" />
  </div>
  <h3 className="text-base font-semibold text-slate-800">
    Chưa có sinh viên nào trong lớp
  </h3>
  <p className="text-sm text-slate-500 mt-1 max-w-sm">
    Lớp học này hiện tại chưa có danh sách sinh viên. Bắt đầu bằng cách nhập danh sách từ Excel hoặc thêm thủ công.
  </p>
  <button className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all">
    <Plus className="w-4 h-4" />
    Thêm sinh viên đầu tiên
  </button>
</div>
```

### 4. Polished Modal / Dialog
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
  <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-900">
        Xác nhận thao tác
      </h3>
      <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="p-6 text-sm text-slate-600">
      Nội dung chi tiết...
    </div>
    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
      <button className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100">
        Hủy
      </button>
      <button className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
        Đồng ý
      </button>
    </div>
  </div>
</div>
```

---

## 5. Pre-delivery UI/UX Checklist

Before concluding any UI work, verify:
- [ ] **Contrast**: Are all text elements clearly readable against their backgrounds? (No gray-300 on white).
- [ ] **Alignment**: Are icons vertically centered with text? Are numbers in tables right-aligned?
- [ ] **States**: Do interactive elements have hover, focus, and active states?
- [ ] **Empty States**: If a list or query returns 0 items, is there an informative empty state instead of blank void?
- [ ] **Mobile Touch**: Are clickable areas at least 44x44px? Is horizontal overflow handled?
- [ ] **Micro-copy**: Are messages positive, clear, and action-oriented (in accurate Vietnamese where applicable)?
- [ ] **No Raw Alerts**: Are feedback messages presented via modern toasts or inline alerts instead of browser `alert()`?
