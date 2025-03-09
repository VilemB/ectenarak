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

// Helper function to ensure proper encoding of Czech characters
function encodeCzechText(text: string): string {
  if (!text) return "";

  // This function ensures proper encoding of Czech characters
  return text;
}

// Helper function to ensure proper encoding of Czech characters in PDF
function encodePdfCzechText(doc: jsPDF, text: string): string {
  if (!text) return "";

  // First encode the text using the general function
  const encodedText = encodeCzechText(text);

  // Return the encoded text directly since we're using a font that supports Czech characters
  return encodedText;
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
    let content = `# ${encodeCzechText(book.title)}\n`;
    content += `Autor: ${encodeCzechText(book.author)}\n`;
    content += `Datum: ${formatDate(book.createdAt)}\n\n`;

    if (book.authorSummary) {
      content += `## ${encodeCzechText("O autorovi")}\n${encodeCzechText(
        book.authorSummary
      )}\n\n`;
    }

    content += `## ${encodeCzechText("Poznámky")}\n`;

    const regularNotes = notes.filter(
      (note) => !note.isAISummary && !note.isError
    );
    const summaries = notes.filter((note) => note.isAISummary && !note.isError);

    if (regularNotes.length > 0) {
      regularNotes.forEach((note, index) => {
        content += `### ${encodeCzechText("Poznámka")} ${index + 1}\n`;
        content += `${formatDate(note.createdAt)}\n\n`;
        content += `${encodeCzechText(note.content)}\n\n`;
      });
    } else {
      content += `${encodeCzechText("Žádné poznámky")}\n\n`;
    }

    if (summaries.length > 0) {
      content += `## ${encodeCzechText("AI Shrnutí")}\n`;
      summaries.forEach((summary, index) => {
        content += `### ${encodeCzechText("Shrnutí")} ${index + 1}\n`;
        content += `${formatDate(summary.createdAt)}\n\n`;
        content += `${encodeCzechText(summary.content)}\n\n`;
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
      link.download = `${encodeCzechText(book.title)} - poznámky.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting text:", error);
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
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

      // Add Czech language font support using local font files
      doc.addFont("/fonts/roboto-regular.ttf", "Roboto", "normal");
      doc.addFont("/fonts/roboto-bold.ttf", "Roboto", "bold");
      doc.addFont("/fonts/roboto-italic.ttf", "Roboto", "italic");

      // Set the default font to Roboto for better Czech character support
      doc.setFont("Roboto", "normal");

      // Set page margins
      const margin = 20; // 20mm margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;

      // Simple helper function to check if we need a new page
      const checkForPageBreak = (
        currentY: number,
        requiredHeight: number = 20
      ): number => {
        if (currentY + requiredHeight > pageHeight - margin) {
          doc.addPage();
          return margin;
        }
        return currentY;
      };

      // Simple helper function to process markdown for Czech characters
      const processMarkdown = (text: string): string => {
        if (!text) return "";

        // First encode Czech characters
        const encodedText = encodePdfCzechText(doc, text);

        // Replace markdown formatting with plain text
        let processed = encodedText;

        // Remove markdown formatting
        processed = processed.replace(/^# (.+)$/gm, "$1");
        processed = processed.replace(/^## (.+)$/gm, "$1");
        processed = processed.replace(/^### (.+)$/gm, "$1");
        processed = processed.replace(/\*\*(.+?)\*\*/g, "$1");
        processed = processed.replace(/\*(.+?)\*/g, "$1");
        processed = processed.replace(/^- (.+)$/gm, "• $1");
        processed = processed.replace(/^(\d+)\. (.+)$/gm, "$1. $2");

        return processed;
      };

      // Initialize the y position for content placement
      let yPosition = margin;

      // Title
      doc.setFont("Roboto", "bold");
      doc.setFontSize(16);
      doc.text(encodeCzechText(book.title), margin, yPosition);
      yPosition += 10;

      // Author
      doc.setFont("Roboto", "normal");
      doc.setFontSize(12);
      doc.text(`Autor: ${encodeCzechText(book.author)}`, margin, yPosition);
      yPosition += 10;

      // Date
      doc.text(`Datum: ${formatDate(book.createdAt)}`, margin, yPosition);
      yPosition += 15;

      // Filter notes
      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      const summaries = notes.filter(
        (note) => note.isAISummary && !note.isError
      );

      // Add notes section
      if (regularNotes.length > 0) {
        // Section title
        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        doc.text("POZNÁMKY", margin, yPosition);
        yPosition += 10;

        // For each note, add content
        regularNotes.forEach((note, index) => {
          // Check if we need a new page
          yPosition = checkForPageBreak(yPosition, 30);

          // Note number and date
          doc.setFont("Roboto", "bold");
          doc.setFontSize(11);
          doc.text(
            `Poznámka #${index + 1} - ${formatDate(note.createdAt)}`,
            margin,
            yPosition
          );
          yPosition += 7;

          // Process and render note content
          doc.setFont("Roboto", "normal");
          doc.setFontSize(10);

          // Split text to fit within page width
          const processedContent = processMarkdown(note.content);
          const contentLines = doc.splitTextToSize(
            processedContent,
            contentWidth
          );

          // Draw content with proper line spacing
          for (let i = 0; i < contentLines.length; i++) {
            // Check for page break during rendering if needed
            yPosition = checkForPageBreak(yPosition, 5);
            doc.text(contentLines[i], margin, yPosition);
            yPosition += 5;
          }

          // Add spacing between notes
          yPosition += 10;
        });
      } else {
        // No notes message
        doc.setFont("Roboto", "italic");
        doc.setFontSize(11);
        doc.text("Žádné poznámky", margin, yPosition);
        yPosition += 10;
      }

      // Add AI summaries
      if (summaries.length > 0) {
        // Check if we need a new page
        yPosition = checkForPageBreak(yPosition, 30);

        // Section title
        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        doc.text("AI SHRNUTÍ", margin, yPosition);
        yPosition += 10;

        // For each summary, add content
        summaries.forEach((summary) => {
          // Check if we need a new page
          yPosition = checkForPageBreak(yPosition, 30);

          // Summary date
          doc.setFont("Roboto", "bold");
          doc.setFontSize(11);
          doc.text(
            `AI Shrnutí - ${formatDate(summary.createdAt)}`,
            margin,
            yPosition
          );
          yPosition += 7;

          // Process and render summary content
          doc.setFont("Roboto", "normal");
          doc.setFontSize(10);

          // Split text to fit within page width
          const processedContent = processMarkdown(summary.content);
          const contentLines = doc.splitTextToSize(
            processedContent,
            contentWidth
          );

          // Draw content with proper line spacing
          for (let i = 0; i < contentLines.length; i++) {
            // Check for page break during rendering if needed
            yPosition = checkForPageBreak(yPosition, 5);
            doc.text(contentLines[i], margin, yPosition);
            yPosition += 5;
          }

          // Add spacing between summaries
          yPosition += 10;
        });
      }

      // Add author summary if available
      if (book.authorSummary) {
        // Check if we need a new page
        yPosition = checkForPageBreak(yPosition, 30);

        // Section title
        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        doc.text("O AUTOROVI", margin, yPosition);
        yPosition += 10;

        // Process the author summary
        const processedAuthorSummary = processMarkdown(
          book.authorSummary || ""
        );

        // Split text to fit within margins
        const authorSummaryLines = doc.splitTextToSize(
          processedAuthorSummary,
          contentWidth
        );

        // Draw text with proper line spacing
        doc.setFont("Roboto", "normal");
        doc.setFontSize(10);

        for (let i = 0; i < authorSummaryLines.length; i++) {
          // Check for page break during rendering if needed
          yPosition = checkForPageBreak(yPosition, 5);
          doc.text(authorSummaryLines[i], margin, yPosition);
          yPosition += 5;
        }
      }

      // Add simple page numbers to all pages
      const totalPages = doc.internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      // Save the PDF
      doc.save(`${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
    }
  };

  const exportForMaturita = () => {
    setIsExporting(true);
    try {
      let content = `# ${encodeCzechText(
        "MATURITNÍ PŘÍPRAVA"
      )}: ${encodeCzechText(book.title)}\n\n`;
      content += `${encodeCzechText(book.title)}\n`;
      content += `Autor: ${encodeCzechText(book.author)}\n`;
      content += `Datum zpracování: ${formatDate(
        new Date().toISOString()
      )}\n\n`;

      content += `## ${encodeCzechText("O autorovi")}\n`;
      if (book.authorSummary) {
        content += `${encodeCzechText(book.authorSummary)}\n\n`;
      } else {
        content += `${encodeCzechText(
          "Informace o autorovi nejsou k dispozici."
        )}\n\n`;
      }

      // Add AI summary if available
      const summaries = notes.filter(
        (note) => note.isAISummary && !note.isError
      );
      if (summaries.length > 0) {
        content += `## ${encodeCzechText("Shrnutí díla")}\n`;
        summaries.forEach((summary) => {
          content += `${encodeCzechText(summary.content)}\n\n`;
        });
      } else {
        content += `## ${encodeCzechText("Shrnutí díla")}\n`;
        content += `${encodeCzechText("Shrnutí díla není k dispozici.")}\n\n`;
      }

      // Add regular notes
      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      content += `## ${encodeCzechText("Vlastní poznámky")}\n`;
      if (regularNotes.length > 0) {
        regularNotes.forEach((note, index) => {
          content += `### ${encodeCzechText("Poznámka")} ${index + 1}\n`;
          content += `${formatDate(note.createdAt)}\n\n`;
          content += `${encodeCzechText(note.content)}\n\n`;
        });
      } else {
        content += `${encodeCzechText("Žádné vlastní poznámky")}\n\n`;
      }

      // Add exam structure
      content += `## ${encodeCzechText("Struktura pro ústní zkoušku")}\n\n`;
      content += `1. ${encodeCzechText("Literárněhistorický kontext")}\n`;
      content += `2. ${encodeCzechText("Téma a motivy")}\n`;
      content += `3. ${encodeCzechText("Časoprostor")}\n`;
      content += `4. ${encodeCzechText("Kompoziční výstavba")}\n`;
      content += `5. ${encodeCzechText("Literární druh a žánr")}\n`;
      content += `6. ${encodeCzechText("Vypravěč / lyrický subjekt")}\n`;
      content += `7. ${encodeCzechText("Postavy")}\n`;
      content += `8. ${encodeCzechText("Vyprávěcí způsoby")}\n`;
      content += `9. ${encodeCzechText("Typy promluv")}\n`;
      content += `10. ${encodeCzechText("Veršová výstavba")}\n`;
      content += `11. ${encodeCzechText(
        "Jazykové prostředky a jejich funkce"
      )}\n`;
      content += `12. ${encodeCzechText("Tropy a figury a jejich funkce")}\n\n`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${encodeCzechText(book.title)} - maturitní příprava.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting maturita text:", error);
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
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
        hotfixes: ["px_scaling"],
      });

      // Add Czech language font support using local font files
      doc.addFont("/fonts/roboto-regular.ttf", "Roboto", "normal");
      doc.addFont("/fonts/roboto-bold.ttf", "Roboto", "bold");
      doc.addFont("/fonts/roboto-italic.ttf", "Roboto", "italic");

      // Set the default font to Roboto for better Czech character support
      doc.setFont("Roboto", "normal");

      // Set page margins
      const margin = 20; // 20mm margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;

      // Define consistent colors for better visual design
      const colors = {
        text: [50, 50, 50],
        lightText: [100, 100, 100],
        heading: [40, 40, 40],
        accent: [65, 105, 225], // Royal Blue
        secondary: [100, 149, 237], // Cornflower Blue
        background: [252, 252, 252],
        headerBg: [240, 248, 255], // Alice Blue
        border: [220, 220, 220],
        noteBg: [248, 250, 252],
        summaryBg: [240, 248, 255],
      };

      // Helper function to apply colors consistently
      const applyColor = (
        colorType: keyof typeof colors,
        method: "setFillColor" | "setDrawColor" | "setTextColor"
      ) => {
        const [r, g, b] = colors[colorType];
        doc[method](r, g, b);
      };

      // Helper function to check if we need a new page
      const checkForPageBreak = (
        currentY: number,
        requiredHeight: number = 20
      ): number => {
        if (currentY + requiredHeight > pageHeight - 40) {
          doc.addPage();
          applyColor("background", "setFillColor");
          doc.rect(0, 0, pageWidth, pageHeight, "F");

          // Add header to new page
          applyColor("headerBg", "setFillColor");
          doc.rect(0, 0, pageWidth, 15, "F");
          applyColor("border", "setDrawColor");
          doc.setLineWidth(0.5);
          doc.line(0, 15, pageWidth, 15);

          // Add book title to header
          doc.setFont("Roboto", "normal");
          doc.setFontSize(9);
          applyColor("lightText", "setTextColor");
          doc.text(encodeCzechText(book.title), margin, 10);

          // Add page number
          const pageNumber = doc.internal.pages.length;
          doc.text(`${pageNumber}`, pageWidth - margin - 5, 10, {
            align: "right",
          });

          return margin + 10;
        }
        return currentY;
      };

      // Helper function to process markdown for Czech characters
      const processMarkdown = (text: string): string => {
        if (!text) return "";

        // First encode Czech characters
        const encodedText = encodePdfCzechText(doc, text);

        // Replace markdown formatting with plain text
        let processed = encodedText;

        // Process headings - convert to plain text with proper spacing and capitalization
        processed = processed.replace(/^# (.+)$/gm, (_, p1) =>
          p1.toUpperCase()
        );
        processed = processed.replace(/^## (.+)$/gm, (_, p1) =>
          p1.toUpperCase()
        );
        processed = processed.replace(/^### (.+)$/gm, (_, p1) =>
          p1.toUpperCase()
        );

        // Remove bold and italic markers
        processed = processed.replace(/\*\*(.+?)\*\*/g, "$1");
        processed = processed.replace(/\*(.+?)\*/g, "$1");

        // Convert lists to plain text with proper indentation
        processed = processed.replace(/^- (.+)$/gm, "• $1");
        processed = processed.replace(/^(\d+)\. (.+)$/gm, "$1. $2");

        return processed;
      };

      // Add subtle page background for a more professional look
      applyColor("background", "setFillColor");
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Add elegant header with a gradient-like effect
      applyColor("headerBg", "setFillColor");
      doc.rect(0, 0, pageWidth, 30, "F");

      // Add subtle accent line at the bottom of the header
      applyColor("border", "setDrawColor");
      doc.setLineWidth(0.5);
      doc.line(0, 30, pageWidth, 30);

      // Title with improved typography
      doc.setFont("Roboto", "bold");
      doc.setFontSize(18);
      applyColor("heading", "setTextColor");

      // Center the title with proper Czech character encoding and capitalization
      const titleText = encodeCzechText(
        `MATURITNÍ PŘÍPRAVA: ${book.title.toUpperCase()}`
      );
      doc.text(titleText, pageWidth / 2, 20, { align: "center" });

      // Set initial y position for content
      let yPosition = 40;

      // Basic information with elegant layout
      // Create a stylish box for basic info
      applyColor("noteBg", "setFillColor");
      applyColor("border", "setDrawColor");
      doc.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, "FD");

      yPosition += 10;

      // Author and date with improved styling
      doc.setFont("Roboto", "normal");
      doc.setFontSize(12);
      applyColor("text", "setTextColor");
      doc.text(
        `Autor: ${encodeCzechText(book.author)}`,
        margin + 10,
        yPosition
      );
      yPosition += 6;
      doc.text(`Datum: ${formatDate(book.createdAt)}`, margin + 10, yPosition);
      yPosition += 20;

      // Add author summary if available with elegant design
      if (book.authorSummary) {
        // Check if we need a new page
        yPosition = checkForPageBreak(yPosition, 60);

        // Create a stylish container for author information
        applyColor("summaryBg", "setFillColor");
        applyColor("border", "setDrawColor");
        doc.setLineWidth(0.2);

        // Calculate container height based on content length
        const authorSummaryText = book.authorSummary || "";
        const authorPreviewLines = doc.splitTextToSize(
          authorSummaryText,
          contentWidth - 30
        );
        // Make container height proportional to text length with a minimum height
        const estimatedHeight = Math.max(
          authorPreviewLines.length * 6 + 50,
          120
        );

        // Draw container with rounded corners
        doc.roundedRect(
          margin,
          yPosition,
          contentWidth,
          estimatedHeight,
          3,
          3,
          "FD"
        );

        // Add accent bar on the left
        applyColor("accent", "setFillColor");
        doc.roundedRect(margin, yPosition, 5, estimatedHeight, 1, 1, "F");

        // Section title with improved styling - capitalized
        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        applyColor("heading", "setTextColor");
        doc.text(encodeCzechText("O AUTOROVI"), margin + 15, yPosition + 15);

        // Add decorative line under the title
        applyColor("accent", "setDrawColor");
        doc.setLineWidth(0.5);
        doc.line(margin + 15, yPosition + 20, margin + 80, yPosition + 20);

        // Author content with better typography
        doc.setFont("Roboto", "normal");
        doc.setFontSize(11);
        applyColor("text", "setTextColor");

        // Process the author summary to remove markdown formatting
        const processedAuthorSummary = processMarkdown(
          book.authorSummary || ""
        );

        // Split text to fit within margins and handle Czech characters
        const authorSummaryLines = doc.splitTextToSize(
          encodeCzechText(processedAuthorSummary),
          contentWidth - 30
        );

        // Draw text with proper line spacing
        let contentY = yPosition + 30;
        for (let i = 0; i < authorSummaryLines.length; i++) {
          // Check for page break during rendering if needed
          if (contentY > pageHeight - 40) {
            doc.addPage();
            applyColor("background", "setFillColor");
            doc.rect(0, 0, pageWidth, pageHeight, "F");

            // Add header to new page
            applyColor("headerBg", "setFillColor");
            doc.rect(0, 0, pageWidth, 15, "F");
            applyColor("border", "setDrawColor");
            doc.setLineWidth(0.5);
            doc.line(0, 15, pageWidth, 15);

            // Add book title to header
            doc.setFont("Roboto", "normal");
            doc.setFontSize(9);
            applyColor("lightText", "setTextColor");
            doc.text(encodeCzechText(book.title), margin, 10);

            // Continue container on new page
            applyColor("summaryBg", "setFillColor");
            applyColor("border", "setDrawColor");
            doc.setLineWidth(0.2);

            // Draw container on new page
            doc.roundedRect(
              margin,
              margin + 10,
              contentWidth,
              pageHeight - margin * 2 - 10,
              3,
              3,
              "FD"
            );

            // Add accent bar on the left
            applyColor("accent", "setFillColor");
            doc.roundedRect(
              margin,
              margin + 10,
              5,
              pageHeight - margin * 2 - 10,
              1,
              1,
              "F"
            );

            contentY = margin + 25;

            // Reset counter to continue from top of page
            const remainingLines = authorSummaryLines.slice(i);

            // Draw remaining text
            doc.setFont("Roboto", "normal");
            doc.setFontSize(11);
            applyColor("text", "setTextColor");

            for (let j = 0; j < remainingLines.length; j++) {
              doc.text(remainingLines[j], margin + 15, contentY + j * 6);
            }

            // Update position and break out of the loop
            yPosition = contentY + remainingLines.length * 6 + 15;
            break;
          }

          doc.text(authorSummaryLines[i], margin + 15, contentY);
          contentY += 6;
        }

        // Update position for next section if we didn't break to a new page
        if (contentY <= pageHeight - 40) {
          yPosition = contentY + 15;
        }
      }

      // Add notes section with elegant design
      // Check if we need a new page
      yPosition = checkForPageBreak(yPosition, 60);

      // Section title with improved styling
      doc.setFont("Roboto", "bold");
      doc.setFontSize(16);
      applyColor("heading", "setTextColor");
      doc.text(encodeCzechText("POZNÁMKY"), margin, yPosition);

      // Add decorative line under section title
      applyColor("accent", "setDrawColor");
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 5, margin + 60, yPosition + 5);

      yPosition += 15;

      const maturitaNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );
      const summaries = notes.filter(
        (note) => note.isAISummary && !note.isError
      );

      // For each note, add content with proper styling
      if (maturitaNotes.length > 0) {
        maturitaNotes.forEach((note, index) => {
          // Check if we need a new page
          yPosition = checkForPageBreak(yPosition, 60);

          // Add a subtle note container with improved design
          applyColor("noteBg", "setFillColor");
          applyColor("border", "setDrawColor");
          doc.setLineWidth(0.2);

          // Calculate note container dimensions
          const notePreviewLines = doc.splitTextToSize(
            note.content.substring(0, 150),
            contentWidth - 30
          );
          const estimatedHeight = Math.max(
            notePreviewLines.length * 6 + 30,
            50
          );

          // Create a more visually appealing note container
          doc.roundedRect(
            margin,
            yPosition,
            contentWidth,
            estimatedHeight,
            3,
            3,
            "FD"
          );

          // Add a colored accent bar on the left for better visual separation
          applyColor("accent", "setFillColor");
          doc.roundedRect(margin, yPosition, 5, estimatedHeight, 1, 1, "F");

          // Note date with better styling
          doc.setFont("Roboto", "bold");
          doc.setFontSize(10);
          applyColor("lightText", "setTextColor");
          doc.text(formatDate(note.createdAt), margin + 10, yPosition + 12);

          // Add note number for reference
          const noteNumberText = `#${index + 1}`;
          const noteNumberWidth = doc.getTextWidth(noteNumberText);
          doc.text(
            noteNumberText,
            pageWidth - margin - 10 - noteNumberWidth,
            yPosition + 12
          );

          // Add a subtle separator line
          applyColor("border", "setDrawColor");
          doc.setLineWidth(0.2);
          doc.line(
            margin + 10,
            yPosition + 18,
            margin + contentWidth - 10,
            yPosition + 18
          );

          // Process and render note content with markdown support
          doc.setFont("Roboto", "normal");
          doc.setFontSize(11);
          applyColor("text", "setTextColor");

          // Split text to fit within note container
          const processedContent = processMarkdown(note.content);
          const contentLines = doc.splitTextToSize(
            processedContent,
            contentWidth - 30
          );

          // Draw content with proper line spacing
          let contentY = yPosition + 25;
          for (let i = 0; i < contentLines.length; i++) {
            // Check for page break during rendering if needed
            if (contentY > pageHeight - 40) {
              doc.addPage();
              applyColor("background", "setFillColor");
              doc.rect(0, 0, pageWidth, pageHeight, "F");

              // Add header to new page
              applyColor("headerBg", "setFillColor");
              doc.rect(0, 0, pageWidth, 15, "F");
              applyColor("border", "setDrawColor");
              doc.setLineWidth(0.5);
              doc.line(0, 15, pageWidth, 15);

              // Add book title to header
              doc.setFont("Roboto", "normal");
              doc.setFontSize(9);
              applyColor("lightText", "setTextColor");
              doc.text(encodeCzechText(book.title), margin, 10);

              // Continue container on new page
              contentY = margin + 25;

              // Add a note continuation indicator
              doc.setFont("Roboto", "italic");
              doc.setFontSize(9);
              applyColor("lightText", "setTextColor");
              doc.text(
                `Poznámka #${index + 1} (pokračování)`,
                margin,
                contentY - 10
              );

              // Add a subtle separator line
              applyColor("border", "setDrawColor");
              doc.setLineWidth(0.2);
              doc.line(
                margin,
                contentY - 5,
                margin + contentWidth,
                contentY - 5
              );

              // Reset counter to continue from top of page
              const remainingLines = contentLines.slice(i);

              // Draw remaining text
              doc.setFont("Roboto", "normal");
              doc.setFontSize(11);
              applyColor("text", "setTextColor");

              for (let j = 0; j < remainingLines.length; j++) {
                doc.text(remainingLines[j], margin + 15, contentY + j * 6);
              }

              // Update position and break out of the loop
              yPosition = contentY + remainingLines.length * 6 + 15;
              break;
            }

            doc.text(contentLines[i], margin + 15, contentY);
            contentY += 6;
          }

          // Update position for next note if we didn't break to a new page
          if (contentY <= pageHeight - 40) {
            yPosition = contentY + 15;
          }

          // Add extra spacing between notes for better separation
          yPosition += 10;
        });
      } else {
        doc.setFont("Roboto", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(encodeCzechText("Žádné poznámky"), margin, yPosition + 10);
        yPosition += 20;
      }

      // Add AI summaries with improved positioning
      if (summaries.length > 0) {
        // Check if we need a new page
        yPosition = checkForPageBreak(yPosition, 60);

        // Section title with improved styling
        doc.setFont("Roboto", "bold");
        doc.setFontSize(16);
        applyColor("heading", "setTextColor");
        doc.text(encodeCzechText("AI SHRNUTÍ"), margin, yPosition);

        // Add decorative line under section title
        applyColor("accent", "setDrawColor");
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 5, margin + 60, yPosition + 5);

        yPosition += 15;

        // For each summary, add content with improved positioning
        summaries.forEach((summary) => {
          // Check if we need a new page
          yPosition = checkForPageBreak(yPosition, 60);

          // Add a subtle summary container with improved design
          applyColor("summaryBg", "setFillColor");
          applyColor("border", "setDrawColor");
          doc.setLineWidth(0.2);

          // Calculate summary container dimensions
          const summaryPreviewLines = doc.splitTextToSize(
            summary.content.substring(0, 150),
            contentWidth - 30
          );
          const estimatedHeight = Math.max(
            summaryPreviewLines.length * 6 + 30,
            50
          );

          // Create a more visually appealing summary container
          doc.roundedRect(
            margin,
            yPosition,
            contentWidth,
            estimatedHeight,
            3,
            3,
            "FD"
          );

          // Add a colored accent bar on the left for better visual separation
          applyColor("accent", "setFillColor");
          doc.roundedRect(margin, yPosition, 5, estimatedHeight, 1, 1, "F");

          // Add AI badge
          doc.setFont("Roboto", "bold");
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);

          // Draw badge background
          applyColor("accent", "setFillColor");
          doc.roundedRect(margin + 10, yPosition + 8, 20, 10, 5, 5, "F");

          // Draw badge text
          doc.text("AI", margin + 15, yPosition + 14);

          // Summary date with better positioning
          doc.setFont("Roboto", "normal");
          doc.setFontSize(10);
          applyColor("lightText", "setTextColor");
          doc.text(formatDate(summary.createdAt), margin + 35, yPosition + 14);

          // Add a subtle separator line
          applyColor("border", "setDrawColor");
          doc.setLineWidth(0.2);
          doc.line(
            margin + 10,
            yPosition + 22,
            margin + contentWidth - 10,
            yPosition + 22
          );

          // Process and render summary content
          doc.setFont("Roboto", "normal");
          doc.setFontSize(11);
          applyColor("text", "setTextColor");

          // Split text to fit within summary container
          const processedContent = processMarkdown(summary.content);
          const contentLines = doc.splitTextToSize(
            processedContent,
            contentWidth - 30
          );

          // Draw content with proper line spacing
          let contentY = yPosition + 30;
          for (let i = 0; i < contentLines.length; i++) {
            // Check for page break during rendering if needed
            if (contentY > pageHeight - 40) {
              doc.addPage();
              applyColor("background", "setFillColor");
              doc.rect(0, 0, pageWidth, pageHeight, "F");

              // Add header to new page
              applyColor("headerBg", "setFillColor");
              doc.rect(0, 0, pageWidth, 15, "F");
              applyColor("border", "setDrawColor");
              doc.setLineWidth(0.5);
              doc.line(0, 15, pageWidth, 15);

              // Add book title to header
              doc.setFont("Roboto", "normal");
              doc.setFontSize(9);
              applyColor("lightText", "setTextColor");
              doc.text(encodeCzechText(book.title), margin, 10);

              // Continue container on new page
              contentY = margin + 25;

              // Add a summary continuation indicator
              doc.setFont("Roboto", "italic");
              doc.setFontSize(9);
              applyColor("lightText", "setTextColor");
              doc.text("AI Shrnutí (pokračování)", margin, contentY - 10);

              // Add a subtle separator line
              applyColor("border", "setDrawColor");
              doc.setLineWidth(0.2);
              doc.line(
                margin,
                contentY - 5,
                margin + contentWidth,
                contentY - 5
              );

              // Reset counter to continue from top of page
              const remainingLines = contentLines.slice(i);

              // Draw remaining text
              doc.setFont("Roboto", "normal");
              doc.setFontSize(11);
              applyColor("text", "setTextColor");

              for (let j = 0; j < remainingLines.length; j++) {
                doc.text(remainingLines[j], margin + 15, contentY + j * 6);
              }

              // Update position and break out of the loop
              yPosition = contentY + remainingLines.length * 6 + 15;
              break;
            }

            doc.text(contentLines[i], margin + 15, contentY);
            contentY += 6;
          }

          // Update position for next summary if we didn't break to a new page
          if (contentY <= pageHeight - 40) {
            yPosition = contentY + 15;
          }

          // Add extra spacing between summaries for better separation
          yPosition += 10;
        });
      }

      // Add exam structure with improved styling
      yPosition = checkForPageBreak(yPosition, 60);

      // Section title with improved styling
      doc.setFont("Roboto", "bold");
      doc.setFontSize(16);
      applyColor("heading", "setTextColor");
      doc.text(
        encodeCzechText("STRUKTURA PRO ÚSTNÍ ZKOUŠKU"),
        margin,
        yPosition
      );

      // Add decorative line under section title
      applyColor("accent", "setDrawColor");
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 5, margin + 60, yPosition + 5);

      yPosition += 15;

      // Add exam structure in a visually appealing container
      applyColor("noteBg", "setFillColor");
      applyColor("border", "setDrawColor");

      // Calculate container height
      const examStructure = [
        "Literárněhistorický kontext",
        "Téma a motivy",
        "Časoprostor",
        "Kompoziční výstavba",
        "Literární druh a žánr",
        "Vypravěč / lyrický subjekt",
        "Postavy",
        "Vyprávěcí způsoby",
        "Typy promluv",
        "Veršová výstavba",
        "Jazykové prostředky a jejich funkce",
        "Tropy a figury a jejich funkce",
      ];

      const structureHeight = examStructure.length * 8 + 20;

      // Draw container with rounded corners
      doc.roundedRect(
        margin,
        yPosition,
        contentWidth,
        structureHeight,
        3,
        3,
        "FD"
      );

      // Draw structure items with improved styling
      doc.setFont("Roboto", "normal");
      doc.setFontSize(11);
      applyColor("text", "setTextColor");

      for (let i = 0; i < examStructure.length; i++) {
        // Check if we need a new page
        if (yPosition + 10 + i * 8 > pageHeight - 40) {
          doc.addPage();
          applyColor("background", "setFillColor");
          doc.rect(0, 0, pageWidth, pageHeight, "F");

          // Add header to new page
          applyColor("headerBg", "setFillColor");
          doc.rect(0, 0, pageWidth, 15, "F");
          applyColor("border", "setDrawColor");
          doc.setLineWidth(0.5);
          doc.line(0, 15, pageWidth, 15);

          // Add book title to header
          doc.setFont("Roboto", "normal");
          doc.setFontSize(9);
          applyColor("lightText", "setTextColor");
          doc.text(encodeCzechText(book.title), margin, 10);

          // Continue container on new page
          yPosition = margin + 10;

          // Redraw container
          applyColor("noteBg", "setFillColor");
          applyColor("border", "setDrawColor");

          // Calculate remaining height
          const remainingItems = examStructure.length - i;
          const remainingHeight = remainingItems * 8 + 10;

          // Draw container
          doc.roundedRect(
            margin,
            yPosition,
            contentWidth,
            remainingHeight,
            3,
            3,
            "FD"
          );

          // Reset font for content
          doc.setFont("Roboto", "normal");
          doc.setFontSize(11);
          applyColor("text", "setTextColor");

          // Draw remaining items
          for (let j = i; j < examStructure.length; j++) {
            const itemY = yPosition + 10 + (j - i) * 8;

            // Draw item number
            doc.setFont("Roboto", "bold");
            doc.text(`${j + 1}.`, margin + 10, itemY);

            // Draw item text
            doc.setFont("Roboto", "normal");
            doc.text(encodeCzechText(examStructure[j]), margin + 20, itemY);
          }

          // Update position and break out of the loop
          yPosition += remainingHeight + 15;
          break;
        }

        // Draw item number
        doc.setFont("Roboto", "bold");
        doc.text(`${i + 1}.`, margin + 10, yPosition + 10 + i * 8);

        // Draw item text
        doc.setFont("Roboto", "normal");
        doc.text(
          encodeCzechText(examStructure[i]),
          margin + 20,
          yPosition + 10 + i * 8
        );
      }

      // Update position for next section
      if (yPosition + structureHeight <= pageHeight - 40) {
        yPosition += structureHeight + 15;
      }

      // Add page numbers to all pages
      const totalPages = doc.internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Add footer with page number
        doc.setFont("Roboto", "normal");
        doc.setFontSize(9);
        applyColor("lightText", "setTextColor");
        doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      // Save the PDF with a Czech-friendly filename
      doc.save(
        `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_maturita.pdf`
      );
      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
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
