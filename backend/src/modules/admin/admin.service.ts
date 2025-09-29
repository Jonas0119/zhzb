import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { AdminLog } from '../../entities/admin-log.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepo: Repository<AdminLog>,
  ) {}

  // 检查用户是否为管理员
  async checkAdminRole(userId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('权限不足，需要管理员权限');
    }
  }

  // 获取统计数据
  async getDashboardStats() {
    const totalUsers = await this.userRepo.count();
    const activeUsers = await this.userRepo
      .createQueryBuilder('user')
      .where('user.updatedAt > DATE_SUB(NOW(), INTERVAL 7 DAY)')
      .getCount();

    const todayUsers = await this.userRepo
      .createQueryBuilder('user')
      .where('DATE(user.createdAt) = CURDATE()')
      .getCount();

    // 获取积分统计
    const pointsStats = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'SUM(user.aicPoints) as totalAicPoints',
        'SUM(user.hhPoints) as totalHhPoints',
        'SUM(user.balance) as totalBalance'
      ])
      .getRawOne();

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        todayNew: todayUsers
      },
      points: {
        totalAic: Number(pointsStats.totalAicPoints) || 0,
        totalHh: Number(pointsStats.totalHhPoints) || 0,
        totalBalance: Number(pointsStats.totalBalance) || 0
      }
    };
  }

  // 获取用户列表
  async getUserList(page: number = 1, limit: number = 20, search?: string) {
    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.role',
        'user.aicPoints',
        'user.hhPoints',
        'user.balance',
        'user.createdAt'
      ])
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      queryBuilder.where(
        '(user.username LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        aicPoints: Number(user.aicPoints),
        hhPoints: Number(user.hhPoints),
        balance: Number(user.balance),
        createdAt: user.createdAt
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 给用户增加积分
  async addUserPoints(adminId: number, targetUserId: number, pointType: 'AIC' | 'HH', amount: number, reason?: string) {
    // 检查管理员权限
    await this.checkAdminRole(adminId);

    // 查找目标用户
    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 更新用户积分
    const fieldName = pointType === 'AIC' ? 'aicPoints' : 'hhPoints';
    const currentPoints = Number(targetUser[fieldName]);
    targetUser[fieldName] = currentPoints + amount;

    await this.userRepo.save(targetUser);

    // 记录操作日志
    await this.adminLogRepo.save({
      adminId,
      action: 'add_points',
      targetUserId,
      details: {
        pointType,
        amount,
        reason: reason || '管理员手动增加积分',
        beforePoints: currentPoints,
        afterPoints: currentPoints + amount
      }
    });

    return {
      success: true,
      message: `成功给用户 ${targetUser.username} 增加 ${amount} ${pointType}积分`,
      newBalance: {
        aicPoints: Number(targetUser.aicPoints),
        hhPoints: Number(targetUser.hhPoints)
      }
    };
  }

  // 修改用户权限
  async updateUserRole(adminId: number, targetUserId: number, newRole: 'user' | 'admin') {
    // 检查管理员权限
    await this.checkAdminRole(adminId);

    // 查找目标用户
    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 不能修改自己的权限
    if (adminId === targetUserId) {
      throw new ForbiddenException('不能修改自己的权限');
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await this.userRepo.save(targetUser);

    // 记录操作日志
    await this.adminLogRepo.save({
      adminId,
      action: 'update_user_role',
      targetUserId,
      details: {
        oldRole,
        newRole,
        reason: '管理员修改用户权限'
      }
    });

    return {
      success: true,
      message: `成功将用户 ${targetUser.username} 的权限修改为 ${newRole === 'admin' ? '管理员' : '普通用户'}`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role
      }
    };
  }

  // 获取操作日志
  async getAdminLogs(page: number = 1, limit: number = 20) {
    const [logs, total] = await this.adminLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .leftJoinAndSelect('log.targetUser', 'targetUser')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        adminName: log.admin?.username || '未知',
        targetUserName: log.targetUser?.username || '系统',
        details: log.details,
        createdAt: log.createdAt
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}