import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetCurrentUserId } from '../common/decorators/get-current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async getMe(@GetCurrentUserId() userId: string) {
    const user = await this.users.findById(userId);
    return user;
  }

  @Patch('me')
  async updateMe(@GetCurrentUserId() userId: string, @Body() dto: UpdateProfileDto) {
    const updated = await this.users.updateProfile(userId, dto);
    return updated;
  }
}
