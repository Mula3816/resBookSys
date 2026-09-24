import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              RestaurantBooking
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              尊享餐厅预订系统
            </p>
          </div>
          {children}
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <h1 className="text-4xl font-bold mb-4">
                欢迎来到 RestaurantBooking
              </h1>
              <p className="text-xl mb-8">
                探索优质餐厅，几秒内完成桌台预订
              </p>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm opacity-90">餐厅</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm opacity-90">预订</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-sm opacity-90">评分</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
