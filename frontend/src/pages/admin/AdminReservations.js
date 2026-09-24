import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, Check, X, Calendar, DollarSign, Trash2 } from 'lucide-react';
import reservationService from '../../services/reservationService';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Card, { CardContent, CardHeader } from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import { formatDate, formatTime, getStatusText } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentReservation, setSelectedPaymentReservation] = useState(null);
  const [paymentData, setPaymentData] = useState({
    total_amount: '',
    payment_method: '',
    notes: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    restaurant_id: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Definir fetchReservations con useCallback y debounce para optimización
  const fetchReservations = useCallback(
    debounce(async () => {
      try {
        setLoading(true);
        const response = await reservationService.getAll(filters);
        setReservations(response.reservations);
        setPagination(response.pagination);
      } catch (error) {
        console.error('加载预订失败:', error);
        toast.error('加载预订失败');
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters.search, filters.status, filters.restaurant_id, filters.date_from, filters.date_to, filters.page, filters.limit]
  );

  // Función debounce simple
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // useEffect ahora puede usar fetchReservations correctamente
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusUpdate = async (reservationId, newStatus) => {
    // Prevenir múltiples clics
    if (updatingId === reservationId) return;
    
    try {
      setUpdatingId(reservationId);
      
      await reservationService.updateStatus(reservationId, newStatus);
      toast.success(`预订状态已更新为「${getStatusText(newStatus)}」`);

      // Solo hacer fetch después de un retraso, sin actualización local
      setTimeout(() => {
        fetchReservations();
      }, 300);
    } catch (error) {
      console.error('更新预订状态失败:', error);
      toast.error('更新状态失败');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (reservationId) => {
    if (!window.confirm('确定要删除这条预订吗？此操作无法撤销。')) {
      return;
    }

    try {
      await reservationService.delete(reservationId);
      toast.success('预订删除成功');
      fetchReservations();
    } catch (error) {
      console.error('删除预订失败:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('删除预订失败');
      }
    }
  };

  const handlePayment = async (reservationId) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    setSelectedPaymentReservation(reservation);
    setPaymentData({
      total_amount: reservation.total_amount || '',
      payment_method: reservation.payment_method || '',
      notes: reservation.payment_notes || ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPaymentReservation) return;

    try {
      await reservationService.recordPayment(selectedPaymentReservation.id, paymentData);
      toast.success('支付记录已保存');
      setShowPaymentModal(false);
      setSelectedPaymentReservation(null);
      setPaymentData({ total_amount: '', payment_method: '', notes: '' });
      
      // Notificar a otros componentes que se actualice el dashboard
      window.dispatchEvent(new CustomEvent('payment-registered', {
        detail: { amount: paymentData.total_amount, reservationId: selectedPaymentReservation.id }
      }));
      
      // Actualizar el dashboard inmediatamente
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('payment-registered', {
          detail: { amount: paymentData.total_amount, reservationId: selectedPaymentReservation.id }
        }));
      }, 100);
      
      // No llamar a fetchReservations aquí, el dashboard se actualizará por el evento
      // fetchReservations(); // Comentado para evitar duplicaciones
    } catch (error) {
      console.error('登记支付失败:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg || err.message);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('登记支付失败');
      }
    }
  };

  const statusOptions = [
    { value: 'pending', label: '待处理', color: 'yellow' },
    { value: 'confirmed', label: '已确认', color: 'green' },
    { value: 'cancelled', label: '已取消', color: 'red' },
    { value: 'completed', label: '已完成', color: 'blue' },
    { value: 'no_show', label: '未到场', color: 'gray' }
  ];

  if (loading && reservations.length === 0) {
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
          预订
        </h1>
        <p className="text-gray-600">
          管理系统中的所有预订
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="搜索预订..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value, page: 1 }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束日期
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value, page: 1 }))}
                className="input"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="input"
            >
              <option value="">全部状态</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未找到预订
            </h3>
            <p className="text-gray-600">
              没有符合筛选条件的预订
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {reservations.map((reservation, index) => (
              <Card key={`reservation-${reservation.id}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reservation.restaurant_name}
                        </h3>
                        <Badge status={reservation.status}>
                          {getStatusText(reservation.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">客户</p>
                          <p className="font-medium">{reservation.user_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">日期</p>
                          <p className="font-medium">{formatDate(reservation.reservation_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">时间</p>
                          <p className="font-medium">{formatTime(reservation.reservation_time)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">桌台</p>
                          <p className="font-medium">桌台 {reservation.table_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">人数</p>
                          <p className="font-medium">{reservation.party_size}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>邮箱：{reservation.user_email}</span>
                        {reservation.user_phone && <span>电话：{reservation.user_phone}</span>}
                        <span>确认码：{reservation.confirmation_code}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReservation(reservation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {reservation.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                            disabled={updatingId === reservation.id}
                            loading={updatingId === reservation.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(reservation.id)}
                            disabled={updatingId === reservation.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {reservation.status === 'confirmed' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusUpdate(reservation.id, 'completed')}
                            disabled={updatingId === reservation.id}
                            loading={updatingId === reservation.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusUpdate(reservation.id, 'no_show')}
                            disabled={updatingId === reservation.id}
                            loading={updatingId === reservation.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {reservation.status === 'completed' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePayment(reservation.id)}
                            disabled={updatingId === reservation.id}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(reservation.id)}
                            disabled={updatingId === reservation.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {(reservation.status === 'cancelled' || reservation.status === 'no_show') && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(reservation.id)}
                          disabled={updatingId === reservation.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
                    key={`page-${page}`}
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

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  预订详情
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReservation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">餐厅</p>
                    <p className="font-medium">{selectedReservation.restaurant_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">状态</p>
                    <Badge status={selectedReservation.status}>
                      {getStatusText(selectedReservation.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">客户</p>
                    <p className="font-medium">{selectedReservation.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">邮箱</p>
                    <p className="font-medium">{selectedReservation.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">日期</p>
                    <p className="font-medium">{formatDate(selectedReservation.reservation_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">时间</p>
                    <p className="font-medium">{formatTime(selectedReservation.reservation_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">桌台</p>
                    <p className="font-medium">桌台 {selectedReservation.table_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">人数</p>
                    <p className="font-medium">{selectedReservation.party_size}</p>
                  </div>
                </div>

                {selectedReservation.occasion && (
                  <div>
                    <p className="text-sm text-gray-600">场合</p>
                    <p className="font-medium">{selectedReservation.occasion}</p>
                  </div>
                )}

                {selectedReservation.special_requests && (
                  <div>
                    <p className="text-sm text-gray-600">特殊要求</p>
                    <p className="font-medium">{selectedReservation.special_requests}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">确认码</p>
                  <p className="font-mono font-bold text-lg">{selectedReservation.confirmation_code}</p>
                </div>

                {selectedReservation.payment_date && (
                  <div>
                    <p className="text-sm text-gray-600">支付时间</p>
                    <p className="font-medium">{new Date(selectedReservation.payment_date).toLocaleString()}</p>
                  </div>
                )}

                {selectedReservation.total_amount && selectedReservation.total_amount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">已付金额</p>
                    <p className="font-medium text-green-600">¥ {parseFloat(selectedReservation.total_amount).toFixed(2)}</p>
                  </div>
                )}

                {selectedReservation.payment_method && (
                  <div>
                    <p className="text-sm text-gray-600">支付方式</p>
                    <p className="font-medium">{selectedReservation.payment_method}</p>
                  </div>
                )}

                {selectedReservation.payment_notes && (
                  <div>
                    <p className="text-sm text-gray-600">支付备注</p>
                    <p className="font-medium">{selectedReservation.payment_notes}</p>
                  </div>
                )}

                {selectedReservation.history && selectedReservation.history.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">变更记录</p>
                    <div className="space-y-2">
                      {selectedReservation.history.map((item, index) => (
                        <div key={`history-${item.id}-${index}`} className="text-sm border-l-2 border-gray-200 pl-3">
                          <p className="font-medium">{getStatusText(item.status)}</p>
                          <p className="text-gray-600">{item.notes}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPaymentReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  登记支付 - 预订 #{selectedPaymentReservation.id}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentReservation(null);
                    setPaymentData({ total_amount: '', payment_method: '', notes: '' });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    餐厅
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedPaymentReservation.restaurant_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    客户
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedPaymentReservation.user_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日期和时间
                  </label>
                  <p className="text-gray-900 font-medium">
                    {formatDate(selectedPaymentReservation.reservation_date)} - {formatTime(selectedPaymentReservation.reservation_time)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总金额（¥）*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentData.total_amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, total_amount: e.target.value }))}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    支付方式
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="input"
                  >
                    <option value="">请选择支付方式</option>
                    <option value="现金">现金</option>
                    <option value="信用卡">信用卡</option>
                    <option value="借记卡">借记卡</option>
                    <option value="银行转账">银行转账</option>
                    <option value="微信支付">微信支付</option>
                    <option value="支付宝">支付宝</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input"
                    rows={3}
                    placeholder="关于本次支付的补充说明..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedPaymentReservation(null);
                      setPaymentData({ total_amount: '', payment_method: '', notes: '' });
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    登记支付
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;
