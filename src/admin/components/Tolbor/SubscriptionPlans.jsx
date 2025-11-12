import React, { useState } from 'react';
import { useSubscription } from '../../../hooks/useSubscription';
import Toast from '../../../components/LittleComponents/Toast';
import './SubscriptionPlans.css';

const SubscriptionPlans = ({ showModal, onClose }) => {
  const { subscription, upgradeToplan, refreshSubscription, isOwner } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  // Одоогийн хэрэглэгчийн төрлөөс (user vs centerOwner) хамаарч panel-аа автоматаар сонгоно
  const effectiveType = isOwner || subscription?.accountType === 'centerOwner' ? 'center' : 'subscription';

  // PC Center upgrade plans - зөвхөн бизнес планууд
  const centerPlans = [
    {
      id: 'business_standard',
      name: 'Бизнес Стандарт',
      price: '29,900₮',
      monthly: true,
      popular: true,
      features: [
        '✅ PC Center эзэмшигч',
        '✅ 1 төв нэмэх',
        '✅ 3 зураг оруулах',
        '✅ Ачаалал засах'
      ],
      color: '#007bff'
    },
    {
      id: 'business_pro',
      name: 'Бизнес Про',
      price: '59,900₮',
      monthly: true,
      features: [
        '✅ PC Center эзэмшигч',
        '✅ 3 төв нэмэх',
        '✅ Хязгааргүй зураг оруулах',
        '✅ Ачаалал удирдлага',
        '✅ Дэлгэрэнгүй тайлан',
        '✅ Video оруулах',
        '✅ VIP дэмжлэг(News , Top rating , Priority support)'
      ],
      color: '#6f42c1'
    }
  ];

  // Subscription plans - free user-д зөвхөн normal план
  const subscriptionPlans = [
    {
      id: 'normal',
      name: 'Энгийн',
      price: '4,990₮',
      monthly: true,
      features: [
        '✅ Бүх төв харах',
        '✅ Дэлгэрэнгүй мэдээлэл',
        '✅ Ачаалал шалгах',
        '✅ Дуртай төв нэмэх'
      ],
      color: '#28a745'
    }
  ];

  // Одоогийн төрлөөс хамааран plans сонгох
  const plans = effectiveType === 'center' ? centerPlans : subscriptionPlans;

  const handleUpgrade = async (planId, paymentMethod = 'mock') => {
    setLoading(true);
    try {
      const selectedPlanData = plans.find(p => p.id === planId);
      const result = await upgradeToplan(selectedPlanData, paymentMethod);
      if (result.success) {
        // Subscription data шинэчлэх
        await refreshSubscription();
        setToast({ message: '🎉 Амжилттай төлбөр хийлээ! Таны эрх шинэчлэгдлээ.', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setToast({ message: result.message || 'Төлбөр хийхэд алдаа гарлаа', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Төлбөр хийхэд алдаа гарлаа', type: 'error' });
    }
    setLoading(false);
  };

  // Automatic payment function (immediate/mock)
  const handleInstantUpgrade = (planId) => {
    setSelectedPlan(planId);
    // run mock upgrade
    handleUpgrade(planId, 'mock');
  };

  const PaymentModal = () => (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>{plans.find(p => p.id === selectedPlan)?.name} План</h3>
          <button onClick={() => setShowPayment(false)}>×</button>
        </div>
        
        <div className="payment-amount">
          <span>Төлөх дүн: {plans.find(p => p.id === selectedPlan)?.price}</span>
        </div>

        <div className="payment-methods">
          <h4>Төлбөрийн арга сонгох:</h4>
          
          <button 
            className="payment-btn qpay"
            onClick={() => handleUpgrade(selectedPlan, 'qpay')}
            disabled={loading}
          >
            <img src="/qpay-logo.png" alt="QPay" />
            QPay-ээр төлөх
          </button>

          <button 
            className="payment-btn mostmoney"
            onClick={() => handleUpgrade(selectedPlan, 'mostmoney')}
            disabled={loading}
          >
            <img src="/mostmoney-logo.png" alt="MostMoney" />
            MostMoney-ээр төлөх
          </button>

          <button 
            className="payment-btn card"
            onClick={() => handleUpgrade(selectedPlan, 'card')}
            disabled={loading}
          >
            💳 Картаар төлөх
          </button>
        </div>

        {loading && (
          <div className="payment-loading">
            <div className="spinner"></div>
            <span>Төлбөр боловсруулж байна...</span>
          </div>
        )}
      </div>
    </div>
  );

  if (!showModal) return null;

  return (
    <>
      <div className="subscription-modal-overlay">
        <div className="subscription-modal">
          <div className="modal-header">
            <h2>{effectiveType === 'center' ? 'PC Center Эзэмшигчийн план' : 'Планаа сонгоорой'}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          {effectiveType === 'subscription' && (
            <div className="current-plan">
              <span>Одоогийн план: <strong>{subscription?.plan === 'free' ? 'Үнэгүй' : 
                subscription?.plan === 'normal' ? 'Энгийн' :
                subscription?.plan === 'business_standard' ? 'Бизнес Стандарт' :
                subscription?.plan === 'business_pro' ? 'Бизнес Про' : 'Тодорхойгүй'}</strong></span>
            </div>
          )}

          {effectiveType === 'center' && (
            <div className="current-plan">
              <span>🏢 PC Center эзэмшигч болж, өөрийн төвийг удирдаарай!</span>
            </div>
          )}

          <div className="plans-grid">
            {plans.map(plan => {
              // Одоогийн төлөвлөгөө бол дахин авахыг хориглоно (user, centerOwner аль алинд)
              const isCurrent = subscription?.plan === plan.id;
              const isLowerTier = effectiveType === 'center' ? false : 
                plans.findIndex(p => p.id === subscription?.plan) >= plans.findIndex(p => p.id === plan.id);
              
              return (
                <div 
                  key={plan.id} 
                  className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                  style={{ borderColor: plan.color }}
                >
                  {plan.popular && <div className="popular-badge">Их сонгодог</div>}
                  
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price">{plan.price}</span>
                      <span className="period">/сар</span>
                    </div>
                  </div>

                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <div className="plan-action">
                    {isCurrent ? (
                      <button className="btn current-plan-btn" disabled>
                        Одоогийн план
                      </button>
                    ) : isLowerTier && subscription?.plan !== 'free' ? (
                      <button className="btn downgrade-btn" disabled>
                        Доош буух
                      </button>
                    ) : (
                      <button 
                        className="btn upgrade-btn"
                        style={{ backgroundColor: plan.color }}
                        onClick={() => handleInstantUpgrade(plan.id)}
                        disabled={loading}
                      >
                        {loading && selectedPlan === plan.id ? 'Төлж байна...' : 
                         subscription?.plan === 'free' ? '🚀 Шууд эхлэх' : '⚡ Шууд шинэчлэх'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

  {showPayment && <PaymentModal />}
  {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </>
  );
};

export default SubscriptionPlans;