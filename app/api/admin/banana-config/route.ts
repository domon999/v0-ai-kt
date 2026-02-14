import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiResponseHelper } from '@/lib/utils/api-response'

// 获取所有 Banana 配置
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
      return ApiResponseHelper.unauthorized('需要管理员权限')
    }

    // 获取所有配置
    const { data: configs, error } = await supabase
      .from('banana_config')
      .select('*')
      .order('priority', { ascending: true })

    if (error) {
      return ApiResponseHelper.serverError('获取配置失败')
    }

    return ApiResponseHelper.success({ configs })
  } catch (error) {
    console.error('[v0] Get Banana configs error:', error)
    return ApiResponseHelper.serverError('服务器错误')
  }
}

// 新增 Banana 配置
export async function POST(req: NextRequest) {
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
      return ApiResponseHelper.unauthorized('需要管理员权限')
    }

    const body = await req.json()
    const { config_name, api_key, base_url, model_key, priority, notes } = body

    // 验证必填字段
    if (!config_name || !api_key || !base_url) {
      return ApiResponseHelper.validationError('配置名称、API Key 和 Base URL 是必填项')
    }

    // 插入新配置
    const { data, error } = await supabase
      .from('banana_config')
      .insert({
        config_name,
        api_key,
        base_url: base_url || 'https://www.blueshirtmap.com/v1/chat/completions',
        model_key: model_key || 'gemini-3-pro-image-preview',
        priority: priority || 1,
        notes: notes || '',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return ApiResponseHelper.serverError(`添加配置失败: ${error.message}`)
    }

    return ApiResponseHelper.success({ config: data }, '配置添加成功')
  } catch (error) {
    console.error('[v0] Create Banana config error:', error)
    return ApiResponseHelper.serverError('服务器错误')
  }
}

// 更新 Banana 配置
export async function PATCH(req: NextRequest) {
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
      return ApiResponseHelper.unauthorized('需要管理员权限')
    }

    const body = await req.json()
    const { id, config_name, api_key, base_url, model_key, priority, notes, is_active } = body

    if (!id) {
      return ApiResponseHelper.validationError('配置 ID 是必填项')
    }

    // 更新配置
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (config_name !== undefined) updateData.config_name = config_name
    if (api_key !== undefined) updateData.api_key = api_key
    if (base_url !== undefined) updateData.base_url = base_url
    if (model_key !== undefined) updateData.model_key = model_key
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('banana_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return ApiResponseHelper.serverError(`更新配置失败: ${error.message}`)
    }

    return ApiResponseHelper.success({ config: data }, '配置更新成功')
  } catch (error) {
    console.error('[v0] Update Banana config error:', error)
    return ApiResponseHelper.serverError('服务器错误')
  }
}

// 删除 Banana 配置
export async function DELETE(req: NextRequest) {
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
      return ApiResponseHelper.unauthorized('需要管理员权限')
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return ApiResponseHelper.validationError('配置 ID 是必填项')
    }

    const { error } = await supabase
      .from('banana_config')
      .delete()
      .eq('id', id)

    if (error) {
      return ApiResponseHelper.serverError(`删除配置失败: ${error.message}`)
    }

    return ApiResponseHelper.success({}, '配置删除成功')
  } catch (error) {
    console.error('[v0] Delete Banana config error:', error)
    return ApiResponseHelper.serverError('服务器错误')
  }
}
