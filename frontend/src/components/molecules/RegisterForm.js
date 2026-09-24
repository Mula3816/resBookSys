import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import toast from 'react-hot-toast';

const RegisterForm = () => {
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('提交注册数据:', data);
      
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone
      });
      
      console.log('注册结果:', result);

      if (result.success) {
        toast.success('账号创建成功！');
        navigate('/');
      } else {
        console.error('注册失败:', result.error);
        toast.error(result.error || '创建账号失败');
      }
    } catch (error) {
      console.error('注册时发生意外错误:', error);
      toast.error('创建账号时发生意外错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Input
            label="姓名"
            type="text"
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
            label="邮箱"
            type="email"
            placeholder="your@email.com"
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

        <div>
          <Input
            label="电话（选填）"
            type="tel"
            placeholder="13800000000"
            {...register('phone', {
              // 选填字段：空值直接通过，仅在有输入时校验格式
              validate: (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value) || '电话格式不正确'
            })}
            error={errors.phone?.message}
          />
        </div>

        <div>
          <Input
            label="密码"
            type="password"
            placeholder="••••••••"
            {...register('password', {
              required: '请输入密码',
              minLength: {
                value: 6,
                message: '密码至少需要 6 个字符'
              }
            })}
            error={errors.password?.message}
          />
        </div>

        <div>
          <Input
            label="确认密码"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword', {
              required: '请确认密码',
              validate: value => value === password || '两次输入的密码不一致'
            })}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
        >
          创建账号
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            已有账号？{' '}
            <Link
              to="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              立即登录
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
