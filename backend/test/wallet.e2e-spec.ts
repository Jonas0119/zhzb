import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

async function authToken(server: any) {
  const username = `w_${Date.now()}`;
  const email = `${username}@example.com`;
  const password = 'Passw0rd!';
  await request(server).post('/api/auth/register').send({ username, email, password });
  const login = await request(server).post('/api/auth/login').send({ username, password });
  return login.body.token as string;
}

describe('Wallet (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    server = app.getHttpServer();
    token = await authToken(server);
  });

  afterAll(async () => {
    await app.close();
  });

  it('info -> recharge -> cards CRUD -> transactions', async () => {
    const infoBefore = await request(server).get('/api/wallet/info').set('Authorization', `Bearer ${token}`).expect(200);
    expect(infoBefore.body.balance).toBeDefined();

    await request(server)
      .post('/api/wallet/recharge')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 123.45 })
      .expect(201);

    const infoAfter = await request(server).get('/api/wallet/info').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Number(infoAfter.body.balance)).toBeGreaterThanOrEqual(Number(infoBefore.body.balance));

    const card = await request(server)
      .post('/api/wallet/bank-card')
      .set('Authorization', `Bearer ${token}`)
      .send({ cardNumber: '6222021234567890123', holderName: '张三', bankName: '中国银行', phone: '13800138000' })
      .expect(201);

    const cards = await request(server)
      .get('/api/wallet/bank-cards')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(cards.body)).toBeTruthy();

    await request(server)
      .delete(`/api/wallet/bank-cards/${card.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(server)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});


