import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config";
import { FaTimes, FaMapMarkerAlt, FaSave, FaGamepad, FaUpload, FaTrash } from "react-icons/fa";
import PickerModal from "../../components/ListComponents/PickerModal";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import Toast from "../../components/LittleComponents/Toast";

const emptyForm = {
  name: "",
  category: "gaming",
  address: "",
  phone: "",
  email: "",
  website: "",
  opening: "",
  price: "",
  pricing: {
    standard: "",
    vip: "",
    stage: "",
    overnight: ""
  },
  rating: "",
  isVip: false,
  logo: "",
  images: "",
  videos: "",
  embedVideos: "",
  facilities: "",
  lat: "", 
  lng: "" 
};export default function AdminForm({ editingItem = null, onSaved, onCancel, isOpen = false }) {
  const { token } = useAuth();
  const { subscription, plan, isOwner } = useSubscription();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Хуучин зургууд
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]); // Хуучин видеонууд
  const [toast, setToast] = useState(null);

  // Business Standard: allow max 3 images; no video upload
  const isBusinessStandard = Boolean(isOwner && (plan === 'business_standard'));
  // Fallback to 3 if server hasn't populated maxImages yet
  const allowedImages = isBusinessStandard
    ? (Number(subscription?.maxImages) > 0 ? Number(subscription?.maxImages) : 3)
    : Infinity;
  const canUploadVideo = isOwner ? Boolean(subscription?.canUploadVideo ?? (plan !== 'business_standard')) : true;

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name || "",
        category: editingItem.category || "gaming",
        address: editingItem.address || "",
        phone: editingItem.phone || "",
        email: editingItem.email || "",
        website: editingItem.website || "",
        opening: editingItem.opening || "",
        price: editingItem.price || "",
        pricing: {
          standard: editingItem.pricing?.standard || "",
          vip: editingItem.pricing?.vip || "",
          stage: editingItem.pricing?.stage || "",
          overnight: editingItem.pricing?.overnight || ""
        },
        rating: editingItem.rating || "",
        isVip: editingItem.isVip || false,
        logo: editingItem.logo || "",
        images: editingItem.images ? editingItem.images.join('\n') : "",
        videos: editingItem.videos ? editingItem.videos.join('\n') : "",
        embedVideos: editingItem.embedVideos ? editingItem.embedVideos.join('\n') : "",
        facilities: editingItem.facilities ? editingItem.facilities.join('\n') : "",
        lat: editingItem.lat ?? "",
        lng: editingItem.lng ?? ""
      });
      // Edit үед uploadedImages-г хоосон байлгах (хуучин зургууд давтагдахаас сэргийлэх)
      setUploadedImages([]);
      setUploadedVideos([]);
      // Хуучин зураг, видеог тусдаа state-д хадгалах
      setExistingImages(editingItem.images || []);
      setExistingVideos(editingItem.videos || []);
    } else {
      setForm(emptyForm);
      setUploadedImages([]);
      setUploadedVideos([]);
      setExistingImages([]);
      setExistingVideos([]);
    }
    const handler = (e) => {
      const { lat, lng } = e.detail || {};
      if (lat != null && lng != null) {
        setForm((s) => ({ ...s, lat: lat.toString(), lng: lng.toString() }));
        setPickerOpen(false);
      }
    };
    window.addEventListener("picker:selected", handler);
    return () => window.removeEventListener("picker:selected", handler);
  }, [editingItem]);

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Enforce image limit for Business Standard
    const urlImagesCount = form.images ? form.images.split('\n').filter((u) => u.trim()).length : 0;
    const currentCount = existingImages.length + uploadedImages.length + urlImagesCount;
    const remaining = allowedImages === Infinity ? Infinity : Math.max(allowedImages - currentCount, 0);

    if (remaining === 0) {
      setToast({ type: 'error', message: `Бизнес Стандарт: дээд тал нь ${allowedImages} зураг оруулах боломжтой` });
      e.target.value = '';
      return;
    }

    const toProcess = remaining === Infinity ? files : files.slice(0, remaining);
    if (files.length > toProcess.length) {
      setToast({ type: 'error', message: `Зургийн тоо ${allowedImages}-ын хязгаартай. Илүү файлууд нэмэгдсэнгүй.` });
    }

    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 2 төрлийн зураг үүсгэх: thumbnail болон high quality
          
          // 1. Thumbnail (жагсаалт, карт зэрэгт ашиглах) - хурдан ачаалагдана
          const thumbnailCanvas = document.createElement('canvas');
          const thumbnailCtx = thumbnailCanvas.getContext('2d');
          
          const thumbnailMaxWidth = 400;
          const thumbnailMaxHeight = 300;
          let thumbWidth = img.width;
          let thumbHeight = img.height;
          
          const thumbnailRatio = Math.min(thumbnailMaxWidth / thumbWidth, thumbnailMaxHeight / thumbHeight);
          if (thumbnailRatio < 1) {
            thumbWidth = Math.round(thumbWidth * thumbnailRatio);
            thumbHeight = Math.round(thumbHeight * thumbnailRatio);
          }
          
          thumbnailCanvas.width = thumbWidth;
          thumbnailCanvas.height = thumbHeight;
          thumbnailCtx.imageSmoothingEnabled = true;
          thumbnailCtx.imageSmoothingQuality = 'high';
          thumbnailCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
          const thumbnailImage = thumbnailCanvas.toDataURL('image/jpeg', 0.8);
          
          // 2. High Quality (дэлгэрэнгүй харуулах үед) - сайн чанартай
          const highQualityCanvas = document.createElement('canvas');
          const highQualityCtx = highQualityCanvas.getContext('2d');
          
          const maxWidth = 1920;  // Full HD хэмжээ - веб дээр маш сайн харагдана
          const maxHeight = 1080;
          let { width, height } = img;
          
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          if (ratio < 1) {
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          highQualityCanvas.width = width;
          highQualityCanvas.height = height;
          highQualityCtx.imageSmoothingEnabled = true;
          highQualityCtx.imageSmoothingQuality = 'high';
          highQualityCtx.drawImage(img, 0, 0, width, height);
          
          // High quality-г progressive compression хийх
          let quality = 0.9; // 90% чанараас эхлэх - маш сайн чанар
          let highQualityImage = highQualityCanvas.toDataURL('image/jpeg', quality);
          
          // Зөвхөн хэт том бол чанарыг бага зэрэг бууруулна (1MB max)
          const maxSizeBytes = 1024 * 1024; // 1MB max - өндөр чанар хадгалах
          let attempts = 0;
          while (highQualityImage.length > maxSizeBytes && quality > 0.7 && attempts < 3) {
            quality -= 0.05; // Бага зэрэг бууруулна
            highQualityImage = highQualityCanvas.toDataURL('image/jpeg', quality);
            attempts++;
          }
          
          // Хэмжээ мэдээллийг консолд хэвлэх
          const thumbnailSizeKB = Math.round(thumbnailImage.length / 1024);
          const highQualitySizeKB = Math.round(highQualityImage.length / 1024);
          console.log(`Image processed:
            Thumbnail: ${thumbWidth}x${thumbHeight}, ${thumbnailSizeKB}KB
            High Quality: ${width}x${height}, ${highQualitySizeKB}KB, quality: ${(quality * 100).toFixed(0)}%`);
          
          // Хоёр зургийг object болгон хадгалах
          const imageData = {
            thumbnail: thumbnailImage,
            highQuality: highQualityImage,
            originalName: file.name
          };
          
          setUploadedImages(prev => [...prev, imageData]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Video функцууд - сайжруулсан compression
  const handleVideoUpload = (e) => {
    if (!canUploadVideo) {
      setToast({ type: 'error', message: 'Видео оруулахын тулд Business Pro план шаардлагатай' });
      e.target.value = '';
      return;
    }
    const files = Array.from(e.target.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      setToast({ type: 'error', message: 'Зөвхөн video файл upload хийж болно!' });
      return;
    }

    videoFiles.forEach(file => {
      // Video file хэмжээг шалгах - ямар ч хэмжээ хүлээж авна
      console.log(`Processing video: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        // Video мэдээлэл object болгон хадгалах
        const videoData = {
          data: event.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        };
        
        // TODO: Video compression энд нэмж болно (FFmpeg.js ашиглан)
        // Одоохондоо шууд хадгална
        setUploadedVideos(prev => [...prev, videoData]);
        
        console.log(`Video processed: ${file.name}, stored size: ${(event.target.result.length / 1024 / 1024).toFixed(2)}MB`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeVideo = (index) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingVideo = (index) => {
    setExistingVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Logo-н хэмжээг тохируулах
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Logo-д зориулсан хэмжээ (жижиг, дөрвөлжин)
          const maxSize = 200;
          
          let { width, height } = img;
          
          // Дөрвөлжин болгох (хамгийн жижиг талыг ашиглах)
          const size = Math.min(width, height);
          
          canvas.width = maxSize;
          canvas.height = maxSize;
          
          // Дунд хэсгээс авах (crop)
          const startX = (width - size) / 2;
          const startY = (height - size) / 2;
          
          // Зургийг canvas дээр зурах
          ctx.drawImage(img, startX, startY, size, size, 0, 0, maxSize, maxSize);
          
          // Logo base64 авах
          const logoImage = canvas.toDataURL('image/png', 0.9);
          setForm(prev => ({ ...prev, logo: logoImage }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Coordinate байхгүй бол map picker нээх
    if (!form.lat || !form.lng || form.lat === "" || form.lng === "") {
      setPickerOpen(true);
      return;
    }
    
    setSaving(true);
    try {
      // Зургийн array бэлтгэх
      let finalImages = [];
      
      if (editingItem) {
        // Edit режимд: existingImages болон шинэ uploadedImages-г нэгтгэх
        finalImages = [...existingImages];
        
        // Шинээр upload хийсэн зургуудыг нэмэх (thumbnail + high quality format)
        if (uploadedImages.length > 0) {
          uploadedImages.forEach(imageData => {
            if (typeof imageData === 'object' && imageData.thumbnail && imageData.highQuality) {
              // Шинэ format: object with thumbnail & high quality
              finalImages.push(imageData);
            } else {
              // Хуучин format: зөвхөн string
              finalImages.push(imageData);
            }
          });
        }
        
        // URL-аар оруулсан зургийг нэмэх
        if (form.images && form.images.trim()) {
          const urlImages = form.images.split('\n').filter(url => url.trim());
          // Давхардаагүй зургийг л нэмэх
          urlImages.forEach(url => {
            if (!finalImages.find(img => 
              (typeof img === 'string' && img === url) || 
              (typeof img === 'object' && img.highQuality === url)
            )) {
              finalImages.push(url); // URL зураг - string байдлаар хадгална
            }
          });
        }
      } else {
        // Шинэ item режимд: uploadedImages болон URL зургуудыг нэмэх
        finalImages = [...uploadedImages]; // Энэ нь thumbnail + high quality objects байна
        
        if (form.images && form.images.trim()) {
          const urlImages = form.images.split('\n').filter(url => url.trim());
          finalImages = [...finalImages, ...urlImages]; // URL зургууд - string байдлаар нэмэгдэнэ
        }
      }

      // Video array бэлтгэх - зөвхөн upload хийсэн видеонуудыг ашиглах (URL-ээр нэмэхийг болиулсан)
      let finalVideos = [];
      
      if (editingItem) {
        // Edit режимд: existingVideos болон шинэ uploadedVideos-г нэгтгэх
        finalVideos = [...existingVideos];
        
        // Шинээр upload хийсэн видеонуудыг нэмэх
        if (uploadedVideos.length > 0) {
          uploadedVideos.forEach(videoData => {
            if (typeof videoData === 'object' && videoData.data) {
              // Шинэ format: video object
              finalVideos.push(videoData);
            } else {
              // Хуучин format: зөвхөн string
              finalVideos.push(videoData);
            }
          });
        }
        // Видео холбоосоор нэмэхийг дэмжихгүй
      } else {
        // Шинэ item режимд: зөвхөн upload хийсэн видеонууд
        finalVideos = [...uploadedVideos]; // Энэ нь video objects байна
      }

      // Embed Videos array бэлтгэх
      let finalEmbedVideos = [];
      if (form.embedVideos && form.embedVideos.trim()) {
        finalEmbedVideos = form.embedVideos.split('\n').filter(embed => embed.trim());
      }

      const payload = { 
        ...form, 
        lat: form.lat === "" ? undefined : Number(form.lat), 
        lng: form.lng === "" ? undefined : Number(form.lng),
        rating: form.rating === "" ? undefined : Number(form.rating),
        isVip: Boolean(form.isVip),
        logo: form.logo || undefined,
        images: finalImages,
        videos: finalVideos,
        embedVideos: finalEmbedVideos,
        facilities: form.facilities ? form.facilities.split('\n').filter(f => f.trim()) : []
      };
      
      // Payload хэмжээг шалгах
      const payloadSize = JSON.stringify(payload).length;
      const payloadSizeMB = (payloadSize / 1024 / 1024).toFixed(2);
      console.log(`Payload size: ${payloadSizeMB} MB`);
      console.log(`Images count: ${finalImages.length} (with thumbnail + high quality)`);
      
      // Enforce image count limit just before submit
      if (allowedImages !== Infinity && finalImages.length > allowedImages) {
        setToast({ type: 'error', message: `Дээд тал нь ${allowedImages} зураг оруулах боломжтой. Илүүг хасна уу.` });
        return;
      }

      // If plan doesn't allow video, strip them from payload safely
      if (!canUploadVideo) {
        finalVideos = [];
        finalEmbedVideos = [];
      }

      // Аюулгүй хэмжээ: 20MB (high quality + thumbnail зургуудад хангалттай)
      if (payloadSize > 20 * 1024 * 1024) { 
        setToast({ type: 'error', message: `Нийт мэдээлэл хэт том байна (${payloadSizeMB}MB). Цөөн зураг оруулна уу эсвэл зургуудыг багцлан нэмнэ үү.` });
        return;
      }
      let res;
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (editingItem && (editingItem._id || editingItem.id)) {
        res = await axios.put(`${API_BASE}/api/centers/${editingItem._id ?? editingItem.id}`, payload, config);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'success', message: 'PC Center амжилттай шинэчлэгдлээ' } }));
      } else {
        res = await axios.post(`${API_BASE}/api/centers`, payload, config);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'success', message: 'PC Center амжилттай нэмэгдлээ' } }));
      }
      window.dispatchEvent(new CustomEvent("centers:updated", { detail: res.data }));
      onSaved && onSaved(res.data);
    } catch (err) {
      console.error("Save error:", err);
      
      // Error message-г илүү дэлгэрэнгүй харуулах
      let errorMessage = "Save failed";
      if (err.response) {
        if (err.response.status === 413) {
          errorMessage = "Зураг хэт том байна. Жижиг зураг сонгоно уу.";
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "20px"
    }}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "600px",
        maxHeight: "90vh",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 24px 0 24px",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: "linear-gradient(135deg, #1976d2, #42a5f5)",
              borderRadius: "12px",
              padding: "12px",
              color: "#fff"
            }}>
              <FaGamepad size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a1a" }}>
                {editingItem ? "PC Center засах" : "Шинэ PC Center нэмэх"}
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "14px" }}>
                {editingItem ? "Центрийн мэдээллийг шинэчлэх" : "Шинэ тоглоомын газрын мэдээлэл оруулах"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              fontSize: "20px"
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Form Content */}
        <div style={{ 
          padding: "0 24px 24px 24px", 
          maxHeight: "calc(90vh - 120px)", 
          overflowY: "auto" 
        }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: "18px", 
                fontWeight: "600", 
                color: "#333",
                borderBottom: "2px solid #e3f2fd",
                paddingBottom: "8px"
              }}>
                Үндсэн мэдээлэл
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Нэр *
                  </label>
                  <input
                    type="text"
                    placeholder="Galaxy Gaming Center"
                    value={form.name}
                    onChange={onChange("name")}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Төрөл
                  </label>
                  <select
                    value={form.category}
                    onChange={onChange("category")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                      background: "#fff"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  >
                    <option value="gaming">Gaming Center</option>
                    <option value="internet">Internet Cafe</option>
                    <option value="console">Console Gaming</option>
                    <option value="vr">VR Gaming</option>
                    <option value="shop">Game Shop</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Хаяг *
                </label>
                <input
                  type="text"
                  placeholder="Сүхбаатар дүүрэг, 1-р хороо, Улаанбаатар"
                  value={form.address}
                  onChange={onChange("address")}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Pricing Section */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#333", fontSize: "18px", fontWeight: "600" }}>
                  💰 Үнийн мэдээлэл
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "14px" }}>
                      🎮 Заал (₮/цаг)
                    </label>
                    <input
                      type="number"
                      placeholder="3000"
                      value={form.pricing.standard}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm(s => ({
                          ...s,
                          pricing: { ...s.pricing, standard: value },
                          price: value ? `${value}₮/цаг` : ""
                        }));
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "2px solid #e0e0e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#4caf50"}
                      onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                    />
                    {form.pricing.standard && (
                      <div style={{ fontSize: "12px", color: "#4caf50", marginTop: "4px", fontWeight: "500" }}>
                        {parseInt(form.pricing.standard || 0).toLocaleString()}₮/цаг
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "14px" }}>
                      👑 VIP өрөө (₮/цаг)
                    </label>
                    <input
                      type="number"
                      placeholder="5000"
                      value={form.pricing.vip}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm(s => ({ ...s, pricing: { ...s.pricing, vip: value } }));
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "2px solid #e0e0e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#ff9800"}
                      onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                    />
                    {form.pricing.vip && (
                      <div style={{ fontSize: "12px", color: "#ff9800", marginTop: "4px", fontWeight: "500" }}>
                        {parseInt(form.pricing.vip || 0).toLocaleString()}₮/цаг
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "14px" }}>
                      🎭 Stage өрөө (₮/цаг)
                    </label>
                    <input
                      type="number"
                      placeholder="7000"
                      value={form.pricing.stage}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm(s => ({ ...s, pricing: { ...s.pricing, stage: value } }));
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "2px solid #e0e0e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#9c27b0"}
                      onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                    />
                    {form.pricing.stage && (
                      <div style={{ fontSize: "12px", color: "#9c27b0", marginTop: "4px", fontWeight: "500" }}>
                        {parseInt(form.pricing.stage || 0).toLocaleString()}₮/цаг
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "14px" }}>
                      🌙 Хоног (₮/хоног)
                    </label>
                    <input
                      type="number"
                      placeholder="15000"
                      value={form.pricing.overnight}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm(s => ({ ...s, pricing: { ...s.pricing, overnight: value } }));
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "2px solid #e0e0e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#3f51b5"}
                      onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                    />
                    {form.pricing.overnight && (
                      <div style={{ fontSize: "12px", color: "#3f51b5", marginTop: "4px", fontWeight: "500" }}>
                        {parseInt(form.pricing.overnight || 0).toLocaleString()}₮/хоног
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Үндсэн үнэ (хуучин)
                  </label>
                  <input
                    type="text"
                    placeholder="3000₮/час автомат үүсэх"
                    value={form.price}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      background: "#f5f5f5",
                      color: "#666",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Үнэлгээ (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    placeholder="4.5"
                    value={form.rating}
                    onChange={onChange("rating")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "8px" }}>
                  <input
                    type="checkbox"
                    checked={form.isVip || false}
                    onChange={(e) => setForm((s) => ({ ...s, isVip: e.target.checked }))}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: "600", color: "#333" }}>VIP Special Center</span>
                </label>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Утасны дугаар
                </label>
                <input
                  type="tel"
                  placeholder="+976 9999 9999"
                  value={form.phone}
                  onChange={onChange("phone")}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: "18px", 
                fontWeight: "600", 
                color: "#333",
                borderBottom: "2px solid #e3f2fd",
                paddingBottom: "8px"
              }}>
                Харилцааны мэдээлэл
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    placeholder="info@galaxygaming.mn"
                    value={form.email}
                    onChange={onChange("email")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Вебсайт
                  </label>
                  <input
                    type="url"
                    placeholder="www.galaxygaming.mn"
                    value={form.website}
                    onChange={onChange("website")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Цагийн хуваарь
                </label>
                <input
                  type="text"
                  placeholder="10:00 - 23:00"
                  value={form.opening}
                  onChange={onChange("opening")}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: "18px", 
                fontWeight: "600", 
                color: "#333",
                borderBottom: "2px solid #e3f2fd",
                paddingBottom: "8px"
              }}>
                Байршил
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Өргөрөг (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="47.918"
                    value={form.lat}
                    onChange={onChange("lat")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Уртраг (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="106.917"
                    value={form.lng}
                    onChange={onChange("lng")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                </div>
              </div>

              <div style={{ 
                marginTop: "16px", 
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  style={{
                    background: "linear-gradient(45deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <FaMapMarkerAlt />
                  📍 Pick Location
                </button>
                
                {(form.lat && form.lng) && (
                  <div style={{ 
                    color: "#22c55e", 
                    fontSize: "14px", 
                    fontWeight: "500" 
                  }}>
                    ✅ Байршил сонгогдсон ({Number(form.lat).toFixed(3)}, {Number(form.lng).toFixed(3)})
                  </div>
                )}
              </div>

              <div style={{ 
                marginTop: "12px", 
                padding: "12px", 
                background: "#f8f9fa", 
                borderRadius: "8px",
                fontSize: "14px",
                color: "#666",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaMapMarkerAlt style={{ color: "#1976d2" }} />
                <span>Submit хийхэд байршил заагаагүй бол автоматаар газрын зураг гарч ирнэ</span>
              </div>
            </div>

            {/* Images & Facilities */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ 
                margin: "0 0 16px 0", 
                fontSize: "18px", 
                fontWeight: "600", 
                color: "#333",
                borderBottom: "2px solid #e3f2fd",
                paddingBottom: "8px"
              }}>
                Зураг болон дэд бүтэц
              </h3>
              
              {/* Logo Upload */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Logo зураг
                </label>
                
                <div style={{ 
                  border: "2px dashed #e0e0e0", 
                  borderRadius: "8px", 
                  padding: "20px",
                  textAlign: "center",
                  background: "#fafafa"
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: "none" }}
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <FaUpload /> Logo сонгох
                  </label>
                  
                  {form.logo && (
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ 
                        width: "100px", 
                        height: "100px", 
                        margin: "0 auto",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "3px solid #667eea",
                        background: "white"
                      }}>
                        <img 
                          src={form.logo} 
                          alt="Logo" 
                          style={{ 
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover" 
                          }} 
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, logo: "" }))}
                        style={{
                          marginTop: "8px",
                          padding: "6px 12px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        <FaTrash /> Устгах
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Зураг оруулах
                </label>
                
                <div style={{ 
                  border: "2px dashed #e0e0e0", 
                  borderRadius: "8px", 
                  padding: "20px",
                  textAlign: "center",
                  background: "#fafafa"
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      border: "none"
                    }}
                  >
                    <FaUpload />
                    Зураг сонгох
                  </label>
                  <p style={{ margin: "12px 0 0 0", color: "#666", fontSize: "14px" }}>
                    JPG, PNG файл сонгоно уу (олон зураг сонгож болно)
                  </p>
                  {allowedImages !== Infinity && (
                    <p style={{ margin: "8px 0 0 0", color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>
                      Бизнес Стандарт: дээд тал нь {allowedImages} зураг
                    </p>
                  )}
                </div>

                {/* Image Preview */}
                {(existingImages.length > 0 || uploadedImages.length > 0) && (
                  <div style={{ marginTop: "16px" }}>
                    {/* Хуучин зургууд (Edit үед) */}
                    {existingImages.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ marginBottom: "12px", fontWeight: "500", color: "#333" }}>
                          Хуучин зургууд ({existingImages.length})
                        </p>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
                          gap: "12px" 
                        }}>
                          {existingImages.map((img, index) => {
                            const src = typeof img === 'object' ? (img.thumbnail || img.highQuality) : img;
                            const title = typeof img === 'object' ? (img.originalName || 'Existing image') : `Existing ${index + 1}`;
                            return (
                              <div key={`existing-${index}`} style={{ position: "relative" }}>
                                <img
                                  src={src}
                                  alt={title}
                                  title={title}
                                  style={{
                                    width: "100%",
                                    height: "100px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "2px solid #e0e0e0",
                                    background: "#f5f5f5"
                                  }}
                                />
                                {typeof img === 'object' && img.highQuality && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    left: 4,
                                    padding: '2px 6px',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#fff',
                                    background: 'rgba(0,0,0,0.55)',
                                    borderRadius: 6
                                  }}>
                                    HQ
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeExistingImage(index)}
                                  style={{
                                    position: "absolute",
                                    top: "4px",
                                    right: "4px",
                                    background: "#ff4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "24px",
                                    height: "24px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px"
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Шинээр оруулсан зургууд */}
                    {uploadedImages.length > 0 && (
                      <div>
                        <p style={{ marginBottom: "12px", fontWeight: "500", color: "#333" }}>
                          Шинээр оруулсан зургууд ({uploadedImages.length})
                        </p>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
                          gap: "12px" 
                        }}>
                          {uploadedImages.map((img, index) => (
                            <div key={`new-${index}`} style={{ position: "relative" }}>
                              <img
                                src={typeof img === 'object' ? img.thumbnail : img}
                                alt={typeof img === 'object' ? img.originalName : `Upload ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "2px solid #4CAF50"
                                }}
                                title={typeof img === 'object' ? `${img.originalName} (High Quality зураг бэлэн)` : ''}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  background: "#ff4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px"
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* URL Input (Alternative) */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Эсвэл зургийн холбоос оруулах (шинэ мөрөөр тусгаарла)
                </label>
                <textarea
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  value={form.images}
                  onChange={onChange("images")}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Video Upload Section */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "16px", fontWeight: "600", color: "#333", fontSize: "18px" }}>
                  🎬 Видео оруулах
                </label>

                {/* Video File Upload */}
                <div style={{ 
                  border: "2px dashed #e0e0e0", 
                  borderRadius: "8px", 
                  padding: "20px",
                  textAlign: "center",
                  background: "#fafafa",
                  marginBottom: "16px"
                }}>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                    style={{ display: "none" }}
                    id="video-upload"
                    disabled={!canUploadVideo}
                  />
                  <label
                    htmlFor="video-upload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 24px",
                      background: canUploadVideo ? "linear-gradient(135deg, #667eea, #764ba2)" : "#cbd5e1",
                      color: canUploadVideo ? "#fff" : "#6b7280",
                      borderRadius: "8px",
                      cursor: canUploadVideo ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      fontWeight: "500",
                      border: "none",
                      fontSize: "14px"
                    }}
                  >
                    🎥 Видео сонгох
                  </label>
                  <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#666" }}>
                    {canUploadVideo ? 'MP4, AVI, MOV файл сонгоно уу (олон видео сонгож болно, 50MB хүртэл)' : 'Бизнес Стандарт пландад видео оруулах боломжгүй'}
                  </p>
                </div>

                {/* Video Preview */}
                {canUploadVideo && (existingVideos.length > 0 || uploadedVideos.length > 0) && (
                  <div style={{ marginBottom: "16px" }}>
                    {/* Existing Videos */}
                    {existingVideos.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <p style={{ marginBottom: "12px", fontWeight: "500", color: "#333" }}>
                          Одоо байгаа видеонууд ({existingVideos.length})
                        </p>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                          gap: "12px" 
                        }}>
                          {existingVideos.map((video, index) => (
                            <div key={`existing-video-${index}`} style={{ position: "relative" }}>
                              <video
                                src={video}
                                controls
                                style={{
                                  width: "100%",
                                  height: "120px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "2px solid #2196F3"
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingVideo(index)}
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  background: "#f44336",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px"
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Newly Uploaded Videos */}
                    {uploadedVideos.length > 0 && (
                      <div>
                        <p style={{ marginBottom: "12px", fontWeight: "500", color: "#333" }}>
                          Шинээр оруулсан видеонууд ({uploadedVideos.length})
                        </p>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                          gap: "12px" 
                        }}>
                          {uploadedVideos.map((video, index) => (
                            <div key={`new-video-${index}`} style={{ position: "relative" }}>
                              <video
                                src={typeof video === 'object' ? video.data : video}
                                controls
                                style={{
                                  width: "100%",
                                  height: "120px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "2px solid #4CAF50"
                                }}
                                title={typeof video === 'object' ? `${video.name} (${(video.size / 1024 / 1024).toFixed(2)}MB)` : ''}
                              />
                              <button
                                type="button"
                                onClick={() => removeVideo(index)}
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  background: "#f44336",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "24px",
                                  height: "24px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px"
                                }}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Видео холбоосоор нэмэхийг хассан - зөвхөн upload эсвэл embed */}

                {/* Embed Video Input */}
                {canUploadVideo && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Embed видео (YouTube, Vimeo, etc) - iframe эсвэл холбоос
                  </label>
                  <textarea
                    placeholder="YouTube: https://www.youtube.com/watch?v=VIDEO_ID&#10;Facebook: https://www.facebook.com/reel/1149883142838636/&#10;Instagram: https://www.instagram.com/p/POST_ID/&#10;Vimeo: https://vimeo.com/VIDEO_ID&#10;Эсвэл бүрэн iframe embed code оруулна уу"
                    value={form.embedVideos || ""}
                    onChange={onChange("embedVideos")}
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "2px solid #e0e0e0",
                      borderRadius: "8px",
                      fontSize: "16px",
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                  <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>
                    {canUploadVideo ? 'YouTube, Facebook, Instagram, Vimeo холбоос эсвэл бүрэн iframe embed code оруулж болно' : 'Видео линк/эмбед хийх боломжгүй (Business Pro шаардлагатай)'}
                  </p>
                </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                  Дэд бүтэц буюу боломжууд/тоног төхөөрөмж (шинэ мөрөөр тусгаарла)
                </label>
                <textarea
                  placeholder="Gaming PC (RTX 4080)&#10;PlayStation 5&#10;Xbox Series X&#10;VR Gaming&#10;Wi-Fi&#10;Ундаа, хоол"
                  value={form.facilities}
                  onChange={onChange("facilities")}
                  rows={6}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    resize: "vertical",
                    fontFamily: "inherit"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#1976d2"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: "flex", 
              gap: "12px", 
              paddingTop: "24px",
              borderTop: "1px solid #e0e0e0"
            }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#666",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Цуцлах
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2,
                  padding: "14px 24px",
                  border: "none",
                  borderRadius: "8px",
                  background: saving ? "#ccc" : "linear-gradient(135deg, #1976d2, #42a5f5)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {saving ? (
                  <>
                    <div style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}></div>
                    Хадгалж байна...
                  </>
                ) : (
                  <>
                    <FaSave />
                    {editingItem ? "Өөрчлөлт хадгалах" : "PC Center нэмэх"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Picker Modal */}
      {pickerOpen && (
        <PickerModal 
          onCancel={() => setPickerOpen(false)} 
          onConfirm={(pos) => {
            const { lat, lng } = pos;
            setForm((s) => ({ ...s, lat: lat.toString(), lng: lng.toString() }));
            setPickerOpen(false);
          }} 
        />
      )}
    </div>
  );
}