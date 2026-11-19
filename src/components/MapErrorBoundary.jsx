import { Component } from 'react';
import { SiteIcon } from './Icons.jsx';

export default class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('SafariMap failed to render:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-savanna-200 bg-cream-100/90 shadow-card p-4 sm:p-7">
          <div className="rounded-2xl bg-cream-200 min-h-[320px] flex items-center justify-center px-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <SiteIcon name="map" className="text-3xl text-teal-700" />
              <p className="font-display text-lg text-teal-800">Map unavailable</p>
              <p className="text-xs text-teal-700/80 max-w-sm">
                The interactive map could not be displayed. The rest of this page is unaffected.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}