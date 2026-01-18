import Button from './Button';

export interface PaginationMeta {
  current_page: number;
  last_page?: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
}

export default function Pagination({
  meta,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
  className = '',
}: PaginationProps) {
  const { current_page, last_page, total, per_page, from, to } = meta;
  const totalPages = last_page || Math.ceil(total / per_page);

  const handlePrevious = () => {
    if (current_page > 1) {
      onPageChange(current_page - 1);
    }
  };

  const handleNext = () => {
    if (current_page < totalPages) {
      onPageChange(current_page + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== current_page) {
      onPageChange(page);
    }
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Si le nombre total de pages est petit, afficher toutes
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher les pages avec des ellipses
      if (current_page <= 3) {
        // Début de la pagination
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (current_page >= totalPages - 2) {
        // Fin de la pagination
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Milieu de la pagination
        pages.push(1);
        pages.push('...');
        for (let i = current_page - 1; i <= current_page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 ${className}`}>
      {/* Informations sur les résultats */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Affichage de <span className="font-semibold">{from || 0}</span> à{' '}
        <span className="font-semibold">{to || 0}</span> sur{' '}
        <span className="font-semibold">{total}</span> résultat{total > 1 ? 's' : ''}
      </div>

      {/* Sélecteur de nombre d'éléments par page */}
      {onPerPageChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Par page:
          </label>
          <select
            value={per_page}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-800"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation des pages */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={current_page === 1}
          className="px-3 py-1"
        >
          Précédent
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  current_page === pageNum
                    ? 'bg-red-800 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={current_page >= totalPages}
          className="px-3 py-1"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
