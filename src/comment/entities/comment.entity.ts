import { Comment } from './comment.interface';

export class CommentEntity implements Comment {
  id!: string; // uuid v4
  content!: string;
  articleId!: string; // refers to Article
  authorId!: string | null; // refers to User
  createdAt!: number; // timestamp of creation

  constructor(partial?: Partial<CommentEntity>) {
    Object.assign(this, partial);
  }
}
