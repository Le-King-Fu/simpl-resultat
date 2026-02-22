# Changelog

## [Unreleased]

### Added
- Dynamic Report (pivot table): compose custom reports by assigning dimensions to rows, columns, filters and measures to values
- Delete keywords from the "All Keywords" view

## [0.3.8]

### Added
- Custom date range picker for reports and dashboard
- Toggle to position subtotals above or below detail rows
- Display release notes from CHANGELOG in GitHub releases and in-app updater

## [0.3.7]

### Fixes
- Remove MSI bundle to prevent updater install path conflict
- Change Windows updater installMode to basicUi
- Improve split indicator visibility and adjustments layout

## 0.3.2

### New Features
- **Linux support**: Add Linux build (`.deb`, `.rpm`, `.AppImage`) to release workflow
- **Transaction splits on Adjustments page**: View transaction split adjustments in a dedicated section on the Adjustments page

### Fixes
- Fix CSV auto-detect edge cases
- Remove accent from productName for Linux `.deb` compatibility

## 0.3.1

### Fixes
- Always show profile switcher in sidebar (#2)

## 0.3.0

### New Features
- **Multiple profiles**: Create multiple profiles with separate databases, custom names, and colors
- **PIN protection**: Protect profiles with an optional numeric PIN
- **Profile switcher**: Quick profile switching from the sidebar
- **Drag-and-drop categories**: Reorder categories or change parent via drag-and-drop in the category tree
- **Transaction splits**: Split a transaction across multiple categories with adjustable amounts

## 0.2.10

### New Features
- **Period quick-select**: Add quick period filter buttons (This month, Last month, etc.) on the Transactions page
- **Budget vs Actual report**: Monthly and year-to-date comparison table in Reports
- **Parent category subtotals**: Budget page shows aggregated subtotals for parent categories
- **User guide**: Complete documentation page accessible from Settings, printable to PDF

### Improvements
- Persist template selection and add Update template button
- Don't pre-select already-imported files when entering source config
- Make settings data imports visible in Import History
- Replace per-template delete buttons with single delete on selection
- Replace refresh icon with save icon on update template button
- Add sign convention to budget page

## 0.2.9

### Fixes
- Allow duplicate-content files with different names (#1)

## 0.2.8

### New Features
- **Data export/import**: Export and import your data (transactions, categories, or both) with optional AES-256-GCM encryption (#3)

### Fixes
- Cross-file duplicate detection and per-file import tracking

## 0.2.5

### New Features
- **Import config templates**: Save and load import source configurations as reusable templates
- **12-month budget grid**: Full year budget view with monthly cells and annual totals

### Fixes
- Budget and category fixes
- Migration checksum issue (schema.sql must not be modified after initial release)

## 0.2.3

### New Features
- **Chart patterns**: Added SVG fill patterns (diagonal lines, dots, crosshatch, etc.) to differentiate categories in bar charts, pie chart, and stacked bar charts beyond just color
- **Chart context menu**: Right-click any category in a chart to hide it or view its transactions in a detail popup
- **Hidden categories**: Hidden categories appear as dismissible chips above charts with a "Show all" button to restore them
- **Transaction detail modal**: View all transactions composing a category's total directly from any chart
- **Import preview popup**: The data preview is now a popup modal instead of a separate wizard step, allowing quick inspection without leaving the configuration page
- **Direct duplicate check**: New "Check Duplicates" button on the import configuration page skips directly to duplicate validation without requiring a preview first

### Improvements
- Import wizard flow simplified: source-config → duplicate-check (preview is optional via popup)
- Duplicate-check back button now returns to source configuration instead of the removed preview step
- Added `categoryIds` map to `CategoryOverTimeData` for proper category resolution in the over-time chart

## 0.2.2

- Bump version

## 0.2.1

- Add "All Keywords" view on Categories page
- Add dark mode with warm gray palette
- Fix orphan categories, persist has_header for imports, add re-initialize
- Add Budget and Adjustments pages
