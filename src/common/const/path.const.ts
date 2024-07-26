import { join } from 'path';

/**
 * 서버 프로젝트의 루트 폴더
 * 지금 내 환경에서는 'cf_sns' 경로가 반환됨.
 */
export const PROJECT_ROOT_PATH = process.cwd();

/** 외부에서 접근 가능한 파일들을 모아둔 폴더 이름 */
export const PUBLIC_FOLDER_NAME = 'public';

/** post 관련 이미지를 저장할 폴더 이름. */
export const POSTS_FOLDER_NAME = 'posts';

/**
 * 실제 공개폴더의 절대경로
 * -> /{프로젝트의 위치}/public
 */
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

/**
 * post 관련 이미지를 저장할 폴더 (절대경로)
 * -> /{프로젝트의 위치}/public/posts
 */
export const POST_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POSTS_FOLDER_NAME);

/**
 * 절대경로x -> 이미지의 위치를 get요청에 담아서 보내줄때 사용하는 용도.
 * 예)  /public/posts/xxx.jpg
 */
export const POST_PUBLIC_IMAGE_PATH = join(
  PUBLIC_FOLDER_NAME,
  POSTS_FOLDER_NAME,
);
