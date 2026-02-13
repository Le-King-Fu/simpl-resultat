# Changelog

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
