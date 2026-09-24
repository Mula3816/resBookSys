import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  // Crear fecha en zona local para evitar problemas de UTC
  const dateObj = new Date(date);
  // Ajustar para evitar problemas de zona horaria
  dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatTime(time) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(`2000-01-01T${time}`));
}

export function formatDateTime(date, time) {
  try {
    // Si date y time son undefined o nulos, devolver string vacío
    if (!date || !time) {
      return '';
    }
    
    // Crear un objeto Date combinando fecha y hora en zona local
    const dateTimeString = `${date}T${time}`;
    const dateObj = new Date(dateTimeString);
    
    // Ajustar para evitar problemas de zona horaria
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.warn('日期无效:', dateTimeString);
      // Intentar formatear por separado
      return `${date} ${time}`;
    }

    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    console.error('formatDateTime 出错:', error);
    return `${date} ${time}`;
  }
}

export function generateTimeSlots() {
  const slots = [];
  for (let hour = 11; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    no_show: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusText(status) {
  const texts = {
    pending: '待处理',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成',
    no_show: '未到场',
  };
  return texts[status] || status;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(amount);
}

export function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diff = end - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0 && minutes > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时`;
  }
  return `${minutes}分钟`;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
}

export function debounce(func, wait) {
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

// Función para normalizar fechas y evitar problemas de zona horaria
export function normalizeDate(date) {
  if (!date) return null;
  
  // Si es string en formato YYYY-MM-DD, mantenerlo como está
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Si es objeto Date, convertir a YYYY-MM-DD en zona local
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Para otros casos, intentar crear un Date y convertir
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    // Ajustar para zona horaria local
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('日期规范化出错:', error);
    return null;
  }
}
