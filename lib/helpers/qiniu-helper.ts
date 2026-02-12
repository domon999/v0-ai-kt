import qiniu from 'qiniu'

export interface QiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
  domain: string
  region?: string
}

export class QiniuHelper {
  private mac: qiniu.auth.digest.Mac
  private config: QiniuConfig
  private bucketManager: qiniu.rs.BucketManager

  constructor(config: QiniuConfig) {
    this.config = config
    this.mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey)
    
    const qiniuConfig = new qiniu.conf.Config({
      zone: this.getZone(config.region || 'z0'),
    })
    
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, qiniuConfig)
  }

  private getZone(region: string): qiniu.conf.Zone {
    const zones: Record<string, qiniu.conf.Zone> = {
      z0: qiniu.zone.Zone_z0, // 华东
      z1: qiniu.zone.Zone_z1, // 华北
      z2: qiniu.zone.Zone_z2, // 华南
      na0: qiniu.zone.Zone_na0, // 北美
      as0: qiniu.zone.Zone_as0, // 东南亚
    }
    return zones[region] || qiniu.zone.Zone_z0
  }

  async upload(buffer: Buffer, key: string, mimeType?: string): Promise<string> {
    const options = {
      scope: this.config.bucket,
      mimeLimit: mimeType,
    }
    
    const putPolicy = new qiniu.rs.PutPolicy(options)
    const uploadToken = putPolicy.uploadToken(this.mac)

    const formUploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config())
    const putExtra = new qiniu.form_up.PutExtra()

    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, key, buffer, putExtra, (err, body, info) => {
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
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.config.bucket, key, (err, respBody, respInfo) => {
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
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(this.config.bucket, key, (err, respBody, respInfo) => {
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
