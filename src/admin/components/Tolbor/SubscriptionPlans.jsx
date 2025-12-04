import React, { useState } from 'react';
import { useSubscription } from '../../../hooks/useSubscription';
import Toast from '../../../components/LittleComponents/Toast';
import axios from 'axios';
import { API_BASE } from '../../../config';
import './SubscriptionPlans.css';

const SubscriptionPlans = ({ showModal, onClose }) => {
  const { subscription, upgradeToplan, refreshSubscription, isOwner } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState('');

  // Одоогийн хэрэглэгчийн төрлөөс (user vs centerOwner) хамаарч panel-аа автоматаар сонгоно
  const effectiveType = isOwner || subscription?.accountType === 'centerOwner' ? 'center' : 'subscription';

  // Game Center upgrade plans - зөвхөн бизнес планууд
  const centerPlans = [
    {
      id: 'business_standard',
      name: 'Бизнес Стандарт',
      price: '19,900₮',
      priceValue: 19900,
      monthly: true,
      popular: true,
      features: [
        '✅ Game Center эзэмшигч',
        '✅ 1 төв нэмэх',
        '✅ 3 зураг оруулах',
        '✅ Ачаалал засах'
      ],
      color: '#007bff'
    },
    {
      id: 'business_pro',
      name: 'Бизнес Про',
      price: '39,900₮',
      priceValue: 39900,
      monthly: true,
      features: [
        '✅ Game Center эзэмшигч',
        '✅ 2 төв нэмэх',
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
      price: '1,990₮',
      priceValue: 1990,
      monthly: true,
      features: [
        '✅ Бүх төв харах',
        '✅ Дэлгэрэнгүй мэдээлэл',
        '✅ Ачаалал шалгах',
        '✅ Дуртай төв нэмэх',
        '✅ Захиалага хийх',
        '✅ Шинэлэг Game Center-уудын бичлэг гүйлгэж үзэх(Reels)'
      ],
      color: '#28a745'
    }
  ];

  // Одоогийн төрлөөс хамааран plans сонгох
  const plans = effectiveType === 'center' ? centerPlans : subscriptionPlans;

  // handleUpgrade removed - using bank transfer instead of mock payment

  // Show bank transfer details and create pending payment
  const handleInstantUpgrade = async (planId) => {
    setSelectedPlan(planId);
    
    // Create pending payment
    try {
      const selectedPlanData = plans.find(p => p.id === planId);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/payment/create-pending`,
        { 
          planId: planId,
          amount: selectedPlanData.priceValue
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Pending payment created successfully');
    } catch (error) {
      console.error('Error creating pending payment:', error);
    }
    
    setShowPayment(true);
  };

  const PaymentModal = () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const [copied, setCopied] = useState('');
    const [paymentCode, setPaymentCode] = useState(null);
    const [codeLoading, setCodeLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('monpay'); // 'monpay', 'bank' or 'qpay'
    const [qpayLoading, setQpayLoading] = useState(false);
    const [qpayData, setQpayData] = useState(null);
    const [modalToast, setModalToast] = useState(null); // Toast inside modal
    
    // Modal дотор Toast харуулах
    const showModalToast = (message, type = 'info') => {
      setModalToast({ message, type });
      setTimeout(() => setModalToast(null), 4000);
    };

    // Код авах
    React.useEffect(() => {
      const fetchCode = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
            `${API_BASE}/api/payment/generate-code`,
            { planId: selectedPlan },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPaymentCode(response.data);
        } catch (error) {
          console.error('Error generating code:', error);
          showModalToast('Код үүсгэхэд алдаа гарлаа', 'error');
        } finally {
          setCodeLoading(false);
        }
      };
      fetchCode();
    }, [selectedPlan]);

    // QPay invoice үүсгэх
    const createQPayInvoice = async () => {
      setQpayLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_BASE}/api/qpay/create-invoice`,
          { 
            planId: selectedPlan
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setQpayData({
            qr_image: response.data.data.qrImage,
            qr_text: response.data.data.qrText,
            urls: response.data.data.urls || response.data.data.deeplinks || [],
            invoiceId: response.data.data.invoiceId
          });
        }
      } catch (error) {
        console.error('QPay error:', error);
        showModalToast('QPay төлбөр үүсгэхэд алдаа гарлаа. Банкны шилжүүлэг ашиглана уу.', 'error');
      } finally {
        setQpayLoading(false);
      }
    };

    const copyToClipboard = (text, field) => {
      navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    };

    return (
      <div className="payment-modal-overlay" onClick={() => setShowPayment(false)}>
        <div className="payment-modal" onClick={(e) => e.stopPropagation()} style={{
          maxWidth: '500px',
          background: 'white',
          borderRadius: '20px',
          padding: '0',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}>
          {/* Modal дотор Toast */}
          {modalToast && (
            <div style={{
              position: 'absolute',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10001,
              background: modalToast.type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                         modalToast.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                         'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              fontSize: '14px',
              fontWeight: '600',
              maxWidth: '90%',
              textAlign: 'center',
              animation: 'slideDown 0.3s ease'
            }}>
              {modalToast.type === 'error' ? '⚠️' : modalToast.type === 'success' ? '✅' : '💡'} {modalToast.message}
            </div>
          )}
          
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '20px 20px 0 0',
            color: 'white',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowPayment(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '20px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >×</button>
            <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              💳 Төлбөр төлөх
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {selectedPlanData?.name} План
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>
            {/* Amount */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center',
              marginBottom: '24px',
              color: 'white'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
                Шилжүүлэх дүн
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700' }}>
                {selectedPlanData?.price}
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setPaymentMethod('monpay')}
                style={{
                  flex: 1,
                  padding: '14px 8px',
                  border: paymentMethod === 'monpay' ? '2px solid #e11d48' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: paymentMethod === 'monpay' ? '#fff1f2' : 'white',
                  color: paymentMethod === 'monpay' ? '#be123c' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                🏦 Банк шилжүүлэг
              </button>
              <button
                onClick={() => {
                  setPaymentMethod('qpay');
                  if (!qpayData && !qpayLoading) {
                    createQPayInvoice();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '14px 8px',
                  border: paymentMethod === 'qpay' ? '2px solid #00b14f' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  background: paymentMethod === 'qpay' ? '#ecfdf5' : 'white',
                  color: paymentMethod === 'qpay' ? '#047857' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                📱 QPay
              </button>
            </div>

            {/* Bank Transfer Content (Monpay данс руу) */}
            {paymentMethod === 'monpay' && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '20px',
                border: '2px solid #3b82f6'
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1d4ed8', fontSize: '18px' }}>
                    🏦 Банк шилжүүлэг
                  </h4>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    Аль ч банкнаас шилжүүлж болно
                  </p>
                </div>

                {/* Supported Banks */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  {['Хаан', 'Голомт', 'ХХБ', 'State', 'Monpay'].map(bank => (
                    <span key={bank} style={{
                      background: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      color: '#1d4ed8',
                      border: '1px solid #93c5fd'
                    }}>
                      ✓ {bank}
                    </span>
                  ))}
                </div>

                {/* Account Details */}
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1d4ed8' }}>
                    📱 Хүлээн авагч данс (Monpay)
                  </h4>
                  
                  {/* Monpay Account Number */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      Дансны дугаар
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0f9ff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8', fontFamily: 'monospace' }}>
                        99107463441
                      </span>
                      <button
                        onClick={() => copyToClipboard('99107463441', 'monpay')}
                        style={{
                          background: copied === 'monpay' ? '#10b981' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {copied === 'monpay' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  {/* IBAN Account Number */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      IBAN дугаар (Олон улсын шилжүүлэг)
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fef3c7',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', fontFamily: 'monospace' }}>
                        MN2500 500 991 0746 3441
                      </span>
                      <button
                        onClick={() => copyToClipboard('MN2500500991074634441', 'iban')}
                        style={{
                          background: copied === 'iban' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {copied === 'iban' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  {/* Bank Name */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      Банк
                    </div>
                    <div style={{
                      background: '#f0f9ff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1d4ed8'
                    }}>
                      Monpay (Аль ч банкнаас шилжүүлнэ)
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      Утас
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0f9ff',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#1d4ed8', fontFamily: 'monospace' }}>
                        95520443
                      </span>
                      <button
                        onClick={() => copyToClipboard('95520443', 'monpayphone')}
                        style={{
                          background: copied === 'monpayphone' ? '#10b981' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {copied === 'monpayphone' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment Code */}
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: '2px solid #fbbf24'
                }}>
                  <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px', fontWeight: '600' }}>
                    ⚠️ ГҮЙЛГЭЭНИЙ УТГА (заавал оруулах!)
                  </div>
                  {codeLoading ? (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#92400e' }}>
                      ⏳ Код үүсгэж байна...
                    </div>
                  ) : paymentCode ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'white',
                      padding: '12px 16px',
                      borderRadius: '10px'
                    }}>
                      <span style={{ 
                        fontSize: '22px', 
                        fontWeight: '700', 
                        color: '#92400e', 
                        fontFamily: 'monospace',
                        letterSpacing: '2px'
                      }}>
                        {paymentCode.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(paymentCode.code, 'monpaycode')}
                        style={{
                          background: copied === 'monpaycode' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        {copied === 'monpaycode' ? '✓ Хуулсан' : '📋 Хуулах'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#dc2626' }}>
                      ⚠️ Код үүсгэхэд алдаа
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div style={{
                  background: 'white',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: '#1d4ed8' }}>📌 Заавар:</strong>
                  <ol style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
                    <li>Банкны апп нээх (Хаан/Голомт/ХХБ/Monpay)</li>
                    <li><strong>99107463441</strong> данс руу шилжүүлэг хийх</li>
                    <li><strong style={{ color: '#f59e0b' }}>Гүйлгээний утга</strong> дээр <strong>{paymentCode?.code || 'PZ-XXXXXX'}</strong> бичих</li>
                    <li>Төлбөр амжилттай → Хэсэг хугацааны дараа эрх нээгдэнэ ✅</li>
                  </ol>
                </div>

                {/* Waiting for Payment Message */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  border: '2px solid #fbbf24',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
                    Төлбөр баталгаажихыг хүлээж байна...
                  </div>
                  <div style={{ fontSize: '12px', color: '#a16207' }}>
                    Шилжүүлэг хийсний дараа админ баталгаажуулна
                  </div>
                </div>
              </div>
            )}

            {/* QPay Content */}
            {paymentMethod === 'qpay' && (
              <div style={{
                background: '#f0fdf4',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '20px',
                border: '2px solid #22c55e'
              }}>
                {qpayLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
                    <p style={{ color: '#047857', fontWeight: '600' }}>QPay нэхэмжлэх үүсгэж байна...</p>
                  </div>
                ) : qpayData?.qr_image ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#047857' }}>📱 QPay QR Код</h4>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0' }}>
                        Банкны аппаар QR код уншуулна уу
                      </p>
                      <img 
                        src={`data:image/png;base64,${qpayData.qr_image}`} 
                        alt="QPay QR"
                        style={{
                          width: '200px',
                          height: '200px',
                          borderRadius: '12px',
                          border: '4px solid #22c55e'
                        }}
                      />
                    </div>
                    
                    {/* Deep link buttons */}
                    {qpayData.urls && qpayData.urls.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#047857' }}>
                          🏦 Банкны апп сонгох:
                        </h4>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gap: '8px' 
                        }}>
                          {qpayData.urls.slice(0, 6).map((bank, idx) => (
                            <a
                              key={idx}
                              href={bank.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '10px 8px',
                                background: 'white',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb',
                                textDecoration: 'none',
                                color: '#1f2937',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              {bank.logo && (
                                <img 
                                  src={bank.logo} 
                                  alt={bank.name}
                                  style={{ width: '32px', height: '32px', marginBottom: '4px', borderRadius: '6px' }}
                                />
                              )}
                              <span style={{ textAlign: 'center' }}>{bank.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: '#fef3c7', 
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#92400e'
                    }}>
                      💡 Төлбөр амжилттай хийгдсэний дараа эрх автоматаар нээгдэнэ.
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                    <p style={{ color: '#dc2626', marginBottom: '16px' }}>
                      QPay холболт одоогоор боломжгүй байна
                    </p>
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      style={{
                        padding: '10px 20px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🏦 Банк шилжүүлэг ашиглах
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bank Details - only show when bank method selected */}
            {paymentMethod === 'bank' && (
            <>
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>
                🏦 Дансны мэдээлэл
              </h4>
              
              {/* Bank Name */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Банк
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                    Хаан банк
                  </span>
                  <button
                    onClick={() => copyToClipboard('Хаан банк', 'bank')}
                    style={{
                      background: copied === 'bank' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {copied === 'bank' ? '✓ Хуулсан' : '📋 Хуулах'}
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Дансны дугаар
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>
                    5401345831
                  </span>
                  <button
                    onClick={() => copyToClipboard('5401345831', 'account')}
                    style={{
                      background: copied === 'account' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {copied === 'account' ? '✓ Хуулсан' : '📋 Хуулах'}
                  </button>
                </div>
              </div>

              {/* Account Name */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Дансны нэр
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                    Б.Баярсайхан
                  </span>
                  <button
                    onClick={() => copyToClipboard('Б.Баярсайхан', 'name')}
                    style={{
                      background: copied === 'name' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {copied === 'name' ? '✓ Хуулсан' : '📋 Хуулах'}
                  </button>
                </div>
              </div>

              {/* Phone Number */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Утасны дугаар
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', fontFamily: 'monospace' }}>
                    95520443
                  </span>
                  <button
                    onClick={() => copyToClipboard('95520443', 'phone')}
                    style={{
                      background: copied === 'phone' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {copied === 'phone' ? '✓ Хуулсан' : '📋 Хуулах'}
                  </button>
                </div>
              </div>

              {/* 🆕 Payment Code */}
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  Гүйлгээний утга (CODE)
                </div>
                {codeLoading ? (
                  <div style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    ⏳ Код үүсгэж байна...
                  </div>
                ) : paymentCode ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '3px solid #fbbf24'
                  }}>
                    <span style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      color: '#92400e', 
                      fontFamily: 'monospace',
                      letterSpacing: '2px'
                    }}>
                      {paymentCode.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(paymentCode.code, 'code')}
                      style={{
                        background: copied === 'code' ? '#10b981' : '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      {copied === 'code' ? '✓ Хуулсан' : '📋 Хуулах'}
                    </button>
                  </div>
                ) : (
                  <div style={{
                    background: '#fee2e2',
                    padding: '12px',
                    borderRadius: '12px',
                    color: '#991b1b',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}>
                    ⚠️ Код үүсгэхэд алдаа гарлаа
                  </div>
                )}
              </div>
            </div>

            {/* Instructions - only for bank transfer */}
            <div style={{
              background: '#ede9fe',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '2px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '14px', color: '#5b21b6', lineHeight: '1.8' }}>
                <strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                  📌 Төлбөр төлөх заавар:
                </strong>
                <ol style={{ margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Дансанд шилжүүлэг хийх:</strong> Дээрх дансны мэдээлэл ашиглана
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#f59e0b' }}>⚠️ ГҮЙЛГЭЭНИЙ УТГА дээр</strong> дээрх <strong style={{ fontFamily: 'monospace', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>{paymentCode?.code || 'PZ-XXXXXX'}</strong> кодыг бичнэ үү!
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    Шилжүүлэг амжилттай хийгдсэний дараа таны утас дээр <strong>SMS ирнэ</strong>
                  </li>
                  <li>
                    Систем <strong>автоматаар</strong> SMS-ийг уншиж, кодыг баталгаажуулаад эрхийг нээнэ ✅
                  </li>
                </ol>
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#fef3c7', 
                  borderRadius: '8px',
                  border: '1px solid #fbbf24'
                }}>
                  <strong>💡 Анхааруулга:</strong> Гүйлгээний утга дээр <strong>кодыг заавал</strong> оруулна уу. Энэ кодоор таны төлбөрийг таних болно!
                </div>
              </div>
            </div>
            </> 
            )}

            {/* Action Button */}
            <button
              onClick={() => {
                setShowPayment(false);
                setToast({ 
                  message: '💰 Шилжүүлэг хийсний дараа SMS баталгаажуулалт хүлээнэ үү', 
                  type: 'info' 
                });
              }}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
              }}
            >
              ✅ Ойлголоо
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!showModal) return null;

  return (
    <>
      <div className="subscription-modal-overlay">
        <div className="subscription-modal">
          <div className="modal-header">
            <h2>{effectiveType === 'center' ? 'Game Center Эзэмшигчийн план' : 'Планаа сонгоорой'}</h2>
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
              <span>🏢 Game Center эзэмшигч болж, өөрийн төвийг удирдаарай!</span>
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
  
  {/* Payment Success Modal */}
  {paymentSuccess && (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'scaleIn 0.3s ease'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          fontSize: '40px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
        }}>
          ✓
        </div>
        
        <h2 style={{
          margin: '0 0 12px 0',
          fontSize: '24px',
          fontWeight: '800',
          color: '#1f2937'
        }}>
          🎉 Баяр хүргэе!
        </h2>
        
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '16px',
          color: '#4b5563',
          lineHeight: '1.6'
        }}>
          Таны төлбөр амжилттай баталгаажлаа!<br/>
          <strong style={{ color: '#059669' }}>{successPlanName}</strong> эрх идэвхжлээ.
        </p>
        
        <div style={{
          background: '#f0fdf4',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '2px solid #10b981'
        }}>
          <div style={{ fontSize: '14px', color: '#047857', fontWeight: '600' }}>
            ✅ 30 хоногийн эрх нээгдлээ
          </div>
        </div>
        
        <button
          onClick={() => {
            setPaymentSuccess(false);
            refreshSubscription();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          Үргэлжлүүлэх →
        </button>
      </div>
    </div>
  )}
  
  {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </>
  );
};

export default SubscriptionPlans;