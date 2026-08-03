import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBusinesses, createBusiness as apiCreateBusiness, deleteBusiness as apiDeleteBusiness, updateBusiness as apiUpdateBusiness } from '../services/business';
import { useAuth } from './AuthContext';

const BusinessContext = createContext(null);

export const BusinessProvider = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) {
      setBusinesses([]);
      setActiveBusiness(null);
      setLoading(false);
      return;
    }

    const loadBusinesses = async () => {
      try {
        setLoading(true);
        const data = await getBusinesses();
        // Assuming API returns a paginated list or array.
        const results = Array.isArray(data) ? data : (data.results || []);
        setBusinesses(results);
        
        // Restore last active business from local storage if available
        const savedId = localStorage.getItem('active_business_id');
        if (results.length > 0) {
          const savedBusiness = results.find(b => b.id.toString() === savedId);
          if (savedBusiness) {
            setActiveBusiness(savedBusiness);
          } else {
            setActiveBusiness(results[0]);
            localStorage.setItem('active_business_id', results[0].id.toString());
          }
        } else {
          setActiveBusiness(null);
        }
      } catch (err) {
        console.error('Failed to load businesses:', err);
        setError('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [user]);

  const addBusiness = async (data) => {
    try {
      const newBusiness = await apiCreateBusiness(data);
      setBusinesses(prev => [...prev, newBusiness]);
      setActiveBusiness(newBusiness);
      localStorage.setItem('active_business_id', newBusiness.id.toString());
      return newBusiness;
    } catch (err) {
      console.error('Failed to create business:', err);
      throw err;
    }
  };

  const changeActiveBusiness = (businessId) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setActiveBusiness(business);
      localStorage.setItem('active_business_id', business.id.toString());
    }
  };

  const removeBusiness = async (businessId) => {
    try {
      await apiDeleteBusiness(businessId);
      const remaining = businesses.filter(b => b.id !== businessId);
      setBusinesses(remaining);
      
      if (activeBusiness?.id === businessId) {
        if (remaining.length > 0) {
          setActiveBusiness(remaining[0]);
          localStorage.setItem('active_business_id', remaining[0].id.toString());
        } else {
          setActiveBusiness(null);
          localStorage.removeItem('active_business_id');
        }
      }
    } catch (err) {
      console.error('Failed to delete business:', err);
      throw err;
    }
  };

  const editBusiness = async (businessId, data) => {
    try {
      const updated = await apiUpdateBusiness(businessId, data);
      setBusinesses(prev => prev.map(b => b.id === businessId ? updated : b));
      if (activeBusiness?.id === businessId) {
        setActiveBusiness(updated);
      }
      return updated;
    } catch (err) {
      console.error('Failed to update business:', err);
      throw err;
    }
  };

  return (
    <BusinessContext.Provider value={{ 
      businesses, 
      activeBusiness, 
      loading, 
      error, 
      addBusiness, 
      changeActiveBusiness,
      removeBusiness,
      editBusiness
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
