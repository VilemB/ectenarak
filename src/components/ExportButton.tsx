import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Note } from "@/types";
import { Download, FileText, Loader2, FileIcon } from "lucide-react";
import jsPDF from "jspdf";
import { Modal } from "@/components/ui/modal";

interface ExportButtonProps {
  book: Book;
  notes: Note[];
}

export function ExportButton({ book, notes }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
      setShowModal(false);
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
      setShowModal(false);
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
      setShowModal(false);
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
      setShowModal(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-50/30 text-blue-700 border-blue-200 hover:bg-blue-100/40 rounded-full transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Exportuji...
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </>
        )}
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => !isExporting && setShowModal(false)}
        title={`Exportovat ${book.title}`}
        showCloseButton={true}
      >
        <div className="p-5 max-w-full overflow-x-hidden">
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                exportAsText();
              }}
              disabled={isExporting}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3 text-blue-500" />
                <div>
                  <div className="font-medium">Textový formát</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Jednoduchý textový soubor s poznámkami a shrnutím
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                exportAsPDF();
              }}
              disabled={isExporting}
            >
              <div className="flex items-center">
                <FileIcon className="h-5 w-5 mr-3 text-red-500" />
                <div>
                  <div className="font-medium">PDF formát</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Formátovaný PDF dokument s poznámkami a shrnutím
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                exportForMaturita();
              }}
              disabled={isExporting}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-3 text-amber-500" />
                <div>
                  <div className="font-medium">Maturitní formát (TXT)</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Textový soubor strukturovaný pro přípravu k maturitě
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start text-left h-auto py-3 px-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                exportForMaturitaPDF();
              }}
              disabled={isExporting}
            >
              <div className="flex items-center">
                <FileIcon className="h-5 w-5 mr-3 text-amber-500" />
                <div>
                  <div className="font-medium">Maturitní formát (PDF)</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    PDF dokument strukturovaný pro přípravu k maturitě
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
