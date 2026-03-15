import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getMasterSummary() {
    // 1. Calculate AOV (Average Order Value)
    const orderStats = await this.prisma.order.aggregate({
      _count: { id: true },
      _sum: { totalAmount: true },
      where: { state: 'complete' },
    });

    const totalOrders = orderStats._count.id || 0;
    const totalRevenue = orderStats._sum.totalAmount || 0;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Return Rate (Mock logic for now, using 'canceled' state or specific refund flags)
    const canceledOrders = await this.prisma.order.count({
      where: { state: 'canceled' },
    });
    const returnRate = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;

    // 3. Conversion Rate (Baseline mock, as traffic is not tracked in DB yet)
    // In a real scenario, this would involve a 'Traffic' table or an external analytics API
    const conversionRate = 3.2; // Baseline placeholder

    // 4. CAC (Mock, as marketing spend usually comes from a different system)
    const cac = 45000;

    // 5. Traffic (Baseline placeholder)
    const traffic = 45200;

    // 6. Customer Metrics
    const totalCustomers = await this.prisma.customer.count();
    const retentionRate = 24.5; // Mock logic
    const clv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return [
      {
        title: 'Tỷ lệ chuyển đổi (CR)',
        value: `${conversionRate}%`,
        change: '+0.4%',
        isPositive: true,
        category: 'Business',
      },
      {
        title: 'Giá trị đơn hàng (AOV)',
        value: `${aov.toLocaleString('vi-VN')}đ`,
        change: '+12%',
        isPositive: true,
        category: 'Business',
      },
      {
        title: 'Chi phí thu hút (CAC)',
        value: `${cac.toLocaleString('vi-VN')}đ`,
        change: '-5%',
        isPositive: true,
        category: 'Marketing',
      },
      {
        title: 'Tỷ lệ hoàn trả',
        value: `${returnRate.toFixed(1)}%`,
        change: '+0.1%',
        isPositive: returnRate < 5,
        category: 'Health',
      },
      {
        title: 'Lưu lượng truy cập',
        value: traffic.toLocaleString('vi-VN'),
        change: '+18%',
        isPositive: true,
        category: 'Traffic',
      },
      {
        title: 'Tỷ lệ thoát',
        value: '42%',
        change: '-2%',
        isPositive: true,
        category: 'UX',
      },
      {
        title: 'Bỏ giỏ hàng',
        value: '68%',
        change: '+4%',
        isPositive: false,
        category: 'Sales',
      },
      {
        title: 'Tốc độ tải trang',
        value: '1.2s',
        change: '-0.3s',
        isPositive: true,
        category: 'Tech',
      },
      {
        title: 'Tỷ lệ quay lại',
        value: `${retentionRate}%`,
        change: '+2%',
        isPositive: true,
        category: 'Retain',
      },
      {
        title: 'Giá trị trọn đời (CLV)',
        value: `${clv.toLocaleString('vi-VN')}đ`,
        change: '+15%',
        isPositive: true,
        category: 'Customer',
      },
    ];
  }

  async getMasterCharts() {
    // This would return time-series data for the BarChart
    // Mocking 12 months for now
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const data = months.map(() => Math.floor(Math.random() * 60) + 40);

    return {
      revenueGrowth: data,
      funnel: [
        { label: 'Traffic', value: '100%', percent: 100 },
        { label: 'Thêm vào giỏ', value: '32%', percent: 32 },
        { label: 'Thanh toán', value: '12%', percent: 12 },
        { label: 'Thành công (CR)', value: '3.2%', percent: 3.2 },
      ],
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
      conversionRate: 2.8, // Mock for now
      traffic: 12400, // Mock for now
    };
  }

  async getShopCharts(shopId: string) {
    // 1. Line Chart Data (Last 7 days revenue)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('vi-VN', { weekday: 'short' });
    });

    const revenueTrends = last7Days.map(() => Math.floor(Math.random() * 5000000) + 1000000);

    // 2. Pie Chart Data (Orders by State)
    const orderStates = await this.prisma.order.groupBy({
      by: ['state'],
      where: { shopId },
      _count: { id: true },
    });

    const distribution = orderStates.map((s) => ({
      label: s.state.charAt(0).toUpperCase() + s.state.slice(1),
      value: s._count.id,
      percent: 0, // Will calculate below
    }));

    const totalCount = distribution.reduce((acc, curr) => acc + curr.value, 0);
    distribution.forEach((item) => {
      item.percent = totalCount > 0 ? (item.value / totalCount) * 100 : 0;
    });

    return {
      lineChart: {
        labels: last7Days,
        datasets: [{ label: 'Doanh thu', data: revenueTrends }],
      },
      pieChart: distribution,
    };
  }
}
