import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log to performance monitor
    if (typeof window !== 'undefined' && (window as any).performanceMonitor) {
      (window as any).performanceMonitor.recordMetric({
        chunkLoadTime: 0,
        chunkSize: 0,
        loadSuccess: false,
        error: error.message,
        chunkName: 'component-error',
        timestamp: Date.now(),
      });
    }

    // Log to console for debugging
    console.error('Chunk Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleChunkLoadError = (event: CustomEvent) => {
    console.log('Chunk load error event received:', event.detail);
    this.setState({
      hasError: true,
      error: new Error(`Failed to load chunk: ${event.detail.chunkId}`)
    });
  };

  componentDidMount() {
    // Listen for chunk load errors
    if (typeof window !== 'undefined') {
      window.addEventListener('chunkLoadError', this.handleChunkLoadError as EventListener);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('chunkLoadError', this.handleChunkLoadError as EventListener);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-medium">
                    {this.state.error?.message || 'A loading error occurred'}
                  </p>
                  <p className="text-sm text-orange-700">
                    This might be due to a network issue or an update being deployed.
                    Try refreshing the page to resolve this issue.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>

              <Button
                onClick={() => window.history.back()}
                className="w-full"
                variant="outline"
              >
                Go Back
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}