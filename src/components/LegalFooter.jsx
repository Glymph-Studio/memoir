import { Link } from 'react-router-dom';

export default function LegalFooter() {
  return (
    <footer className="border-t border-memoir-100 bg-white px-4 py-5 text-center text-xs text-memoir-500">
      <nav aria-label="Legal information" className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <Link to="/privacy" className="hover:text-memoir-800">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-memoir-800">Terms and Conditions</Link>
        <Link to="/cookies" className="hover:text-memoir-800">Cookie Policy</Link>
        <Link to="/refunds" className="hover:text-memoir-800">Refund Policy</Link>
      </nav>
      <p className="mt-3">© {new Date().getFullYear()} Anadi Tripathi. All rights reserved.</p>
    </footer>
  );
}
