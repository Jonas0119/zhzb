import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

async function authToken(server: any) {
  const username = `m_${Date.now()}`;
  const email = `${username}@example.com`;
  const password = 'Passw0rd!';
  await request(server).post('/api/auth/register').send({ username, email, password });
  const login = await request(server).post('/api/auth/login').send({ username, password });
  return login.body.token as string;
}

describe('Market (e2e)', () => {
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

  it('sell -> list -> buy -> my-orders -> cancel (if remaining)', async () => {
    const sell = await request(server)
      .post('/api/market/sell')
      .set('Authorization', `Bearer ${token}`)
      .send({ pointType: 'AIC', amount: 1.2345, unitPrice: 0.88 })
      .expect(201);
    const orderId = sell.body.id;

    const list = await request(server).get('/api/market/orders').expect(200);
    expect(list.body.find((x: any) => x.id === orderId)).toBeTruthy();

    await request(server)
      .post(`/api/market/buy/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 0.5 })
      .expect(201);

    const my = await request(server)
      .get('/api/market/my-orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(my.body)).toBeTruthy();

    // 尝试取消（若仍有剩余）
    const detailList = await request(server).get('/api/market/orders').expect(200);
    const found = detailList.body.find((x: any) => x.id === orderId);
    if (found && found.remainingAmount > 0 && found.status === 'active') {
      await request(server)
        .delete(`/api/market/orders/${orderId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }
  });
});


