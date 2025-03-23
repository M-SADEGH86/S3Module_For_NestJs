import { DeleteObjectCommand, PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ResizeOptionsType, UploadOptionType } from './types/s3.type';
import * as sharp from 'sharp';
import { S3Message } from 'src/common/enums/message.enum';

// npm i --save @aws-sdk/client-s3
@Injectable()
export class S3Service {
  // Configurations 
  constructor(private readonly s3Client: S3Client) {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      region: 'default',
      endpoint: `https://${process.env.S3_ENDPOINT}`,
    });
  }
  // npm i --save sharp 
  // resize and convert to .webp format 
  private resized(image: Buffer, options: ResizeOptionsType): Promise<Buffer> {
    const { width, fit = 'cover', height = null } = options;
    return sharp(image).resize(width, height, { fit }).webp({ quality: 90 }).toBuffer();
  }

  // upload single file 
  async uploadOne(image: Express.Multer.File, options: UploadOptionType) {
    const { S3_BUCKET_NAME, S3_ENDPOINT } = process.env;
    const { folder, name, width, fit, height } = options;
    const Key: string = `${folder}/${name}-${Date.now()}.webp`;
    const Body = await this.resized(image.buffer, { width, fit, height });
    const command = new PutObjectCommand({
      Key, // image Key
      Bucket: process.env.S3_BUCKET_NAME, // your bucket name 
      Body, // file as buffer send
    });
    try {
      const response = await this.s3Client.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new BadRequestException(S3Message.UploadFaild);
      }
      return `https://${S3_BUCKET_NAME}.${S3_ENDPOINT}/${Key}`;
    } catch (err) {
      throw new BadRequestException(S3Message.UploadFaild);
    }
  }

  // upload some files 
  async uploadAll(images: Express.Multer.File[], options: UploadOptionType) {
    const uploads: string[] = [];
    for await (let image of images) {
      const Location: string = await this.uploadOne(image, options);
      uploads.push(Location);
    }
    return uploads;
  }

  // delete single file 
  async deleteOne(location: string) {
    const { S3_BUCKET_NAME, S3_ENDPOINT } = process.env;
    const slice: number = `https://${S3_BUCKET_NAME}.${S3_ENDPOINT}/`.length;
    const Key: string = location.slice(slice);
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key,
    });
    try {
      const response = await this.s3Client.send(command);
      if (response.$metadata.httpStatusCode !== 204) {
        throw new BadRequestException(S3Message.DeleteFaild);
      }
    } catch (err) {
      throw new BadRequestException(S3Message.DeleteFaild);
    }
  }

  // delete some files
  async deleteAll (locations: string[]) {
    for await (let location of locations) {
      await this.deleteOne(location)
    }
  }
}
