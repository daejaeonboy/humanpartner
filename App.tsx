import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { BottomNav } from './components/Layout/BottomNav';
import { Footer } from './components/Layout/Footer';
import { MainPage } from './pages/MainPage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductDetailPage } from './pages/ProductDetail';
import { MyPage } from './pages/MyPage';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { RedirectToProduct } from './pages/RedirectToProduct';
import { CSCenter } from './pages/CSCenter';
import { ProductSearchResult } from './pages/ProductSearchResult';
import { CompanyIntro } from './pages/CompanyIntro';
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AuthProvider } from './src/context/AuthContext';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProductManager } from './pages/admin/ProductManager';
import { BookingList } from './pages/admin/BookingList';
import { SectionManager } from './pages/admin/SectionManager';
import { CategoryManager } from './pages/admin/CategoryManager';
import { CMSManager } from './pages/admin/CMSManager';
import { UserManager } from './pages/admin/UserManager';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminSignup } from './pages/admin/AdminSignup';
import { NavMenuManager } from './pages/admin/NavMenuManager';
import { FAQManager } from './pages/admin/FAQManager';
import { AdminRoute } from './src/components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes - Protected */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
            <Route path="cms" element={<CMSManager />} />
            <Route path="sections" element={<SectionManager />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="bookings" element={<BookingList />} />
            <Route path="users" element={<UserManager />} />
            <Route path="menus" element={<NavMenuManager />} />
            <Route path="faqs" element={<FAQManager />} />
          </Route>

          {/* Admin Login - Separate Route */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />

          {/* Public Routes */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-white">
                <Header />
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/products" element={<ProductListPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/mypage" element={<MyPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/cs" element={<CSCenter />} />
                  <Route path="/p/:code" element={<RedirectToProduct />} />
                  <Route path="/search" element={<ProductSearchResult />} />
                  <Route path="/company" element={<CompanyIntro />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                </Routes>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;