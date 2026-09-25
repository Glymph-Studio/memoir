import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-lg border border-red-100">
            <AlertTriangle size={32} className="mx-auto text-red-500 mb-3" />
            <h3 className="font-semibold text-neutral-800 mb-2">Something went wrong</h3>
            <p className="text-sm text-neutral-500 mb-4 break-words">{this.state.error?.message || 'Unknown error'}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="btn-primary w-full">Reload</button>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="btn-secondary w-full mt-2">Try again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
