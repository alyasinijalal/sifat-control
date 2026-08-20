import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-2xl space-y-4 text-slate-900">
          <div className="flex items-center gap-3 text-rose-600 font-black text-lg">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span>Ошибка при отображении модуля</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Произошла сбойная ситуация при обработке данных. Восстановите работу компонента нажатием на кнопку ниже.
          </p>

          {this.state.error && (
            <div className="p-3 bg-slate-900 text-rose-300 font-mono text-[11px] rounded-xl overflow-x-auto">
              {this.state.error.toString()}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Попробовать снова</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}
