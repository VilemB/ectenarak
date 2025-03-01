import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Note } from "@/types";
import { Download, FileText, FileIcon, BookText } from "lucide-react";
import jsPDF from "jspdf";
import { Modal } from "@/components/ui/modal";

interface ExportButtonProps {
  book: Book;
  notes: Note[];
}

export function ExportButton({ book, notes }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("cs-CZ");
  };

  const generateTextContent = () => {
    let content = `# ${book.title}\n`;
    content += `Autor: ${book.author}\n`;
    content += `Datum: ${formatDate(book.createdAt)}\n\n`;

    if (book.authorSummary) {
      content += `## O autorovi\n${book.authorSummary}\n\n`;
    }

    content += `## Poznámky\n`;

    const regularNotes = notes.filter(
      (note) => !note.isAISummary && !note.isError
    );
    const summaries = notes.filter((note) => note.isAISummary);

    if (regularNotes.length > 0) {
      regularNotes.forEach((note) => {
        content += `### Poznámka (${formatDate(note.createdAt)})\n${
          note.content
        }\n\n`;
      });
    } else {
      content += "Žádné poznámky\n\n";
    }

    if (summaries.length > 0) {
      content += `## AI Shrnutí\n`;
      summaries.forEach((summary) => {
        content += `${summary.content}\n\n`;
      });
    }

    return content;
  };

  const handleExport = async (exportFunction: () => void, type: string) => {
    setExportType(type);
    setIsExporting(true);
    setExportSuccess(null);

    try {
      // Small delay to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      exportFunction();

      // Show success status
      setExportSuccess(true);

      // Close modal after success
      setTimeout(() => {
        setIsExporting(false);
        setExportType(null);
        setExportSuccess(null);
        setIsExportModalOpen(false);
      }, 1500);
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);

      // Show error status
      setExportSuccess(false);

      // Reset after error
      setTimeout(() => {
        setIsExporting(false);
        setExportType(null);
        setExportSuccess(null);
      }, 2000);
    }
  };

  const exportAsText = () => {
    setIsExporting(true);
    try {
      const content = generateTextContent();
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${book.title} - poznámky.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting notes:", error);
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  const exportAsPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Set font to support Czech characters
      doc.setFont("helvetica");

      // Title
      doc.setFontSize(18);
      doc.text(book.title, 20, 20);

      // Author and date
      doc.setFontSize(12);
      doc.text(`Autor: ${book.author}`, 20, 30);
      doc.text(`Datum: ${formatDate(book.createdAt)}`, 20, 37);

      let yPosition = 45;

      // Author summary
      if (book.authorSummary) {
        doc.setFontSize(14);
        doc.text("O autorovi", 20, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        const authorLines = doc.splitTextToSize(book.authorSummary, 170);
        doc.text(authorLines, 20, yPosition);
        yPosition += authorLines.length * 5 + 10;
      }

      // Notes section
      doc.setFontSize(14);
      doc.text("Poznámky", 20, yPosition);
      yPosition += 7;

      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );

      if (regularNotes.length > 0) {
        doc.setFontSize(10);

        regularNotes.forEach((note) => {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.text(`Poznámka (${formatDate(note.createdAt)})`, 20, yPosition);
          yPosition += 7;

          doc.setFontSize(10);
          const noteLines = doc.splitTextToSize(note.content, 170);
          doc.text(noteLines, 20, yPosition);
          yPosition += noteLines.length * 5 + 10;
        });
      } else {
        doc.setFontSize(10);
        doc.text("Žádné poznámky", 20, yPosition);
        yPosition += 10;
      }

      // AI Summaries
      const summaries = notes.filter((note) => note.isAISummary);

      if (summaries.length > 0) {
        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text("AI Shrnutí", 20, yPosition);
        yPosition += 7;

        doc.setFontSize(10);

        summaries.forEach((summary) => {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          const summaryLines = doc.splitTextToSize(summary.content, 170);
          doc.text(summaryLines, 20, yPosition);
          yPosition += summaryLines.length * 5 + 10;
        });
      }

      doc.save(`${book.title} - poznámky.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  const exportForMaturita = () => {
    setIsExporting(true);
    try {
      let content = `# MATURITNÍ PŘÍPRAVA: ${book.title}\n\n`;
      content += `## Základní informace\n`;
      content += `- **Název díla:** ${book.title}\n`;
      content += `- **Autor:** ${book.author}\n`;
      content += `- **Datum zpracování:** ${formatDate(
        new Date().toISOString()
      )}\n\n`;

      if (book.authorSummary) {
        content += `## Autor\n${book.authorSummary}\n\n`;
      }

      // Add AI summary if available
      const summary = notes.find((note) => note.isAISummary);
      if (summary) {
        content += `## Shrnutí díla\n${summary.content}\n\n`;
      }

      content += `## Vlastní poznámky\n`;
      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      if (regularNotes.length > 0) {
        regularNotes.forEach((note) => {
          content += `### ${formatDate(note.createdAt)}\n${note.content}\n\n`;
        });
      } else {
        content += "Žádné vlastní poznámky\n\n";
      }

      content += `## Struktura pro ústní zkoušku\n`;
      content += `1. **Literární druh a žánr:**\n   _Doplň_\n\n`;
      content += `2. **Téma a motivy:**\n   _Doplň_\n\n`;
      content += `3. **Časoprostor:**\n   _Doplň_\n\n`;
      content += `4. **Kompoziční výstavba:**\n   _Doplň_\n\n`;
      content += `5. **Hlavní postavy:**\n   _Doplň_\n\n`;
      content += `6. **Jazykové prostředky:**\n   _Doplň_\n\n`;
      content += `7. **Literárně-historický kontext:**\n   _Doplň_\n\n`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${book.title} - maturitní příprava.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting maturita format:", error);
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  const exportForMaturitaPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Set font to support Czech characters
      doc.setFont("helvetica");

      // Title
      doc.setFontSize(18);
      doc.text(`MATURITNÍ PŘÍPRAVA: ${book.title}`, 20, 20);

      let yPosition = 30;

      // Basic information
      doc.setFontSize(14);
      doc.text("Základní informace", 20, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.text(`Název díla: ${book.title}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Autor: ${book.author}`, 20, yPosition);
      yPosition += 5;
      doc.text(
        `Datum zpracování: ${formatDate(new Date().toISOString())}`,
        20,
        yPosition
      );
      yPosition += 10;

      // Author summary
      if (book.authorSummary) {
        doc.setFontSize(14);
        doc.text("Autor", 20, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        const authorLines = doc.splitTextToSize(book.authorSummary, 170);
        doc.text(authorLines, 20, yPosition);
        yPosition += authorLines.length * 5 + 10;
      }

      // AI Summary
      const summary = notes.find((note) => note.isAISummary);
      if (summary) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text("Shrnutí díla", 20, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        const summaryLines = doc.splitTextToSize(summary.content, 170);
        doc.text(summaryLines, 20, yPosition);
        yPosition += summaryLines.length * 5 + 10;
      }

      // User notes
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text("Vlastní poznámky", 20, yPosition);
      yPosition += 7;

      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      if (regularNotes.length > 0) {
        doc.setFontSize(10);

        regularNotes.forEach((note) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.text(formatDate(note.createdAt), 20, yPosition);
          yPosition += 5;

          doc.setFontSize(10);
          const noteLines = doc.splitTextToSize(note.content, 170);
          doc.text(noteLines, 20, yPosition);
          yPosition += noteLines.length * 5 + 10;
        });
      } else {
        doc.setFontSize(10);
        doc.text("Žádné vlastní poznámky", 20, yPosition);
        yPosition += 10;
      }

      // Exam structure
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text("Struktura pro ústní zkoušku", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("1. Literární druh a žánr:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("2. Téma a motivy:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("3. Časoprostor:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("4. Kompoziční výstavba:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("5. Hlavní postavy:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("6. Jazykové prostředky:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.text("7. Literárně-historický kontext:", 20, yPosition);
      yPosition += 5;
      doc.setFontSize(10);
      doc.text("_Doplň_", 30, yPosition);

      doc.save(`${book.title} - maturitní příprava.pdf`);
    } catch (error) {
      console.error("Error exporting maturita PDF:", error);
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 gap-1 px-2 rounded-md transition-all duration-200 ease-in-out"
        onClick={(e) => {
          e.stopPropagation();
          setIsExportModalOpen(true);
        }}
        aria-label="Export options"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Export</span>
      </Button>

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => !isExporting && setIsExportModalOpen(false)}
        title="Exportovat poznámky"
        showCloseButton={!isExporting}
      >
        <div className="p-6 max-w-full overflow-x-hidden">
          {exportSuccess === true && (
            <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Export byl úspěšně dokončen
            </div>
          )}

          {exportSuccess === false && (
            <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Při exportu došlo k chybě
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting) handleExport(exportAsText, "TXT");
              }}
              disabled={isExporting}
              className={`
                group flex flex-col items-start p-4 rounded-lg border border-gray-800 bg-gray-900/50
                transition-all duration-200 ease-in-out
                ${
                  isExporting
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-blue-500/30 hover:bg-gray-800/50"
                }
                ${
                  isExporting && exportType === "TXT"
                    ? "border-blue-500/30 bg-blue-500/5"
                    : ""
                }
              `}
            >
              <div className="flex items-center w-full mb-2">
                <div className="flex-shrink-0 mr-3">
                  {isExporting && exportType === "TXT" ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  ) : (
                    <div className="text-blue-500">
                      <FileText className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-white group-hover:text-blue-400 transition-colors">
                    Textový formát
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 ml-11">
                Jednoduchý textový soubor s poznámkami a shrnutím
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting) handleExport(exportAsPDF, "PDF");
              }}
              disabled={isExporting}
              className={`
                group flex flex-col items-start p-4 rounded-lg border border-gray-800 bg-gray-900/50
                transition-all duration-200 ease-in-out
                ${
                  isExporting
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-red-500/30 hover:bg-gray-800/50"
                }
                ${
                  isExporting && exportType === "PDF"
                    ? "border-red-500/30 bg-red-500/5"
                    : ""
                }
              `}
            >
              <div className="flex items-center w-full mb-2">
                <div className="flex-shrink-0 mr-3">
                  {isExporting && exportType === "PDF" ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <div className="text-red-500">
                      <FileIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-white group-hover:text-red-400 transition-colors">
                    PDF formát
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 ml-11">
                Formátovaný PDF dokument s poznámkami a shrnutím
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting)
                  handleExport(exportForMaturita, "Maturita TXT");
              }}
              disabled={isExporting}
              className={`
                group flex flex-col items-start p-4 rounded-lg border border-gray-800 bg-gray-900/50
                transition-all duration-200 ease-in-out
                ${
                  isExporting
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-amber-500/30 hover:bg-gray-800/50"
                }
                ${
                  isExporting && exportType === "Maturita TXT"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : ""
                }
              `}
            >
              <div className="flex items-center w-full mb-2">
                <div className="flex-shrink-0 mr-3">
                  {isExporting && exportType === "Maturita TXT" ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  ) : (
                    <div className="text-amber-500">
                      <BookText className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-white group-hover:text-amber-400 transition-colors">
                    Maturitní formát (TXT)
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 ml-11">
                Textový soubor strukturovaný pro přípravu k maturitě
              </div>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting)
                  handleExport(exportForMaturitaPDF, "Maturita PDF");
              }}
              disabled={isExporting}
              className={`
                group flex flex-col items-start p-4 rounded-lg border border-gray-800 bg-gray-900/50
                transition-all duration-200 ease-in-out
                ${
                  isExporting
                    ? "cursor-not-allowed opacity-60"
                    : "hover:border-amber-500/30 hover:bg-gray-800/50"
                }
                ${
                  isExporting && exportType === "Maturita PDF"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : ""
                }
              `}
            >
              <div className="flex items-center w-full mb-2">
                <div className="flex-shrink-0 mr-3">
                  {isExporting && exportType === "Maturita PDF" ? (
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  ) : (
                    <div className="text-amber-500">
                      <FileIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-white group-hover:text-amber-400 transition-colors">
                    Maturitní formát (PDF)
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 ml-11">
                PDF dokument strukturovaný pro přípravu k maturitě
              </div>
            </button>
          </div>

          <div className="mt-5 text-xs text-gray-500 italic text-center">
            Exportované soubory se stáhnou do složky stahování vašeho
            prohlížeče.
          </div>
        </div>
      </Modal>
    </div>
  );
}
