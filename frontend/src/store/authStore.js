import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials, role = 'user') => {
        try {
          const endpoint = role === 'seller' ? '/auth/seller/login' : '/auth/login';
          const response = await api.post(endpoint, credentials);
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true });
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.message || 'Login failed' 
          };
        }
      },

      register: async (userData, role = 'user') => {
        try {
          const endpoint = role === 'seller' ? '/auth/seller/register' : '/auth/register';
          const response = await api.post(endpoint, userData);
          const { token, user } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true });
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.message || 'Registration failed' 
          };
        }
      },

      // Direct auth setter for admin login (which handles its own API call)
      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.user, token, isAuthenticated: true });
          return true;
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('token');
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
