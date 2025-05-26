import React from 'react';

/**
 * Component to display pagination controls.
 * @param {object} props
 * @param {number} props.currentPage - The current active page.
 * @param {number} props.lastPage - The total number of pages.
 * @param {number} [props.totalItems] - Optional total number of items.
 * @param {function} props.onPageChange - Callback function invoked when a page change is requested (receives the new page number).
 * @param {boolean} [props.isLoading=false] - Loading state to disable buttons.
 */
function PaginationControls({
    currentPage,
    lastPage,
    totalItems,
    onPageChange,
    isLoading = false
}) {
    if (!lastPage || lastPage <= 1) {
        return null; // Don't render if only one page or no data
    }

    return (
        <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
            >
                Previous
            </button>
            <span>
                Page {currentPage} of {lastPage} {totalItems !== undefined ? `(Total: ${totalItems})` : ''}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage || isLoading}
            >
                Next
            </button>
            {/* You could add logic here to display specific page numbers if desired */}
        </div>
    );
}

export default PaginationControls;