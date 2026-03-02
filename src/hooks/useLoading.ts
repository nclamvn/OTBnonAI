import { useAppContext } from '../contexts/AppContext';

export const useLoading = () => {
  const { loading, showLoading, hideLoading, withLoading } = useAppContext();
  return { loading, showLoading, hideLoading, withLoading };
};
