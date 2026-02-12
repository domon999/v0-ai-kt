import { createClient } from '@/lib/supabase/server'
import { QiniuHelper } from '@/lib/helpers/qiniu-helper'
import { put, del } from '@vercel/blob'

export type StorageProvider = 'qiniu' | 'vercel_blob'

export interface UploadResult {
  url: string
  provider: StorageProvider
  key?: string
}

export class StorageService {
  static async getActiveConfig() {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('storage_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !data) {
      throw new Error('No active storage configuration found')
    }

    return data
  }

  static async upload(
    file: Buffer | Blob,
    filename: string,
    options?: {
      contentType?: string
      prefix?: string
    }
  ): Promise<UploadResult> {
    const config = await this.getActiveConfig()

    if (config.provider === 'qiniu') {
      return await this.uploadToQiniu(file as Buffer, filename, options)
    } else {
      return await this.uploadToVercelBlob(file as Blob, filename, options)
    }
  }

  private static async uploadToQiniu(
    buffer: Buffer,
    filename: string,
    options?: { contentType?: string; prefix?: string }
  ): Promise<UploadResult> {
    const config = await this.getActiveConfig()

    if (!config.qiniu_access_key || !config.qiniu_secret_key || !config.qiniu_bucket || !config.qiniu_domain) {
      throw new Error('Qiniu configuration incomplete')
    }

    const helper = new QiniuHelper({
      accessKey: config.qiniu_access_key,
      secretKey: config.qiniu_secret_key,
      bucket: config.qiniu_bucket,
      domain: config.qiniu_domain,
      region: config.qiniu_region || 'z0',
    })

    const key = helper.generateKey(filename, options?.prefix)
    const url = await helper.upload(buffer, key, options?.contentType)

    return {
      url,
      provider: 'qiniu',
      key,
    }
  }

  private static async uploadToVercelBlob(
    blob: Blob,
    filename: string,
    options?: { contentType?: string; prefix?: string }
  ): Promise<UploadResult> {
    const key = options?.prefix ? `${options.prefix}/${filename}` : filename

    const result = await put(key, blob, {
      access: 'public',
      contentType: options?.contentType,
    })

    return {
      url: result.url,
      provider: 'vercel_blob',
      key: result.pathname,
    }
  }

  static async delete(url: string, provider?: StorageProvider): Promise<void> {
    const config = await this.getActiveConfig()
    const actualProvider = provider || config.provider

    if (actualProvider === 'qiniu') {
      await this.deleteFromQiniu(url)
    } else {
      await this.deleteFromVercelBlob(url)
    }
  }

  private static async deleteFromQiniu(url: string): Promise<void> {
    const config = await this.getActiveConfig()

    if (!config.qiniu_access_key || !config.qiniu_secret_key || !config.qiniu_bucket || !config.qiniu_domain) {
      throw new Error('Qiniu configuration incomplete')
    }

    const helper = new QiniuHelper({
      accessKey: config.qiniu_access_key,
      secretKey: config.qiniu_secret_key,
      bucket: config.qiniu_bucket,
      domain: config.qiniu_domain,
      region: config.qiniu_region || 'z0',
    })

    const key = url.replace(`https://${config.qiniu_domain}/`, '')
    await helper.delete(key)
  }

  private static async deleteFromVercelBlob(url: string): Promise<void> {
    await del(url)
  }
}
