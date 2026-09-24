import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  ArrowLeft,
  Utensils,
  Check
} from 'lucide-react';
import restaurantService from '../services/restaurantService';
import Button from '../components/atoms/Button';
import Card, { CardContent, CardHeader } from '../components/atoms/Card';
import Badge from '../components/atoms/Badge';
import { formatDate, formatTime, normalizeDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const RestaurantDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const response = await restaurantService.getById(id);
      setRestaurant(response);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('加载餐厅信息失败');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!selectedDate) {
      toast.error('请选择日期');
      return;
    }

    try {
      setLoadingAvailability(true);
      const response = await restaurantService.getAvailability(id, selectedDate, partySize);
      setAvailability(response);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('查询可订时段失败');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleBooking = () => {
    if (!user) {
      toast.error('请先登录后再进行预订');
      navigate('/auth/login');
      return;
    }

    if (!selectedDate || !availability) {
      toast.error('请先查询可订时段');
      return;
    }

    // 规范化日期，避免时区问题
    const normalizedDate = normalizeDate(selectedDate);
    console.log('Fecha seleccionada original:', selectedDate);
    console.log('Fecha normalizada para reserva:', normalizedDate);

    navigate(`/booking/${id}`, {
      state: {
        restaurant,
        date: normalizedDate,
        partySize,
        availability
      }
    });
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            未找到该餐厅
          </h2>
          <Button onClick={() => navigate('/restaurants')}>
            返回餐厅列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/restaurants')}
        className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>返回餐厅列表</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {restaurant.name}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-semibold">{restaurant.rating}</span>
                  </div>
                  <Badge status={restaurant.status}>
                    {restaurant.status === 'active' ? '营业中' : '已停业'}
                  </Badge>
                  <Badge variant="default">
                    {restaurant.cuisine_type}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-lg">
              {restaurant.description}
            </p>
          </div>

          {/* Image */}
          <div className="h-64 md:h-96 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl overflow-hidden">
            {restaurant.image && restaurant.image !== '[object Object]' && restaurant.image.trim() !== '' ? (
              <img 
                src={restaurant.image} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Utensils className="h-16 w-16 text-white opacity-50" />
              </div>
            )}
          </div>

          {/* Restaurant Info */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">
                餐厅信息
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">地址</p>
                      <p className="text-gray-600">{restaurant.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">电话</p>
                      <p className="text-gray-600">{restaurant.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">营业时间</p>
                      <p className="text-gray-600">
                        {restaurant.opening_time} - {restaurant.closing_time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">容量</p>
                      <p className="text-gray-600">可容纳 {restaurant.capacity} 人</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tables */}
          {restaurant.tables && restaurant.tables.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900">
                  可用桌台
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {restaurant.tables.map((table) => (
                    <div key={table.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          桌台 {table.table_number}
                        </span>
                        <Badge status={table.status}>
                          {table.status === 'available' ? '可用' : '已占用'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>容量：可容纳 {table.capacity} 人</p>
                        {table.location && <p>位置：{table.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">
                预订桌台
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  人数
                </label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value))}
                  className="input"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>
                      {num} 人
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={checkAvailability}
                disabled={loadingAvailability || !selectedDate}
                loading={loadingAvailability}
                className="w-full"
              >
                查询可订时段
              </Button>

              {availability && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-800 mb-2">
                      {formatDate(selectedDate)} 可订时段
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availability.availability
                        .filter(slot => slot.available)
                        .slice(0, 6)
                        .map((slot, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{formatTime(slot.time)}</span>
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleBooking}
                    className="w-full"
                    disabled={!user}
                  >
                    {user ? '继续预订' : '登录后预订'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetailPage;
