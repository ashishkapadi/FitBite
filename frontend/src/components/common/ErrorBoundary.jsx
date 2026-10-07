import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[FitBite React ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            background: '#FFFFFF',
            padding: '36px',
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥗</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#0F172A' }}>
              Something paused your meal flow
            </h2>
            <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '0.95rem' }}>
              We hit an unexpected snag rendering this view. Don't worry, your orders and saved custom meals are safe.
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Return to Marketplace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
