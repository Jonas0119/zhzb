import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> profile', async () => {
    const username = `u_${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'Passw0rd!';

    const reg = await request(server)
      .post('/api/auth/register')
      .send({ username, email, password })
      .expect(201);
    expect(reg.body.token).toBeDefined();

    const login = await request(server)
      .post('/api/auth/login')
      .send({ username, password })
      .expect(201);
    const token = login.body.token;

    const profile = await request(server)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(profile.body.username).toBe(username);
  });
});


