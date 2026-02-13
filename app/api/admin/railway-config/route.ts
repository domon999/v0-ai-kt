import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

/**
 * GET /api/admin/railway-config
 * 获取所有 Railway 配置
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    // 检查管理员权限
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const { data: configs, error } = await supabase
      .from('railway_config')
      .select('*')
      .order('priority', { ascending: true })

    if (error) {
      return ApiResponseHelper.serverError('获取配置失败')
    }

    return ApiResponseHelper.success(configs || [])
  } catch (error) {
    console.error('[v0] Get Railway configs error:', error)
    return ApiResponseHelper.serverError('获取配置失败')
  }
}

/**
 * POST /api/admin/railway-config
 * 添加新的 Railway 配置
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    // 检查管理员权限
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const body = await request.json()
    const { config_name, api_base_url, api_key, priority = 1 } = body

    if (!config_name || !api_base_url || !api_key) {
      return ApiResponseHelper.validationError('请填写所有必填字段')
    }

    const { data, error } = await supabase
      .from('railway_config')
      .insert({
        config_name,
        api_base_url,
        api_key,
        priority,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Insert Railway config error:', error)
      return ApiResponseHelper.serverError('添加配置失败')
    }

    return ApiResponseHelper.success(data, '配置添加成功')
  } catch (error) {
    console.error('[v0] Add Railway config error:', error)
    return ApiResponseHelper.serverError('添加配置失败')
  }
}

/**
 * PATCH /api/admin/railway-config
 * 更新 Railway 配置
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    // 检查管理员权限
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return ApiResponseHelper.validationError('缺少配置ID')
    }

    const { data, error } = await supabase
      .from('railway_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Update Railway config error:', error)
      return ApiResponseHelper.serverError('更新配置失败')
    }

    return ApiResponseHelper.success(data, '配置更新成功')
  } catch (error) {
    console.error('[v0] Update Railway config error:', error)
    return ApiResponseHelper.serverError('更新配置失败')
  }
}

/**
 * DELETE /api/admin/railway-config
 * 删除 Railway 配置
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    // 检查管理员权限
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return ApiResponseHelper.validationError('缺少配置ID')
    }

    const { error } = await supabase
      .from('railway_config')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[v0] Delete Railway config error:', error)
      return ApiResponseHelper.serverError('删除配置失败')
    }

    return ApiResponseHelper.success(null, '配置删除成功')
  } catch (error) {
    console.error('[v0] Delete Railway config error:', error)
    return ApiResponseHelper.serverError('删除配置失败')
  }
}
