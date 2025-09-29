import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 获取数据看板统计
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const userId = req.user.userId;
    await this.adminService.checkAdminRole(userId);
    return this.adminService.getDashboardStats();
  }

  // 获取用户列表
  @Get('users')
  async getUserList(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string
  ) {
    const userId = req.user.userId;
    await this.adminService.checkAdminRole(userId);
    return this.adminService.getUserList(
      parseInt(page),
      parseInt(limit),
      search
    );
  }

  // 给用户增加积分
  @Post('users/:userId/add-points')
  async addUserPoints(
    @Req() req: any,
    @Body() body: { pointType: 'AIC' | 'HH'; amount: number; reason?: string }
  ) {
    const adminId = req.user.userId;
    const targetUserId = parseInt(req.params.userId);
    return this.adminService.addUserPoints(
      adminId,
      targetUserId,
      body.pointType,
      body.amount,
      body.reason
    );
  }

  // 修改用户权限
  @Post('users/:userId/update-role')
  async updateUserRole(
    @Req() req: any,
    @Body() body: { role: 'user' | 'admin' }
  ) {
    const adminId = req.user.userId;
    const targetUserId = parseInt(req.params.userId);
    return this.adminService.updateUserRole(
      adminId,
      targetUserId,
      body.role
    );
  }

  // 获取操作日志
  @Get('logs')
  async getAdminLogs(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const userId = req.user.userId;
    await this.adminService.checkAdminRole(userId);
    return this.adminService.getAdminLogs(
      parseInt(page),
      parseInt(limit)
    );
  }
}


