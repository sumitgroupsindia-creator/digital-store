import { Component } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './ui';

/**
 * App-wide error boundary. Catches render-time crashes anywhere in the tree
 * and shows a recoverable fallback instead of a blank white screen.
 *
 * (React Query / network failures are handled per-page with <ErrorState/>;
 * this is the last line of defense for unexpected JS errors.)
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-5">
          <Icon name="alert" className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-display font-bold text-fg">Something went wrong</h1>
        <p className="text-sm text-muted mt-1.5 max-w-sm">
          An unexpected error occurred. You can try reloading the page or head back to the store.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary text-sm">
            <Icon name="refresh" className="w-4 h-4" /> Reload page
          </button>
          <Link to="/" onClick={this.handleReset} className="btn-secondary text-sm">
            <Icon name="store" className="w-4 h-4" /> Back to Store
          </Link>
        </div>
      </div>
    );
  }
}
