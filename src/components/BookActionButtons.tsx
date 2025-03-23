import { Button } from "@/components/ui/button";
import { Book } from "@/types";
import { Trash2, User, Sparkles } from "lucide-react";
import { ExportButton } from "./ExportButton";

// Create a separate component for action buttons in the book header
const BookActionButtons = ({
  book,
  setIsAuthorInfoVisible,
  isAuthorInfoVisible,
  setAuthorSummaryModal,
  handleDeleteAuthorSummary,
  isGeneratingAuthorSummary,
  handleBookDelete,
}: {
  book: Book;
  setIsAuthorInfoVisible: (visible: boolean) => void;
  isAuthorInfoVisible: boolean;
  setAuthorSummaryModal: (open: boolean) => void;
  handleDeleteAuthorSummary: () => void;
  isGeneratingAuthorSummary: boolean;
  handleBookDelete: () => void;
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 sm:flex-row">
      {book.authorSummary ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsAuthorInfoVisible(!isAuthorInfoVisible);
            }}
            variant="outline"
            size="sm"
            className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
          >
            <User className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Informace o autorovi</span>
            <span className="sm:hidden">Info</span>
          </Button>
          <div className="flex">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setAuthorSummaryModal(true);
              }}
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200 rounded-r-none border-r-0"
              disabled={isGeneratingAuthorSummary}
            >
              {isGeneratingAuthorSummary ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  <span>Generuji...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">
                    Aktualizovat informace o autorovi
                  </span>
                  <span className="sm:hidden">Aktualizovat</span>
                </>
              )}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAuthorSummary();
              }}
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-200 hover:bg-destructive/10 hover:text-destructive dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-destructive/20 transition-all duration-200 rounded-l-none px-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Smazat info o autorovi</span>
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setAuthorSummaryModal(true);
          }}
          variant="outline"
          size="sm"
          className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
          disabled={!book.id || isGeneratingAuthorSummary}
        >
          {isGeneratingAuthorSummary ? (
            <>
              <div className="w-4 h-4 border-2 border-t-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
              <span>Generuji...</span>
            </>
          ) : (
            <>
              <User className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Informace o autorovi</span>
              <span className="sm:hidden">Info</span>
            </>
          )}
        </Button>
      )}

      <div className="flex gap-1.5 ml-auto sm:ml-0">
        <ExportButton book={book} notes={book.notes || []} />

        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          onClick={(e) => {
            e.stopPropagation();
            handleBookDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BookActionButtons;
