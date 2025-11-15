# Release v1.6.1

## Bug Fixes

### Import Modal - API Response Compatibility

Fixed multiple critical bugs in the Import Data modal caused by backend API response structure changes introduced in v1.6.0.

**Issues:**
- Import modal displayed empty file list with skeleton loaders instead of uploaded files
- Console error: `TypeError: action.uploaded is not iterable`
- React warning: `Each child in a list should have a unique "key" prop`
- React warning: `Cannot update a component while rendering a different component`

**Root Cause:**
The FileUploadListAPI endpoint was updated in v1.6.0 to return paginated DRF response `{count, next, previous, results}` with new field names (`file_name`, `file_type`, `task_count`) instead of direct array with legacy fields (`file`, `size`). The Import.jsx component was not updated to handle the new response structure.

**Fixes Applied:**

**1. Pagination Response Handling** (Import.jsx:187-197)
```javascript
// BEFORE
const files = await api.callApi("fileUploads", {...});
dispatch({ uploaded: files ?? [] });

// AFTER
const response = await api.callApi("fileUploads", {...});
const files = response?.results ?? [];
dispatch({ uploaded: files });
```
- Extracts `results` array from paginated response
- Prevents "not iterable" error when spreading in reducer
- Matches pattern used in `useFilesList.ts` hook

**2. File Property Mapping** (Import.jsx:492-496)
```javascript
// BEFORE
<td>{file.file}</td>
<td>{file.size}</td>

// AFTER
<td>{file.file_name}</td>
<td>{file.task_count} task{file.task_count !== 1 ? 's' : ''}</td>
```
- Updated to use new API field names from FileUploadListSerializer
- Shows task count instead of file size (more useful information)
- Fixes empty table rows issue

**3. CSV Detection** (Import.jsx:308)
```javascript
// BEFORE
if (files.some(({ file }) => /\.[ct]sv$/.test(file))) {...}

// AFTER
if (files.some(({ file_name }) => /\.[ct]sv$/.test(file_name))) {...}
```
- Updated property reference for CSV/TSV file detection
- Ensures "Treat CSV/TSV as" prompt appears correctly

**4. React Key Prop** (Import.jsx:491)
```javascript
// BEFORE
<tr key={file.file}>

// AFTER
<tr key={file.id}>
```
- Uses unique database ID instead of potentially non-unique filename
- Eliminates React warning and improves rendering efficiency

**5. Side Effect Isolation** (Import.jsx:315-318)
```javascript
// BEFORE (in reducer)
if (action.ids) {
  onFileListUpdate?.(ids);
  return { ...state, ids };
}

// AFTER (separate useEffect)
useEffect(() => {
  if (files.ids.length > 0) {
    onFileListUpdate?.(files.ids);
  }
}, [files.ids, onFileListUpdate]);
```
- Moved `onFileListUpdate` callback from reducer to useEffect
- Prevents "setState during render" violation
- Follows React rules: side effects belong in effects, not reducers

**File Modified:**
- `web/apps/labelstudio/src/pages/CreateProject/Import/Import.jsx`

**Testing Checklist:**
- [x] Files display correctly in Import modal table
- [x] File names shown instead of empty cells
- [x] Task count displayed in third column
- [x] No console errors during file upload
- [x] CSV/TSV detection prompt appears for CSV files
- [x] No React warnings in browser console
- [x] File list loads on modal open
- [x] Multiple uploads accumulate in list

**API Response Format (v1.6.0+):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 6,
      "file_name": "document.pdf",
      "file_type": ".pdf",
      "created_at": "2025-11-15T01:52:50.988882Z",
      "status": "not_started",
      "task_count": 1,
      "project_title": "Project Name"
    }
  ]
}
```

**Backward Compatibility:**
No breaking changes. The fix ensures compatibility with the v1.6.0 backend API while maintaining all existing Import modal functionality.

---

## Enhancements

### File Viewer Modal - In-Modal Document Preview

Enhanced file viewing UX by replacing new browser tab navigation with in-modal document preview for Files table.

**Issue:**
- Clicking "View" button in Files table opened documents in new browser tab
- Disrupted workflow by navigating away from Label Studio
- No preview capability within the application
- Poor mobile browser support for new tab behavior

**Implementation:**

**New Files Created:**

**1. File Viewer Modal Component** (`file-viewer-modal.tsx`)
```typescript
export const showFileViewer = ({ fileUrl, fileName, fileType }: FileViewerModalProps)
```
- Displays files in large modal (90vw width, 85vh height)
- Supports PDF documents via iframe
- Supports images (JPG, PNG, GIF, BMP, WEBP)
- URL sanitization prevents XSS attacks (http/https only)
- Graceful fallback for unsupported file types

**2. Styling** (`file-viewer-modal.scss`)
- Clean, minimal SCSS following BEM pattern
- Centered image display with proper scaling
- Full-height PDF iframe for optimal viewing
- Responsive layout adapts to modal size

**3. Integration** (`file-actions.tsx`)
```typescript
// BEFORE
window.open(fileUrl, '_blank');

// AFTER
showFileViewer({
  fileUrl,
  fileName: file.file_name,
  fileType: file.file_type,
});
```
- View button now opens modal instead of new tab
- Seamless integration with existing file actions
- Maintains download and annotate functionality

**Key Features:**

**PDF Viewing:**
- Native browser PDF controls (zoom, page navigation)
- Full 85vh height for comfortable reading
- No external plugins required
- Works across Chrome, Firefox, Safari, Edge

**Image Viewing:**
- Auto-scaled to fit modal dimensions
- Maintains aspect ratio with `object-fit: contain`
- Centered display with padding
- Supports common image formats

**Security:**
- URL sanitization blocks malicious protocols
- Only `http://` and `https://` URLs allowed
- Prevents `javascript:` and `data:` URI attacks
- Invalid URLs show error message

**User Experience:**
- Large viewport (90% screen width, 85% height)
- Close button and ESC key support
- Stays within application context
- No browser tab clutter
- Mobile-friendly modal behavior

**Files Modified:**
- `web/apps/labelstudio/src/pages/Projects/file-actions.tsx` - Updated handleView function

**Files Created:**
- `web/apps/labelstudio/src/pages/Projects/file-viewer-modal.tsx` (93 lines)
- `web/apps/labelstudio/src/pages/Projects/file-viewer-modal.scss` (46 lines)

**Testing Checklist:**
- [x] PDFs display correctly in modal
- [x] Images display with proper scaling
- [x] Modal closes on X button and ESC key
- [x] Unsupported files show fallback message
- [x] URL sanitization blocks malicious URLs
- [x] Works on Chrome, Firefox, Safari, Edge
- [x] Mobile responsive behavior
- [x] No browser console errors

**Browser Compatibility:**
- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support
- Mobile browsers: Responsive modal, may require native PDF app for PDFs

**Performance:**
- Modal renders instantly
- Large PDFs load progressively
- No memory leaks on modal close
- Minimal CSS footprint

**Future Enhancements:**
- PDF.js integration for consistent cross-browser rendering
- Multi-page document navigation
- Zoom controls for images
- Support for video/audio preview
- Thumbnail previews in modal
