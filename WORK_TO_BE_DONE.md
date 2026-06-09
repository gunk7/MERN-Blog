# 📋 Work To Be Done - Wavelog MERN Blog Platform

**Last Updated**: 2026-06-07  
**Project**: Wavelog - AI-Powered Blog Publishing Platform  

---

## 🔴 **CRITICAL ISSUES (Fix Immediately)**

### 1. **Typo in Addon Routes** - BLOCKER
- **File**: `Backend/routes/addonRoutes.js` line 2
- **Issue**: `const router = exporess.Router();` (misspelled `express`)
- **Severity**: 🔴 Critical - Causes runtime crash
- **Fix Time**: 2 minutes
- **Action**: Change `exporess` to `express`

```javascript
// BEFORE (Line 2)
const router = exporess.Router();

// AFTER
const router = express.Router();
```

---

### 2. **Notification System - Incomplete Implementation** - HIGH PRIORITY
- **Models**: ✅ Exists (`notificationModel.js`)
- **Controllers**: ❌ Missing or empty (`notiContoller.js`)
- **Routes**: ❌ Not wired up
- **Frontend**: ❌ No UI components or pages
- **Severity**: 🔴 High - Users cannot see activities
- **Fix Time**: 4-6 hours

**What's Missing**:
- [ ] Implement `notiController.js` with handlers for:
  - `POST /create` - Internal method to create notifications
  - `GET /` - Get user notifications (paginated)
  - `GET /unread-count` - Get unread notification count
  - `PATCH /:id/read` - Mark notification as read
  - `DELETE /:id` - Delete notification
  - `DELETE /read-all` - Clear all read notifications
- [ ] Wire notification routes in `Backend/routes/routes.js`
- [ ] Trigger notifications in controllers:
  - Follow controller: When user A follows user B → Create notification for B
  - Blog controller: When blog is published → Notify followers
  - Comment controller: When comment added → Notify blog author
  - Like controller: When blog/comment liked → Notify creator
  - Subscription: When user subscribes → Send welcome notification
- [ ] Frontend pages/components:
  - `frontend/src/pages/Notifications.jsx` - Notification center
  - `frontend/src/components/NotificationDropdown.jsx` - Header dropdown
  - Show unread count badge on bell icon
  - Mark as read on click
  - Delete notification option

**Integration Points**:
```javascript
// In commentController.js after creating comment
await createNotification({
  recipientId: blog.author,
  type: 'comment',
  message: `${user.username} commented on your blog`,
  relatedId: blogId,
  relatedType: 'Blog'
});

// In followController.js after creating follow
await createNotification({
  recipientId: followingId,
  type: 'follow',
  message: `${user.username} started following you`,
  relatedId: userId,
  relatedType: 'User'
});
```

---

### 3. **Refund Request Management - Incomplete**
- **Model**: ✅ Exists (`refundRequestModel.js`)
- **Controllers**: ⚠️ File exists but implementation incomplete
- **Admin Page**: ✅ Exists (`admin/src/pages/AdminRefundRequestPage.jsx`)
- **Severity**: 🔴 High - Business logic incomplete
- **Fix Time**: 3-4 hours

**Implementation Needed**:
- [ ] Complete `refundRequestControllers.js`:
  ```javascript
  exports.getAllRefundRequests = async (req, res) => { /* ... */ }
  exports.getRefundRequestById = async (req, res) => { /* ... */ }
  exports.approveRefund = async (req, res) => {
    // Process Stripe refund
    // Update RefundRequest status
    // Send email notification
    // Update Transaction record
  }
  exports.rejectRefund = async (req, res) => {
    // Update RefundRequest with rejection reason
    // Send email to user
  }
  exports.updateRefundStatus = async (req, res) => { /* ... */ }
  ```
- [ ] Verify admin routes are registered in `Backend/routes/adminRoutes.js`
- [ ] Test admin panel refund request UI:
  - List all requests with filters (pending, approved, rejected)
  - Approve/Reject buttons with reason field
  - View original transaction details
  - Track status changes

---

## 🟡 **HIGH PRIORITY FEATURES (Next Sprint)**

### 4. **Email Notifications System**
- **Status**: Framework exists (nodemailer, templates) but not triggered
- **Severity**: 🟡 High - Users want activity alerts
- **Fix Time**: 3-4 hours

**Feature Scope**:
- [ ] Send email when someone follows user
- [ ] Send email when blog is published (to followers)
- [ ] Send email when someone comments on blog
- [ ] Send email when someone replies to comment
- [ ] Send email when someone likes blog/comment
- [ ] Send email digest (weekly/daily summary)
- [ ] Create email templates for each type
- [ ] Add user settings for email preferences:
  - `emailNotifications` object in User model:
    ```javascript
    emailNotifications: {
      onFollowed: true,
      onCommented: true,
      onReplied: true,
      onLiked: true,
      newBlogAlert: true,
      weeklyDigest: false
    }
    ```
- [ ] Add email preference UI in frontend profile settings

**Database Changes**:
```javascript
// Add to User model
emailNotifications: {
  onFollowed: { type: Boolean, default: true },
  onCommented: { type: Boolean, default: true },
  onReplied: { type: Boolean, default: true },
  onLiked: { type: Boolean, default: true },
  newBlogAlert: { type: Boolean, default: true },
  weeklyDigest: { type: Boolean, default: false },
  updatedAt: Date
}
```

---

### 5. **Blog Moderation Workflow**
- **Status**: Status field exists (`draft`, `published`, `scheduled`, `under_review`) but workflow not enforced
- **Severity**: 🟡 High - Content control needed
- **Fix Time**: 2-3 hours

**Implementation**:
- [ ] When blog created → Set status to `under_review` (configurable)
- [ ] Admin can approve/reject blogs from admin panel
- [ ] Rejected blogs return to author with reason
- [ ] Author notified via email + notification
- [ ] Only approved blogs appear in public feed
- [ ] Frontend shows "Pending Review" badge on user's blogs
- [ ] Add moderation reason/notes field:
  ```javascript
  // In blogModel.js
  moderationNotes: { type: String, default: '' },
  moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: Date
  ```
- [ ] Update admin blog management page to handle rejection UI

**Routes**:
- [ ] `PATCH /api/admin/blogs/:id/approve` - Approve blog
- [ ] `PATCH /api/admin/blogs/:id/reject` - Reject with reason

---

### 6. **Advanced Blog Search & Filtering**
- **Status**: Basic listing only
- **Severity**: 🟡 High - UX improvement
- **Fix Time**: 3-4 hours

**Features**:
- [ ] Search blogs by:
  - [ ] Title/content (full-text search - requires MongoDB text index)
  - [ ] Author username
  - [ ] Tags
  - [ ] Category
  - [ ] Date range
  - [ ] View count range
  - [ ] Likes count
- [ ] Filtering options:
  - [ ] Sort: Newest, Most viewed, Most liked, Trending
  - [ ] Status: Published only (or draft for own blogs)
  - [ ] Time filter: Today, This week, This month, This year
- [ ] Frontend components:
  - [ ] `SearchBar.jsx` - Search input with debounce
  - [ ] `FilterPanel.jsx` - Advanced filters sidebar
  - [ ] `SortOptions.jsx` - Sort dropdown
- [ ] Backend implementation:
  - [ ] Add MongoDB text index on title, content, tags
  - [ ] Implement search aggregation pipeline
  - [ ] Optimize with indexing

**Database Index**:
```javascript
// blogModel.js
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ createdAt: -1 });
```

---

### 7. **Tag Management UI**
- **Status**: AI auto-generates tags, no UI to view/manage
- **Severity**: 🟡 Medium-High
- **Fix Time**: 2-3 hours

**Features**:
- [ ] Browse all tags in system
- [ ] View blogs by tag (tag cloud/list)
- [ ] Edit/delete tags (admin only)
- [ ] Merge duplicate tags
- [ ] View tag popularity/usage count
- [ ] Auto-complete tag suggestions while editing blog

**Components**:
- [ ] `frontend/src/pages/TagsPage.jsx` - View all tags
- [ ] `frontend/src/components/TagCloud.jsx` - Tag cloud visualization
- [ ] `frontend/src/components/TagAutoComplete.jsx` - Tag suggestions
- [ ] `admin/src/pages/TagManagement.jsx` - Admin tag management

---

## 🟠 **MEDIUM PRIORITY FEATURES (Future Sprints)**

### 8. **Analytics Dashboard**
- **Status**: Basic stats exist, no visualization
- **Severity**: 🟠 Medium - Good for authors
- **Fix Time**: 6-8 hours

**Author Analytics**:
- [ ] Per-blog analytics:
  - Views over time (line chart)
  - Likes/Comments trend (bar chart)
  - Traffic by day of week
  - Top traffic sources (referrer)
  - Read time statistics
- [ ] Channel-wide analytics:
  - Total views, likes, comments, followers
  - Growth trends
  - Top performing blogs
  - Audience insights (location, engagement)
- [ ] Subscriber retention metrics

**Admin Analytics**:
- [ ] Platform overview:
  - Total users, active users, new signups (chart)
  - Total blogs, published vs draft
  - Revenue dashboard (MRR, ARR, growth)
  - Subscription breakdown by plan
  - Churn rate analysis
- [ ] Content metrics:
  - Top blogs, top authors
  - Trending content
  - Content category breakdown
- [ ] Financial:
  - Transaction history chart
  - Refund rate
  - ARPU (Average Revenue Per User)
  - Addon token sales

**Technology**:
- [ ] Use Recharts or Chart.js for visualizations
- [ ] Backend aggregation queries (MongoDB)
- [ ] Cache analytics for performance

---

### 9. **Comment Moderation & Reporting**
- **Status**: Soft delete exists, no moderation workflow
- **Severity**: 🟠 Medium
- **Fix Time**: 3-4 hours

**Features**:
- [ ] Report comment (spam, inappropriate, etc.)
- [ ] Comment approval workflow (optional per blog)
- [ ] Admin moderation dashboard:
  - View reported comments
  - Ban user (prevent commenting)
  - Delete comment (hard/soft)
  - Send warning to commenter
- [ ] Author can moderate own blog comments
- [ ] User can see warnings/bans on profile

**Database Models**:
```javascript
// New: CommentReport model
{
  commentId, reportedBy, reason, description, status, createdAt
}

// Add to User model
isBanned: { type: Boolean, default: false },
banReason: String,
bannedAt: Date
```

---

### 10. **Direct Messaging System**
- **Status**: Not implemented
- **Severity**: 🟠 Medium - Social feature
- **Fix Time**: 6-8 hours

**Features**:
- [ ] Send/receive direct messages
- [ ] Message threads with users
- [ ] Real-time notifications (via WebSocket)
- [ ] Typing indicators
- [ ] Block user from messaging
- [ ] Message history/archive
- [ ] Read receipts (optional)

**Database Model**:
```javascript
// Conversation
{ userId1, userId2, lastMessage, lastMessageTime }

// Message
{ conversationId, senderId, text, attachments, readAt, createdAt }
```

---

### 11. **Blog Revisions/Version History**
- **Status**: Not implemented
- **Severity**: 🟠 Low-Medium
- **Fix Time**: 4-5 hours

**Features**:
- [ ] Save blog version on each edit
- [ ] View revision history
- [ ] Restore to previous version
- [ ] Compare revisions (diff view)
- [ ] Annotate changes

---

### 12. **User Recommendations**
- **Status**: Not implemented
- **Severity**: 🟠 Medium - Engagement driver
- **Fix Time**: 4-5 hours

**Types**:
- [ ] "Blogs you might like" based on:
  - Tags you follow
  - Authors you follow
  - Reading history
  - Similar blogs
- [ ] "Authors to follow" based on:
  - Your interests
  - Follower overlap
  - Engagement score
- [ ] "Trending this week"

---

## 🔵 **LOW PRIORITY / NICE-TO-HAVE**

### 13. **Timezone Support for Blog Scheduling**
- **Status**: Server uses UTC, no timezone selector
- **Severity**: 🔵 Low
- **Fix Time**: 2-3 hours
- **Changes**:
  - Add timezone field to User model
  - Timezone selector in profile settings
  - Convert scheduled time to server UTC before storing
  - Convert back to user timezone when displaying

### 14. **Blog Export/Import**
- **Severity**: 🔵 Low
- **Fix Time**: 3-4 hours
- **Formats**: PDF, Markdown, HTML
- **Bulk import**: CSV or JSON

### 15. **Categories Management**
- **Status**: Currently hardcoded enum
- **Severity**: 🔵 Low
- **Fix Time**: 2-3 hours
- **Changes**:
  - Move categories to admin-managed collection
  - Add category creation/editing in admin panel
  - Update category filtering

### 16. **Multi-language Support (i18n)**
- **Status**: Not implemented
- **Severity**: 🔵 Low
- **Fix Time**: 8-10 hours
- **Setup**: i18next or react-intl

### 17. **Blog Comments Nested UI Depth Limit**
- **Status**: Infinite nesting possible
- **Severity**: 🔵 Low
- **Fix Time**: 1 hour
- **Change**: Limit nesting to 3-4 levels for UI

### 18. **Progressive Web App (PWA)**
- **Status**: Not implemented
- **Severity**: 🔵 Low
- **Fix Time**: 4-5 hours
- **Features**: Offline support, installable app, push notifications

### 19. **API Documentation (Swagger/OpenAPI)**
- **Status**: Not documented
- **Severity**: 🔵 Low
- **Fix Time**: 4-5 hours
- **Tool**: Swagger UI or OpenAPI generator

### 20. **Global Rate Limiting**
- **Status**: Only on AI endpoints
- **Severity**: 🔵 Low
- **Fix Time**: 2 hours
- **Add**: Rate limiting middleware on all endpoints

---

## 📊 **WORK SUMMARY BY PRIORITY**

| Priority | Items | Estimated Hours | Impact |
|----------|-------|-----------------|--------|
| 🔴 Critical | 3 | 8-10 | **System-breaking** |
| 🟡 High | 4 | 12-15 | **Core functionality** |
| 🟠 Medium | 5 | 20-25 | **UX/content control** |
| 🔵 Low | 8 | 25-30 | **Polish/nice-to-have** |
| **Total** | **20** | **65-80** | **4-5 weeks of dev** |

---

## 🎯 **RECOMMENDED IMPLEMENTATION ORDER**

### **Week 1 - Fix Critical Issues**
1. Fix `exporess` typo (2 min)
2. Implement notification system (4-6 hrs)
3. Complete refund request handlers (3-4 hrs)

### **Week 2 - Complete Core Features**
4. Email notifications integration (3-4 hrs)
5. Blog moderation workflow (2-3 hrs)
6. Advanced search/filtering (3-4 hrs)

### **Week 3 - Content Management**
7. Tag management UI (2-3 hrs)
8. Comment moderation system (3-4 hrs)
9. Blog revision history (4-5 hrs)

### **Week 4 - Analytics & Polish**
10. Analytics dashboard (6-8 hrs)
11. User recommendations (4-5 hrs)
12. Misc improvements (2-3 hrs)

### **Future - Nice-to-Have**
- Direct messaging, PWA, i18n, categories management, export/import

---

## 📝 **TESTING CHECKLIST**

- [ ] Unit tests for new controllers
- [ ] Integration tests for notification flow
- [ ] E2E tests for:
  - Blog creation → moderation → publishing
  - Comment → notification flow
  - Refund request → approval flow
- [ ] Load testing for search queries
- [ ] Email delivery testing
- [ ] Stripe webhook testing
- [ ] Admin panel permissions testing

---

## 🚀 **DEPLOYMENT NOTES**

- **Env vars needed for new features**:
  - Email notification settings
  - Moderation toggle
  - Analytics cache TTL
  - Rate limit settings

- **Database migrations**:
  - Add indexes for search
  - Add fields for moderation
  - Add fields for email preferences

- **Rollout strategy**:
  - Feature flags for new features (especially moderation)
  - Backward compatibility for API changes
  - Gradual rollout (10% → 50% → 100%)

---

**Last Reviewed**: 2026-06-07  
**Next Review**: When 50% of work items are completed
