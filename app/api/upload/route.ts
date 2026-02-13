import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { ApiResponseHelper } from '@/lib/utils/api-response'
import { validateImageFile } from '@/lib/utils/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return ApiResponseHelper.validationError('请选择文件')
    }

    // Validate file
    const validation = validateImageFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    })

    if (!validation.valid) {
      return ApiResponseHelper.validationError(validation.error!)
    }

    // Upload to Vercel Blob
    const filename = `${user.id}/${Date.now()}-${file.name}`
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log('[v0] File uploaded:', blob.url)

    return ApiResponseHelper.success({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    }, '文件上传成功')
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return ApiResponseHelper.serverError(
      error instanceof Error ? error.message : '文件上传失败'
    )
  }
}
