
import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import { ToastProvider } from './context/ToastContext';
import { GlobalDialogProvider } from './context/GlobalDialogContext';
import GlobalDialog from './components/GlobalDialog';



interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public declare props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }


  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Safely access the error message
      const errorMessage = this.state.error?.message || 'Unknown Error';

      return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontFamily: 'sans-serif', 
            backgroundColor: '#f8fafc',
            color: '#334155',
            textAlign: 'center',
            padding: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤕</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>อุ๊ย! เกิดข้อผิดพลาด (Application Error)</h1>
          <p style={{ maxWidth: '500px', marginBottom: '20px', lineHeight: '1.6' }}>
            ระบบเกิดการขัดข้องชั่วคราว ไม่ต้องตกใจนะครับ<br/>
            <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '12px', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                {errorMessage}
            </span>
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
                padding: '12px 24px', 
                backgroundColor: '#4f46e5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
          >
             ลองรีโหลดใหม่ (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- INSTANT PWA SYNC (Inspired by HoneyMoney) ---
// This runs immediately before React mounts to ensure the UI feels snappy
try {
  const cachedName = localStorage.getItem('pwa_app_name');
  const cachedIcon = localStorage.getItem('pwa_app_icon');

  if (cachedName) {
    document.title = cachedName;
    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) metaTitle.setAttribute('content', cachedName);
  }

  if (cachedIcon) {
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon) appleIcon.setAttribute('href', cachedIcon);
    
    // Also update favicon if it's a standard link
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && !favicon.getAttribute('href')?.startsWith('data:image/svg')) {
      favicon.setAttribute('href', cachedIcon);
    }
  }
} catch (e) {
  console.warn("PWA Sync failed:", e);
}

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <GlobalDialogProvider>
          <App />
          <GlobalDialog />
        </GlobalDialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
