export interface Book {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  authorSummary?: string;
  authorId?: string;
  userId?: string;
  notes?: Note[];
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
  isAISummary?: boolean;
  isError?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Author {
  id: string;
  name: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}
