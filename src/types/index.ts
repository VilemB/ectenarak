export interface Book {
  id: string;
  title: string;
  author: string;
  authorId: string;
  userId: string;
  legacyUserId?: string;
  notes?: Note[];
  authorSummary?: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string[];
  coverImage?: string;
  description?: string;
  currentPage?: number;
  totalPages?: number;
  readingStartDate?: string;
  readingCompletionDate?: string;
  status?: "not_started" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  progressPercentage?: number;
  noteCount?: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  isAISummary?: boolean;
  createdBy?: string;
  isError?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    language?: string;
    emailNotifications?: boolean;
    privacySettings?: {
      shareReadingActivity?: boolean;
      shareLibrary?: boolean;
    };
  };
  profile?: {
    bio?: string;
    location?: string;
    website?: string;
    favoriteGenres?: string[];
  };
  stats?: {
    booksRead: number;
    pagesRead: number;
    notesCreated: number;
    lastActiveAt: string;
  };
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface Author {
  id: string;
  name: string;
  summary?: string;
  birthDate?: string;
  deathDate?: string;
  nationality?: string;
  genres?: string[];
  biography?: string;
  photoUrl?: string;
  externalIds?: {
    goodreads?: string;
    wikipedia?: string;
    librarything?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  currentPage: number;
  totalPages?: number;
  percentage: number;
  startDate?: string;
  completionDate?: string;
  status: "not_started" | "in_progress" | "completed";
}

export interface BookFilters {
  status?: "not_started" | "in_progress" | "completed";
  genre?: string;
  author?: string;
  searchTerm?: string;
  sortBy?: "title" | "author" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
