import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, error: err?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ReachAI Error]', error, info);
  }

  handleReload = () => {
    window.location.hash = '/dashboard';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#0F1117] text-[#F1F5F9]">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L4.206 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold text-[#F1F5F9]">Something went wrong</h2>
            <p className="text-[13px] text-[#94A3B8]">{this.state.error}</p>
            <button
              onClick={this.handleReload}
              className="mt-2 px-5 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[13px] font-semibold rounded-lg transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
