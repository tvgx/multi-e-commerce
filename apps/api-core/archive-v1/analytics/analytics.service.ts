import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMasterSummary() {
    const orderStats = await this.prisma.order.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { state: 'complete' },
    });

    const totalOrders = orderStats._count.id || 0;
    const totalRevenue = orderStats._sum.totalAmount || 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const canceledOrders = await this.prisma.order.count({
      where: { state: 'canceled' },
    });
    const returnRate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;

    const totalCustomers = await this.prisma.customer.count();
    const clv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return [
      {
        title: 'Tỷ lệ chuyển đổi (CR)',
        value: null,
        change: null,
        isPositive: true,
        category: 'Business',
      },
      {
        title: 'Giá trị đơn hàng (AOV)',
        value: `${aov.toLocaleString('vi-VN')}đ`,
        change: null,
        isPositive: true,
        category: 'Business',
      },
      {
        title: 'Chi phí thu hút (CAC)',
        value: null,
        change: null,
        isPositive: true,
        category: 'Marketing',
      },
      {
        title: 'Tỷ lệ hoàn trả',
        value: `${returnRate.toFixed(1)}%`,
        change: null,
        isPositive: returnRate < 5,
        category: 'Health',
      },
      {
        title: 'Lưu lượng truy cập',
        value: null,
        change: null,
        isPositive: true,
        category: 'Traffic',
      },
      {
        title: 'Tỷ lệ thoát',
        value: null,
        change: null,
        isPositive: true,
        category: 'UX',
      },
      {
        title: 'Bỏ giỏ hàng',
        value: null,
        change: null,
        isPositive: false,
        category: 'Sales',
      },
      {
        title: 'Tốc độ tải trang',
        value: null,
        change: null,
        isPositive: true,
        category: 'Tech',
      },
      {
        title: 'Tỷ lệ quay lại',
        value: null,
        change: null,
        isPositive: true,
        category: 'Retain',
      },
      {
        title: 'Giá trị trọn đời (CLV)',
        value: `${clv.toLocaleString('vi-VN')}đ`,
        change: null,
        isPositive: true,
        category: 'Customer',
      },
    ];
  }

  async getMasterCharts() {
    // Return null for funnel as it's untracked
    // For revenueGrowth, we should query actual data, but since Prisma doesn't have a simple date_trunc grouping out of the box without raw query, we will use a raw query or simple aggregation if possible. For now, returning empty array or null is better than mock if no data, or a basic fetch.
    return {
      revenueGrowth: null,
      funnel: null,
    };
  }

  async getShopSummary(shopId: string) {
    const orderStats = await this.prisma.order.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { shopId, state: 'complete' },
    });

    const totalOrders = orderStats._count.id || 0;
    const totalRevenue = orderStats._sum.totalAmount || 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const canceledOrders = await this.prisma.order.count({
      where: { shopId, state: 'canceled' },
    });
    const returnRate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      aov,
      returnRate,
      conversionRate: null,
      traffic: null,
    };
  }

  async getShopCharts(shopId: string) {
    const orderStates = await this.prisma.order.groupBy({
      by: ['state'],
      where: { shopId },
      _count: { id: true },
    });

    const distribution = (orderStates as any[]).map((s: any) => ({
      label: s.state.charAt(0).toUpperCase() + s.state.slice(1),
      value: s._count.id,
      percent: 0,
    }));

    const totalCount = distribution.reduce((acc, curr) => acc + curr.value, 0);
    distribution.forEach((item) => {
      item.percent = totalCount > 0 ? (item.value / totalCount) * 100 : 0;
    });

    return {
      lineChart: null, // Untracked
      pieChart: distribution,
    };
  }
}
