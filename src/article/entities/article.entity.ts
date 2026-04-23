import { Article } from './article.interface';

export class ArticleEntity implements Article {
  id!: string;
  title!: string;
  content!: string;
  status!: 'draft' | 'published' | 'archived';
  authorId!: string | null;
  categoryId!: string | null;
  tags!: string[];
  createdAt!: number;
  updatedAt!: number;

  constructor(partial?: Partial<Article>) {
    Object.assign(this, partial);
  }
}