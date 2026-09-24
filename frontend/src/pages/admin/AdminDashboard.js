import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Calendar, TrendingUp, TrendingDown, 
  Clock, DollarSign, Star, AlertCircle,
  CheckCircle, XCircle, Activity, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import reservationService from '../../services/reservationService';
import userService from '../../services/userService';
import restaurantService from '../../services/restaurantService';
import Card, { CardContent, CardHeader } from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import Button from '../../components/atoms/Button';
import { formatCurrency, debounce } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalRestaurants: 0,
    activeRestaurants: 0,
    monthlyRevenue: 0,
    averageRating: 0
  });
  const [changes, setChanges] = useState({
    totalReservations: 0,
    activeReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    totalUsers: 0,
    activeRestaurants: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentReservations, setRecentReservations] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  
  // Estado para el selector de fechas
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Función para obtener datos del dashboard con useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Formatear fechas para la API
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      console.log(`获取统计数据区间：${firstDay} - ${lastDay}`);
      
      // Obtener estadísticas generales con fechas específicas
      // 用户统计为管理员专属接口：商家不调用（403），用 0 占位
      const [reservationStats, userStats, restaurantStats] = await Promise.all([
        reservationService.getStats({ date_from: firstDay, date_to: lastDay }),
        user?.role === 'admin'
          ? userService.getStats({ date_from: firstDay, date_to: lastDay })
          : Promise.resolve({ total: 0, active: 0 }),
        // 商家：餐厅统计只统计自己名下的店
        restaurantService.getStats(user?.role === 'merchant' ? { owner_id: user.id } : {})
      ]);

      setStats({
        totalReservations: reservationStats.total || 0,
        activeReservations: reservationStats.confirmed || 0,
        completedReservations: reservationStats.completed || 0,
        cancelledReservations: reservationStats.cancelled || 0,
        totalUsers: userStats.total || 0,
        activeUsers: userStats.active || 0,
        totalRestaurants: restaurantStats.total || 0,
        activeRestaurants: restaurantStats.active || 0,
        monthlyRevenue: reservationStats.revenue || 0,
        averageRating: restaurantStats.averageRating || 0
      });

      // Establecer cambios dinámicos
      if (reservationStats.changes) {
        setChanges({
          totalReservations: reservationStats.changes.total || 0,
          activeReservations: reservationStats.changes.confirmed || 0,
          completedReservations: reservationStats.changes.completed || 0,
          cancelledReservations: reservationStats.changes.cancelled || 0,
          totalUsers: reservationStats.changes.totalUsers || 0,
          activeRestaurants: 0, // No hay cambio para restaurantes activos
          monthlyRevenue: reservationStats.changes.revenue || 0
        });
      }

      // Obtener reservas recientes
      const recentResponse = await reservationService.getAll({
        limit: 5,
        sort: 'created_at',
        order: 'DESC'
      });
      setRecentReservations(recentResponse.reservations || []);

      // Obtener restaurantes top（商家只看自己的店）
      const topResponse = await restaurantService.getAll({
        limit: 5,
        sort: 'rating',
        order: 'DESC',
        ...(user?.role === 'merchant' ? { owner_id: user.id } : {})
      });
      setTopRestaurants(topResponse.restaurants || []);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      toast.error('加载仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  // Funciones para navegación de meses
  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Escuchar eventos de pago para actualizar el dashboard en tiempo real
    const handlePaymentRegistered = (event) => {
      console.log('支付已登记，正在刷新仪表盘:', event.detail);
      fetchDashboardData(); // Refrescar todos los datos cuando se registra un pago
    };
    
    window.addEventListener('payment-registered', handlePaymentRegistered);
    
    return () => {
      window.removeEventListener('payment-registered', handlePaymentRegistered);
    };
  }, [fetchDashboardData]);

  const StatCard = ({ icon: Icon, title, value, change, changeType, color = 'blue' }) => {
    const getChangeType = (changeValue) => {
      if (changeValue > 0) return 'increase';
      if (changeValue < 0) return 'decrease';
      return 'neutral';
    };

    const actualChangeType = changeType || getChangeType(change);
  
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {change !== undefined && change !== 0 && (
                <div className={`flex items-center mt-2 text-sm ${
                  actualChangeType === 'increase' ? 'text-green-600' : 
                  actualChangeType === 'decrease' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {actualChangeType === 'increase' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : actualChangeType === 'decrease' ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : null}
                  <span>{change > 0 ? '+' : ''}{change}%</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
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

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            管理仪表盘
          </h1>
          <p className="text-gray-600">预订系统总览</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Selector de fechas */}
          <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[150px] text-center">
              <span className="font-medium text-gray-900">
                {formatMonthYear(currentDate)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-1"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Botón para ir al mes actual */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentMonth}
          >
            本月
          </Button>          
          {/* Botón de refrescar */}
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Calendar}
          title="预订总数"
          value={stats.totalReservations}
          change={changes.totalReservations}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          title="有效预订"
          value={stats.activeReservations}
          change={changes.activeReservations}
          color="green"
        />
        {user?.role === 'admin' && (
          <StatCard
            icon={Users}
            title="用户总数"
            value={stats.totalUsers}
            change={changes.totalUsers}
            color="purple"
          />
        )}
        <StatCard
          icon={Activity}
          title="营业中餐厅"
          value={stats.activeRestaurants}
          change={changes.activeRestaurants}
          color="orange"
        />
      </div>

      {/* Estadísticas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={XCircle}
          title="已取消预订"
          value={stats.cancelledReservations}
          change={changes.cancelledReservations}
          color="red"
        />
        <StatCard
          icon={DollarSign}
          title="本月收入"
          value={formatCurrency(stats.monthlyRevenue)}
          change={changes.monthlyRevenue}
          color="green"
        />
        <StatCard
          icon={Star}
          title="平均评分"
          value={parseFloat(stats.averageRating).toFixed(1)}
          color="yellow"
        />
        <StatCard
          icon={Clock}
          title="今日已完成"
          value={stats.completedReservations}
          change={changes.completedReservations}
          color="blue"
        />
      </div>

      {/* Sección de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reservas Recientes */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">最近预订</h2>
            <Button variant="outline" size="sm">
              查看全部
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentReservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无最近预订</p>
              ) : (
                recentReservations.map((reservation, index) => (
                  <div key={`reservation-${reservation.id}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {reservation.restaurant_name}
                        </span>
                        <Badge 
                          variant={
                            reservation.status === 'confirmed' ? 'success' :
                            reservation.status === 'pending' ? 'warning' : 'danger'
                          }
                        >
                          {reservation.status === 'confirmed' ? '已确认' :
                           reservation.status === 'pending' ? '待处理' : '已取消'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {reservation.party_size} 人 • {reservation.reservation_time}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(reservation.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restaurantes Top */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">热门餐厅</h2>
            <Button variant="outline" size="sm">
              查看全部
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topRestaurants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无餐厅数据</p>
              ) : (
                topRestaurants.map((restaurant, index) => (
                  <div key={`restaurant-${restaurant.id}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {restaurant.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{restaurant.name}</div>
                        <div className="text-sm text-gray-600">{restaurant.cuisine_type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium text-gray-900">
                          {restaurant.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {restaurant.capacity} 人
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card className="mt-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">快捷操作</h2>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="primary"
              onClick={() => window.location.href = '/admin/restaurants'}
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              管理餐厅
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/admin/tables'}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              管理桌台
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/admin/reservations'}
              className="w-full"
            >
              <Users className="h-4 w-4 mr-2" />
              查看预订
            </Button>
            {user?.role === 'admin' && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/admin/users'}
              className="w-full"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              管理用户
            </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
