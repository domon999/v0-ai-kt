import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

// 获取所有配置
export async function GET() {
  try {
    const supabase = await createClient()

    // 验证管理员权限
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const { data: configs, error } = await supabase
      .from('minimax_voice_configs')
      .select('*')
      .order('priority', { ascending: true })

    if (error) {
      return ApiResponseHelper.serverError('获取配置失败: ' + error.message)
    }

    return ApiResponseHelper.success(configs)
  } catch (error) {
    console.error('[v0] Get MiniMax configs error:', error)
    return ApiResponseHelper.serverError('获取配置失败')
  }
}

// 添加新配置
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] POST /api/admin/minimax-config - Start')
    
    const supabase = await createClient()

    // 验证管理员权限
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    console.log('[v0] User auth check:', { hasUser: !!user })
    
    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    console.log('[v0] Admin check:', { isAdmin: profile?.is_admin })

    if (!profile?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const body = await request.json()
    const { config_name, group_id, api_key, priority } = body

    console.log('[v0] Request body:', { 
      config_name, 
      group_id, 
      hasApiKey: !!api_key,
      priority 
    })

    if (!config_name || !api_key) {
      console.log('[v0] Validation failed - missing required fields')
      return ApiResponseHelper.validationError('缺少必填字段')
    }

    console.log('[v0] Attempting to insert config...')

    const { data, error } = await supabase
      .from('minimax_voice_configs')
      .insert({
        provider: config_name,
        group_id,
        api_key,
        priority: priority || 1,
        enabled: true,
      })
      .select()
      .single()

    console.log('[v0] Insert result:', { 
      success: !error, 
      hasData: !!data,
      error: error ? { message: error.message, code: error.code } : null
    })

    if (error) {
      console.error('[v0] Database error:', error)
      return ApiResponseHelper.serverError('添加配置失败: ' + error.message)
    }

    console.log('[v0] Config saved successfully:', { id: data.id })
    return ApiResponseHelper.success(data, '配置添加成功')
  } catch (error) {
    console.error('[v0] Add MiniMax config error:', error)
    return ApiResponseHelper.serverError('添加配置失败')
  }
}

// 更新配置
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证管理员权限
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const body = await request.json()
    const { id, config_name, group_id, api_key, priority, enabled } = body

    if (!id) {
      return ApiResponseHelper.validationError('缺少配置 ID')
    }

    const updateData: any = { updated_at: new Date().toISOString() }

    if (config_name !== undefined) updateData.provider = config_name
    if (group_id !== undefined) updateData.group_id = group_id
    if (api_key !== undefined && api_key !== '') updateData.api_key = api_key
    if (priority !== undefined) updateData.priority = priority
    if (enabled !== undefined) updateData.enabled = enabled

    const { data, error } = await supabase
      .from('minimax_voice_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return ApiResponseHelper.serverError('更新配置失败: ' + error.message)
    }

    return ApiResponseHelper.success(data, '配置更新成功')
  } catch (error) {
    console.error('[v0] Update MiniMax config error:', error)
    return ApiResponseHelper.serverError('更新配置失败')
  }
}

// 删除配置
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证管理员权限
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponseHelper.unauthorized('请先登录')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return ApiResponseHelper.forbidden('需要管理员权限')
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return ApiResponseHelper.validationError('缺少配置 ID')
    }

    const { error } = await supabase
      .from('minimax_voice_configs')
      .delete()
      .eq('id', id)

    if (error) {
      return ApiResponseHelper.serverError('删除配置失败: ' + error.message)
    }

    return ApiResponseHelper.success(null, '配置删除成功')
  } catch (error) {
    console.error('[v0] Delete MiniMax config error:', error)
    return ApiResponseHelper.serverError('删除配置失败')
  }
}
