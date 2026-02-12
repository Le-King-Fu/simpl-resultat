# Task: Fix orphan categories + add re-initialize button

## Root Cause (orphan categories)
`deactivateCategory` ran `SET is_active = 0 WHERE id = $1 OR parent_id = $1`, which silently
deactivated ALL children when a parent was deleted — even children that had transactions assigned.
Since `getAllCategoriesWithCounts` filters `WHERE is_active = 1`, those children vanished from the UI
with no way to recover them.

## Plan
- [x] Fix `deactivateCategory`: promote children to root, only deactivate the parent itself
- [x] Add `getChildrenUsageCount` to block deletion when children have transactions
- [x] Add `reinitializeCategories` service function (re-runs seed data)
- [x] Add `reinitializeCategories` to hook
- [x] Add re-initialize button with confirmation on CategoriesPage
- [x] Add i18n keys (en + fr)
- [x] Update deleteConfirm/deleteBlocked messages to reflect new behavior
- [x] `npm run build` passes

## Review
6 files changed. Orphan fix promotes children to root level instead of cascading deactivation.
Re-initialize button resets all categories+keywords to seed state (with user confirmation).
