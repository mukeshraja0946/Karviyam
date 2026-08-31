import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-[#B71C1C] rounded-3xl flex items-center justify-center mb-4 border border-red-100 shadow-md">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6">
            An unexpected error occurred while rendering this page. You can reload the page or click below to restore state.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-200"
            >
              <span>Back to Store Home</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
