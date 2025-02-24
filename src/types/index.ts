export interface Book {
  id: string;
  title: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: Date;
  isAISummary?: boolean;
}
