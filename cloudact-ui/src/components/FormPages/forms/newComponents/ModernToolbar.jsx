import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useState } from 'react';

export default function ModernToolbar({
  currentPage,
  numPages,
  setCurrentPage,
  setScale,
  scale,
}) {

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0)); // Max zoom 200%
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5)); // Min zoom 50%
  };

  return (
    <>
      <div className="card mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          {/* Page Navigation */}
          <div className="d-flex align-items-center">
            <button
              className="btn btn-light me-2"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={20} />
            </button>

            <span className="fw-medium">
              {currentPage} / {numPages}
            </span>

            <button
              className="btn btn-light ms-2"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Field Controls */}
          <div className="d-flex align-items-center">

          {/* Add Zoom Controls */}
            {/* <div className="btn-group ms-3 border-start ps-3">
              <button
                className="btn btn-light"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="btn btn-light disabled">
                {Math.round(scale * 100)}%
              </span>
              <button
                className="btn btn-light"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}