import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Client, S3Service],
  exports: [S3Service],
})
export class S3Module {}
