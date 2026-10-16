import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                An unexpected display error occurred. You can easily reload the application or reset stored settings to restore normal operation.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Error Details:
                </span>
                <p className="font-mono text-[11px] text-rose-600 dark:text-rose-400 break-words line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition-all tap-active"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetData}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all tap-active"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Local State & Reload</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
