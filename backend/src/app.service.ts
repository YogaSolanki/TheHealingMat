import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'The Healing Mat API',
      version: '0.0.1',
    };
  }
}
