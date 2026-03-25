import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { AuthProvider } from './src/context/AuthContext';
import { AdminRoute } from './src/components/AdminRoute';

const MainPage = lazy(() =>
  import('./pages/MainPage').then((module) => ({ default: module.MainPage }))
);
const ProductListPage = lazy(() =>
  import('./pages/ProductListPage').then((module) => ({ default: module.ProductListPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetailPage }))
);
const MyPage = lazy(() =>
  import('./pages/MyPage').then((module) => ({ default: module.MyPage }))
);
const MyInfoPage = lazy(() =>
  import('./pages/MyInfoPage').then((module) => ({ default: module.MyInfoPage }))
);
const InquiryPage = lazy(() =>
  import('./pages/InquiryPage').then((module) => ({ default: module.InquiryPage }))
);
const Login = lazy(() =>
  import('./pages/Login').then((module) => ({ default: module.Login }))
);
const SignUp = lazy(() =>
  import('./pages/SignUp').then((module) => ({ default: module.SignUp }))
);
const RedirectToProduct = lazy(() =>
  import('./pages/RedirectToProduct').then((module) => ({ default: module.RedirectToProduct }))
);
const CSCenter = lazy(() =>
  import('./pages/CSCenter').then((module) => ({ default: module.CSCenter }))
);
const ProductSearchResult = lazy(() =>
  import('./pages/ProductSearchResult').then((module) => ({ default: module.ProductSearchResult }))
);
const CompanyIntro = lazy(() =>
  import('./pages/CompanyIntro').then((module) => ({ default: module.CompanyIntro }))
);
const TermsOfService = lazy(() =>
  import('./pages/TermsOfService').then((module) => ({ default: module.TermsOfService }))
);
const PrivacyPolicy = lazy(() =>
  import('./pages/PrivacyPolicy').then((module) => ({ default: module.PrivacyPolicy }))
);
const AlliancePage = lazy(() =>
  import('./pages/AlliancePage').then((module) => ({ default: module.AlliancePage }))
);
const EventPage = lazy(() =>
  import('./pages/EventPage').then((module) => ({ default: module.EventPage }))
);
const BlankPage = lazy(() =>
  import('./pages/BlankPage').then((module) => ({ default: module.BlankPage }))
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((module) => ({ default: module.NotFound }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const ProductManager = lazy(() =>
  import('./pages/admin/ProductManager').then((module) => ({ default: module.ProductManager }))
);
const BookingList = lazy(() =>
  import('./pages/admin/BookingList').then((module) => ({ default: module.BookingList }))
);
const SectionManager = lazy(() =>
  import('./pages/admin/SectionManager').then((module) => ({ default: module.SectionManager }))
);
const CategoryManager = lazy(() =>
  import('./pages/admin/CategoryManager').then((module) => ({ default: module.CategoryManager }))
);
const CMSManager = lazy(() =>
  import('./pages/admin/CMSManager').then((module) => ({ default: module.CMSManager }))
);
const UserManager = lazy(() =>
  import('./pages/admin/UserManager').then((module) => ({ default: module.UserManager }))
);
const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((module) => ({ default: module.AdminLogin }))
);
const AdminSignup = lazy(() =>
  import('./pages/admin/AdminSignup').then((module) => ({ default: module.AdminSignup }))
);
const NavMenuManager = lazy(() =>
  import('./pages/admin/NavMenuManager').then((module) => ({ default: module.NavMenuManager }))
);
const FAQManager = lazy(() =>
  import('./pages/admin/FAQManager').then((module) => ({ default: module.FAQManager }))
);
const InquiryManager = lazy(() =>
  import('./pages/admin/InquiryManager').then((module) => ({ default: module.InquiryManager }))
);

const RouteLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Loader2 className="animate-spin text-[#39B54A]" size={36} />
  </div>
);

const LazyRoute = ({
  component: Component,
}: {
  component: React.LazyExoticComponent<React.ComponentType>;
}) => (
  <Suspense fallback={<RouteLoader />}>
    <Component />
  </Suspense>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <LazyRoute component={AdminDashboard} />
              </AdminRoute>
            }
          >
            <Route path="cms" element={<LazyRoute component={CMSManager} />} />
            <Route path="sections" element={<LazyRoute component={SectionManager} />} />
            <Route path="categories" element={<LazyRoute component={CategoryManager} />} />
            <Route path="products" element={<LazyRoute component={ProductManager} />} />
            <Route path="bookings" element={<LazyRoute component={BookingList} />} />
            <Route path="users" element={<LazyRoute component={UserManager} />} />
            <Route path="menus" element={<LazyRoute component={NavMenuManager} />} />
            <Route path="faqs" element={<LazyRoute component={FAQManager} />} />
            <Route path="inquiries" element={<LazyRoute component={InquiryManager} />} />
          </Route>

          {/* Admin Login - Separate Route */}
          <Route path="/admin/login" element={<LazyRoute component={AdminLogin} />} />
          <Route path="/admin/signup" element={<LazyRoute component={AdminSignup} />} />

          {/* Public Routes */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-white">
                <Header />
                <Routes>
                  <Route path="/" element={<LazyRoute component={MainPage} />} />
                  <Route path="/products" element={<LazyRoute component={ProductListPage} />} />
                  <Route path="/products/:id" element={<LazyRoute component={ProductDetailPage} />} />
                  <Route path="/mypage" element={<LazyRoute component={MyPage} />} />
                  <Route path="/mypage/info" element={<LazyRoute component={MyInfoPage} />} />
                  <Route path="/mypage/inquiry" element={<LazyRoute component={InquiryPage} />} />
                  <Route path="/login" element={<LazyRoute component={Login} />} />
                  <Route path="/signup" element={<LazyRoute component={SignUp} />} />
                  <Route path="/cs" element={<LazyRoute component={CSCenter} />} />
                  <Route path="/p/:code" element={<LazyRoute component={RedirectToProduct} />} />
                  <Route path="/search" element={<LazyRoute component={ProductSearchResult} />} />
                  <Route path="/company" element={<LazyRoute component={CompanyIntro} />} />
                  <Route path="/alliance" element={<LazyRoute component={AlliancePage} />} />
                  <Route path="/event" element={<LazyRoute component={EventPage} />} />
                  <Route path="/blank" element={<LazyRoute component={BlankPage} />} />
                  <Route path="/terms" element={<LazyRoute component={TermsOfService} />} />
                  <Route path="/privacy" element={<LazyRoute component={PrivacyPolicy} />} />
                  <Route path="*" element={<LazyRoute component={NotFound} />} />
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
