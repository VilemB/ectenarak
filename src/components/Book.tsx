"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Book, Note } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  Sparkles,
  ChevronDown,
  Trash2,
  X,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  SummaryPreferencesModal,
  SummaryPreferences,
} from "./SummaryPreferencesModal";
import { ExportButton } from "./ExportButton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  AuthorSummaryPreferencesModal,
  AuthorSummaryPreferences,
} from "@/components/AuthorSummaryPreferencesModal";
import { NoteEditor } from "@/components/NoteEditor";

interface BookProps {
  book: Book;
  onDelete: (bookId: string) => void;
}

export default function BookComponent({
  book: initialBook,
  onDelete,
}: BookProps) {
  // Validate the book object
  const safeBook: Book = useMemo(() => {
    if (!initialBook || Object.keys(initialBook).length === 0) {
      console.error(
        "Warning: Empty book object received in props:",
        initialBook
      );
      // Return a safe default book object
      return {
        id: `temp-${Math.random().toString(36).substring(2, 11)}`,
        title: "Untitled Book",
        author: "Unknown Author",
        notes: [],
        createdAt: new Date().toISOString(),
      };
    }
    return initialBook;
  }, [initialBook]);

  // Rest of the component uses safeBook instead of initialBook
  const [book, setBook] = useState<Book>(safeBook);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAuthorSummary, setIsGeneratingAuthorSummary] =
    useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAuthorInfoVisible, setIsAuthorInfoVisible] = useState(false);
  const [activeNoteFilter, setActiveNoteFilter] = useState<
    "all" | "regular" | "ai"
  >("all");
  const [errorMessages, setErrorMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [successMessages, setSuccessMessages] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "book" | "note" | "authorSummary";
    noteId?: string;
    isLoading?: boolean;
  }>({ isOpen: false, type: "book", isLoading: false });
  const [summaryModal, setSummaryModal] = useState(false);
  const [authorSummaryModal, setAuthorSummaryModal] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(
    null
  );

  // Add a function to show error messages
  const showErrorMessage = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setErrorMessages((prev) => [...prev, { id, message }]);

    // Auto-remove the error message after 5 seconds
    setTimeout(() => {
      setErrorMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 5000);
  }, []);

  // Add a function to show success messages
  const showSuccessMessage = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setSuccessMessages((prev) => [...prev, { id, message }]);

    // Auto-remove the success message after 3 seconds
    setTimeout(() => {
      setSuccessMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  }, []);

  // Function to fetch notes
  const fetchNotes = useCallback(
    async (bookId: string) => {
      try {
        setIsLoadingNotes(true);
        const response = await fetch(`/api/books/${bookId}/notes`);
        if (!response.ok) {
          throw new Error("Failed to fetch notes");
        }
        const data = await response.json();

        // Format the notes from the response
        const formattedNotes = data.notes.map(
          (note: {
            _id: string;
            content: string;
            createdAt: string;
            isAISummary?: boolean;
          }) => ({
            id: note._id,
            bookId: bookId,
            content: note.content,
            createdAt: new Date(note.createdAt).toISOString(),
            isAISummary: note.isAISummary || false,
          })
        );

        setNotes(formattedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        showErrorMessage("Failed to load notes. Please try again.");
      } finally {
        setIsLoadingNotes(false);
      }
    },
    [showErrorMessage]
  );

  // Update local book state when props change, with validation
  useEffect(() => {
    if (initialBook && Object.keys(initialBook).length > 0) {
      setBook(initialBook);

      // Pre-fetch notes when the component mounts
      if (initialBook.id) {
        fetchNotes(initialBook.id);
      }
    }
  }, [initialBook, fetchNotes]);

  // Handle clicks outside the book component to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bookRef.current &&
        !bookRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Add a smooth scroll effect when expanding a book
  useEffect(() => {
    if (isExpanded) {
      // Wait for the animation to complete before scrolling
      setTimeout(() => {
        if (bookRef.current) {
          const bookRect = bookRef.current.getBoundingClientRect();
          const isBookVisible =
            bookRect.top >= 0 && bookRect.bottom <= window.innerHeight;

          // Only scroll if the book isn't fully visible
          if (!isBookVisible) {
            const offset =
              bookRect.height > window.innerHeight
                ? 100 // If book is taller than viewport, just scroll to top with some padding
                : window.innerHeight / 3; // Otherwise center it more or less

            window.scrollTo({
              top: window.scrollY + bookRect.top - offset,
              behavior: "smooth",
            });
          }
        }
      }, 400); // Wait for expansion animation to be mostly complete
    }
  }, [isExpanded]);

  // Add a smooth scroll to the notes section when adding a new note
  useEffect(() => {
    if (notes.length > 0 && isExpanded) {
      // Scroll to the bottom of notes when a new note is added
      notesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [notes.length, isExpanded]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const response = await fetch(`/api/books/${book.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newNote,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      const data = await response.json();

      // Format the notes from the response
      const formattedNotes = data.notes.map(
        (note: {
          _id: string;
          content: string;
          createdAt: string;
          isAISummary?: boolean;
        }) => ({
          id: note._id,
          bookId: book.id,
          content: note.content,
          createdAt: new Date(note.createdAt).toISOString(),
          isAISummary: note.isAISummary || false,
        })
      );

      // Update the notes state
      setNotes(formattedNotes);

      // Clear the textarea
      setNewNote("");

      // Show success message
      showSuccessMessage("Poznámka byla úspěšně přidána");

      // Set filter to show all notes or regular notes if we're currently on AI filter
      if (activeNoteFilter === "ai") {
        setActiveNoteFilter("all");
      }

      // Scroll to the bottom of the notes list after a short delay
      setTimeout(() => {
        notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error adding note:", error);
      showErrorMessage("Nepodařilo se přidat poznámku");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Expand/collapse the book card
  const toggleExpanded = (e: React.MouseEvent) => {
    // Don't toggle if clicking on buttons or interactive elements
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement &&
        (e.target.closest("button") ||
          e.target.closest(".modal-content") || // Don't collapse when clicking modal content
          e.target.closest("[role='dialog']"))) // Don't collapse when clicking any dialog
    ) {
      return;
    }

    setIsExpanded(!isExpanded);
  };

  const handleGenerateSummary = async (
    preferencesToUse: SummaryPreferences
  ) => {
    console.log("=== HANDLE GENERATE SUMMARY CALLED ===");
    console.log("Preferences:", preferencesToUse);

    setIsGenerating(true);
    try {
      // Get notes text if available, but don't require it
      const notesText = notes
        .filter((note) => !note.isAISummary)
        .map((note) => note.content)
        .join("\n\n");

      console.log("Notes text length:", notesText.length);

      console.log("Sending API request to generate summary...");
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookTitle: book.title,
          bookAuthor: book.author,
          notes: notesText, // This can now be empty
          preferences: preferencesToUse,
        }),
      });
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to generate summary");
      }

      const data = await response.json();
      console.log("Summary generated successfully");

      // Add the AI summary as a note in the database
      console.log("Saving summary as a note...");
      const summaryResponse = await fetch(`/api/books/${book.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: data.summary,
          isAISummary: true,
        }),
      });
      console.log("Save note response status:", summaryResponse.status);

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to save summary");
      }

      const summaryData = await summaryResponse.json();
      console.log("Summary saved successfully");

      // Transform the notes data
      const formattedNotes = summaryData.notes.map(
        (note: {
          _id: string;
          content: string;
          createdAt: string;
          isAISummary?: boolean;
        }) => ({
          id: note._id,
          bookId: book.id,
          content: note.content,
          createdAt: new Date(note.createdAt).toISOString(),
          isAISummary: note.isAISummary || false,
        })
      );

      setNotes(formattedNotes);
      setSummaryModal(false);
    } catch (error) {
      console.error("Error generating summary:", error);

      // Use the new error message function
      showErrorMessage(
        "Nastala chyba při generování shrnutí. Zkuste to prosím znovu později."
      );

      setSummaryModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeleteModal({ isOpen: true, type: "note", noteId, isLoading: false });
  };

  const handleConfirmDelete = async () => {
    if (!book.id) {
      showErrorMessage("Nelze smazat knihu bez ID");
      setDeleteModal({ isOpen: false, type: "book", isLoading: false });
      return;
    }

    // Set loading state
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      // Call the onDelete function passed from the parent
      await onDelete(book.id);
      showSuccessMessage("Kniha byla úspěšně smazána");
    } catch (error) {
      console.error("Error deleting book:", error);
      showErrorMessage("Nepodařilo se smazat knihu. Zkuste to prosím znovu.");
    } finally {
      setDeleteModal({ isOpen: false, type: "book", isLoading: false });
    }
  };

  const handleConfirmDeleteNote = async () => {
    if (deleteModal.type === "note" && deleteModal.noteId && book.id) {
      // Set loading state
      setDeleteModal((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await fetch(
          `/api/books/${book.id}/notes/${deleteModal.noteId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete note");
        }

        const data = await response.json();

        // Update the notes list with the returned data
        const formattedNotes = data.notes.map(
          (note: {
            _id: string;
            content: string;
            createdAt: string;
            isAISummary?: boolean;
          }) => ({
            id: note._id,
            bookId: book.id,
            content: note.content,
            createdAt: new Date(note.createdAt).toISOString(),
            isAISummary: note.isAISummary || false,
          })
        );

        // Update both the local notes state and the book state
        setNotes(formattedNotes);
        setBook((prevBook) => ({
          ...prevBook,
          notes: formattedNotes,
        }));

        // Show success message
        showSuccessMessage("Poznámka byla úspěšně smazána");
      } catch (error) {
        console.error("Error deleting note:", error);
        showErrorMessage("Nepodařilo se smazat poznámku");
      } finally {
        // Always close the delete modal, even if there was an error
        setDeleteModal({ isOpen: false, type: "book", isLoading: false });
      }
    } else {
      // Close the modal if the required IDs are missing
      setDeleteModal({ isOpen: false, type: "book", isLoading: false });
      showErrorMessage("Chybí ID poznámky nebo knihy");
    }
  };

  const handleGenerateAuthorSummary = async (
    preferencesToUse: AuthorSummaryPreferences
  ) => {
    console.log("=== HANDLE GENERATE AUTHOR SUMMARY CALLED ===");

    if (!book.id) {
      showErrorMessage("Nelze generovat informace o autorovi pro knihu bez ID");
      return;
    }

    if (!book.author) {
      showErrorMessage("Nelze generovat informace o autorovi bez jména autora");
      return;
    }

    console.log("Generating author summary for:", book.author);
    console.log("Book ID:", book.id);
    console.log("Preferences:", preferencesToUse);

    setIsGeneratingAuthorSummary(true);

    try {
      // Use the new consolidated API endpoint
      const apiUrl = `/api/author-summary`;
      console.log("API URL:", apiUrl);
      console.log(
        "Request payload:",
        JSON.stringify(
          {
            author: book.author,
            preferences: preferencesToUse,
            bookId: book.id,
          },
          null,
          2
        )
      );

      console.log("Sending API request...");

      let response;
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: book.author,
            preferences: preferencesToUse,
            bookId: book.id,
          }),
        });
        console.log("API request sent");
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(
          `Network error: ${
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)
          }`
        );
      }

      console.log("API response status:", response.status);
      console.log(
        "API response headers:",
        Array.from(response.headers).reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, string>)
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error || "Nepodařilo se získat informace o autorovi"
        );
      }

      const data = await response.json();
      console.log("API success response:", data);

      setBook((prevBook) => ({
        ...prevBook,
        authorSummary: data.summary,
      }));
      setAuthorSummaryModal(false); // Close the modal after successful generation
      setIsAuthorInfoVisible(true);
      showSuccessMessage("Informace o autorovi byly úspěšně vygenerovány");
    } catch (error) {
      console.error("Error generating author summary:", error);
      showErrorMessage(
        error instanceof Error
          ? error.message
          : "Nepodařilo se vygenerovat informace o autorovi"
      );
    } finally {
      setIsGeneratingAuthorSummary(false);
    }
  };

  /**
   * Delete the author summary for the current book
   */
  const handleDeleteAuthorSummary = async () => {
    // Open the confirmation dialog
    setDeleteModal({ isOpen: true, type: "authorSummary", isLoading: false });
  };

  /**
   * Handle the confirmation of author summary deletion
   */
  const handleConfirmDeleteAuthorSummary = async () => {
    console.log("=== HANDLE CONFIRM DELETE AUTHOR SUMMARY CALLED ===");

    if (!book.id) {
      showErrorMessage("Nelze smazat informace o autorovi pro knihu bez ID");
      setDeleteModal({
        isOpen: false,
        type: "authorSummary",
        isLoading: false,
      });
      return;
    }

    if (!book.authorSummary) {
      showErrorMessage("Kniha nemá informace o autorovi ke smazání");
      setDeleteModal({
        isOpen: false,
        type: "authorSummary",
        isLoading: false,
      });
      return;
    }

    // Set loading state
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      // Call the DELETE endpoint
      const apiUrl = `/api/author-summary?bookId=${book.id}`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error || "Nepodařilo se smazat informace o autorovi"
        );
      }

      const data = await response.json();
      console.log("API success response:", data);

      // Update the book state to remove the author summary
      setBook((prevBook) => ({
        ...prevBook,
        authorSummary: undefined,
      }));

      // Close the author info panel
      setIsAuthorInfoVisible(false);

      showSuccessMessage("Informace o autorovi byly úspěšně smazány");
    } catch (error) {
      console.error("Error deleting author summary:", error);
      showErrorMessage(
        error instanceof Error
          ? error.message
          : "Nepodařilo se smazat informace o autorovi"
      );
    } finally {
      // Reset the delete modal state
      setDeleteModal({
        isOpen: false,
        type: "authorSummary",
        isLoading: false,
      });
    }
  };

  // Update the handleBookDelete function
  const handleBookDelete = () => {
    // Check if the book has a valid ID (not a temporary one)
    if (!book.id || book.id.startsWith("temp-")) {
      console.error("Cannot delete book without a valid ID:", book);
      showErrorMessage(
        "Nelze smazat knihu bez platného ID. Zkuste obnovit stránku."
      );
      return;
    }

    // Use the deleteModal state instead of showDeleteConfirm
    setDeleteModal({
      isOpen: true,
      type: "book",
      isLoading: false,
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when the book is expanded
      if (!isExpanded) return;

      // Check if no modal is open
      const noModalOpen =
        !deleteModal.isOpen && !summaryModal && !authorSummaryModal;

      // Check if not typing in a text field
      const notInTextField =
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA";

      // Add note with Alt+N
      if (e.altKey && e.key === "n" && noModalOpen && notInTextField) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, deleteModal.isOpen, summaryModal, authorSummaryModal]);

  // Add a function to handle closing the author summary with scroll position preservation
  const handleCloseAuthorInfo = useCallback(() => {
    // Save the current scroll position before closing
    setSavedScrollPosition(window.scrollY);

    // Close the author info immediately - this prevents the flashing issue
    // by letting the AnimatePresence handle the exit animation properly
    setIsAuthorInfoVisible(false);
  }, []);

  // Handle animation completion after closing author summary
  const handleAnimationComplete = useCallback(() => {
    if (savedScrollPosition !== null) {
      // Scroll to the book element instead of restoring previous position
      if (bookRef.current) {
        bookRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      setSavedScrollPosition(null);
    }
  }, [savedScrollPosition]);

  // Add click outside handler for author summary
  useEffect(() => {
    if (!isAuthorInfoVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the author summary
      const target = event.target as Node;
      const authorSummaryElement = document.getElementById(
        `author-summary-${book.id}`
      );

      if (authorSummaryElement && !authorSummaryElement.contains(target)) {
        // Add a subtle visual feedback when clicking outside
        const ripple = document.createElement("div");
        ripple.className =
          "fixed w-5 h-5 rounded-full bg-amber-400/30 dark:bg-amber-600/30 z-50 pointer-events-none";
        ripple.style.left = `${event.clientX - 10}px`;
        ripple.style.top = `${event.clientY - 10}px`;
        ripple.style.transform = "scale(0)";
        ripple.style.opacity = "1";
        ripple.style.transition = "all 0.3s ease-out";

        document.body.appendChild(ripple);

        // Trigger the animation
        requestAnimationFrame(() => {
          ripple.style.transform = "scale(8)";
          ripple.style.opacity = "0";
        });

        // Remove the ripple element after animation
        setTimeout(() => {
          if (document.body.contains(ripple)) {
            document.body.removeChild(ripple);
          }
        }, 300);

        // Close the author info
        handleCloseAuthorInfo();
      }
    };

    // Add escape key handler to close author summary
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isAuthorInfoVisible) {
        handleCloseAuthorInfo();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isAuthorInfoVisible, book.id, handleCloseAuthorInfo]);

  // Add a function to handle viewing a specific summary
  const handleViewSummary = (noteId: string) => {
    setSelectedSummary(noteId === selectedSummary ? null : noteId);
  };

  // Add ESC key handler for selected summary
  useEffect(() => {
    if (!selectedSummary) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedSummary) {
        setSelectedSummary(null);
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [selectedSummary]);

  return (
    <motion.div
      ref={bookRef}
      className="bg-background rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Book Header */}
      <motion.div
        className={`p-5 cursor-pointer transition-colors duration-200 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] ${
          isExpanded ? "border-b border-border/40" : ""
        }`}
        onClick={toggleExpanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-grow space-y-3">
            {/* Title and Author */}
            <div>
              <motion.h3
                className="text-xl font-medium text-foreground group-hover:text-primary transition-colors"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                {book.title}
              </motion.h3>
              <div className="flex items-center mt-1.5">
                <motion.div
                  className="group cursor-pointer flex items-center gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (book.authorSummary) {
                      if (isAuthorInfoVisible) {
                        handleCloseAuthorInfo();
                      } else {
                        setIsAuthorInfoVisible(true);
                      }
                    } else {
                      setAuthorSummaryModal(true);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {book.author}
                  </span>
                  {book.authorSummary && (
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] group-hover:shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all"></span>
                    </span>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Book Metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                <span>{formatDate(book.createdAt)}</span>
              </div>
              {notes.length > 0 && (
                <div className="flex items-center">
                  <PenLine className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                  <span>
                    {notes.length}{" "}
                    {notes.length === 1
                      ? "poznámka"
                      : notes.length > 1 && notes.length < 5
                      ? "poznámky"
                      : "poznámek"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {book.authorSummary ? (
              <div className="flex gap-2">
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
                        <div className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></div>
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
                    <div className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></div>
                    <span>Generuji...</span>
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    <span className="hidden sm:inline">
                      Informace o autorovi
                    </span>
                    <span className="sm:hidden">Info</span>
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-1.5">
              <ExportButton book={book} notes={notes} />

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

              <Button
                variant={isExpanded ? "default" : "outline"}
                size="sm"
                className="transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={`h-4 w-4 mr-1.5 transition-transform duration-300 ease-in-out ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <span>{isExpanded ? "Skrýt" : "Zobrazit"}</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Author Summary Panel */}
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        {isAuthorInfoVisible && book.authorSummary && (
          <motion.div
            id={`author-summary-${book.id}`}
            initial={{ opacity: 0, height: 0, overflow: "hidden" }}
            animate={{ opacity: 1, height: "auto", overflow: "visible" }}
            exit={{
              opacity: 0,
              height: 0,
              overflow: "hidden",
              transition: {
                opacity: { duration: 0.2, ease: "easeOut" },
                height: { duration: 0.3, delay: 0.1, ease: "easeInOut" },
              },
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
              duration: 0.3,
            }}
            className="mx-5 my-3 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-lg text-sm border border-amber-200/50 dark:border-amber-800/30 shadow-inner relative"
          >
            {/* Close button - positioned absolutely in the top-right corner */}
            <div className="absolute -top-2 -right-2 z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                  scale: [0.9, 1.1, 1],
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.6, 1],
                  ease: "easeOut",
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-700 dark:text-amber-300 h-8 w-8 p-0 rounded-full shadow-md border border-amber-200/70 dark:border-amber-800/70 transition-all duration-200"
                  onClick={handleCloseAuthorInfo}
                  aria-label="Zavřít informace o autorovi"
                  title="Zavřít informace o autorovi (ESC)"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Zavřít</span>
                </Button>
              </motion.div>
            </div>

            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center text-amber-700 dark:text-amber-400">
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">O autorovi</span>
              </div>
              <motion.div
                className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/70 shadow-sm"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.2 }}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "rgba(251, 191, 36, 0.2)",
                  borderColor: "rgba(251, 191, 36, 0.3)",
                }}
              >
                <kbd className="px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-800 rounded border border-amber-300 dark:border-amber-700 shadow-sm">
                  ESC
                </kbd>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  zavřít panel
                </span>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="prose prose-amber prose-sm dark:prose-invert max-w-none"
            >
              <ReactMarkdown>{book.authorSummary}</ReactMarkdown>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 flex justify-between"
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600/70 dark:text-amber-500/70 hover:text-destructive hover:bg-destructive/10 h-7 px-2 transition-all duration-200"
                onClick={handleDeleteAuthorSummary}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Smazat informace o autorovi</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-xs"
                onClick={handleCloseAuthorInfo}
              >
                Zavřít
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content (Notes) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, overflow: "hidden" }}
            animate={{ height: "auto", overflow: "visible" }}
            exit={{ height: 0, overflow: "hidden" }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 1,
            }}
          >
            {/* Notes Section */}
            <div className="p-5">
              {/* Notes Filter */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Poznámky</h4>
                  <div className="flex items-center gap-1 bg-secondary/50 rounded-full p-1 text-xs">
                    <button
                      className={`px-2 py-0.5 rounded-full transition-colors ${
                        activeNoteFilter === "all"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => setActiveNoteFilter("all")}
                    >
                      Všechny
                    </button>
                    <button
                      className={`px-2 py-0.5 rounded-full transition-colors ${
                        activeNoteFilter === "regular"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => setActiveNoteFilter("regular")}
                    >
                      Moje
                    </button>
                    <button
                      className={`px-2 py-0.5 rounded-full transition-colors ${
                        activeNoteFilter === "ai"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => setActiveNoteFilter("ai")}
                    >
                      AI
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-950/50 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSummaryModal(true);
                    }}
                    disabled={isGenerating || !book.id}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin mr-1.5 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></div>
                        <span>Generuji...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        <span>Generovat shrnutí knihy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4 mb-6">
                {isLoadingNotes ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    className="flex flex-col items-center justify-center py-8 text-muted-foreground"
                  >
                    <div className="animate-spin mb-3 h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
                    <p className="text-sm">Načítání poznámek...</p>
                  </motion.div>
                ) : notes.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    className="text-center py-8 text-muted-foreground bg-background/50 rounded-lg border border-dashed border-border/60"
                  >
                    <div className="flex justify-center mb-3">
                      <PenLine className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm mb-2">Zatím nemáte žádné poznámky.</p>
                    <p className="text-xs text-muted-foreground/70">
                      Přidejte svou první poznámku pomocí formuláře níže.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <AnimatePresence initial={false}>
                      {notes
                        .filter((note) => {
                          if (activeNoteFilter === "all") return true;
                          if (activeNoteFilter === "regular")
                            return !note.isAISummary;
                          if (activeNoteFilter === "ai")
                            return note.isAISummary;
                          return true;
                        })
                        .map((note, index) => (
                          <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: {
                                delay: index * 0.05,
                                type: "spring",
                                stiffness: 100,
                                damping: 15,
                              },
                            }}
                            exit={{
                              opacity: 0,
                              y: -10,
                              transition: { duration: 0.2 },
                            }}
                            className={`relative p-4 rounded-lg border shadow-sm hover:shadow-md ${
                              note.isAISummary
                                ? "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30 shadow-inner"
                                : "bg-background border-border/60"
                            } ${
                              deleteModal.type === "note" &&
                              deleteModal.noteId === note.id &&
                              deleteModal.isLoading
                                ? "opacity-50"
                                : ""
                            } transition-all duration-200`}
                          >
                            {note.isAISummary && (
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center text-amber-700 dark:text-amber-400">
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  <span className="font-medium">
                                    AI shrnutí knihy
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {selectedSummary === note.id && (
                                    <span className="text-xs text-amber-600/70 dark:text-amber-500/70">
                                      ESC
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600/70 dark:text-amber-500/70 hover:text-amber-700 hover:bg-amber-200/30 dark:hover:bg-amber-800/30 h-6 w-6 p-0 rounded-full"
                                    onClick={() => handleViewSummary(note.id)}
                                    aria-label={
                                      selectedSummary === note.id
                                        ? "Zavřít shrnutí"
                                        : "Zobrazit celé shrnutí"
                                    }
                                  >
                                    {selectedSummary === note.id ? (
                                      <X className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                    <span className="sr-only">
                                      {selectedSummary === note.id
                                        ? "Zavřít"
                                        : "Zobrazit"}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            )}

                            {note.isAISummary ? (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.2 }}
                                className="prose prose-amber prose-sm dark:prose-invert max-w-none"
                              >
                                {selectedSummary === note.id ? (
                                  <ReactMarkdown>{note.content}</ReactMarkdown>
                                ) : (
                                  <>
                                    <ReactMarkdown>
                                      {note.content.split("\n\n")[0]}
                                    </ReactMarkdown>
                                    {note.content.split("\n\n").length > 1 && (
                                      <div
                                        className="mt-2 text-amber-600 dark:text-amber-400 text-xs cursor-pointer hover:underline"
                                        onClick={() =>
                                          handleViewSummary(note.id)
                                        }
                                      >
                                        Zobrazit celé shrnutí...
                                      </div>
                                    )}
                                  </>
                                )}
                              </motion.div>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{note.content}</ReactMarkdown>
                              </div>
                            )}

                            {note.isAISummary &&
                              selectedSummary === note.id && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3, duration: 0.2 }}
                                  className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 flex justify-between items-center"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600/70 dark:text-amber-500/70 hover:text-destructive hover:bg-destructive/10 h-7 px-2 transition-all duration-200"
                                    onClick={() => handleDeleteNote(note.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="sr-only">
                                      Smazat shrnutí
                                    </span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 text-xs"
                                    onClick={() => setSelectedSummary(null)}
                                  >
                                    Zavřít
                                  </Button>
                                </motion.div>
                              )}

                            {!note.isAISummary && (
                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30">
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground/70" />
                                  {formatDate(note.createdAt)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2 transition-all duration-200"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

              {/* Add Note Form */}
              <div className="mt-4">
                <NoteEditor
                  value={newNote}
                  onChange={setNewNote}
                  onSubmit={handleAddNote}
                  onCancel={() => {
                    setNewNote("");
                    setIsAddingNote(false);
                    textareaRef.current?.blur();
                  }}
                  isSubmitting={isAddingNote}
                  placeholder="Přidat poznámku..."
                  autoFocus={false}
                  minRows={2}
                  maxRows={8}
                  showPreview={true}
                />
              </div>
            </div>
            <div ref={notesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Messages */}
      <AnimatePresence>
        {errorMessages.length > 0 && (
          <div className="p-4 space-y-2">
            {errorMessages.map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Success Messages */}
      <AnimatePresence>
        {successMessages.length > 0 && (
          <div className="p-4 space-y-2">
            {successMessages.map((success, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-md"
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-500 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {success.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: "book", isLoading: false })
        }
        onConfirm={
          deleteModal.type === "book"
            ? handleConfirmDelete
            : deleteModal.type === "note"
            ? handleConfirmDeleteNote
            : handleConfirmDeleteAuthorSummary
        }
        title={
          deleteModal.type === "book"
            ? "Smazat knihu"
            : deleteModal.type === "note"
            ? "Smazat poznámku"
            : "Smazat informace o autorovi"
        }
        description={
          deleteModal.type === "book"
            ? `Opravdu chcete smazat knihu "${book.title}"? Tato akce je nevratná.`
            : deleteModal.type === "note"
            ? "Opravdu chcete smazat tuto poznámku? Tato akce je nevratná."
            : "Opravdu chcete smazat informace o autorovi? Tato akce je nevratná."
        }
        confirmText={
          deleteModal.type === "book"
            ? "Smazat knihu"
            : deleteModal.type === "note"
            ? "Smazat poznámku"
            : "Smazat informace o autorovi"
        }
        cancelText="Zrušit"
        isLoading={deleteModal.isLoading}
        variant="destructive"
      />

      {/* Summary Preferences Modal */}
      <SummaryPreferencesModal
        isOpen={summaryModal}
        onClose={() => setSummaryModal(false)}
        onGenerate={handleGenerateSummary}
        isGenerating={isGenerating}
        title="Generovat shrnutí knihy"
        description="Vyberte preferovaný styl a zaměření shrnutí knihy."
      />

      {/* Add Author Summary Preferences Modal */}
      <AuthorSummaryPreferencesModal
        isOpen={authorSummaryModal}
        onClose={() => setAuthorSummaryModal(false)}
        onGenerate={handleGenerateAuthorSummary}
        isGenerating={isGeneratingAuthorSummary}
        title="Generovat informace o autorovi"
        description="Vyberte preferovaný styl a zaměření informací o autorovi."
      />
    </motion.div>
  );
}
