import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Users, MapPin } from 'lucide-react';
import tableService from '../../services/tableService';
import restaurantService from '../../services/restaurantService';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card, { CardContent, CardHeader } from '../atoms/Card';
import Badge from '../atoms/Badge';
import toast from 'react-hot-toast';

const TableForm = ({ table, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [imagePreview, setImagePreview] = useState(table?.image || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      restaurant_id: table?.restaurant_id || '',
      table_number: table?.table_number || '',
      capacity: table?.capacity || '',
      min_capacity: table?.min_capacity || 1,
      table_type: table?.table_type || 'standard',
      location: table?.location || '',
      status: table?.status || 'available'
    }
  });

  const tableTypes = [
    { value: 'standard', label: '标准' },
    { value: 'vip', label: 'VIP' },
    { value: 'private', label: '包间' },
    { value: 'outdoor', label: '户外' }
  ];

  const locations = [
    { value: '室内', label: '室内' },
    { value: '露台', label: '露台' },
    { value: '包间', label: '包间' },
    { value: '吧台', label: '吧台' },
    { value: '花园', label: '花园' },
    { value: '铁板烧', label: '铁板烧' },
    { value: '榻榻米', label: '榻榻米' },
    { value: '果汁吧', label: '果汁吧' },
    { value: '宴会厅', label: '宴会厅' },
    { value: '休息区', label: '休息区' }
  ];

  React.useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantService.getAll({ limit: 100 });
        setRestaurants(response.restaurants);
      } catch (error) {
        console.error('获取餐厅列表失败:', error);
      }
    };

    fetchRestaurants();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (table) {
        await tableService.update(table.id, data);
        toast.success('桌台更新成功');
      } else {
        await tableService.create(data);
        toast.success('桌台创建成功');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('保存桌台失败:', error);

      // Mostrar errores específicos del backend
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        backendErrors.forEach(err => {
          toast.error(`${err.msg || err.message}`);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('保存桌台失败');
      }
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
            {table ? '编辑桌台' : '添加桌台'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  餐厅 *
                </label>
                <select
                  {...register('restaurant_id', { required: '请选择餐厅' })}
                  className="input"
                >
                  <option value="">请选择餐厅...</option>
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
                {errors.restaurant_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.restaurant_id.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="桌台编号 *"
                  placeholder="M1、M2 等"
                  {...register('table_number', {
                    required: '请输入桌台编号',
                    pattern: {
                      value: /^[A-Z0-9]+$/i,
                      message: '仅允许字母和数字'
                    }
                  })}
                  error={errors.table_number?.message}
                />
              </div>
            </div>

            {/* Capacidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="容量 *"
                  type="number"
                  placeholder="4"
                  {...register('capacity', {
                    required: '请输入容量',
                    min: {
                      value: 1,
                      message: '容量至少为 1'
                    },
                    max: {
                      value: 20,
                      message: '容量不能超过 20'
                    }
                  })}
                  error={errors.capacity?.message}
                />
              </div>

              <div>
                <Input
                  label="最小容量"
                  type="number"
                  placeholder="1"
                  {...register('min_capacity', {
                    required: '请输入最小容量',
                    min: {
                      value: 1,
                      message: '最小容量至少为 1'
                    },
                    max: {
                      value: 20,
                      message: '最小容量不能超过 20'
                    }
                  })}
                  error={errors.min_capacity?.message}
                />
              </div>
            </div>

            {/* Tipo y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  桌台类型 *
                </label>
                <select
                  {...register('table_type', { required: '请选择桌台类型' })}
                  className="input"
                >
                  <option value="">请选择类型...</option>
                  {tableTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.table_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.table_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  位置 *
                </label>
                <select
                  {...register('location', { required: '请选择位置' })}
                  className="input"
                >
                  <option value="">请选择位置...</option>
                  {locations.map(location => (
                    <option key={location.value} value={location.value}>{location.label}</option>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline h-4 w-4 mr-2" />
                桌台图片
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
                    onClick={() => setImagePreview('')}
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
                <option value="available">可用</option>
                <option value="unavailable">不可用</option>
                <option value="maintenance">维护中</option>
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
                {table ? '更新' : '创建'}桌台
              </Button>
            </div>
          </form>
        </CardContent>
      </div>
    </div>
  );
};

export default TableForm;
