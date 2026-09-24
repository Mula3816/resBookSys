import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, MapPin, Clock, Users } from 'lucide-react';
import restaurantService from '../../services/restaurantService';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card, { CardContent, CardHeader } from '../atoms/Card';
import toast from 'react-hot-toast';

const RestaurantForm = ({ restaurant, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  // Limpiar la imagen inicial si es [object Object]
  const initialImage = restaurant?.image && restaurant.image !== '[object Object]' ? restaurant.image : '';
  const [imagePreview, setImagePreview] = useState(initialImage);
  const [imageFile, setImageFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: restaurant?.name || '',
      cuisine_type: restaurant?.cuisine_type || '',
      description: restaurant?.description || '',
      address: restaurant?.address || '',
      phone: restaurant?.phone || '',
      email: restaurant?.email || '',
      opening_time: restaurant?.opening_time || '',
      closing_time: restaurant?.closing_time || '',
      capacity: restaurant?.capacity || '',
      rating: restaurant?.rating || '',
      image: initialImage,
      status: restaurant?.status || 'active'
    }
  });

  // value 必须与后端枚举白名单一致（backend/routes/restaurants.js，已本地化为中文）
  const cuisineTypes = [
    { value: '秘鲁菜', label: '秘鲁菜' },
    { value: '日料', label: '日料' },
    { value: '意大利菜', label: '意大利菜' },
    { value: '法餐', label: '法餐' },
    { value: '墨西哥菜', label: '墨西哥菜' },
    { value: '西班牙菜', label: '西班牙菜' },
    { value: '中餐', label: '中餐' },
    { value: '泰餐', label: '泰餐' },
    { value: '国际融合菜', label: '国际融合菜' },
    { value: '素食', label: '素食' },
    { value: '印度菜', label: '印度菜' },
    { value: '美式', label: '美式' },
    { value: '地中海菜', label: '地中海菜' },
    { value: '融合菜', label: '融合菜' }
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Si hay un archivo de imagen, lo procesamos
      if (imageFile) {
        // Para archivos, necesitamos usar FormData
        const formData = new FormData();
        
        // Agregar todos los campos del formulario
        Object.keys(data).forEach(key => {
          if (key !== 'image') {
            formData.append(key, data[key]);
          }
        });
        
        // Agregar el archivo de imagen
        formData.append('image', imageFile);
        
        if (restaurant) {
          try {
            const response = await restaurantService.update(restaurant.id, formData);
          } catch (error) {
            console.error('PUT 请求出错:', error);
            throw error;
          }
        } else {
          try {
            const response = await restaurantService.create(formData);
          } catch (error) {
            console.error('POST 请求出错:', error);
            throw error;
          }
        }
      } else {
        // Si no hay archivo nuevo, enviar los datos normalmente
        // pero incluir la URL de la imagen existente si hay una
        if (imagePreview && !imagePreview.startsWith('data:')) {
          data.image = imagePreview;
        } else if (!imagePreview) {
          // Si no hay vista previa, limpiar el campo de imagen
          data.image = '';
        }
        
        if (restaurant) {
          await restaurantService.update(restaurant.id, data);
        } else {
          await restaurantService.create(data);
        }
      }
      
      toast.success(`餐厅${restaurant ? '更新' : '创建'}成功`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存餐厅失败:', error);
      
      // Mostrar errores específicos del backend
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        backendErrors.forEach(err => {
          toast.error(`${err.msg || err.message}`);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('保存餐厅失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
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
            {restaurant ? '编辑餐厅' : '添加餐厅'}
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
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="餐厅名称 *"
                  placeholder="例如：全聚德"
                  {...register('name', {
                    required: '请输入名称',
                    minLength: {
                      value: 2,
                      message: '名称至少需要 2 个字符'
                    }
                  })}
                  error={errors.name?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  菜系 *
                </label>
                <select
                  {...register('cuisine_type', { required: '请选择菜系' })}
                  className="input"
                >
                  <option value="">请选择类型...</option>
                  {cuisineTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.cuisine_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.cuisine_type.message}</p>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述 *
              </label>
              <textarea
                {...register('description', {
                  required: '请输入描述',
                  minLength: {
                    value: 10,
                    message: '描述至少需要 10 个字符'
                  },
                  maxLength: {
                    value: 1000,
                    message: '描述不能超过 1000 个字符'
                  }
                })}
                rows={4}
                placeholder="请描述餐厅的招牌菜、环境等（至少 10 个字符）"
                className="input min-h-[100px] resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="地址 *"
                  placeholder="中山路 123 号"
                  {...register('address', {
                    required: '请输入地址',
                    minLength: {
                      value: 10,
                      message: '地址至少需要 10 个字符'
                    },
                    maxLength: {
                      value: 200,
                      message: '地址不能超过 200 个字符'
                    }
                  })}
                  error={errors.address?.message}
                />
              </div>

              <div>
                <Input
                  label="电话 *"
                  placeholder="010-12345678"
                  {...register('phone', {
                    required: '请输入电话',
                    minLength: {
                      value: 10,
                      message: '电话至少需要 10 个字符'
                    },
                    maxLength: {
                      value: 20,
                      message: '电话不能超过 20 个字符'
                    }
                  })}
                  error={errors.phone?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="邮箱 *"
                  type="email"
                  placeholder="contact@restaurant.com"
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
                  label="容量 *"
                  type="number"
                  placeholder="50"
                  {...register('capacity', {
                    required: '请输入容量',
                    min: {
                      value: 1,
                      message: '容量至少为 1'
                    },
                    max: {
                      value: 500,
                      message: '容量不能超过 500'
                    }
                  })}
                  error={errors.capacity?.message}
                />
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-2" />
                  营业开始时间 *
                </label>
                <select
                  {...register('opening_time', { required: '请选择营业开始时间' })}
                  className="input"
                >
                  <option value="">请选择...</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                {errors.opening_time && (
                  <p className="text-red-500 text-sm mt-1">{errors.opening_time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-2" />
                  营业结束时间 *
                </label>
                <select
                  {...register('closing_time', { required: '请选择营业结束时间' })}
                  className="input"
                >
                  <option value="">请选择...</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                {errors.closing_time && (
                  <p className="text-red-500 text-sm mt-1">{errors.closing_time.message}</p>
                )}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                评分（1-5）
              </label>
              <select
                {...register('rating', {
                  min: { value: 1, message: '评分最低为 1' },
                  max: { value: 5, message: '评分最高为 5' }
                })}
                className="input"
                step="0.1"
              >
                <option value="">请选择评分...</option>
                {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
              {errors.rating && (
                <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>
              )}
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline h-4 w-4 mr-2" />
                餐厅图片
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
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm">点击上传图片</span>
                      </div>
                    )}
                  </label>
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    删除图片
                  </button>
                )}
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                {...register('status')}
                className="input"
              >
                <option value="active">营业中</option>
                <option value="inactive">已停业</option>
              </select>
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
                {restaurant ? '更新' : '创建'}餐厅
              </Button>
            </div>
          </form>
        </CardContent>
      </div>
    </div>
  );
};

export default RestaurantForm;
