import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Star, Clock, Users, Calendar, ArrowRight } from 'lucide-react';
import Button from '../components/atoms/Button';

const HomePage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Search,
      title: '智能搜索',
      description: '根据您的偏好和可订时段，找到理想的餐厅。'
    },
    {
      icon: Calendar,
      title: '快速预订',
      description: '通过直观、安全的系统，几秒内完成桌台预订。'
    },
    {
      icon: Users,
      title: '团体预订',
      description: '为大型团体提供个性化预订方案。'
    },
    {
      icon: Clock,
      title: '即时确认',
      description: '立即收到确认通知和自动提醒。'
    }
  ];

  const stats = [
    { number: '500+', label: '餐厅' },
    { number: '50K+', label: '预订' },
    { number: '4.9', label: '评分' },
    { number: '24/7', label: '客服支持' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              预订顶级餐厅
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              五星级餐厅尊享预订系统
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/restaurants">
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  浏览餐厅
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {user ? (
                <Link to="/reservations">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                    我的预订
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/register">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                    注册
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-primary-600">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              尊享功能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              为您打造卓越预订体验所需的一切
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              如何使用
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              三步轻松预订桌台
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                搜索餐厅
              </h3>
              <p className="text-gray-600">
                浏览我们精选的优质餐厅，按菜系、位置或可订时段筛选。
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                选择并预订
              </h3>
              <p className="text-gray-600">
                选择日期、时间和人数，几秒内确认预订。
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                尽享美食体验
              </h3>
              <p className="text-gray-600">
                立即获得确认，尽享美食之旅。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备好预订下一餐了吗？
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            加入成千上万客户的行列，畅享优质餐厅预订体验。
          </p>
          <Link to="/restaurants">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              立即开始
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
