import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { MediaItem } from '../../types';
import { 
  Upload, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  X
} from 'lucide-react';

export const AdminMediaLibrary: React.FC = () => {
  const { mediaList, addMedia, updateMedia, deleteMedia, imageSlots, menuItems } = useData();
  const { role } = useAuth();
  const isReadOnly = role === 'viewer';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'real' | 'unused'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Edit Modal State
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ id: string; count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert/resize image to WebP client-side
  const processImageFile = async (file: File): Promise<{ dataUrl: string; width: number; height: number; size: number }> => {
    return new Promise((resolve, reject) => {
      // If SVG or non-raster, keep original
      if (file.type.includes('svg')) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result as string,
            width: 512,
            height: 512,
            size: file.size
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDimension = 2000;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const webpUrl = canvas.toDataURL('image/webp', 0.88);
        resolve({
          dataUrl: webpUrl,
          width,
          height,
          size: Math.round(webpUrl.length * 0.75) // approximate bytes
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || isReadOnly) return;
    setIsUploading(true);
    setUploadProgress(10);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { dataUrl, width, height, size } = await processImageFile(file);
        const newMedia: MediaItem = {
          id: `media-${Date.now()}-${i}`,
          storage_path: `real/${file.name.replace(/\s+/g, '_')}`,
          public_url: dataUrl,
          width,
          height,
          bytes: size,
          alt_en: file.name.split('.')[0],
          alt_ar: 'صورة من مطعم وكافيه أولديش',
          caption_en: '',
          caption_ar: '',
          tags: ['real', 'uploaded'],
          is_ai: false, // Uploaded by user -> real!
          created_at: new Date().toISOString()
        };
        addMedia(newMedia);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        console.error('Upload processing error:', err);
      }
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(null);
    }, 400);
  };

  // Filter items
  const filteredList = mediaList.filter((m) => {
    if (filterType === 'ai' && !m.is_ai) return false;
    if (filterType === 'real' && m.is_ai) return false;

    // Check unused
    if (filterType === 'unused') {
      const usedInSlots = Object.values(imageSlots).some(s => s.media_id === m.id);
      const usedInMenu = menuItems.some(item => item.media_id === m.id);
      if (usedInSlots || usedInMenu) return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTag = m.tags?.some(t => t.toLowerCase().includes(q));
      const matchAlt = m.alt_en.toLowerCase().includes(q) || m.alt_ar.toLowerCase().includes(q);
      if (!matchTag && !matchAlt) return false;
    }

    return true;
  });

  const handleDeleteClick = (media: MediaItem) => {
    if (isReadOnly) return;
    const res = deleteMedia(media.id);
    if (!res.success) {
      setDeleteWarning({ id: media.id, count: res.usageCount });
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#161616', margin: '0 0 4px 0' }}>
            مكتبة الوسائط والصور (Media Library)
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            رفع الصور، التحويل التلقائي لصيغة WebP، وتحديد الصور الحقيقية والتوضيحية
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => handleFilesUpload(e.target.files)}
          />
          <button
            type="button"
            disabled={isReadOnly || isUploading}
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            <span>{isUploading ? `جارٍ المعالجة (${uploadProgress}%)...` : 'رفع صور جديدة (WebP)'}</span>
          </button>
        </div>
      </div>

      {isReadOnly && (
        <div className="admin-alert info" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>حسابك في وضع العرض فقط (Viewer) — مسموح تصفح المكتبة دون تعديل أو حذف.</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        className="admin-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFilesUpload(e.dataTransfer.files);
        }}
        onClick={() => !isReadOnly && fileInputRef.current?.click()}
      >
        <ImageIcon size={36} style={{ color: 'var(--color-gold)', marginInline: 'auto', marginBottom: '8px' }} />
        <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#333' }}>
          اسحب وأفلت الصور هنا، أو انقر للاختيار من جهازك
        </p>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>
          يتم تحويل الصور تلقائياً إلى صيغة WebP وضغطها لسرعة فائقة (الحد الأقصى 2000px)
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBlock: '20px' }}>
        <div className="menu-search-box" style={{ maxWidth: '320px', margin: 0 }}>
          <Search size={16} className="menu-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالوصف أو الوسم..."
            className="menu-search-input"
            style={{ paddingBlock: '8px' }}
          />
        </div>

        <div className="category-pills" style={{ margin: 0 }}>
          <button
            type="button"
            className={`cat-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            جميع الصور ({mediaList.length})
          </button>
          <button
            type="button"
            className={`cat-pill ${filterType === 'real' ? 'active' : ''}`}
            onClick={() => setFilterType('real')}
          >
            📷 صور حقيقية ({mediaList.filter(m => !m.is_ai).length})
          </button>
          <button
            type="button"
            className={`cat-pill ${filterType === 'ai' ? 'active' : ''}`}
            onClick={() => setFilterType('ai')}
          >
            🤖 صور توضيحية AI ({mediaList.filter(m => m.is_ai).length})
          </button>
          <button
            type="button"
            className={`cat-pill ${filterType === 'unused' ? 'active' : ''}`}
            onClick={() => setFilterType('unused')}
          >
            غير مستخدمة
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="admin-media-grid">
        {filteredList.map((media) => {
          const usedCount = Object.values(imageSlots).filter(s => s.media_id === media.id).length;
          return (
            <div key={media.id} className="admin-media-card">
              <div className="media-thumb-wrap">
                <img src={media.public_url} alt={media.alt_ar || media.alt_en} />
                <span 
                  className="badge" 
                  style={{
                    position: 'absolute',
                    top: '8px',
                    insetInlineStart: '8px',
                    background: media.is_ai ? 'rgba(158, 71, 56, 0.85)' : 'rgba(83, 99, 75, 0.85)',
                    color: '#FFF',
                    fontSize: '0.6875rem'
                  }}
                >
                  {media.is_ai ? 'صورة توضيحية AI' : 'صورة حقيقية'}
                </span>
                {usedCount > 0 && (
                  <span 
                    className="badge" 
                    style={{
                      position: 'absolute',
                      top: '8px',
                      insetInlineEnd: '8px',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#FFF',
                      fontSize: '0.6875rem'
                    }}
                  >
                    مستخدمة في {usedCount} موقع
                  </span>
                )}
              </div>

              <div style={{ padding: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.8125rem', fontWeight: 600, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {media.alt_ar || media.alt_en}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {media.tags?.map((t, idx) => (
                    <span key={idx} style={{ fontSize: '0.6875rem', background: '#EEE', padding: '2px 6px', borderRadius: '3px', color: '#555' }}>
                      #{t}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EEE', paddingTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline-gold btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => setEditingMedia(media)}
                  >
                    <Edit3 size={13} />
                    <span>تعديل التفاصيل</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    className="btn btn-outline-light btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#C53030', borderColor: '#E2E8F0' }}
                    onClick={() => handleDeleteClick(media)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <div className="lightbox-modal" role="dialog" onClick={() => setDeleteWarning(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C53030', marginBottom: '12px' }}>
              <AlertCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>لا يمكن حذف الصورة</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#555', lineHeight: '1.6' }}>
              هذه الصورة مستخدمة حالياً في <strong>{deleteWarning.count}</strong> موقع بالموقع أو بأصناف القائمة.
              يرجى تغيير الصورة في تلك الأقسام أولاً قبل الحذف لحماية تناسق الموقع.
            </p>
            <div style={{ textAlign: 'left', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeleteWarning(null)}
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {editingMedia && (
        <div className="lightbox-modal" role="dialog" onClick={() => setEditingMedia(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>تعديل تفاصيل الصورة</h3>
              <button type="button" onClick={() => setEditingMedia(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', marginBottom: '16px' }}>
              <img 
                src={editingMedia.public_url} 
                alt="Preview" 
                style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '4px' }} 
              />
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={editingMedia.is_ai}
                    onChange={(e) => setEditingMedia({ ...editingMedia, is_ai: e.target.checked })}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    صورة توضيحية ذكاء اصطناعي (AI Illustrative Image)
                  </span>
                </label>
                <p style={{ fontSize: '0.75rem', color: '#777', margin: 0 }}>
                  عند تفعيل هذا الخيار، سيظهر تلقائياً وسم "صورة توضيحية / Illustrative image" فوق الصورة في الموقع العام التزاماً بالأمانة المهنية.
                </p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>النص البديل (عربي) - Alt Text</label>
              <input
                type="text"
                value={editingMedia.alt_ar}
                onChange={(e) => setEditingMedia({ ...editingMedia, alt_ar: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Alt Text (English)</label>
              <input
                type="text"
                value={editingMedia.alt_en}
                onChange={(e) => setEditingMedia({ ...editingMedia, alt_en: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>شرح الصورة (عربي) - Caption</label>
              <textarea
                rows={2}
                value={editingMedia.caption_ar || ''}
                onChange={(e) => setEditingMedia({ ...editingMedia, caption_ar: e.target.value })}
                className="form-textarea"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Caption (English)</label>
              <textarea
                rows={2}
                value={editingMedia.caption_en || ''}
                onChange={(e) => setEditingMedia({ ...editingMedia, caption_en: e.target.value })}
                className="form-textarea"
                dir="ltr"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => setEditingMedia(null)}
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isReadOnly}
                className="btn btn-primary btn-sm"
                onClick={() => {
                  updateMedia(editingMedia.id, editingMedia);
                  setEditingMedia(null);
                }}
              >
                <Check size={14} />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
