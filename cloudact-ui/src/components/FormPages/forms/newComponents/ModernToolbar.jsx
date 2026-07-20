import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ModernToolbar({
  currentPage,
  numPages,
  setCurrentPage,
}) {
  const navBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 6px',
    border: 'none',
    background: 'transparent',
    color: '#495057',
    borderRadius: '6px',
    cursor: 'pointer',
    lineHeight: 0,
  };

  return (
    // Compact, centered page navigator — small footprint, no empty bar.
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '3px 8px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
        }}
      >
        <button
          type="button"
          style={{ ...navBtnStyle, opacity: currentPage <= 1 ? 0.4 : 1, cursor: currentPage <= 1 ? 'default' : 'pointer' }}
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', minWidth: '52px', textAlign: 'center' }}>
          {currentPage} / {numPages}
        </span>

        <button
          type="button"
          style={{ ...navBtnStyle, opacity: currentPage >= numPages ? 0.4 : 1, cursor: currentPage >= numPages ? 'default' : 'pointer' }}
          disabled={currentPage >= numPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
