import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(params: { name: string; email: string; passwordHash: string }) {
    const exists = await this.userModel.exists({ email: params.email });
    if (exists) throw new ConflictException('Email already in use');
    const created = await this.userModel.create({
      name: params.name,
      email: params.email,
      passwordHash: params.passwordHash,
    });
    return created;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setRefreshTokenHash(userId: string, hash: string | null) {
    await this.userModel.updateOne({ _id: userId }, { $set: { refreshTokenHash: hash } }).exec();
  }
}
