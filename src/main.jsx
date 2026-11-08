import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Muestra el error en pantalla en vez de dejarla en blanco
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: '#fda4af', padding: 16, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
          {String(this.state.error?.stack || this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);