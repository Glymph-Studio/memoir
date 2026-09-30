import { Link } from 'react-router-dom';

export default function AuthLegalLinks() {
  return (
    <nav aria-label="Legal information" className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs text-memoir-600">
      <Link to="/privacy" className="underline-offset-2 hover:underline">Privacy</Link>
      <Link to="/terms" className="underline-offset-2 hover:underline">Terms</Link>
      <Link to="/cookies" className="underline-offset-2 hover:underline">Cookies</Link>
      <Link to="/refunds" className="underline-offset-2 hover:underline">Refunds</Link>
    </nav>
  );
}
