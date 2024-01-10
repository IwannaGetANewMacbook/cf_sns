/**
 * The functions that we wanna make.
 *
 * 1) resisterWithEmail (이메일로 회원가입)
 *    - email, nickname, password를 입력받고 사용자를 생성.
 *    - 생성이 완료되면 accessToken과 refreshToken을 반환.
 *      (회원가입 후 다시 로그인해주세요 <- 이런 쓸데없는 과정을 방지하기 위해서.
 *
 *  2) loginWithEmail (로그인)
 *    - email, password를 입력하면 사용자 검증을 진행.
 *    - 검증이 완료되면 accessToken과 refreshToken을 반환.
 *
 *  3) loginUser
 *    -(1)과 (2)에서 필요한 accessToken과 refreshToken을 반환하는 로직.
 *
 *  4) signToken (Token 생성 로직)
 *    - (3)에서 필요한 accessToken과 resfreshToekn을 sign하는 로직.
 *
 *  5) authenticateWithEmailAndPassword
 *    - (2)에서 로그인을 진행할 때 필요한 기본적인 검증 진행.
 *      1. 사용자가 존재하는지 확인. (Based on Email)
 *      2. 비밀번호가 맞는지 확인.
 *      3. 모두 통과되면 찾은 사용자 정보 반환.
 *
 */

/**
 * Token을 사용하게 되는 방식
 *
 * 1) 사용자가 로그인 또는 회원가입을 진행하면 accessToken과 refreshToken을 발급받음.
 * 2) 로그인 할때는 Basic Token과 함께 요청을 보낸다.
 *    Basic Token은 '이메일:비밀번호'를 Base64로 인코딩한 형태.
 *    예) {authorization: 'Basic { token }'}
 * 3) 아무나 접근 할 수 없는 정보(private route)를 접근 할때는
 *    accessToken을 Header에 추가해서 요청과 함께 보냄.
 *    예) {authorization: 'Bearer { token }'}
 * 4) Token과 요청을 함께 받은 서버는 Token 검증을 통해 현재 요청을 보낸 사용자가 누군지 알 수 있음.
 * 5) 모든 Token은 만료기간이 있음. 만료기간이 지나면 새로 Token을 발급받아야 함.
 *    그렇지 않으면 jwtService.verify()에서 인증이 통과 안된다.
 *    그러니 accessToken을 새로 발급 받을 수 있는 /auth/token/access와
 *    refreshToken을 새로 발급 받을 수 있는 /auth/token/refresh가 필요.
 * 6) Token이 만료되면 각각의 Token을 새로 받을 수 있는 EndPoint에 요청을 해서
 *    새로운 Token을 발급받고 새로운 Token을 사용해서 private route에 접근.
 *
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUND_KEY,
  ENV_JWT_SECRET_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Payload에 들어갈 정보
   *
   * 1) email
   * 2) sub -> id
   * 3) type : 'access' | 'refresh'
   */

  // Pick 타입 -> 클래스 안에서 원하는 프로퍼티만 뽑아옴. 여기서는 email과 id
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      expiresIn: isRefreshToken ? 3600 : 300, // sec
    });
  }

  loginUser(user: Pick<UsersModel, 'id' | 'email'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    // (2)에서 로그인을 진행할 때 필요한 기본적인 검증 진행.
    // 1. 사용자가 존재하는지 확인. (Based on Email)
    // 2. 비밀번호가 맞는지 확인.
    // 3. 모두 통과되면 찾은 사용자 정보 반환.

    const existingUser = await this.usersService.getUserByEmail(user.email);

    // email checking
    if (!existingUser) {
      throw new UnauthorizedException('401 unauthorized\n존재하지 않는 사용자');
    }

    // password checking
    // 1) 입력된 비밀번호, 2) 기존hash(사용자 정보에 저장돼있는 hash)
    const passOK = await bcrypt.compare(user.password, existingUser.password);

    if (!passOK) {
      throw new UnauthorizedException(
        '401 unauthorized\n존재하지 않는 비밀번호.',
      );
    }

    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    // authenticateWithEmailAndPassword() 이 함수에서 이미 예외처리 다 함.
    // 따라서 해당 함수에서는 따로 예외처리 불필요!

    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(
    user: Pick<UsersModel, 'nickname' | 'email' | 'password'>,
  ) {
    // bcrypt.hash(해쉬걸고싶은 PW, 총 rounds 수), salt는 자동생성
    const hash = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get<string>(ENV_HASH_ROUND_KEY)),
    );
    // user.password = hash;

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }

  // Token parsing method
  /**
   * Header로 부터 Token을 받을 때
   * {authorization: 'Basic { token }'} - 로그인 할 때
   * {authorization: 'Bearer { token }'} - 로그인 한 다음 요청을 보낼 때.
   */
  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' '); // -> [Basic, {token}]

    // Header로부터 Token Extract 시, 혹시모를 사고를 대비하여 예외처리.
    const prefix = isBearer ? 'Bearer' : 'Basic';
    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('401 Unauthorized\n Wrong Token');
    }

    const token = splitToken[1];

    return token;
  }

  /**
   * Basic ssdjwklsndlksndkslnd:sndklsndsklnd 일 때,
   * 1) ssdjwklsndlksndkslnd:sndklsndsklnd --> email:password 로 decode 해야함.
   * 2) email:password --> [email, password] 이렇게 split 함.
   * 3) {email: eamil, password: password} 이렇게 return.
   */
  decodeBasicToken(base64String: string) {
    /** 그냥 외우는 코드 */
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('401 Unauthorized\nWrong Token');
    }

    const email = split[0];
    const password = split[1];

    return {
      email: email,
      password: password,
    };
  }

  /**토큰 검증 함수
   * 토큰 검증 후 payload 반환.
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
    } catch (e) {
      throw new UnauthorizedException('jwt expired or wrong token');
    }
  }

  /**토큰 새로 발급받는 함수 */
  rotateToken(token: string, isRefreshToken: boolean) {
    /** Token의 payload만 뽑아내는 함수*/
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
    });

    // payload안에는 { sub: id, email: email, type: 'access | 'refresh' } 3개의 property가 있음.
    // 3개의 property가 잘 들어있는지 검증절차.
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '401 Unauthorized \n It is only possible to reissue token with refresh token',
      );
    }

    return this.signToken({ ...decoded, id: decoded.sub }, isRefreshToken);
  }
}
