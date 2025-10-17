import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../entities/transaction.entity';
import { BankCard } from '../../entities/bank-card.entity';

@Injectable()
export class WalletService {
  // 充值产品配置映射表
  private readonly rechargeProducts = {
    'recharge_100': {
      name: '充值100元',
      priceUSD: 14.50,
      priceCNY: 100,
       productId: 'prod_76gXeKJ2o34gGcd47LZYdL' // 实际的Creem产品ID  prod_LCFD3sTeCrE4DvEJNwlnj
      //productId: 'prod_LCFD3sTeCrE4DvEJNwlnj' // 实际的Creem产品ID  prod_LCFD3sTeCrE4DvEJNwlnj
    },
    'recharge_500': {
      name: '充值500元',
      priceUSD: 72.50,
      priceCNY: 500,
      productId: 'prod_7g5JTReDwsZ7CqqBpdG6C5' // 实际的Creem产品ID
    },
    'recharge_1000': {
      name: '充值1000元',
      priceUSD: 145.00,
      priceCNY: 1000,
      productId: 'prod_6kk3Wbz6pvDwMK46px4D9A' // 待创建
    },
    'recharge_2000': {
      name: '充值2000元',
      priceUSD: 290.00,
      priceCNY: 2000,
      productId: 'prod_1hKo0OkAJlOdhizEHtS8Yj' // 待创建
    },
    'recharge_5000': {
      name: '充值5000元',
      priceUSD: 725.00,
      priceCNY: 5000,
      productId: 'prod_2n5Lm8nXAEEo8TYcI1gO8F' // 待创建
    },
    'recharge_10000': {
      name: '充值10000元',
      priceUSD: 1450.00,
      priceCNY: 10000,
      productId: 'prod_7ldwdnPQRA7C9P6WE8XkVI' // 待创建
    }
  };

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(BankCard) private readonly cardRepo: Repository<BankCard>,
    @Inject('CREEM_API_KEY') private readonly apiKey: string
  ) {}

  async getInfo(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    return {
      balance: user.balance,
      frozenBalance: user.frozenBalance,
      points: {
        AIC: user.aicPoints,
        HH: user.hhPoints
      },
      frozenPoints: {
        AIC: user.frozenAicPoints,
        HH: user.frozenHhPoints
      }
    };
  }

  async getRechargeProducts() {
    return Object.values(this.rechargeProducts).map(product => ({
      productId: product.productId,
      name: product.name,
      priceCNY: product.priceCNY,
      priceUSD: product.priceUSD,
      displayPrice: `¥${product.priceCNY}`,
      usdPrice: `$${product.priceUSD}`
    }));
  }

  // 测试Creem产品是否存在
  async testCreemProduct(productId: string) {
    try {
      console.log(`测试Creem产品: ${productId}`);
      console.log(`API密钥: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined'}`);
      
      // 首先尝试获取产品信息
      // 使用 x-api-key 认证方式（根据测试结果，这是正确的方式）
      const productResponse = await fetch(`https://test-api.creem.io/v1/products/${productId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (productResponse.ok) {
        const productInfo = await productResponse.json();
        console.log('产品信息获取成功:', productInfo);
        return {
          exists: true,
          product: productInfo,
          message: '产品存在且可访问'
        };
      } else if (productResponse.status === 404) {
        console.log('产品不存在（404）');
        return {
          exists: false,
          error: 'Product not found',
          statusCode: 404,
          details: { message: '产品可能还未在 Creem 平台创建' }
        };
      } else {
        const errorResult = await productResponse.json().catch(() => ({}));
        console.log('产品信息获取失败:', errorResult);
        return {
          exists: false,
          error: errorResult.error || 'Product access failed',
          statusCode: productResponse.status,
          details: errorResult
        };
      }
    } catch (error) {
      console.error(`测试产品 ${productId} 失败:`, error);
      return { 
        exists: false, 
        error: error.message,
        statusCode: error.statusCode,
        details: error.body || error.toString()
      };
    }
  }

  // 测试不同的API密钥格式
  async testApiKeyFormats() {
    const formats = [
      { name: 'Bearer Token', header: 'Authorization', value: `Bearer ${this.apiKey}` },
      { name: 'x-api-key', header: 'x-api-key', value: this.apiKey },
      { name: 'API Key as Bearer', header: 'Authorization', value: `Bearer ${this.apiKey.replace('creem_', '')}` }
    ];

    const results: Array<{
      format: string;
      success: boolean;
      status?: number;
      error?: any;
    }> = [];

    for (const format of formats) {
      try {
        console.log(`测试认证方式: ${format.name}`);

        const response = await fetch('https://test-api.creem.io/v1/products', {
          method: 'GET',
          headers: {
            [format.header]: format.value,
            'Content-Type': 'application/json'
          }
        });

        results.push({
          format: format.name,
          success: response.ok,
          status: response.status,
          error: response.ok ? null : await response.json().catch(() => ({}))
        });

        if (response.ok) {
          console.log(`✅ ${format.name} 认证成功`);
          return { success: true, format: format.name };
        } else {
          console.log(`❌ ${format.name} 认证失败: ${response.status}`);
        }
      } catch (error) {
        results.push({
          format: format.name,
          success: false,
          error: error.message
        });
        console.log(`❌ ${format.name} 测试出错: ${error.message}`);
      }
    }

    return { success: false, results };
  }

  // 诊断Creem API连接问题
  async diagnoseCreemAPI() {
    const results = {
      apiKeyValid: false,
      productExists: false,
      checkoutPermission: false,
      authFormat: null as string | null,
      errors: [] as string[]
    };

    try {
      console.log('开始Creem API诊断...');

      // 1. 测试不同的API密钥格式
      const authTest = await this.testApiKeyFormats();
      if (authTest.success && authTest.format) {
        results.apiKeyValid = true;
        results.authFormat = authTest.format;
        console.log(`✅ 使用 ${authTest.format} 认证成功`);
      } else {
        results.errors.push('所有认证方式都失败');
        console.log('❌ 所有认证方式都失败');
      }

      // 2. 测试API密钥有效性 - 尝试获取产品列表
      try {
        // 使用 x-api-key 认证方式（根据测试结果，这是正确的方式）
        const productsResponse = await fetch('https://test-api.creem.io/v1/products', {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (productsResponse.ok) {
          results.apiKeyValid = true;
          console.log('✅ API密钥有效');
        } else if (productsResponse.status === 403) {
          results.apiKeyValid = false;
          const errorResult = await productsResponse.json().catch(() => ({}));
          results.errors.push(`API密钥权限不足: ${errorResult.error || 'Forbidden'}`);
          console.log('❌ API密钥权限不足:', errorResult);
        } else {
          // 其他错误（如404）不一定是认证问题
          results.apiKeyValid = true; // 假设认证成功，但端点问题
          console.log('✅ API密钥认证成功，但端点可能有问题');
        }
      } catch (error) {
        results.errors.push(`API密钥测试失败: ${error.message}`);
        console.log('❌ API密钥测试失败:', error.message);
      }

      // 3. 测试产品是否存在
      const productId = 'prod_76gXeKJ2o34gGcd47LZYdL';
      try {
        // 使用 x-api-key 认证方式（根据测试结果，这是正确的方式）
        const productResponse = await fetch(`https://test-api.creem.io/v1/products/${productId}`, {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (productResponse.ok) {
          results.productExists = true;
          console.log('✅ 产品存在');
        } else if (productResponse.status === 404) {
          results.productExists = false;
          console.log('❌ 产品不存在（这是正常的，产品可能还未创建）');
          results.errors.push(`产品 ${productId} 不存在，请先在 Creem 平台创建该产品`);
        } else {
          // 其他错误（如403权限问题）
          results.productExists = false;
          const errorResult = await productResponse.json().catch(() => ({}));
          results.errors.push(`产品访问失败: ${errorResult.error || 'Unknown error'}`);
          console.log('❌ 产品访问失败:', errorResult);
        }
      } catch (error) {
        results.errors.push(`产品测试失败: ${error.message}`);
        console.log('❌ 产品测试失败:', error.message);
      }

      // 3. 测试结账权限 - 尝试创建一个最小化的结账会话
      if (results.apiKeyValid && results.productExists) {
        try {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
          const checkoutResponse = await fetch('https://test-api.creem.io/v1/checkouts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey
            },
            body: JSON.stringify({
              product_id: productId,
              success_url: `${frontendUrl}/recharge-callback?status=success`,
              cancel_url: `${frontendUrl}/recharge-callback?status=cancel`,
              metadata: {
                test: 'diagnostic'
              }
            })
          });

          if (checkoutResponse.ok) {
            results.checkoutPermission = true;
            console.log('✅ 结账权限正常');
          } else {
            const errorResult = await checkoutResponse.json();
            results.errors.push(`结账权限不足: ${errorResult.error}`);
            console.log('❌ 结账权限不足:', errorResult);
          }
        } catch (error) {
          results.errors.push(`结账测试失败: ${error.message}`);
          console.log('❌ 结账测试失败:', error.message);
        }
      }

      console.log('Creem API诊断完成:', results);
      return results;

    } catch (error) {
      console.error('诊断过程出错:', error);
      results.errors.push(`诊断失败: ${error.message}`);
      return results;
    }
  }

  async recharge(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('金额需大于0');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    user.balance = Number(user.balance) + Number(amount);
    await this.userRepo.save(user);
    await this.txRepo.save(this.txRepo.create({
      userId,
      type: TransactionType.RECHARGE,
      status: TransactionStatus.COMPLETED,
      title: '钱包充值',
      amount,
      balanceAfter: user.balance
    }));
    return { balance: user.balance };
  }

  async createRechargeIntent(userId: number, productId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const product = Object.values(this.rechargeProducts).find(p => p.productId === productId);
    if (!product) throw new BadRequestException('无效的产品ID');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const requestBody = {
      product_id: product.productId,
      //success_url: `${frontendUrl}/recharge-callback?session_id={CHECKOUT_SESSION_ID}`,
      //success_url: `http://localhost:3000/api/wallet/webhook`,
      metadata: {
        userId: user.id.toString(),
        originalAmountCNY: product.priceCNY.toString(),
        productName: product.name
      },
      customer: {
        email: user.email || '',
        name: user.username || ''
      }
    };

    try {
      const response = await fetch('https://test-api.creem.io/v1/checkouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorResult = await response.json();
        console.log('Creem API错误详情:', {
          status: response.status,
          error: errorResult,
          apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'undefined',
          productId: product.productId
        });
        throw new Error(`Creem API error: ${response.status} - ${JSON.stringify(errorResult)}`);
      }

      const result = await response.json();
      console.log('Creem checkout响应:', JSON.stringify(result, null, 2));  // 保留日志

      // 获取checkoutUrl：使用文档指定的checkout_url字段
      if (!result.checkout_url) {
        throw new Error('Creem响应缺少checkout_url字段，请检查product_id或API配置');
      }
      const checkoutUrl = result.checkout_url;

      // 创建pending transaction
      const tx = this.txRepo.create({
        userId: user.id,
        type: TransactionType.RECHARGE,
        status: TransactionStatus.PENDING,
        title: product.name,
        amount: product.priceCNY,
        balanceAfter: user.balance,  // 修正为balanceAfter
        description: `等待Creem支付完成，会话ID: ${result.id}`
      });
      await this.txRepo.save(tx);

      return {
        checkoutUrl,
        amountCNY: product.priceCNY,
        amountUSD: product.priceUSD,
        productName: product.name
      };
    } catch (error) {
      console.error('Creem API错误:', error);
      throw new BadRequestException(`创建支付会话失败: ${error.message}`);
    }
  }

  public constructWebhookEvent(payload: Buffer | undefined, signature: string) {
    if (!payload) {
      throw new Error('Missing payload');
    }
    
    // TODO: 实现真正的 webhook 验证
    // Creem SDK 可能没有直接的 webhook 验证方法
    // 这里暂时返回解析的 payload
    try {
      return JSON.parse(payload.toString());
    } catch (error) {
      throw new Error('Invalid webhook payload');
    }
  }

  async handleWebhook(event: any) {
    console.log('=== 开始处理Creem webhook事件 ===');
    console.log('事件类型:', event.eventType || event.type);
    console.log('事件ID:', event.id);
    console.log('完整事件数据:', JSON.stringify(event, null, 2));
    
    // 处理结账完成事件 - Creem使用eventType字段
    if (event.eventType === 'checkout.completed' || event.type === 'checkout.completed' || event.type === 'payment.succeeded') {
      console.log('检测到结账完成事件');
      
      // 从object.metadata中获取用户信息
      const metadata = event.object?.metadata || event.metadata || {};
      const { userId, originalAmountCNY, productName } = metadata;
      
      console.log('提取的metadata:', { userId, originalAmountCNY, productName });
      
      if (!userId) {
        console.log('Webhook事件缺少userId，跳过处理');
        return;
      }

      const user = await this.userRepo.findOne({ where: { id: parseInt(userId) } });
      if (!user) {
        console.log('未找到用户:', userId);
        return;
      }

      console.log('找到用户:', { id: user.id, username: user.username, currentBalance: user.balance });

      const amountCNY = parseFloat(originalAmountCNY) || 0;
      console.log('充值金额:', amountCNY, '元');
      
      // 更新用户余额
      const oldBalance = user.balance;
      user.balance = Number(user.balance) + amountCNY;
      await this.userRepo.save(user);
      console.log(`余额更新: ${oldBalance} -> ${user.balance}`);

      // 更新交易记录状态
      const transaction = await this.txRepo.findOne({
        where: { 
          userId: parseInt(userId),
          type: TransactionType.RECHARGE,
          status: TransactionStatus.PENDING,
          title: productName
        },
        order: { createdAt: 'DESC' }
      });

      if (transaction) {
        console.log('找到待处理交易，更新状态');
        transaction.status = TransactionStatus.COMPLETED;
        transaction.balanceAfter = user.balance;
        await this.txRepo.save(transaction);
        console.log('交易状态已更新为完成');
      } else {
        console.log('未找到待处理交易，创建新的完成交易');
        // 如果没找到对应的待处理交易，创建新的完成交易
        const newTransaction = this.txRepo.create({
          userId: parseInt(userId),
          type: TransactionType.RECHARGE,
          status: TransactionStatus.COMPLETED,
          title: productName || '钱包充值',
          amount: amountCNY,
          balanceAfter: user.balance,
          description: `Creem支付完成，订单ID: ${event.object?.id || event.id}`
        });
        await this.txRepo.save(newTransaction);
        console.log('新交易记录已创建');
      }

      console.log(`✅ 用户 ${userId} 充值成功，金额: ${amountCNY}元，新余额: ${user.balance}元`);
    } else {
      console.log('未处理的webhook事件类型:', event.eventType || event.type);
    }
    
    console.log('=== webhook事件处理完成 ===');
  }

  async transactions(userId: number) {
    return this.txRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async listCards(userId: number) {
    return this.cardRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async addCard(userId: number, data: { cardNumber: string; holderName: string; bankName: string; phone: string }) {
    const card = this.cardRepo.create({ ...data, userId });
    await this.cardRepo.save(card);
    return card;
  }

  async deleteCard(userId: number, id: number) {
    const card = await this.cardRepo.findOne({ where: { id, userId } });
    if (!card) throw new NotFoundException('银行卡不存在');
    await this.cardRepo.delete(id);
    return { success: true };
  }
}


