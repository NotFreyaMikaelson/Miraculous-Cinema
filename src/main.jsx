import React from 'react';
import ReactDOM from 'react-dom/client';

// Muestra errores de render en pantalla
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

const root = ReactDOM.createRoot(document.getElementById('root'));

// Import dinámico: si App.jsx o sus imports fallan al cargar, el error se muestra en pantalla
import('./App.jsx')
  .then(({ default: App }) => {
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  })
  .catch((err) => {
    root.render(
      <pre style={{ color: '#fda4af', padding: 16, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
        {String(err?.stack || err)}
      </pre>
    );
  });