import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(params: {
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) {
    const exists = await this.userModel.exists({ email: params.email });
    if (exists) throw new ConflictException('Email already in use');
    const created = await this.userModel.create({
      name: params.name,
      email: params.email,
      passwordHash: params.passwordHash,
      phone: params.phone,
      addressLine1: params.addressLine1,
      addressLine2: params.addressLine2,
      city: params.city,
      state: params.state,
      postalCode: params.postalCode,
      country: params.country,
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

  async setPasswordById(userId: string, passwordHash: string) {
    await this.userModel.updateOne({ _id: userId }, { $set: { passwordHash } }).exec();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const allowed: (keyof UpdateProfileDto)[] = [
      'name',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'postalCode',
      'country',
    ];
    const update: Record<string, any> = {};
    for (const key of allowed) {
      const val = dto[key];
      if (typeof val !== 'undefined') update[key] = val;
    }
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
