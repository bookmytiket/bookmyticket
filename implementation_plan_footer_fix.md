# Remove Duplicate Footer Links

The "Quick Links" section in the footer currently displays duplicate items. This plan ensures that only unique links are rendered based on their title.

## Proposed Changes

### Footer Component
#### [MODIFY] [Footer.jsx](file:///home/raja/bookmyticket/components/Footer.jsx)
- Implement a filter to ensure `quickLinks` contains only unique items by `title`.

## Verification Plan

### Automated Tests
- Run `npm run dev` and verify visually that there are no duplicates in the footer.

### Manual Verification
- View the website's footer and confirm "Quick Links" has unique items as shown in the updated design.
