import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin, Clock, Users, X } from 'lucide-react';
import restaurantService from '../services/restaurantService';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Card, { CardContent, CardHeader } from '../components/atoms/Card';
import Badge from '../components/atoms/Badge';
import { formatCurrency } from '../utils/helpers';

const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    cuisine_type: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  const cuisineTypes = [
  { name: '秘鲁菜', icon: '🦞' },
  { name: '日料', icon: '🍱' },
  { name: '意大利菜', icon: '🍝' },
  { name: '法餐', icon: '🥐' },
  { name: '墨西哥菜', icon: '🌮' },
  { name: '西班牙菜', icon: '🥘' },
  { name: '中餐', icon: '🥡' },
  { name: '泰餐', icon: '🍜' },
  { name: '国际融合菜', icon: '🍽️' },
  { name: '素食', icon: '🥗' },
  { name: '印度菜', icon: '🍛' },
  { name: '美式', icon: '🍔' },
  { name: '地中海菜', icon: '🫒' },
  { name: '融合菜', icon: '🍴' }
];

  // 搜索防抖
  const [searchDebounce, setSearchDebounce] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchDebounce, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchDebounce]);

  useEffect(() => {
    fetchRestaurants();
  }, [filters]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
      // 正确构建查询参数
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params[key] = value;
        }
      });

      const response = await restaurantService.getAll(params);
      setRestaurants(response.restaurants);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchDebounce(value);
  };

  const handleCuisineFilter = (cuisine) => {
    setFilters(prev => ({ 
      ...prev, 
      cuisine_type: cuisine === prev.cuisine_type ? '' : cuisine,
      page: 1 
    }));
  };

  const clearFilters = () => {
    setSearchDebounce('');
    setFilters({ search: '', cuisine_type: '', page: 1, limit: 12 });
  };

  const hasActiveFilters = filters.search || filters.cuisine_type;

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          优质餐厅
        </h1>
        <p className="text-gray-600">
          发现城中最好的餐厅
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="按名称、类型或描述搜索餐厅..."
              value={searchDebounce}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              data-testid="restaurants-search"
            />
            {searchDebounce && (
              <button
                onClick={() => setSearchDebounce('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>清除筛选</span>
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">已应用的筛选条件：</span>
            {filters.search && (
              <Badge variant="default" className="flex items-center space-x-1">
                <span>搜索："{filters.search}"</span>
                <button
                  onClick={() => setSearchDebounce('')}
                  className="ml-1 hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.cuisine_type && (
              <Badge variant="default" className="flex items-center space-x-1">
                <span>{filters.cuisine_type}</span>
                <button
                  onClick={() => handleCuisineFilter(filters.cuisine_type)}
                  className="ml-1 hover:text-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Cuisine Types */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            <span>按菜系筛选：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cuisineTypes.map((cuisine) => (
              <button
                key={cuisine.name}
                onClick={() => handleCuisineFilter(cuisine.name)}
                data-testid={`cuisine-${cuisine.name}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 flex items-center space-x-2 ${
                  filters.cuisine_type === cuisine.name
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{cuisine.icon}</span>
                <span>{cuisine.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {!loading && restaurants.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {pagination && (
              <span>
                显示 {restaurants.length} / {pagination.total} 家餐厅
                {hasActiveFilters && '（已应用筛选条件）'}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              清除筛选
            </Button>
          )}
        </div>
      )}

      {/* Restaurants Grid */}
      {loading && restaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-gray-500">
            正在搜索餐厅...
          </div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {hasActiveFilters
              ? '没有找到符合所选筛选条件的餐厅'
              : '暂无可用餐厅'
            }
          </div>
          {hasActiveFilters && (
            <Button onClick={clearFilters}>
              清除筛选
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} data-testid={`restaurant-card-${restaurant.id}`} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div 
                  className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 relative"
                  onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                >
                  {restaurant.image && restaurant.image !== '[object Object]' && restaurant.image.trim() !== '' && (
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge status={restaurant.status}>
                      {restaurant.status === 'active' ? '营业中' : '已停业'}
                    </Badge>
                  </div>
                </div>
                
                <CardContent>
                  <CardHeader className="pt-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{restaurant.rating}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {restaurant.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{restaurant.address}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>可容纳 {restaurant.capacity} 人</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{restaurant.opening_time} - {restaurant.closing_time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="default">
                        {restaurant.cuisine_type}
                      </Badge>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                上一页
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
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
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantsPage;
