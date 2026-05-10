import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export type AuthRequest = Request & {
  user?: JwtPayload;
};
