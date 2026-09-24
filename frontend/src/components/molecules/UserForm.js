import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Mail, Phone, User, Shield } from 'lucide-react';
import userService from '../../services/userService';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card, { CardContent, CardHeader } from '../atoms/Card';
import Badge from '../atoms/Badge';
import toast from 'react-hot-toast';

const UserForm = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(user?.image || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role: user?.role || 'client',
      password: '',
      confirmPassword: ''
    }
  });

  const roles = [
    { value: 'admin', label: '管理员' },
    { value: 'manager', label: '经理' },
    { value: 'client', label: '客户' }
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (user) {
        // Solo enviar los campos permitidos para actualizar
        const updateData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role
        };
        
        if (data.password) {
          updateData.password = data.password;
        }
        
        await userService.update(user.id, updateData);
        toast.success('用户更新成功');
      } else {
        // Para nuevos usuarios, siempre requerir contraseña
        if (!data.password) {
          toast.error('新用户必须设置密码');
          setLoading(false);
          return;
        }

        await userService.create(data);
        toast.success('用户创建成功');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存用户失败:', error);
      toast.error('保存用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? '编辑用户' : '添加用户'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="姓名 *"
                  placeholder="张三"
                  {...register('name', {
                    required: '请输入姓名',
                    minLength: {
                      value: 2,
                      message: '姓名至少需要 2 个字符'
                    }
                  })}
                  error={errors.name?.message}
                />
              </div>

              <div>
                <Input
                  label="邮箱 *"
                  type="email"
                  placeholder="user@example.com"
                  {...register('email', {
                    required: '请输入邮箱',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: '邮箱格式不正确'
                    }
                  })}
                  error={errors.email?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="电话"
                  placeholder="13800000000"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="inline h-4 w-4 mr-2" />
                  角色 *
                </label>
                <select
                  {...register('role', { required: '请选择角色' })}
                  className="input"
                >
                  <option value="">请选择角色...</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                )}
              </div>
            </div>

            {/* Contraseñas - solo mostrar si es nuevo usuario o si se quiere cambiar */}
            <div className="space-y-6">
              <div>
                <Input
                  label={user ? "新密码（留空则保持不变）" : "密码 *"}
                  type="password"
                  placeholder="•••••••••"
                  {...register('password', {
                    required: user ? false : '请输入密码',
                    minLength: {
                      value: 6,
                      message: '密码至少需要 6 个字符'
                    }
                  })}
                  error={errors.password?.message}
                />
              </div>

              {(user?.password || !user) && (
                <div>
                  <Input
                    label="确认密码 *"
                    type="password"
                    placeholder="•••••••••"
                    {...register('confirmPassword', {
                      required: user ? false : '请确认密码',
                      validate: (value) => {
                        const password = document.querySelector('input[name="password"]').value;
                        return value === password || '两次输入的密码不一致';
                      }
                    })}
                  error={errors.confirmPassword?.message}
                  />
                </div>
              )}
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline h-4 w-4 mr-2" />
                头像
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <User className="h-8 w-8 mb-2" />
                        <span className="text-sm">点击上传图片</span>
                      </div>
                    )}
                  </label>
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    删除图片
                  </button>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loading}
              >
                {user ? '更新' : '创建'}用户
              </Button>
            </div>
          </form>
        </CardContent>
      </div>
    </div>
  );
};

export default UserForm;
