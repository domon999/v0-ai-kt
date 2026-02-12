import { createClient } from '@/lib/supabase/server'
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
    // Qiniu requires Node.js runtime and has dependency issues in edge runtime
    // Use Vercel Blob as the default storage solution
    throw new Error('Qiniu storage is not available. Please configure Vercel Blob storage.')
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
    // Qiniu requires Node.js runtime and has dependency issues in edge runtime
    throw new Error('Qiniu storage is not available. Please configure Vercel Blob storage.')
  }

  private static async deleteFromVercelBlob(url: string): Promise<void> {
    await del(url)
  }
}
