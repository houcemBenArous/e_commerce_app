import { Role } from '../../common/enums/role.enum';

export type JwtPayload = {
  sub: string; // user id
  email: string;
  roles: Role[];
};
