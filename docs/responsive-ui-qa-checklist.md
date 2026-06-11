# BoardReady PH Responsive UI/UX QA Checklist

This checklist documents the responsive standards applied across BoardReady PH and serves as a guide for QA and future development.

## 1. General Layout and Navigation
- [x] **AppShell Navigation**: The sidebar navigation collapses into a bottom navigation bar or a hamburger menu on mobile (`sm` and `md` breakpoints).
- [x] **Mobile Horizontal Scrolling**: Tab groups, sub-navigation, and quick filters use `overflow-x-auto` to allow horizontal scrolling without breaking the layout.
- [x] **Dashboard Grid Layouts**: Dashboard metric cards and grid layouts stack into single columns on mobile (`grid-cols-1`) and expand to multiple columns on larger screens (`sm:grid-cols-2`, `lg:grid-cols-4`).

## 2. Forms and Inputs
- [x] **Font Size on Mobile**: All `<input>`, `<textarea>`, and `<select>` elements use `text-base` (16px) on mobile and `md:text-sm` (14px) on desktop to prevent iOS Safari from automatically zooming in when focusing on an input.
- [x] **Stacked Layouts**: Form groups use `flex-col` or `grid gap-4` on mobile and expand side-by-side on desktop (`md:flex-row`, `md:grid-cols-X`).
- [x] **Tap Targets**: Checkboxes, radio buttons, and their labels have generous padding (`px-3 py-3` or `px-3 py-2`) to ensure they meet the minimum recommended mobile tap target size (44x44px).

## 3. Tables and List Views
- [x] **Horizontal Scrolling for Dense Data**: Any dense data representation that uses `<table>` is wrapped in `<div className="overflow-x-auto">` with a `min-w-[Xpx]` constraint on the table itself to prevent columns from being squished unreadably before overflowing.
- [x] **Card-based Lists**: Prefer using responsive `<Card>` elements for list views (like admin questions) which naturally reflow content, rather than complex HTML tables.

## 4. Practice and Mock Exam Experience
- [x] **Choice Selection**: The answer choices use padded `<label>` elements allowing users to tap anywhere on the choice text, not just the small radio button.
- [x] **Pagination Buttons**: Next/Previous and question jump buttons have at least `size-10` (40x40px) or adequate padding to ensure ease of tapping on touch screens.

## 5. Global Polish
- [x] **Typography**: Consistent use of system fonts via Tailwind and shadcn/ui.
- [x] **Empty States**: Empty list states and errors are contained within readable `<Card>` wrappers to maintain UI consistency rather than floating unstyled text.
- [x] **Status Badges**: Use of colorful badges (`bg-emerald-600`, `bg-destructive`, etc.) ensures visual hierarchy and scannability on small screens.
