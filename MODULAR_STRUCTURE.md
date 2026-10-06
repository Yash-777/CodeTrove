# CodeTrove Modular Architecture

## Overview

CodeTrove is now structured as a **modular React SPA** optimized for GitHub Pages static hosting. Each feature is organized into independent modules that can be enabled, disabled, or swapped without affecting other parts of the app.

## Directory Structure

```
src/
├── app/                          # Application routes and pages
│   ├── layout/
│   │   ├── AppLayout.jsx         # Main layout wrapper
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   │
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Preferences.jsx
│       ├── NotFound.jsx
│       ├── auth/
│       │   ├── SignInPage.jsx
│       │   └── SignUpPage.jsx
│       ├── content/
│       │   ├── CategoryPage.jsx
│       │   ├── TopicPage.jsx
│       │   └── NavigationPage.jsx
│       ├── learn/
│       │   └── PracticePage.jsx
│       ├── build/
│       │   ├── ToolsPage.jsx
│       │   ├── CompilerPage.jsx
│       │   ├── JwtToolPage.jsx
│       │   ├── CharacterCounterPage.jsx
│       │   └── ProjectsPage.jsx
│       ├── store/
│       │   ├── ProfilePage.jsx
│       │   ├── ResumePage.jsx
│       │   ├── CertificatesPage.jsx
│       │   └── CareerPage.jsx
│       └── admin/
│           ├── NewTopicPage.jsx
│           ├── DraftsPage.jsx
│           └── UsersPage.jsx
│
├── modules/                      # Feature modules - swappable and independent
│   ├── auth/
│   │   ├── AuthContext.jsx       # Auth provider - injects service
│   │   └── services/
│   │       ├── testAuthService.js        # ✅ ACTIVE (no Firebase, localStorage)
│   │       └── firebaseAuthService.js    # 🔧 STUB (ready for migration)
│   │
│   ├── theme/
│   │   └── ThemeContext.jsx      # Light/dark mode management
│   │
│   └── content/
│       ├── contentLoader.js      # Markdown loading utilities
│       ├── topicData.js          # Topic metadata
│       └── navigation.js         # Navigation structure
│
├── components/                   # Reusable UI components
│   ├── RequireRole.jsx           # Role-based access control
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── CodeBlock.jsx
│   └── PasswordField.jsx
│
├── data/                         # Static content files
│   └── topics/
│       ├── java.js               # Topic metadata
│       ├── javascript.js
│       ├── json/
│       │   ├── basics/
│       │   │   └── content.md
│       │   └── schema-validation/
│       │       └── content.md
│       └── ...
│
├── utils/                        # Utility functions
│   ├── passwordStrength.js
│   ├── deviceId.js
│   ├── topicCodegen.js
│   └── router.js
│
├── styles/
│   └── index.css
│
├── App.jsx                       # Main app with HashRouter
├── main.jsx                      # Entry point with providers
└── index.html                    # Single HTML entry
```

## Key Modules

### 1. Auth Module (`src/modules/auth/`)

**Purpose**: Centralized authentication management with pluggable services

**Files**:
- `AuthContext.jsx` - React Context providing auth state and methods
- `services/testAuthService.js` - ✅ **ACTIVE**: Test users in localStorage (no Firebase)
- `services/firebaseAuthService.js` - 🔧 **STUB**: Ready for Firebase implementation

**Why Modular**:
- One import line swap enables Firebase without code changes
- Test auth works offline (perfect for GitHub Pages)
- Services share identical interface
- Components never import services directly

**Current Test Users**:
```
admin@test.com / admin123
editor@test.com / editor123
viewer@test.com / viewer123
```

**Usage in Components**:
```javascript
import { useAuth } from '@modules/auth/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut, hasRole } = useAuth();
  
  if (isAuthenticated) {
    return <div>Welcome {user.displayName}</div>;
  }
  
  return <button onClick={() => signIn('admin@test.com', 'admin123')}>Login</button>;
}
```

**Swapping to Firebase (Future)**:

Only change ONE line in `src/modules/auth/AuthContext.jsx`:

```javascript
// CURRENT:
import { testAuthService } from './services/testAuthService.js';

// WHEN READY:
import { firebaseAuthService } from './services/firebaseAuthService.js';
```

That's it! No component changes needed.

### 2. Theme Module (`src/modules/theme/`)

**Purpose**: Light/dark mode management

**Features**:
- Persists theme preference to localStorage
- Responds to system theme changes (`prefers-color-scheme`)
- Three modes: `light`, `dark`, `system`

**Usage**:
```javascript
import { useTheme } from '@modules/theme/ThemeContext';

function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  return (
    <button onClick={cycleTheme}>
      {theme === 'light' && '☀️'}
      {theme === 'dark' && '🌙'}
      {theme === 'system' && '💻'}
    </button>
  );
}
```

### 3. Content Module (`src/modules/content/`)

**Purpose**: Static content loading and management

**Responsibilities**:
- Load markdown files from `src/data/topics/`
- Manage topic metadata
- Handle navigation structure

## Authentication Flow

### Current: Test Auth (No Firebase)

```
┌─────────────────┐
│  User Input     │
│  Email/Password │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ AuthContext.signIn()│
└────────┬────────────┘
         │
         ▼
┌────────────────────────────┐
│ testAuthService.signIn()   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Validate against hardcoded │
│ test users                 │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Store user in localStorage │
│ (codetrove_current_user)   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Update AuthContext state   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Components re-render with  │
│ user data                  │
└────────────────────────────┘
```

**Advantages**:
- ✅ No external dependencies
- ✅ Works offline (GitHub Pages)
- ✅ Session persists in localStorage
- ✅ Perfect for testing/demo

**Limitations** (by design):
- ❌ Test users hardcoded (for development only)
- ❌ No backend validation
- ❌ Password stored as plaintext (not for production)

### Future: Firebase Auth

When ready:

1. Implement `firebaseAuthService.js` with Firebase SDK
2. Swap import in `AuthContext.jsx`
3. Deploy (workflow unchanged)
4. No component changes!

## Routing Structure

### HashRouter URLs (GitHub Pages Compatible)

```
https://yash-777.github.io/CodeTrove/#/                  → Dashboard
https://yash-777.github.io/CodeTrove/#/content/java      → Learn Java
https://yash-777.github.io/CodeTrove/#/signin            → Login page
https://yash-777.github.io/CodeTrove/#/store/profile     → User profile
https://yash-777.github.io/CodeTrove/#/admin/users       → Admin panel
```

### Why HashRouter?

✅ No server-side routing needed
✅ Works with static GitHub Pages
✅ Entire app loads from single `index.html`
✅ React Router handles routing client-side
✅ Works offline

### How It Works

1. User navigates to `/#/content/java`
2. Browser loads `index.html` from `https://yash-777.github.io/CodeTrove/`
3. React loads
4. React Router sees `#/content/java`
5. Renders the `CategoryPage` component

No server routing needed! ✨

## Build Configurations

### Development

```bash
npm run dev

# Result:
# - Base URL: /
# - Server: http://localhost:5173/
# - Uses testAuthService
# - Full sourcemaps
```

### Production (GitHub Pages)

```bash
npm run build:ghpages

# Sets: GITHUB_PAGES=true
# Result:
# - Base URL: /CodeTrove/
# - Output: dist/
# - Uses testAuthService
# - Minified bundles
# - Ready for static hosting
```

## Component Communication

### Context API (Global State)

For app-wide state that many components need:

- **AuthContext** - User authentication state
- **ThemeContext** - Theme preference

```javascript
import { useAuth } from '@modules/auth/AuthContext';
import { useTheme } from '@modules/theme/ThemeContext';

function MyComponent() {
  const auth = useAuth();      // Global auth state
  const theme = useTheme();    // Global theme state
}
```

### Props (Local State)

For state that affects only a few components:

```javascript
function Parent() {
  const [count, setCount] = useState(0);
  return <Child count={count} onChange={setCount} />;
}
```

**Rule**: Avoid prop drilling. Use Context for cross-cutting concerns.

## Adding New Features

### Add a New Module

1. Create `src/modules/featureName/`
2. Create index context/provider if needed
3. Export hooks/components
4. Add to `src/main.jsx` providers if necessary

```
src/modules/notifications/
├── NotificationContext.jsx
├── NotificationProvider.jsx
└── useNotification.js
```

### Add a New Page

1. Create component in `src/app/pages/`
2. Add Route in `src/App.jsx`
3. Link in Sidebar/Header if needed

### Add Static Content

1. Create markdown file: `src/data/topics/category/topic/content.md`
2. Add metadata: `src/data/topics/category.js`
3. Update navigation if needed
4. No code changes required! ✨

## Testing Locally

### Quick Start

```bash
npm install
npm run dev
# Visit: http://localhost:5173/#/
```

### Test Login

1. Go to: `http://localhost:5173/#/signin`
2. Email: `admin@test.com`
3. Password: `admin123`
4. Refresh page - session persists!

### Production Build Test

```bash
npm run build:ghpages
npm run preview
# Visit: http://localhost:4173/#/
# All routes should work with hashes
```

## Environment Variables

### `.env` (create if needed)

```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_KEY=your-key-here
```

**Note**: Only `VITE_` prefixed variables are exposed to the browser.

## Deployment Checklist

- [x] Use HashRouter (GitHub Pages compatible)
- [x] Set Vite `base: '/CodeTrove/'` for repo subdirectory
- [x] Use testAuthService (no backend required)
- [x] All content as static files (JSON/markdown)
- [x] GitHub Actions workflow configured
- [x] No Node.js server in production
- [x] localStorage for session persistence
- [x] Theme persistence with localStorage

✅ Ready to deploy!

## Migration Path: Test → Firebase

**Phase 1 (Current)**:
- Test auth active
- GitHub Pages deployment working
- App live at: `https://yash-777.github.io/CodeTrove/`

**Phase 2 (Future)**:
- Create Firebase project
- Implement `firebaseAuthService.js`
- Swap import in `AuthContext.jsx`
- Test login flow
- Deploy (no workflow changes)

**Phase 3 (Optional)**:
- Remove test auth service
- Add more Firebase features (Firestore, etc.)
- Update deployment target

## File Size and Performance

**Current Production Build**:
- React + React Router: ~40KB
- App code (minified): ~15KB
- Assets: ~50KB
- **Total: ~105KB** (gzipped ~35KB)

**GitHub Pages Advantages**:
- Free hosting
- CDN delivered worldwide
- Instant deployment
- No backend costs

## Security Notes

⚠️ **Important**: Test auth is **NOT FOR PRODUCTION**

- Passwords are hardcoded (visible in browser)
- No encryption
- No backend validation
- For development/demo only

**When using Firebase**:
- Passwords encrypted in transit (HTTPS)
- Backend token validation
- Secure session management
- Production-ready

## Common Questions

**Q: Can I run the Node server with this build?**
A: No, this is GitHub Pages only. The app is entirely static. The old Express server is not needed.

**Q: Why HashRouter instead of BrowserRouter?**
A: GitHub Pages can't do server-side routing. HashRouter uses client-side routing which works perfectly on static hosting.

**Q: How do I add real backend logic later?**
A: Create API calls from components. Store Firebase config in `modules/content/` module for later. Don't mix backend with app logic.

**Q: Can I merge this to main?**
A: Yes! When ready:
```bash
git checkout feat/modular-react-static-ghpages
git pull origin main
# Resolve any conflicts
git push origin feat/modular-react-static-ghpages
# Create PR on GitHub
# Review and merge
```

## Summary

✅ Modular, component-based architecture
✅ GitHub Pages compatible static SPA
✅ Test authentication included (no Firebase)
✅ Ready for Firebase migration (swap one import)
✅ Automatic GitHub Actions deployment
✅ Theme system (light/dark/system)
✅ Production-grade structure
✅ Zero backend required

Ready to deploy! 🚀
