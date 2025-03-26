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
  buttonProps?: ButtonProps;
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

      // Store current font settings to maintain consistency across page breaks
      let currentFontStyle = "normal";
      let currentFontSize = 10;
      let currentTextColor = [50, 50, 50];

      // Helper function to set font settings
      const setFontSettings = (
        style: string,
        size: number,
        color: number[]
      ) => {
        doc.setFont("Roboto", style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);

        // Store current settings
        currentFontStyle = style;
        currentFontSize = size;
        currentTextColor = color;
      };

      // Simple helper function to check if we need a new page
      const checkForPageBreak = (
        currentY: number,
        requiredHeight: number = 20
      ): number => {
        if (currentY + requiredHeight > pageHeight - margin) {
          // Remember current font settings
          const rememberStyle = currentFontStyle;
          const rememberSize = currentFontSize;
          const rememberColor = [...currentTextColor];

          doc.addPage();

          // Add a simple header to each new page
          setFontSettings("italic", 8, [150, 150, 150]);
          doc.text(encodeCzechText(book.title), margin, 10);

          // Restore font settings after adding the header
          setFontSettings(rememberStyle, rememberSize, rememberColor);

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
      setFontSettings("bold", 16, [50, 50, 50]);
      doc.text(encodeCzechText(book.title), margin, yPosition);
      yPosition += 10;

      // Author
      setFontSettings("normal", 12, [50, 50, 50]);
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
        setFontSettings("bold", 14, [70, 70, 70]);
        doc.text("POZNÁMKY", margin, yPosition);

        // Add a simple line under the section title
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);

        yPosition += 10;

        // For each note, add content
        regularNotes.forEach((note, index) => {
          // Check if we need a new page
          yPosition = checkForPageBreak(yPosition, 30);

          // Note number and date
          setFontSettings("bold", 11, [80, 80, 80]);
          doc.text(
            `Poznámka #${index + 1} - ${formatDate(note.createdAt)}`,
            margin,
            yPosition
          );
          yPosition += 7;

          // Process and render note content
          setFontSettings("normal", 10, [50, 50, 50]);

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
        setFontSettings("italic", 11, [120, 120, 120]);
        doc.text("Žádné poznámky", margin, yPosition);
        yPosition += 10;
      }

      // Add AI summaries
      if (summaries.length > 0) {
        // Check if we need a new page
        yPosition = checkForPageBreak(yPosition, 30);

        // Section title
        setFontSettings("bold", 14, [70, 70, 70]);
        doc.text("AI SHRNUTÍ", margin, yPosition);

        // Add a simple line under the section title
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);

        yPosition += 10;

        // For each summary, add content
        summaries.forEach((summary) => {
          // Check if we need a new page
          yPosition = checkForPageBreak(yPosition, 30);

          // Summary date
          setFontSettings("bold", 11, [80, 80, 80]);
          doc.text(
            `AI Shrnutí - ${formatDate(summary.createdAt)}`,
            margin,
            yPosition
          );
          yPosition += 7;

          // Process and render summary content
          setFontSettings("normal", 10, [50, 50, 50]);

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
        setFontSettings("bold", 14, [70, 70, 70]);
        doc.text("O AUTOROVI", margin, yPosition);

        // Add a simple line under the section title
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);

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
        setFontSettings("normal", 10, [50, 50, 50]);

        for (let i = 0; i < authorSummaryLines.length; i++) {
          // Check for page break during rendering if needed
          yPosition = checkForPageBreak(yPosition, 5);
          doc.text(authorSummaryLines[i], margin, yPosition);
          yPosition += 5;
        }
      }

      // Add simple page numbers to all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Remember current font settings
        const rememberStyle = currentFontStyle;
        const rememberSize = currentFontSize;
        const rememberColor = [...currentTextColor];

        // Set footer font
        setFontSettings("normal", 9, [150, 150, 150]);

        // Add a simple footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        // Add page number
        doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });

        // Restore font settings
        setFontSettings(rememberStyle, rememberSize, rememberColor);
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

      // Store current font settings to maintain consistency across page breaks
      let currentFontStyle = "normal";
      let currentFontSize = 10;
      let currentTextColor = [50, 50, 50];

      // Helper function to set font settings
      const setFontSettings = (
        style: string,
        size: number,
        color: number[]
      ) => {
        doc.setFont("Roboto", style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);

        // Store current settings
        currentFontStyle = style;
        currentFontSize = size;
        currentTextColor = color;
      };

      // Simple helper function to check if we need a new page
      const checkForPageBreak = (
        currentY: number,
        requiredHeight: number = 20
      ): number => {
        if (currentY + requiredHeight > pageHeight - margin) {
          // Remember current font settings
          const rememberStyle = currentFontStyle;
          const rememberSize = currentFontSize;
          const rememberColor = [...currentTextColor];

          doc.addPage();

          // Add a simple header to each new page
          setFontSettings("italic", 8, [150, 150, 150]);
          doc.text(
            encodeCzechText("MATURITNÍ PŘÍPRAVA: " + book.title),
            margin,
            10
          );

          // Restore font settings after adding the header
          setFontSettings(rememberStyle, rememberSize, rememberColor);

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
      setFontSettings("bold", 16, [50, 50, 50]);
      doc.text(
        encodeCzechText("MATURITNÍ PŘÍPRAVA: " + book.title),
        margin,
        yPosition
      );
      yPosition += 10;

      // Author
      setFontSettings("normal", 12, [50, 50, 50]);
      doc.text(`Autor: ${encodeCzechText(book.author)}`, margin, yPosition);
      yPosition += 10;

      // Date
      doc.text(
        `Datum: ${formatDate(new Date().toISOString())}`,
        margin,
        yPosition
      );
      yPosition += 15;

      // Author information section
      setFontSettings("bold", 14, [70, 70, 70]);
      doc.text(encodeCzechText("O AUTOROVI"), margin, yPosition);

      // Add a simple line under the section title
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);

      yPosition += 10;

      // Author content
      setFontSettings("normal", 11, [50, 50, 50]);

      if (book.authorSummary) {
        const processedAuthorSummary = processMarkdown(book.authorSummary);
        const authorSummaryLines = doc.splitTextToSize(
          processedAuthorSummary,
          contentWidth
        );

        for (let i = 0; i < authorSummaryLines.length; i++) {
          yPosition = checkForPageBreak(yPosition, 5);
          doc.text(authorSummaryLines[i], margin, yPosition);
          yPosition += 5;
        }
      } else {
        doc.text(
          encodeCzechText("Informace o autorovi nejsou k dispozici."),
          margin,
          yPosition
        );
        yPosition += 10;
      }

      yPosition += 10;

      // Add AI summaries
      const summaries = notes.filter(
        (note) => note.isAISummary && !note.isError
      );

      // Summary section
      yPosition = checkForPageBreak(yPosition, 20);
      setFontSettings("bold", 14, [70, 70, 70]);
      doc.text(encodeCzechText("SHRNUTÍ DÍLA"), margin, yPosition);

      // Add a simple line under the section title
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);

      yPosition += 10;

      // Summary content
      setFontSettings("normal", 11, [50, 50, 50]);

      if (summaries.length > 0) {
        summaries.forEach((summary) => {
          const processedContent = processMarkdown(summary.content);
          const contentLines = doc.splitTextToSize(
            processedContent,
            contentWidth
          );

          for (let i = 0; i < contentLines.length; i++) {
            yPosition = checkForPageBreak(yPosition, 5);
            doc.text(contentLines[i], margin, yPosition);
            yPosition += 5;
          }

          yPosition += 5;
        });
      } else {
        doc.text(
          encodeCzechText("Shrnutí díla není k dispozici."),
          margin,
          yPosition
        );
        yPosition += 10;
      }

      // Add regular notes
      const regularNotes = notes.filter(
        (note) => !note.isAISummary && !note.isError
      );

      // Notes section
      yPosition = checkForPageBreak(yPosition, 20);
      setFontSettings("bold", 14, [70, 70, 70]);
      doc.text(encodeCzechText("VLASTNÍ POZNÁMKY"), margin, yPosition);

      // Add a simple line under the section title
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 2, margin + 40, yPosition + 2);

      yPosition += 10;

      // Notes content
      if (regularNotes.length > 0) {
        regularNotes.forEach((note, index) => {
          yPosition = checkForPageBreak(yPosition, 15);

          // Note number and date
          setFontSettings("bold", 11, [80, 80, 80]);
          doc.text(
            encodeCzechText(
              `Poznámka ${index + 1} - ${formatDate(note.createdAt)}`
            ),
            margin,
            yPosition
          );
          yPosition += 7;

          // Note content
          setFontSettings("normal", 10, [50, 50, 50]);

          const processedContent = processMarkdown(note.content);
          const contentLines = doc.splitTextToSize(
            processedContent,
            contentWidth
          );

          for (let i = 0; i < contentLines.length; i++) {
            yPosition = checkForPageBreak(yPosition, 5);
            doc.text(contentLines[i], margin, yPosition);
            yPosition += 5;
          }

          yPosition += 10;
        });
      } else {
        setFontSettings("italic", 11, [120, 120, 120]);
        doc.text(encodeCzechText("Žádné vlastní poznámky"), margin, yPosition);
        yPosition += 10;
      }

      // Add exam structure
      yPosition = checkForPageBreak(yPosition, 20);
      setFontSettings("bold", 14, [70, 70, 70]);
      doc.text(
        encodeCzechText("STRUKTURA PRO ÚSTNÍ ZKOUŠKU"),
        margin,
        yPosition
      );

      // Add a simple line under the section title
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 2, margin + 60, yPosition + 2);

      yPosition += 10;

      setFontSettings("normal", 11, [50, 50, 50]);

      const examStructure = [
        "1. Literárněhistorický kontext",
        "2. Téma a motivy",
        "3. Časoprostor",
        "4. Kompoziční výstavba",
        "5. Literární druh a žánr",
        "6. Vypravěč / lyrický subjekt",
        "7. Postavy",
        "8. Vyprávěcí způsoby",
        "9. Typy promluv",
        "10. Veršová výstavba",
        "11. Jazykové prostředky a jejich funkce",
        "12. Tropy a figury a jejich funkce",
      ];

      for (let i = 0; i < examStructure.length; i++) {
        yPosition = checkForPageBreak(yPosition, 5);
        doc.text(encodeCzechText(examStructure[i]), margin, yPosition);
        yPosition += 5;
      }

      // Add simple page numbers to all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Remember current font settings
        const rememberStyle = currentFontStyle;
        const rememberSize = currentFontSize;
        const rememberColor = [...currentTextColor];

        // Set footer font
        setFontSettings("normal", 9, [150, 150, 150]);

        // Add a simple footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        // Add page number
        doc.text(`${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });

        // Restore font settings
        setFontSettings(rememberStyle, rememberSize, rememberColor);
      }

      // Save the PDF
      doc.save(
        `${book.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_maturita.pdf`
      );
      setExportSuccess(true);
    } catch (error) {
      console.error("Error exporting maturita PDF:", error);
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
        className={`
          text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 gap-1 px-2 rounded-md transition-all duration-200 ease-in-out
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
        onClick={(e) => {
          e.stopPropagation();
          setIsExportModalOpen(true);
        }}
        aria-label="Export options"
        {...("buttonProps" in props ? props.buttonProps : {})}
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
