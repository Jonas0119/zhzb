import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Announcements (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
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

  it('list & detail increases viewCount', async () => {
    const list = await request(server).get('/api/announcements').expect(200);
    expect(Array.isArray(list.body)).toBeTruthy();
    if (list.body.length === 0) return; // 已初始化脚本应有数据
    const id = list.body[0].id;
    const before = list.body[0].viewCount || 0;
    const detail = await request(server).get(`/api/announcements/${id}`).expect(200);
    expect(detail.body.id).toBe(id);
    const list2 = await request(server).get('/api/announcements').expect(200);
    const after = list2.body.find((x: any) => x.id === id).viewCount || 0;
    expect(after).toBeGreaterThanOrEqual(before + 1);
  });
});


