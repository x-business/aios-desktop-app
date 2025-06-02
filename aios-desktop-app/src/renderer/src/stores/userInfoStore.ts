import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  occupation: string;
  company: string;
  address: string;
  languages: string[];
  websites: string[];
  goals: string;
  preferences: string;
  contacts: string;
}

interface UserInfoState {
  userInfo: UserInfo;
  setUserInfo: (info: Partial<UserInfo>) => void;
}

const initialUserInfo: UserInfo = {
  fullName: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  occupation: '',
  company: '',
  address: '',
  languages: [],
  websites: [],
  goals: '',
  preferences: '',
  contacts: ''
};

export const useUserInfoStore = create<UserInfoState>()(
  persist(
    (set) => ({
      userInfo: initialUserInfo,
      setUserInfo: (info) => set((state) => ({
        userInfo: { ...state.userInfo, ...info }
      }))
    }),
    {
      name: 'aios-user-info',
      // Only store userInfo in localStorage
      partialize: (state) => ({ userInfo: state.userInfo }),
    }
  )
); 