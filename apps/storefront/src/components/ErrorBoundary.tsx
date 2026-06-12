'use client';
import React from 'react';
import { ensureI18n } from '@ecommerce/i18n/src/config';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.componentName || 'Component'} failed:`, error, info);
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      // Class components can't use hooks, so call ensureI18n() directly.
      const i18n = ensureI18n();
      const message = i18n.t('errors:general.componentUnavailable', {
        name: this.props.componentName || 'Unknown',
      }) as string;

      return (
        <div className="p-4 text-center text-slate-400 text-sm border border-dashed border-slate-300 rounded-lg">
          {message}
        </div>
      );
    }
    return this.props.children;
  }
}
