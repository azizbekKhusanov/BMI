import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Kutilmagan xatolik!</h1>
              <p className="text-slate-500 leading-relaxed">
                Tizimda texnik xatolik yuz berdi. Iltimos, sahifani yangilab ko'ring yoki bosh sahifaga qayting.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-slate-50 p-4 rounded-xl overflow-auto max-h-40 text-xs font-mono text-red-600 border border-red-100">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="rounded-xl border-slate-200 h-12 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} /> Yangilash
              </Button>
              <Button 
                onClick={this.handleGoHome}
                className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 h-12 font-semibold flex items-center justify-center gap-2"
              >
                <Home size={18} /> Bosh sahifa
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
