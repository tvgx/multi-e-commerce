import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly SECRET_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Decrypt incoming payload if it is encrypted
    if (request.body && request.body.encryptedData) {
      try {
        request.body = JSON.parse(this.decrypt(request.body.encryptedData));
      } catch (e) {
        // Fallback or handle invalid encryption
      }
    }

    return next.handle().pipe(
      map(data => {
        // In a real application, you might only encrypt based on a header
        // For demonstration, we'll return both plaintext and encrypted form 
        // if requested, or just wrap it.
        const shouldEncrypt = request.headers['x-require-encryption'] === 'true';
        if (shouldEncrypt && data) {
          return { encryptedData: this.encrypt(JSON.stringify(data)) };
        }
        return data;
      }),
    );
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.SECRET_KEY, 'hex'); // Assuming hex encoded key in env
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const key = Buffer.from(this.SECRET_KEY, 'hex');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
