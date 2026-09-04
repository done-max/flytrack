import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SkyGuard AI Uncaught Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 liquid-glass rounded-3xl border border-red-500/40 text-slate-200 flex flex-col items-center justify-center text-center gap-3 font-sans shadow-2xl m-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase">
              {this.props.fallbackTitle || 'Component Error Recovered'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed font-mono">
              {this.state.error?.message || 'An unexpected simulation rendering state was caught and isolated.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-active text-white text-xs font-mono font-bold cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recover Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}