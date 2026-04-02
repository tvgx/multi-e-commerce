import { Injectable, BadRequestException } from '@nestjs/common';
import * as os from 'os';
import { PrismaService } from '../database/prisma.service';
import { ShopTemplate } from '@ecommerce/database';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemHealth() {
    // OS stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuUsage = os.loadavg()[0]; // 1 minute load average

    // DB stats
    let pgStatus = 'Disconnected';
    let mongoStatus = 'Disconnected';
    let pgShopCount = 0;
    let mongoTemplateCount = 0;

    try {
      pgShopCount = await this.prisma.shop.count();
      pgStatus = 'Connected';
    } catch {
      pgStatus = 'Error';
    }

    try {
      mongoTemplateCount = await ShopTemplate.countDocuments();
      mongoStatus = 'Connected';
    } catch {
      mongoStatus = 'Error';
    }

    return {
      os: {
        platform: os.platform(),
        cpus: os.cpus().length,
        memory: {
          totalGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
          usedGB: (usedMem / 1024 / 1024 / 1024).toFixed(2),
          freeGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
          usagePercent: ((usedMem / totalMem) * 100).toFixed(2),
        },
        loadAvg: cpuUsage.toFixed(2),
      },
      databases: {
        postgresql: {
          status: pgStatus,
          shopCount: pgShopCount,
        },
        mongodb: {
          status: mongoStatus,
          jsonCount: mongoTemplateCount,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Simple JSON Validator for Master Templates
  validateJsonSetup(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString);

      // Basic schema check
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new BadRequestException("Missing 'sections' array in JSON.");
      }

      parsed.sections.forEach((sec: Record<string, unknown>, index: number) => {
        if (!sec.id || !sec.type) {
          throw new BadRequestException(
            `Section at index ${index} is missing 'id' or 'type'.`,
          );
        }
      });

      return {
        valid: true,
        message: 'JSON is structurally valid for Zero-File Rendering.',
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Mass sync generic template logic
  async massSyncFeature(targetAttr: string, newValue: unknown) {
    // Simplified implementation using Mongoose updateMany to modify matching templates
    // Ex: targetAttr = 'publishedData.theme.fontFamily', newValue = 'Roboto'
    const updateQuery = { $set: { [targetAttr]: newValue } };

    const result = await ShopTemplate.updateMany({}, updateQuery);
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }
}
