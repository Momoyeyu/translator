import { Outlet } from 'react-router-dom';
import './AuthLayout.less';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Left Column: Form */}
      <div className="auth-layout__left">
        <div className="auth-layout__left-inner">
          <Outlet />
        </div>
      </div>

      {/* Right Column: Decorative */}
      <div className="auth-layout__right">
        <div className="auth-layout__deco-circle auth-layout__deco-circle--1" />
        <div className="auth-layout__deco-circle auth-layout__deco-circle--2" />
        <div className="auth-layout__deco-circle auth-layout__deco-circle--3" />

        {/* Product Preview Mockup */}
        <div className="auth-layout__preview">
          <div className="auth-layout__preview-header">
            <span className="auth-layout__preview-dot auth-layout__preview-dot--1" />
            <span className="auth-layout__preview-dot auth-layout__preview-dot--2" />
            <span className="auth-layout__preview-dot auth-layout__preview-dot--3" />
            <div className="auth-layout__preview-title-bar" />
          </div>

          <div className="auth-layout__preview-content">
            <div className="auth-layout__preview-source">
              <div className="auth-layout__preview-label">English</div>
              <div className="auth-layout__preview-line" style={{ width: '100%' }} />
              <div className="auth-layout__preview-line" style={{ width: '85%' }} />
              <div className="auth-layout__preview-line" style={{ width: '92%' }} />
              <div className="auth-layout__preview-line" style={{ width: '70%' }} />
            </div>

            <div className="auth-layout__preview-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="auth-layout__preview-target">
              <div className="auth-layout__preview-label">Chinese</div>
              <div className="auth-layout__preview-line" style={{ width: '90%' }} />
              <div className="auth-layout__preview-line" style={{ width: '100%' }} />
              <div className="auth-layout__preview-line" style={{ width: '78%' }} />
              <div className="auth-layout__preview-line" style={{ width: '88%' }} />
            </div>
          </div>

          <div className="auth-layout__preview-badge">
            <span className="auth-layout__preview-badge-dot" />
            Translating... 80%
          </div>
        </div>
      </div>
    </div>
  );
}
