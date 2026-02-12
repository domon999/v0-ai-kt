export interface QiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  domain: string
  region?: string
}

export class QiniuHelper {
  private config: QiniuConfig
  private qiniuPromise: Promise<any> | null = null

  constructor(config: QiniuConfig) {
    this.config = config
  }

  private async getQiniu() {
    if (!this.qiniuPromise) {
      this.qiniuPromise = import('qiniu')
    }
    return this.qiniuPromise
  }

  private async getZone(region: string) {
    const qiniu = await this.getQiniu()
    const zones: Record<string, any> = {
      z0: qiniu.zone.Zone_z0, // 华东
      z1: qiniu.zone.Zone_z1, // 华北
      z2: qiniu.zone.Zone_z2, // 华南
      na0: qiniu.zone.Zone_na0, // 北美
      as0: qiniu.zone.Zone_as0, // 东南亚
    }
    return zones[region] || qiniu.zone.Zone_z0
  }

  async upload(buffer: Buffer, key: string, mimeType?: string): Promise<string> {
    const qiniu = await this.getQiniu()
    const mac = new qiniu.auth.digest.Mac(this.config.accessKey, this.config.secretKey)
    
    const options = {
      scope: this.config.bucket,
      mimeLimit: mimeType,
    }
    
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(mac)

    const formUploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config())
    const putExtra = new qiniu.form_up.PutExtra()

    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, key, buffer, putExtra, (err: any, body: any, info: any) => {
        if (err) {
          reject(err)
        } else if (info.statusCode === 200) {
          const url = `https://${this.config.domain}/${body.key}`
          resolve(url)
        } else {
          reject(new Error(`Upload failed with status ${info.statusCode}`))
        }
      })
    })
  }

  async delete(key: string): Promise<void> {
    const qiniu = await this.getQiniu()
    const mac = new qiniu.auth.digest.Mac(this.config.accessKey, this.config.secretKey)
    const config = new qiniu.conf.Config({ zone: await this.getZone(this.config.region || 'z0') })
    const bucketManager = new qiniu.rs.BucketManager(mac, config)
    
    return new Promise((resolve, reject) => {
      bucketManager.delete(this.config.bucket, key, (err: any, respBody: any, respInfo: any) => {
        if (err) {
          reject(err)
        } else if (respInfo.statusCode === 200) {
          resolve()
        } else {
          reject(new Error(`Delete failed with status ${respInfo.statusCode}`))
        }
      })
    })
  }

  async stat(key: string): Promise<any> {
    const qiniu = await this.getQiniu()
    const mac = new qiniu.auth.digest.Mac(this.config.accessKey, this.config.secretKey)
    const config = new qiniu.conf.Config({ zone: await this.getZone(this.config.region || 'z0') })
    const bucketManager = new qiniu.rs.BucketManager(mac, config)
    
    return new Promise((resolve, reject) => {
      bucketManager.stat(this.config.bucket, key, (err: any, respBody: any, respInfo: any) => {
        if (err) {
          reject(err)
        } else if (respInfo.statusCode === 200) {
          resolve(respBody)
        } else {
          reject(new Error(`Stat failed with status ${respInfo.statusCode}`))
        }
      })
    })
  }

  generateKey(originalName: string, prefix?: string): string {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = originalName.split('.').pop()
    const baseKey = `${timestamp}_${randomStr}.${ext}`
    return prefix ? `${prefix}/${baseKey}` : baseKey
  }
}
