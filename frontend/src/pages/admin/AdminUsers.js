import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, Shield, User } from 'lucide-react';
import userService from '../../services/userService';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Card, { CardContent, CardHeader } from '../../components/atoms/Card';
import Badge from '../../components/atoms/Badge';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll(filters);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('加载用户失败:', error);
      toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await userService.updateRole(userId, { role: newRole });
      toast.success('角色更新成功');
      fetchUsers();
    } catch (error) {
      console.error('更新用户角色失败:', error);
      toast.error('更新角色失败');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('确定要删除该用户吗？此操作无法撤销。')) {
      return;
    }

    try {
      await userService.delete(userId);
      toast.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除用户失败');
    }
  };

  if (loading && users.length === 0) {
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
          用户
        </h1>
        <p className="text-gray-600">
          管理系统中的用户账号
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="搜索用户..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>

            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
              className="input"
            >
              <option value="">全部角色</option>
              <option value="admin">管理员</option>
              <option value="client">客户</option>
            </select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              未找到用户
            </h3>
            <p className="text-gray-600">
              没有符合筛选条件的用户
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                          {user.role === 'admin' ? '管理员' : '客户'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">邮箱</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">电话</p>
                          <p className="font-medium">{user.phone || '未填写'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">预订</p>
                          <p className="font-medium">{user.reservation_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">注册时间</p>
                          <p className="font-medium">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {user.role === 'client' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleUpdate(user.id, 'admin')}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRoleUpdate(user.id, 'client')}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'admin'}
                        title={user.role === 'admin' ? '无法删除管理员' : '删除用户'}
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
    </div>
  );
};

export default AdminUsers;
