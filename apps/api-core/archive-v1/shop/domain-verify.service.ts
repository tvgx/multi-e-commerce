import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns/promises';

@Injectable()
export class DomainVerifyService {
  private readonly logger = new Logger(DomainVerifyService.name);

  /**
   * Verifies if a domain has a TXT record with the format shopVolo-verification=<shopId>
   */
  async verifyDNS(domain: string, shopId: string): Promise<boolean> {
    try {
      // For local development with .localhost or local domains, bypass real check
      if (domain.endsWith('.localhost') || domain.includes('127.0.0.1')) {
        this.logger.log(
          `Bypassing DNS verification for local domain: ${domain}`,
        );
        return true;
      }

      const records = await dns.resolveTxt(domain);
      const expectedRecord = `shopVolo-verification=${shopId}`;

      const found = records.some((group) =>
        group.some((record) => record === expectedRecord),
      );

      if (!found) {
        this.logger.warn(
          `DNS verification failed for ${domain}. Expected: ${expectedRecord}`,
        );
      }

      return found;
    } catch (error) {
      this.logger.error(`DNS lookup failed for ${domain}: ${error.message}`);
      return false;
    }
  }
}
