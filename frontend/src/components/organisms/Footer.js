import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Utensils className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">RestaurantBooking</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              五星级餐厅尊享预订系统。
              快速、安全的预订，尽享极致美食体验。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/restaurants" className="text-gray-400 hover:text-primary-400 transition-colors">
                  餐厅
                </Link>
              </li>
              <li>
                <Link to="/reservations" className="text-gray-400 hover:text-primary-400 transition-colors">
                  我的预订
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-400 hover:text-primary-400 transition-colors">
                  我的资料
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4">联系我们</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary-400" />
                <span className="text-gray-400">info@restaurantbooking.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary-400" />
                <span className="text-gray-400">+51 987 654 321</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary-400" />
                <span className="text-gray-400">秘鲁，利马</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} RestaurantBooking. 版权所有。
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
