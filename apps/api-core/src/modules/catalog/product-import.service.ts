import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as ExcelJS from 'exceljs';
import { TenantService } from '../../common/services/tenant.service';

/**
 * Import sản phẩm hàng loạt từ file CSV/XLSX (TODO 9).
 *
 * Cột (header hàng đầu, không phân biệt hoa thường, nhận cả tiếng Việt):
 *   name*        | tên, ten          — tên sản phẩm (bắt buộc)
 *   price*       | giá, gia          — giá VND (bắt buộc, số)
 *   description  | mô tả, mo ta
 *   category     | danh mục, danh muc — upsert theo tên
 *   sku                              — bỏ trống thì tự sinh từ tên
 *   stock        | tồn kho, ton kho  — số nguyên, mặc định 0
 *   images       | ảnh, anh          — danh sách URL cách nhau bởi ';' hoặc '|'
 *   status                           — DRAFT/PUBLISHED, mặc định PUBLISHED
 *
 * File được parse + validate đồng bộ, xử lý (tạo SP + tải ảnh về MinIO) chạy
 * nền qua Bull queue 'product-import'; FE poll GET /catalog/products/import/:jobId.
 */

export interface ImportRow {
  line: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  sku?: string;
  stock: number;
  images: string[];
  status: string;
}

export interface ImportRowError {
  line: number;
  message: string;
}

const HEADER_ALIASES: Record<string, string> = {
  name: 'name', 'tên': 'name', ten: 'name', 'tên sản phẩm': 'name',
  price: 'price', 'giá': 'price', gia: 'price', 'giá tiền': 'price',
  description: 'description', 'mô tả': 'description', 'mo ta': 'description',
  category: 'category', 'danh mục': 'category', 'danh muc': 'category',
  sku: 'sku',
  stock: 'stock', 'tồn kho': 'stock', 'ton kho': 'stock', quantity: 'stock', 'số lượng': 'stock',
  images: 'images', 'ảnh': 'images', anh: 'images', image: 'images', 'hình ảnh': 'images',
  status: 'status', 'trạng thái': 'status',
};

const MAX_ROWS = 1000;

/** Parser CSV tối giản theo RFC 4180 (hỗ trợ quote + dấu phẩy/newline trong quote). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // strip BOM

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

@Injectable()
export class ProductImportService {
  constructor(
    @InjectQueue('product-import') private readonly importQueue: Queue,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  private async extractGrid(file: any): Promise<string[][]> {
    const name: string = (file.originalname || '').toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new BadRequestException('Workbook has no sheets');
      const grid: string[][] = [];
      sheet.eachRow((row) => {
        const values: string[] = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          values.push(cell.value == null ? '' : String((cell.value as any).text ?? cell.value));
        });
        if (values.some((v) => v.trim() !== '')) grid.push(values);
      });
      return grid;
    }
    if (name.endsWith('.csv') || file.mimetype === 'text/csv') {
      return parseCsv(file.buffer.toString('utf-8'));
    }
    throw new BadRequestException('Unsupported file type — use .csv or .xlsx');
  }

  /** Parse + validate; trả rows hợp lệ và lỗi từng dòng. */
  async parseFile(file: any): Promise<{ rows: ImportRow[]; errors: ImportRowError[] }> {
    const grid = await this.extractGrid(file);
    if (grid.length < 2) {
      throw new BadRequestException('File must contain a header row and at least one data row');
    }
    if (grid.length - 1 > MAX_ROWS) {
      throw new BadRequestException(`Too many rows (max ${MAX_ROWS})`);
    }

    const header = grid[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase()] || null);
    if (!header.includes('name') || !header.includes('price')) {
      throw new BadRequestException('Missing required columns: name, price');
    }

    const rows: ImportRow[] = [];
    const errors: ImportRowError[] = [];

    for (let r = 1; r < grid.length; r++) {
      const line = r + 1; // số dòng trong file (header là dòng 1)
      const cells = grid[r];
      const rec: Record<string, string> = {};
      header.forEach((key, idx) => {
        if (key) rec[key] = (cells[idx] ?? '').toString().trim();
      });

      if (!rec.name) { errors.push({ line, message: 'Thiếu tên sản phẩm' }); continue; }
      const price = Number(rec.price?.replace(/[.,\s]/g, (m) => (m === ',' ? '.' : '')));
      if (!Number.isFinite(price) || price < 0) {
        errors.push({ line, message: `Giá không hợp lệ: "${rec.price}"` });
        continue;
      }
      const stock = rec.stock ? parseInt(rec.stock.replace(/[^\d]/g, ''), 10) : 0;
      if (rec.stock && !Number.isInteger(stock)) {
        errors.push({ line, message: `Tồn kho không hợp lệ: "${rec.stock}"` });
        continue;
      }

      const images = (rec.images || '')
        .split(/[;|]/)
        .map((u) => u.trim())
        .filter(Boolean);
      const badUrl = images.find((u) => !/^https?:\/\//i.test(u));
      if (badUrl) {
        errors.push({ line, message: `URL ảnh không hợp lệ: "${badUrl}"` });
        continue;
      }

      rows.push({
        line,
        name: rec.name,
        description: rec.description || undefined,
        price,
        category: rec.category || undefined,
        sku: rec.sku || undefined,
        stock: Number.isInteger(stock) ? stock : 0,
        images,
        status: rec.status?.toUpperCase() === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      });
    }

    return { rows, errors };
  }

  async startImport(file: any) {
    const shopId = this.getShopId();
    if (!file?.buffer) throw new BadRequestException('File is required');

    const { rows, errors } = await this.parseFile(file);
    if (rows.length === 0) {
      throw new BadRequestException({
        message: 'No valid rows to import',
        errors,
      });
    }

    const job = await this.importQueue.add(
      'import-products',
      { shopId, rows, parseErrors: errors },
      { removeOnComplete: 3600, removeOnFail: 3600 }, // giữ 1h để FE poll
    );

    return { jobId: String(job.id), total: rows.length, parseErrors: errors };
  }

  async getImportStatus(jobId: string) {
    const shopId = this.getShopId();
    const job = await this.importQueue.getJob(jobId);
    if (!job || (job.data as any)?.shopId !== shopId) {
      throw new NotFoundException('Import job not found');
    }

    const state = await job.getState();
    const progress = job.progress() as any;
    return {
      jobId: String(job.id),
      state, // waiting | active | completed | failed
      total: (job.data as any).rows.length,
      processed: typeof progress === 'object' ? progress.processed : 0,
      errors: typeof progress === 'object' ? progress.errors : [],
      parseErrors: (job.data as any).parseErrors || [],
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }
}
