# recruit-server

## 1. 프로젝트의 목표

* Express.js, jwt를 활용해 CRUD기능과 인증 과정이 포함된 백엔드 서버를 구축합니다.
* Mysql과 Prisma 이용해 DB를 구축하고, AWS를 통해 프로젝트를 배포합니다.

## 2. [api](https://rift-gallium-045.notion.site/Node-js-API-5a253be774a0433e964592170517b3b4?pvs=4)

## 3. [ERD](https://drawsql.app/teams/currypangs-team/diagrams/recruit-server)

## 4-1. 필수 구현 사항(완료)
<details>
<summary>Click</summary><br>

세부 사항은 issue 항목에 있어요!
- [x] 설계 및 프로젝트 기본 세팅
- [x] DB 연결, 스키마 작성, 테이블 생성
- [x] 회원가입, 로그인 API 구현
- [x] 사용자 인증 미들웨어, API 구현
- [x] 이력서 관련 API 구현
- [x] API Client로 동작 확인
- [x] EC2, PM2를 활용해 배포 

</details>

## 4-2. 선택 구현 사항(완료)
<details>
<summary>Click</summary><br>
  
세부 사항은 issue 항목에 있어요!
- [x] 역할에 따른 실행결과 분기, API 구현
- [x] Transaction 활용
- [x] RefreshToken 관련 미들웨어, API 구현
- [x] 로드밸런서와 Router53를 이용해 https로 도메인 연결

</details>

## 5. 기술 스택

<details>
<summary>Click</summary>

1. 웹 프레임워크: Express.js

2. 패키지 매니저: yarn   

3. 모듈 시스템: ESM   

4. 데이터베이스: Mysql  

5. ODM: prisma

6. 유효성 검사: Joi

7. 인증, 해싱: JWT, Bcrypt

8. 배포: AWS Ec2, Router53


</details>
