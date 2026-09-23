import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CategoryPage from './pages/content/CategoryPage.jsx';
import TopicPage from './pages/content/TopicPage.jsx';
import PracticePage from './pages/learn/PracticePage.jsx';
import NewTopicPage from './pages/admin/NewTopicPage.jsx';
import DraftsPage from './pages/admin/DraftsPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import CompilerPage from './pages/build/CompilerPage.jsx';
import ToolsPage from './pages/build/ToolsPage.jsx';
import JwtToolPage from './pages/build/JwtToolPage.jsx';
import ProjectsPage from './pages/build/ProjectsPage.jsx';
import ProfilePage from './pages/store/ProfilePage.jsx';
import ResumePage from './pages/store/ResumePage.jsx';
import CertificatesPage from './pages/store/CertificatesPage.jsx';
import CareerPage from './pages/store/CareerPage.jsx';
import Preferences from './pages/Preferences.jsx';
import SignUpPage from './pages/auth/SignUpPage.jsx';
import SignInPage from './pages/auth/SignInPage.jsx';
import NotFound from './pages/NotFound.jsx';
import RequireRole from './components/RequireRole.jsx';

const ANY_LOGGED_IN = ['admin', 'editor', 'viewer'];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="content/:categoryKey" element={<CategoryPage />} />
          <Route path="content/:categoryKey/*" element={<TopicPage />} />

          <Route path="learn/practice" element={<PracticePage />} />
          <Route path="build/compiler" element={<CompilerPage />} />
          <Route path="build/tools" element={<ToolsPage />} />
          <Route path="build/tools/jwt-tool" element={<JwtToolPage />} />
          <Route path="build/projects" element={<RequireRole allow={ANY_LOGGED_IN}><ProjectsPage /></RequireRole>} />

          <Route path="create-page" element={<RequireRole allow={['admin', 'editor']}><NewTopicPage /></RequireRole>} />
          <Route path="drafts" element={<RequireRole allow={['admin', 'editor']}><DraftsPage /></RequireRole>} />
          <Route path="store/profile" element={<RequireRole allow={ANY_LOGGED_IN}><ProfilePage /></RequireRole>} />
          <Route path="store/resume" element={<RequireRole allow={ANY_LOGGED_IN}><ResumePage /></RequireRole>} />
          <Route path="store/certificates" element={<RequireRole allow={ANY_LOGGED_IN}><CertificatesPage /></RequireRole>} />
          <Route path="store/career" element={<RequireRole allow={ANY_LOGGED_IN}><CareerPage /></RequireRole>} />

          <Route path="signup" element={<SignUpPage />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="admin/users" element={<RequireRole allow={['admin']}><UsersPage /></RequireRole>} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
