import { User } from './user.interface';

export class UserEntity implements User {
  id!: string; // uuid v4
  login!: string;
  password!: string;
  role!: User['role'];
  createdAt!: number; // timestamp of creation
  updatedAt!: number; // timestamp of last update

  constructor(partial?: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
