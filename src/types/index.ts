export interface Book {
  id: string;
  title: string;
  author: string;
  createdAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
  isAISummary?: boolean;
}
