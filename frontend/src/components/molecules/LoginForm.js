import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success('欢迎回来！');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Input
            label="邮箱"
            type="email"
            placeholder="your@email.com"
            data-testid="login-email"
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
            label="密码"
            type="password"
            placeholder="••••••••"
            data-testid="login-password"
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

        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={loading}
          data-testid="login-submit"
        >
          登录
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            还没有账号？{' '}
            <Link
              to="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              立即注册
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
