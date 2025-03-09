import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Note } from "@/types";
import { Download, FileText, FileIcon, BookText } from "lucide-react";
import jsPDF from "jspdf";
import { Modal } from "@/components/ui/modal";
import { ButtonProps } from "@/components/ui/button";

// Book export props
interface BookExportProps {
  book: Book;
  notes: Note[];
}

// Single note export props
interface SingleNoteExportProps {
  content: string;
  filename: string;
  buttonProps?: ButtonProps;
}

// Combined props type with discriminator
type ExportButtonProps = BookExportProps | SingleNoteExportProps;

// Helper function to determine if props are for a single note
function isSingleNoteProps(
  props: ExportButtonProps
): props is SingleNoteExportProps {
  return "content" in props;
}

// Implementation
export function ExportButton(props: ExportButtonProps) {
  // Define all state hooks at the top level
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<
    "TXT" | "PDF" | "Maturita TXT" | "Maturita PDF" | null
  >(null);
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null);

  // Check if it's a single note export
  if (isSingleNoteProps(props)) {
    const { content, filename, buttonProps } = props;

    const handleExport = () => {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          handleExport();
        }}
        aria-label="Exportovat poznámku"
        title="Exportovat poznámku"
        {...buttonProps}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    );
  }

  // Book export implementation
  const { book, notes } = props;

  // Check if the book has any notes (regular or AI summary)
  const hasNotes = notes.length > 0;
  // These variables might be useful in the future
  // const hasRegularNotes = notes.filter(note => !note.isAISummary && !note.isError).length > 0;
  // const hasAISummary = notes.some(note => note.isAISummary);

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
    setExportType(
      type as "TXT" | "PDF" | "Maturita TXT" | "Maturita PDF" | null
    );
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
      // Create PDF with UTF-8 support
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true,
      });

      // Add custom fonts for better typography
      // Using Helvetica as base font since it works well with Czech characters
      doc.setFont("helvetica", "normal");

      // Set page margins
      const margin = 20; // 20mm margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;

      // Add subtle page background for a more professional look
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Add elegant header with a gradient line
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageWidth, 35, "F");

      // Add gradient line under header
      doc.setLineDashPattern([1, 0], 0);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.8);
      doc.line(0, 35, pageWidth, 35);

      // Title with improved typography
      doc.setFontSize(18);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");

      // Center the title
      const titleLines = doc.splitTextToSize(book.title, contentWidth);
      doc.text(titleLines, pageWidth / 2, 20, { align: "center" });

      let yPosition = 50;

      // Basic information with elegant layout
      // Create a stylish box for basic info
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, "FD");

      yPosition += 10;

      // Author and date with improved styling
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Autor: ${book.author}`, margin + 10, yPosition);
      yPosition += 6;
      doc.text(`Datum: ${formatDate(book.createdAt)}`, margin + 10, yPosition);
      yPosition += 20;

      // Add author summary if available with elegant design
      if (book.authorSummary) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          // Add subtle page background for a more professional look
          doc.setFillColor(252, 252, 252);
          doc.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        // Section title with improved styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);

        // Add a small icon or decoration before section title
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 3, margin + 8, yPosition - 3);
        doc.text("O autorovi", margin + 12, yPosition);

        // Elegant line under section title
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition + 3, margin + contentWidth, yPosition + 3);

        yPosition += 12;

        // Author content with better typography
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);

        // Calculate height based on text length
        const authorLines = doc.splitTextToSize(
          book.authorSummary,
          contentWidth - 10
        );
        doc.text(authorLines, margin + 5, yPosition);
        yPosition += authorLines.length * 5.5 + 20;
      }

      // Add notes section with elegant design
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        // Add subtle page background for a more professional look
        doc.setFillColor(252, 252, 252);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        yPosition = margin;
      }

      // Section title with improved styling
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);

      // Add a small icon or decoration before section title
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition - 3, margin + 8, yPosition - 3);
      doc.text("Poznámky", margin + 12, yPosition);

      // Elegant line under section title
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 3, margin + contentWidth, yPosition + 3);

      yPosition += 12;

      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      const summaries = notes.filter((note) => note.isAISummary);

      if (regularNotes.length > 0) {
        regularNotes.forEach((note, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            // Add subtle page background for a more professional look
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            yPosition = margin;
          }

          // Create a subtle box for each note
          doc.setFillColor(250, 250, 250);
          doc.setDrawColor(230, 230, 230);
          doc.roundedRect(margin, yPosition, contentWidth, 8, 2, 2, "FD");

          // Note date with better styling
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          doc.text(`${formatDate(note.createdAt)}`, margin + 5, yPosition + 5);
          yPosition += 12;

          // Note content with improved typography
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);

          // Ensure text doesn't overflow by limiting width
          const noteLines = doc.splitTextToSize(
            note.content,
            contentWidth - 10
          );
          doc.text(noteLines, margin + 5, yPosition);

          // Calculate new position based on number of lines
          yPosition += noteLines.length * 5.5 + 15;

          // Add a subtle separator between notes
          if (index < regularNotes.length - 1) {
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.setLineDashPattern([2, 2], 0);
            doc.line(
              margin + 20,
              yPosition - 8,
              margin + contentWidth - 20,
              yPosition - 8
            );
            doc.setLineDashPattern([1, 0], 0);
            yPosition += 5;
          }

          // Check if we need a new page after this note
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            // Add subtle page background for a more professional look
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            yPosition = margin;
          }
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("Žádné poznámky", margin + 5, yPosition);
        yPosition += 15;
      }

      // Add AI summaries if available
      if (summaries.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          // Add subtle page background for a more professional look
          doc.setFillColor(252, 252, 252);
          doc.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        // Section title with improved styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);

        // Add a small icon or decoration before section title
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 3, margin + 8, yPosition - 3);
        doc.text("AI Shrnutí", margin + 12, yPosition);

        // Elegant line under section title
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition + 3, margin + contentWidth, yPosition + 3);

        yPosition += 12;

        summaries.forEach((summary, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            // Add subtle page background for a more professional look
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            yPosition = margin;
          }

          // Create a subtle box for each summary
          doc.setFillColor(245, 245, 250);
          doc.setDrawColor(220, 220, 240);
          doc.roundedRect(margin, yPosition, contentWidth, 8, 2, 2, "FD");

          // Summary date with better styling
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 100);
          doc.text(
            `AI Shrnutí (${formatDate(summary.createdAt)})`,
            margin + 5,
            yPosition + 5
          );
          yPosition += 12;

          // Summary content with improved typography
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);

          // Ensure text doesn't overflow by limiting width
          const summaryLines = doc.splitTextToSize(
            summary.content,
            contentWidth - 10
          );
          doc.text(summaryLines, margin + 5, yPosition);

          // Calculate new position based on number of lines
          yPosition += summaryLines.length * 5.5 + 15;

          // Add a subtle separator between summaries
          if (index < summaries.length - 1) {
            doc.setDrawColor(220, 220, 240);
            doc.setLineWidth(0.2);
            doc.setLineDashPattern([2, 2], 0);
            doc.line(
              margin + 20,
              yPosition - 8,
              margin + contentWidth - 20,
              yPosition - 8
            );
            doc.setLineDashPattern([1, 0], 0);
            yPosition += 5;
          }

          // Check if we need a new page after this summary
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            // Add subtle page background for a more professional look
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            yPosition = margin;
          }
        });
      }

      // Add elegant page numbers at the bottom
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Add footer with subtle line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        // Add page number with elegant styling
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Strana ${i} z ${pageCount}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
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
      // Create PDF with UTF-8 support
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true,
      });

      // Add custom fonts for better typography
      // Using Helvetica as base font since it works well with Czech characters
      doc.setFont("helvetica", "normal");

      // Set page margins
      const margin = 20; // 20mm margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;

      // Add subtle page background for a more professional look
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Add elegant header with a gradient line
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageWidth, 35, "F");

      // Add gradient line under header
      doc.setLineDashPattern([1, 0], 0);
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.8);
      doc.line(0, 35, pageWidth, 35);

      // Title with improved typography
      doc.setFontSize(18);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");

      // Center the title
      const titleText = `MATURITNÍ PŘÍPRAVA: ${book.title}`;
      const titleLines = doc.splitTextToSize(titleText, contentWidth);
      doc.text(titleLines, pageWidth / 2, 20, { align: "center" });

      let yPosition = 50;

      // Basic information with elegant layout
      // Create a stylish box for basic info
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, "FD");

      yPosition += 10;

      // Book title with better styling
      doc.setFontSize(13);
      doc.setTextColor(60, 60, 60);

      // Handle long titles by splitting them if needed
      const bookTitleLines = doc.splitTextToSize(
        `${book.title}`,
        contentWidth - 10
      );
      doc.setFont("helvetica", "bold");
      doc.text(bookTitleLines, margin + 10, yPosition);
      yPosition += bookTitleLines.length * 6 + 2;

      // Author and date with improved styling
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Autor: ${book.author}`, margin + 10, yPosition);
      yPosition += 6;
      doc.text(
        `Datum zpracování: ${formatDate(new Date().toISOString())}`,
        margin + 10,
        yPosition
      );
      yPosition += 20;

      // Author summary with elegant design
      if (book.authorSummary) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          // Add subtle page background for a more professional look
          doc.setFillColor(252, 252, 252);
          doc.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        // Section title with improved styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);

        // Add a small icon or decoration before section title
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 3, margin + 8, yPosition - 3);
        doc.text("O autorovi", margin + 12, yPosition);

        // Elegant line under section title
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition + 3, margin + contentWidth, yPosition + 3);

        yPosition += 12;

        // Author content with better typography
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);

        // Calculate height based on text length
        const authorLines = doc.splitTextToSize(
          book.authorSummary,
          contentWidth - 10
        );
        doc.text(authorLines, margin + 5, yPosition);
        yPosition += authorLines.length * 5.5 + 20;
      }

      // Add AI summary if available with elegant design
      const summary = notes.find((note) => note.isAISummary);
      if (summary) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          // Add subtle page background for a more professional look
          doc.setFillColor(252, 252, 252);
          doc.rect(0, 0, pageWidth, pageHeight, "F");
          yPosition = margin;
        }

        // Section title with improved styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);

        // Add a small icon or decoration before section title
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition - 3, margin + 8, yPosition - 3);
        doc.text("Shrnutí díla", margin + 12, yPosition);

        // Elegant line under section title
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition + 3, margin + contentWidth, yPosition + 3);

        yPosition += 12;

        // Summary content with better typography
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);

        // Ensure text doesn't overflow by limiting width
        const summaryLines = doc.splitTextToSize(
          summary.content,
          contentWidth - 10
        );
        doc.text(summaryLines, margin + 5, yPosition);
        yPosition += summaryLines.length * 5.5 + 20;
      }

      // Add notes with elegant design
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        // Add subtle page background for a more professional look
        doc.setFillColor(252, 252, 252);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        yPosition = margin;
      }

      // Section title with improved styling
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(50, 50, 50);

      // Add a small icon or decoration before section title
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition - 3, margin + 8, yPosition - 3);
      doc.text("Vlastní poznámky", margin + 12, yPosition);

      // Elegant line under section title
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition + 3, margin + contentWidth, yPosition + 3);

      yPosition += 12;

      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );

      if (regularNotes.length > 0) {
        regularNotes.forEach((note, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            // Add subtle page background for a more professional look
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            yPosition = margin;
          }

          // Note date
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`${formatDate(note.createdAt)}`, margin, yPosition);
          yPosition += 6;

          // Note content with proper wrapping
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          // Ensure text doesn't overflow by limiting width
          const noteLines = doc.splitTextToSize(note.content, contentWidth - 5);
          doc.text(noteLines, margin, yPosition);

          // Calculate new position based on number of lines
          yPosition += noteLines.length * 5 + 10;

          // Add a subtle separator between notes
          if (index < regularNotes.length - 1) {
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.line(
              margin,
              yPosition - 5,
              margin + contentWidth,
              yPosition - 5
            );
            yPosition += 5;
          }

          // Check if we need a new page after this note
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            // Add subtle page background for a more professional look
            doc.setFillColor(252, 252, 252);
            doc.rect(0, 0, pageWidth, pageHeight, "F");
            yPosition = margin;
          }
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Žádné vlastní poznámky", margin, yPosition);
        yPosition += 10;
      }

      // Add elegant page numbers at the bottom
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Add footer with subtle line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        // Add page number with elegant styling
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Strana ${i} z ${pageCount}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

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
                Jednoduchý textový soubor s poznámkami a základním formátováním
              </div>
              {!hasNotes && (
                <div className="mt-2 ml-11 text-xs text-yellow-500">
                  Poznámka: Kniha zatím nemá žádné poznámky
                </div>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting && hasNotes) handleExport(exportAsPDF, "PDF");
              }}
              disabled={isExporting || !hasNotes}
              className={`
                group flex flex-col items-start p-4 rounded-lg border border-gray-800 bg-gray-900/50
                transition-all duration-200 ease-in-out
                ${
                  isExporting || !hasNotes
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
                Formátovaný PDF dokument s lepším rozložením a strukturou
              </div>
              {!hasNotes && (
                <div className="mt-2 ml-11 text-xs text-amber-500">
                  Pro export PDF je potřeba mít alespoň jednu poznámku
                </div>
              )}
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
                Textový soubor strukturovaný pro přípravu k maturitě s
                přehledným členěním
              </div>
              {!hasNotes && (
                <div className="mt-2 ml-11 text-xs text-yellow-500">
                  Poznámka: Kniha zatím nemá žádné poznámky
                </div>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting && hasNotes)
                  handleExport(exportForMaturitaPDF, "Maturita PDF");
              }}
              disabled={isExporting || !hasNotes}
              className={`
                group flex flex-col items-start p-4 rounded-lg border border-gray-800 bg-gray-900/50
                transition-all duration-200 ease-in-out
                ${
                  isExporting || !hasNotes
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
                PDF dokument s profesionálním formátováním pro maturitní
                přípravu
              </div>
              {!hasNotes && (
                <div className="mt-2 ml-11 text-xs text-amber-500">
                  Pro export PDF je potřeba mít alespoň jednu poznámku
                </div>
              )}
            </button>
          </div>

          <div className="mt-6 p-3 bg-gray-800/70 border border-gray-700/50 rounded-md text-sm text-gray-300 flex items-center justify-center">
            <Download className="h-4 w-4 mr-2 text-amber-400" />
            Exportované soubory se stáhnou do složky stahování vašeho
            prohlížeče.
          </div>
        </div>
      </Modal>
    </div>
  );
}
