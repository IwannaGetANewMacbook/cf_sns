/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersModel } from './entity/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserFollowersModel } from './entity/user-followers.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly usersRepository: Repository<UsersModel>,
    @InjectRepository(UserFollowersModel)
    private readonly userFollowersRepository: Repository<UserFollowersModel>,
  ) {}

  async createUser(user: Pick<UsersModel, 'email' | 'nickname' | 'password'>) {
    // 1) nickname 중복 확인
    // exist() -> 만약에 조건에 해당되는 값이 있으면 true만환.
    const isNickname = await this.usersRepository.exist({
      where: { nickname: user.nickname },
    });

    if (isNickname) {
      throw new BadRequestException('400 BadRequest\nAlready Extant Nickname');
    }

    // 2) Email 중복 확인
    const isEmail = await this.usersRepository.exist({
      where: { email: user.email },
    });

    if (isEmail) {
      throw new BadRequestException('400 BadRequest\nAlready Extant Email');
    }

    const userObject = this.usersRepository.create({
      nickname: user.nickname,
      email: user.email,
      password: user.password,
    });

    const newUser = await this.usersRepository.save(userObject);

    return newUser;
  }

  async getAllUsers() {
    const users = await this.usersRepository.find();
    return users;
  }

  ///////////////////////////////////////////////////////////////////
  // authService에서 사용할 userRepository 함수들.

  async getUserByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email: email } });
  }

  // follow sysyem logic.
  async followUser(followerId: number, followeeId: number) {
    const result = await this.userFollowersRepository.save({
      follower: { id: followerId },
      followee: { id: followeeId },
    });
    return true;
  }

  // follower 가져오기
  async getFollowers(userId: number, includeNotConfirmed: boolean) {
    const where = { followee: { id: userId } };

    // confirm 된 follwer만 보고싶을 떄.
    if (!includeNotConfirmed) {
      where['isConfirmed'] = true;
    }

    const result = await this.userFollowersRepository.find({
      where,
      relations: { follower: true, followee: true },
    });

    return result.map((v) => ({
      id: v.follower.id,
      nickname: v.follower.nickname,
      email: v.follower.email,
      isConfirmed: v.isConfirmed,
    }));
  }

  async confirmFollow(followerId: number, followeeId: number) {
    const exisisting = await this.userFollowersRepository.findOne({
      where: { follower: { id: followerId }, followee: { id: followeeId } },
      relations: { follower: true, followee: true },
    });

    if (!exisisting) {
      throw new BadRequestException('존재하지 않는 팔로우 요청입니다.');
    }

    await this.userFollowersRepository.save({
      ...exisisting,
      isConfirmed: true,
    });

    return true;
  }

  async deleteFollow(followerId: number, followingId: number) {
    await this.userFollowersRepository.delete({
      follower: { id: followerId },
      followee: { id: followingId },
    });

    return true;
  }
}
