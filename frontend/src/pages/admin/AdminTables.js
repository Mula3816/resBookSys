import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import tableService from '../../services/tableService';
import restaurantService from '../../services/restaurantService';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Card, { CardContent, CardHeader } from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import TableForm from '../../components/molecules/TableForm';
import toast from 'react-hot-toast';

// table_type 显示标签（数据库枚举值仍为英文，不可修改）
const TYPE_LABELS = {
  standard: '标准',
  vip: 'VIP',
  private: '包间',
  outdoor: '户外'
};

const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    restaurant_id: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [showRestaurantDropdown, setShowRestaurantDropdown] = useState(false);
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('');

  const reset = (values) => {
    setFilters(values);
  };

  useEffect(() => {
    fetchTables();
  }, [filters]);

  // 输入餐厅名时防抖模糊搜索（后端 /restaurants?search= 支持名称模糊匹配）
  useEffect(() => {
    if (!restaurantQuery.trim()) {
      setRestaurantOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await restaurantService.getAll({ search: restaurantQuery, page: 1, limit: 10 });
        setRestaurantOptions(response.restaurants || []);
        setShowRestaurantDropdown(true);
      } catch (error) {
        console.error('搜索餐厅失败:', error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [restaurantQuery]);

  const handleRestaurantQueryChange = (value) => {
    setRestaurantQuery(value);
    // 输入与已选餐厅不一致时视为重新搜索，清掉已选筛选
    if (value !== selectedRestaurantName) {
      setFilters(prev => ({ ...prev, restaurant_id: '', page: 1 }));
    }
  };

  const handleSelectRestaurant = (restaurant) => {
    setFilters(prev => ({ ...prev, restaurant_id: restaurant.id, page: 1 }));
    setRestaurantQuery(restaurant.name);
    setSelectedRestaurantName(restaurant.name);
    setShowRestaurantDropdown(false);
  };

  const clearRestaurantFilter = () => {
    setFilters(prev => ({ ...prev, restaurant_id: '', page: 1 }));
    setRestaurantQuery('');
    setSelectedRestaurantName('');
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await tableService.getAll(filters);
      setTables(response.tables);
      setPagination(response.pagination);
    } catch (error) {
      console.error('加载桌台失败:', error);
      toast.error('加载桌台失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个桌台吗？')) {
      return;
    }

    try {
      await tableService.delete(id);
      toast.success('桌台删除成功');
      fetchTables();
    } catch (error) {
      console.error('删除桌台失败:', error);
      toast.error('删除桌台失败');
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTable(null);
    setShowModal(true);
  };

  if (loading && tables.length === 0) {
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
            桌台
          </h1>
          <p className="text-gray-600">
            管理各餐厅的桌台
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          添加桌台
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* 左：餐厅模糊搜索（输入 + 下拉建议，选中后按餐厅筛选） */}
            <div className="relative flex-1 min-w-[220px]">
              <Input
                placeholder="搜索餐厅..."
                value={restaurantQuery}
                onChange={(e) => handleRestaurantQueryChange(e.target.value)}
                onFocus={() => {
                  setShowRestaurantDropdown(true);
                  if (!restaurantQuery.trim() && restaurantOptions.length === 0) {
                    restaurantService.getAll({ page: 1, limit: 10 })
                      .then((response) => setRestaurantOptions(response.restaurants || []))
                      .catch((error) => console.error('加载餐厅列表失败:', error));
                  }
                }}
                onBlur={() => setShowRestaurantDropdown(false)}
                className={filters.restaurant_id ? 'pl-10 pr-8' : 'pl-10'}
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              {filters.restaurant_id && (
                <button
                  type="button"
                  onClick={clearRestaurantFilter}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="清除餐厅筛选"
                >
                  ×
                </button>
              )}
              {showRestaurantDropdown && restaurantOptions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                  {restaurantOptions.map((restaurant) => (
                    <li key={restaurant.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectRestaurant(restaurant)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {restaurant.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 右：桌台编号搜索 */}
            <div className="relative flex-1 min-w-[220px]">
              <Input
                placeholder="搜索桌台编号..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="input"
            >
              <option value="">全部状态</option>
              <option value="available">可用</option>
              <option value="unavailable">不可用</option>
              <option value="maintenance">维护中</option>
            </select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tables List */}
      {tables.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未找到桌台
            </h3>
            <p className="text-gray-600 mb-4">
              先添加第一个桌台吧
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              添加桌台
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {tables.map((table) => (
              <Card key={table.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          桌台 {table.table_number}
                        </h3>
                        <Badge status={table.status}>
                          {table.status === 'available' ? '可用' :
                           table.status === 'unavailable' ? '不可用' : '维护中'}
                        </Badge>
                        <Badge variant="default">
                          {TYPE_LABELS[table.table_type] || table.table_type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">餐厅</p>
                          <p className="font-medium">{table.restaurant_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">容量</p>
                          <p className="font-medium">{table.capacity} 人</p>
                        </div>
                        <div>
                          <p className="text-gray-500">最小容量</p>
                          <p className="font-medium">{table.min_capacity} 人</p>
                        </div>
                        <div>
                          <p className="text-gray-500">位置</p>
                          <p className="font-medium">{table.location || '未分配'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(table)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(table.id)}
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

      {/* Modal para crear/editar mesa */}
      {showModal && (
        <TableForm
          table={editingTable}
          onClose={() => {
            setShowModal(false);
            setEditingTable(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingTable(null);
            fetchTables();
            reset({
              search: filters.search,
              restaurant_id: filters.restaurant_id,
              status: filters.status,
              page: 1,
              limit: 20
            });
          }}
        />
      )}
    </div>
  );
};

export default AdminTables;
