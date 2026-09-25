import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import ChatView from './pages/ChatView';
import Starred from './pages/Starred';
import Scrapbooks from './pages/Scrapbooks';
import Canvas from './pages/Canvas';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function PageTransition({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fdf8f0]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📖</div>
          <p className="text-memoir-400 font-medium">Loading Memoir v4...</p>
          <p className="text-xs text-memoir-300 mt-1">Free • No login needed • Privacy-first</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Auth routes - optional, for saving */}
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />

          {/* Public routes - free use, no login required (guest mode) */}
          <Route path="/" element={<Layout><PageTransition><Home /></PageTransition></Layout>} />
          <Route path="/chat/:chatId" element={<Layout><PageTransition><ChatView /></PageTransition></Layout>} />
          <Route path="/starred" element={<Layout><PageTransition><Starred /></PageTransition></Layout>} />
          <Route path="/scrapbooks" element={<Layout><PageTransition><Scrapbooks /></PageTransition></Layout>} />
          <Route path="/canvas/:scrapbookId" element={<ErrorBoundary><Canvas /></ErrorBoundary>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
