import React, { useState, useRef } from 'react';
import { useVisualEdit } from '../context/VisualEditContext';
import { useData } from '../context/DataContext';
import { 
  X, 
  Upload, 
  Crosshair, 
  RotateCcw, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

export const VisualSlotEditorModal: React.FC = () => {
  const { activeEditingSlotKey, setActiveEditingSlotKey } = useVisualEdit();
  const { 
    imageSlots, 
    updateImageSlot, 
    replaceSlotImage, 
    undoSlotReplacement, 
    resetSlotToDefault, 
    sessionUndoMap 
  } = useData();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [cropWarning, setCropWarning] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeEditingSlotKey) return null;

  const slot = imageSlots[activeEditingSlotKey];
  if (!slot) return null;

  const currentImageUrl = slot.media_url || slot.default_url || '/images/oldish_courtyard_hero.webp';
  const hasUndo = Boolean(sessionUndoMap[slot.slot_key]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    updateImageSlot(slot.slot_key, {
      object_position_x: Math.max(0, Math.min(100, x)),
      object_position_y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await executeUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('جاري فحص وتجهيز الصورة...');
    setCropWarning(null);
    setUploadError(null);
    setUploadSuccess(false);

    const result = await replaceSlotImage(slot.slot_key, file, {
      onProgress: (pct, msg) => {
        setUploadProgress(pct);
        setUploadStatus(msg);
      }
    });

    setIsUploading(false);
    if (result.success) {
      setUploadSuccess(true);
      if (result.cropWarning) setCropWarning(result.cropWarning);
      setTimeout(() => setUploadSuccess(false), 3500);
    } else {
      setUploadError(result.error || 'فشل استبدال الصورة.');
    }
  };

  return (
    <div 
      className="visual-edit-modal-backdrop" 
      onClick={() => setActiveEditingSlotKey(null)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="visual-edit-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '24px',
          fontFamily: 'Cairo, sans-serif'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-gold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                {slot.section}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#718096', fontFamily: 'monospace' }}>
                {slot.slot_key}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1A202C', fontWeight: 700 }}>
              تعديل الصورة: {slot.label_ar}
            </h3>
            <div style={{ fontSize: '0.8125rem', color: '#718096' }}>
              {slot.label_en} {slot.recommended_size ? `• المقاس الموصى به: ${slot.recommended_size}` : ''}
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => setActiveEditingSlotKey(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: '#718096' }}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload Status / Progress */}
        {isUploading && (
          <div style={{ background: '#FFFDF5', border: '1px solid #FEEBC8', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: '#7B341E', marginBottom: '4px' }}>
              <span>{uploadStatus}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--color-gold)', transition: 'width 200ms ease' }} />
            </div>
          </div>
        )}

        {/* Success Alert */}
        {uploadSuccess && (
          <div style={{ background: '#F0FFF4', border: '1px solid #9AE6B4', color: '#22543D', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} style={{ color: '#38A169' }} />
            <span>تم استبدال الصورة فوراً مع الحفاظ على موضعها وتكبيرها ونقطة التركيز!</span>
          </div>
        )}

        {/* Crop Warning Alert */}
        {cropWarning && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>تنبيه نسبة الأبعاد:</strong> {cropWarning}
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FEB2B2', color: '#9B2C2C', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={16} style={{ color: '#E53E3E' }} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            <span>رفع واستبدال الصورة الآن</span>
          </button>

          {hasUndo && (
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={() => undoSlotReplacement(slot.slot_key)}
            >
              <RotateCcw size={14} />
              <span>تراجع عن الاستبدال (Undo)</span>
            </button>
          )}

          {slot.default_url && (
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              onClick={() => resetSlotToDefault(slot.slot_key)}
            >
              <span>استعادة الصورة الافتراضية</span>
            </button>
          )}
        </div>

        {/* Interactive Click-to-Focal Canvas */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8125rem' }}>
            <span style={{ fontWeight: 600, color: '#2D3748' }}>
              <Crosshair size={14} style={{ display: 'inline', marginInlineEnd: '4px', color: 'var(--color-gold)' }} />
              انقر على أي نقطة بالصورة لتحديد نقطة التركيز (Focal Point):
            </span>
            <span style={{ fontFamily: 'monospace', color: '#718096' }}>
              X: {slot.object_position_x}% | Y: {slot.object_position_y}%
            </span>
          </div>

          <div
            onClick={handleImageClick}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '8px',
              background: '#111',
              cursor: 'crosshair',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img 
              src={currentImageUrl} 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {/* Crosshair dot */}
            <div 
              style={{
                position: 'absolute',
                left: `${slot.object_position_x}%`,
                top: `${slot.object_position_y}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                border: '2px solid #FFF',
                borderRadius: '50%',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--color-gold)', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Zoom & Overlay sliders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#F8F9FA', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>التكبير (Zoom)</span>
              <span>{slot.zoom || 1}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={slot.zoom || 1}
              onChange={(e) => updateImageSlot(slot.slot_key, { zoom: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-gold)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>التعتيم (Overlay)</span>
              <span>{Math.round((slot.overlay_opacity || 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={slot.overlay_opacity || 0}
              onChange={(e) => updateImageSlot(slot.slot_key, { overlay_opacity: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-gold)' }}
            />
          </div>
        </div>

        {/* Close Done Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveEditingSlotKey(null)}
          >
            <span>إتمام التعديل وإغلاق</span>
          </button>
        </div>
      </div>
    </div>
  );
};
