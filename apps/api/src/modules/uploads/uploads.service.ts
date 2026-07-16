import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { s3 } from '../../lib/s3'
import { env } from '../../config/env'
import type { PresignUploadInput } from '@repo/types'

export async function generatePresignedUrl(input: PresignUploadInput) {
  const extension = input.fileType.split('/')[1] // "image/jpeg" -> "jpeg"
  const key = `properties/${randomUUID()}.${extension}` // unique path in the bucket

  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: input.fileType,
    ACL: 'public-read',
  })

  // this URL is valid for 60 seconds — enough time for the client to start the upload
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 })

  const publicUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`

  return { uploadUrl, publicUrl, key }
}

export async function generatePresignedGetUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  })

  // this URL is valid for 1 hour — enough time for the client to download/view the file
  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })

  return { downloadUrl }
}

export async function getFileStream(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  })

  const response = await s3.send(command)
  return response.Body
}
