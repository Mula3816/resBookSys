import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import restaurantService from '../../services/restaurantService';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Card, { CardContent, CardHeader } from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import RestaurantForm from '../../components/molecules/RestaurantForm';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const AdminRestaurants = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cuisine_type: '',
    status: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const reset = (values) => {
    setFilters(values);
  };

  useEffect(() => {
    fetchRestaurants();
  }, [filters]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      // 商家只能看到自己名下的餐厅
      const params = user?.role === 'merchant'
        ? { ...filters, owner_id: user.id }
        : filters;
      const response = await restaurantService.getAll(params);
      setRestaurants(response.restaurants);
      setPagination(response.pagination);
    } catch (error) {
      console.error('加载餐厅失败:', error);
      toast.error('加载餐厅失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这家餐厅吗？')) {
      return;
    }

    try {
      await restaurantService.delete(id);
      toast.success('餐厅删除成功');
      fetchRestaurants();
    } catch (error) {
      console.error('删除餐厅失败:', error);
      toast.error('删除餐厅失败');
    }
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingRestaurant(null);
    setShowModal(true);
  };

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

  if (loading && restaurants.length === 0) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            餐厅
          </h1>
          <p className="text-gray-600">
            管理系统中的所有餐厅
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          添加餐厅
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="搜索餐厅..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            <select
              value={filters.cuisine_type}
              onChange={(e) => setFilters(prev => ({ ...prev, cuisine_type: e.target.value, page: 1 }))}
              className="input"
            >
              <option value="">全部菜系</option>
              {cuisineTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="input"
            >
              <option value="">全部状态</option>
              <option value="active">营业中</option>
              <option value="inactive">已停业</option>
            </select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants List */}
      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未找到餐厅
            </h3>
            <p className="text-gray-600 mb-4">
              先添加第一家餐厅吧
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              添加餐厅
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {restaurant.name}
                        </h3>
                        <Badge status={restaurant.status}>
                          {restaurant.status === 'active' ? '营业中' : '已停业'}
                        </Badge>
                        <Badge variant="default">
                          {restaurant.cuisine_type}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {restaurant.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">地址</p>
                          <p className="font-medium">{restaurant.address}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">电话</p>
                          <p className="font-medium">{restaurant.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">容量</p>
                          <p className="font-medium">{restaurant.capacity} 人</p>
                        </div>
                        <div>
                          <p className="text-gray-500">营业时间</p>
                          <p className="font-medium">
                            {restaurant.opening_time} - {restaurant.closing_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>评分：{restaurant.rating}</span>
                        <span>桌台：{restaurant.tables?.length || 0}</span>
                        <span>创建于：{new Date(restaurant.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(restaurant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(restaurant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
              >
                上一页
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setFilters(prev => ({ ...prev, page }))}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal para crear/editar restaurante */}
      {showModal && (
        <RestaurantForm
          restaurant={editingRestaurant}
          onClose={() => {
            setShowModal(false);
            setEditingRestaurant(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingRestaurant(null);
            fetchRestaurants();
            reset({
              search: filters.search,
              cuisine_type: filters.cuisine_type,
              status: filters.status,
              page: 1,
              limit: 12
            });
          }}
        />
      )}
    </div>
  );
};

export default AdminRestaurants;
