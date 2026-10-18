import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Oldish app:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FAF8F5',
            padding: '24px',
            fontFamily: 'Cairo, sans-serif'
          }}
        >
          <div 
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '36px 28px',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid #EAE5DC'
            }}
          >
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FFF5F5',
                color: '#E53E3E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#886E42', fontWeight: 700, marginBottom: '6px' }}>
              Oldish — أولديش
            </div>

            <h1 style={{ fontSize: '1.25rem', color: '#1A202C', margin: '0 0 10px 0', fontWeight: 700 }}>
              عذراً، حدث خطأ غير متوقع
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#718096', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              نعتذر عن هذا الخلل المؤقت. يمكنك تحديث الصفحة أو العودة إلى الصفحة الرئيسية للموقع.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-outline-gold"
                style={{ padding: '8px 18px' }}
              >
                <RotateCcw size={16} />
                <span>إعادة تحميل الصفحة</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{ padding: '8px 18px' }}
              >
                <Home size={16} />
                <span>العودة للرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
