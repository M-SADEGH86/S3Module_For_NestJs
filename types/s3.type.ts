import { FitEnum } from "sharp";

export interface ResizeOptionsType {
  width : number ;
  height ?: number | null ;
  fit ?: keyof FitEnum 
}

export interface UploadOptionType extends ResizeOptionsType {
  folder: string ;
  name: string ;
}