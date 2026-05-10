import { Category } from './category.interface';

export class CategoryEntity implements Category {
  id!: string;
  name!: string;
  description!: string;

  constructor(partial?: Partial<Category>) {
    Object.assign(this, partial);
  }
}
