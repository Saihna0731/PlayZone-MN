import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../../config';
import { useAuth } from '../../../contexts/AuthContext';

const SubscriptionManager = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    freeUsers: 0
  });

  // Subscription планууд (шинэчлэгдсэн)
  const plans = {
    free: {
      name: 'FREE',
      price: 0,
      color: '#9e9e9e',
      features: ['Map харах', 'Popup харж чадахгүй']
    },
    normal: {
      name: 'NORMAL',
      price: 4990,
      color: '#4caf50',
      features: ['Бүх мэдээлэл харах', 'Favorites', 'Ачаалал харах', 'Filters']
    },
    business_standard: {
      name: 'BUSINESS STANDARD',
      price: 29900,
      color: '#ff9800',
      features: ['1 PC center', 'Basic analytics', '3 зураг', 'Email notifications']
    },
    business_pro: {
      name: 'BUSINESS PRO',
      price: 59900,
      color: '#e91e63',
      features: ['3 PC center', 'Advanced analytics', 'Video upload', 'Marketing boost']
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const usersData = response.data.users || [];
      setUsers(usersData);
      
      // Statistics тооцоолох
      const totalRevenue = usersData.reduce((sum, user) => {
        const plan = user.subscription?.plan || 'free';
        const isExpired = user.subscription?.expiresAt && new Date(user.subscription.expiresAt) < new Date();
        return sum + (isExpired ? 0 : plans[plan]?.price || 0);
      }, 0);

      const activeSubscriptions = usersData.filter(user => {
        const plan = user.subscription?.plan || 'free';
        const isExpired = user.subscription?.expiresAt && new Date(user.subscription.expiresAt) < new Date();
        return plan !== 'free' && !isExpired;
      }).length;

      const freeUsers = usersData.filter(user => {
        const plan = user.subscription?.plan || 'free';
        return plan === 'free';
      }).length;

      setStats({
        totalRevenue,
        activeSubscriptions,
        totalUsers: usersData.length,
        freeUsers
      });

    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId, newPlan, duration = 30) => {
    try {
      const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
      
      const response = await axios.put(`${API_BASE}/api/admin/users/${userId}/subscription`, {
        plan: newPlan,
        expiresAt: newPlan === 'free' ? null : expiresAt,
        isActive: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchUsers(); // Refresh data
        alert(`Subscription амжилттай шинэчлэгдлээ!`);
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade хийхэд алдаа гарлаа');
    }
  };

  const getPlanBadge = (subscription) => {
    const plan = subscription?.plan || 'free';
    const planInfo = plans[plan];
    const isExpired = subscription?.expiresAt && new Date(subscription.expiresAt) < new Date();
    
    return (
      <span style={{
        background: isExpired ? '#f44336' : planInfo.color,
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {isExpired ? 'EXPIRED' : planInfo.name}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Хязгааргүй';
    return new Date(dateStr).toLocaleDateString('mn-MN');
  };

  const getTrialStatus = (user) => {
    if (user.subscription?.trialUsed) return null;
    
    const registrationDate = new Date(user.createdAt);
    const trialEndDate = new Date(registrationDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now <= trialEndDate) {
      const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
      return (
        <span style={{
          background: '#2196f3',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '8px',
          fontSize: '10px',
          marginLeft: '8px'
        }}>
          Trial {daysLeft}д
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#f5f5f5',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
          <div style={{ fontSize: '18px', color: '#666' }}>Subscription мэдээлэл ачаалж байна...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#333', 
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          💰 Subscription Manager
          <span style={{ 
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Admin Panel
          </span>
        </h1>
        
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px', 
          marginTop: '24px' 
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #4caf50, #45a049)',
            color: 'white', 
            padding: '20px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.totalRevenue.toLocaleString()}₮
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Сарын орлого</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #2196f3, #1976d2)',
            color: 'white', 
            padding: '20px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.activeSubscriptions}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Идэвхтэй subscription</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: 'white', 
            padding: '20px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Нийт хэрэглэгч</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #9e9e9e, #757575)',
            color: 'white', 
            padding: '20px', 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(158, 158, 158, 0.3)'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.freeUsers}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Free хэрэглэгч</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea, #764ba2)', 
          color: 'white',
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          👥 Хэрэглэгчийн жагсаалт ({users.length})
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                  Хэрэглэгч
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                  И-мэйл
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                  Эрх
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                  Төлөвлөгөө
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                  Дуусах огноо
                </th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: '600' }}>
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id} style={{ 
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.2s',
                  ':hover': { background: '#f9f9f9' }
                }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0'][index % 5]}, ${['#45a049', '#1976d2', '#f57c00', '#ad1457', '#7b1fa2'][index % 5]})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '18px'
                      }}>
                        {(user.fullName || user.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#333', fontSize: '15px' }}>
                          {user.fullName || user.username || 'Нэр алга'}
                          {getTrialStatus(user)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          ID: {user._id.slice(-6)} • {new Date(user.createdAt).toLocaleDateString('mn-MN')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {user.email || 'И-мэйл алга'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      background: user.role === 'admin' ? '#f44336' : user.role === 'center_owner' ? '#ff9800' : '#4caf50',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {getPlanBadge(user.subscription)}
                  </td>
                  <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                    {formatDate(user.subscription?.expiresAt)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {Object.entries(plans).map(([planKey, plan]) => (
                        <button
                          key={planKey}
                          onClick={() => upgradeUser(user._id, planKey)}
                          disabled={user.subscription?.plan === planKey}
                          style={{
                            background: user.subscription?.plan === planKey 
                              ? '#e0e0e0' 
                              : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                            color: user.subscription?.plan === planKey ? '#999' : 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: user.subscription?.plan === planKey ? 'not-allowed' : 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            opacity: user.subscription?.plan === planKey ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                        >
                          {plan.name}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;