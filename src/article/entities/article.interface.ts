export interface Article {
  id: string; // uuid v4
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  authorId: string | null; // refers to User
  categoryId: string | null; // refers to Category
  tags: string[]; // array of tag names
  createdAt: number; // timestamp of creation
  updatedAt: number; // timestamp of last update
}