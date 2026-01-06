import { User, HistoryItem } from '../types';

// Mocked authenticated user
export const MOCK_USER: User = {
  id: '1',
  name: 'Usuário Teste',
  email: 'usuario@exemplo.com',
  avatar: 'https://i.pravatar.cc/150?u=1'
};

// Mocked history data for the dashboard
export const MOCK_HISTORY: HistoryItem[] = [];

export const loginMock = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_USER);
    }, 1000);
  });
};

export const registerMock = async (name: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...MOCK_USER, name, email });
    }, 1000);
  });
};