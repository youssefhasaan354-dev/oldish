import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const AdminTextsEditor: React.FC = () => {
  const { siteSettings, updateSettings, sections, updateSection } = useData();
  const { role } = useAuth();
  const isReadOnly = role === 'viewer';

  const [activeTab, setActiveTab] = useState<'settings' | 'story' | 'atmosphere' | 'reservations'>('settings');

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#161616', margin: '0 0 4px 0' }}>
          محرر النصوص المزدوج (Bilingual Texts Editor)
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
          تعديل العناوين والفقرات باللغتين العربية والإنجليزية جنباً إلى جنب مع عداد الحروف وتنبيه الترجمات الناقصة
        </p>
      </div>

      {/* Tabs */}
      <div className="category-pills" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={`cat-pill ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          النصوص العامة والواجهة (Branding &amp; Hero)
        </button>
        <button
          type="button"
          className={`cat-pill ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
        >
          نصوص قصة المكان (Story)
        </button>
        <button
          type="button"
          className={`cat-pill ${activeTab === 'atmosphere' ? 'active' : ''}`}
          onClick={() => setActiveTab('atmosphere')}
        >
          نصوص الأجواء والخدمات (Atmosphere)
        </button>
      </div>

      {/* Tab 1: General & Hero */}
      {activeTab === 'settings' && (
        <div className="admin-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', color: 'var(--color-charcoal)' }}>
            العناوين الرئيسية والشعارات (Brand &amp; Tagline)
          </h3>

          <div className="text-editor-row">
            {/* Arabic Input */}
            <div className="text-editor-col">
              <label className="form-label">
                <span>اسم المطعم (العربية)</span>
                <span className="char-counter">{siteSettings.brand_name_ar.length} حرف</span>
              </label>
              <input
                type="text"
                value={siteSettings.brand_name_ar}
                disabled={isReadOnly}
                onChange={(e) => updateSettings({ brand_name_ar: e.target.value })}
                className="form-input"
              />
              {!siteSettings.brand_name_ar.trim() && (
                <span className="translation-warning">⚠️ حقل الاسم بالعربية فارغ!</span>
              )}
            </div>

            {/* English Input */}
            <div className="text-editor-col">
              <label className="form-label">
                <span>Brand Name (English)</span>
                <span className="char-counter">{siteSettings.brand_name_en.length} chars</span>
              </label>
              <input
                type="text"
                value={siteSettings.brand_name_en}
                disabled={isReadOnly}
                onChange={(e) => updateSettings({ brand_name_en: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>
          </div>

          <div className="text-editor-row" style={{ marginTop: '16px' }}>
            <div className="text-editor-col">
              <label className="form-label">
                <span>الشعار الرسمي (Arabic Tagline)</span>
                <span className="char-counter">{siteSettings.tagline_ar.length} حرف</span>
              </label>
              <input
                type="text"
                value={siteSettings.tagline_ar}
                disabled={isReadOnly}
                onChange={(e) => updateSettings({ tagline_ar: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="text-editor-col">
              <label className="form-label">
                <span>Official Tagline (English)</span>
                <span className="char-counter">{siteSettings.tagline_en.length} chars</span>
              </label>
              <input
                type="text"
                value={siteSettings.tagline_en}
                disabled={isReadOnly}
                onChange={(e) => updateSettings({ tagline_en: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>
          </div>

          <div className="text-editor-row" style={{ marginTop: '16px' }}>
            <div className="text-editor-col">
              <label className="form-label">
                <span>الوصف الفرعي (Arabic Subline)</span>
                <span className="char-counter">{siteSettings.subline_ar.length} حرف</span>
              </label>
              <input
                type="text"
                value={siteSettings.subline_ar}
                disabled={isReadOnly}
                onChange={(e) => updateSettings({ subline_ar: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="text-editor-col">
              <label className="form-label">
                <span>Subline (English)</span>
                <span className="char-counter">{siteSettings.subline_en.length} chars</span>
              </label>
              <input
                type="text"
                value={siteSettings.subline_en}
                disabled={isReadOnly}
                onChange={(e) => updateSettings({ subline_en: e.target.value })}
                className="form-input"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Story Section */}
      {activeTab === 'story' && (
        <div className="admin-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', color: 'var(--color-charcoal)' }}>
            فقرات قصة المكان والمدخل التراثي (Story Blocks)
          </h3>

          {(() => {
            const storySec = sections.find(s => s.key === 'story');
            const content = storySec?.content || {};

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Block 1 */}
                <div style={{ background: '#F8F6F2', padding: '16px', borderRadius: '6px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>الفقرة الأولى: المدخل والبيت العتيق</h4>
                  <div className="text-editor-row">
                    <div className="text-editor-col">
                      <label className="form-label">العنوان (عربي)</label>
                      <input
                        type="text"
                        value={content.block1_title_ar || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block1_title_ar: e.target.value } })}
                        className="form-input"
                      />
                    </div>
                    <div className="text-editor-col">
                      <label className="form-label">Title (English)</label>
                      <input
                        type="text"
                        value={content.block1_title_en || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block1_title_en: e.target.value } })}
                        className="form-input"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="text-editor-row" style={{ marginTop: '12px' }}>
                    <div className="text-editor-col">
                      <label className="form-label">النص (عربي)</label>
                      <textarea
                        rows={3}
                        value={content.block1_text_ar || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block1_text_ar: e.target.value } })}
                        className="form-textarea"
                      />
                    </div>
                    <div className="text-editor-col">
                      <label className="form-label">Text (English)</label>
                      <textarea
                        rows={3}
                        value={content.block1_text_en || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block1_text_en: e.target.value } })}
                        className="form-textarea"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 2 */}
                <div style={{ background: '#F8F6F2', padding: '16px', borderRadius: '6px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>الفقرة الثانية: واحة الفناء والحديقة</h4>
                  <div className="text-editor-row">
                    <div className="text-editor-col">
                      <label className="form-label">العنوان (عربي)</label>
                      <input
                        type="text"
                        value={content.block2_title_ar || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block2_title_ar: e.target.value } })}
                        className="form-input"
                      />
                    </div>
                    <div className="text-editor-col">
                      <label className="form-label">Title (English)</label>
                      <input
                        type="text"
                        value={content.block2_title_en || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block2_title_en: e.target.value } })}
                        className="form-input"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="text-editor-row" style={{ marginTop: '12px' }}>
                    <div className="text-editor-col">
                      <label className="form-label">النص (عربي)</label>
                      <textarea
                        rows={3}
                        value={content.block2_text_ar || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block2_text_ar: e.target.value } })}
                        className="form-textarea"
                      />
                    </div>
                    <div className="text-editor-col">
                      <label className="form-label">Text (English)</label>
                      <textarea
                        rows={3}
                        value={content.block2_text_en || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('story', { content: { ...content, block2_text_en: e.target.value } })}
                        className="form-textarea"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 3: Atmosphere Cards */}
      {activeTab === 'atmosphere' && (
        <div className="admin-card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', color: 'var(--color-charcoal)' }}>
            بطاقات الأجواء والخدمات (Atmosphere Cards)
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '16px' }}>
            تعديل نصوص بطاقات الخدمات (الفناء، الصالون الداخلي، مناسب للعمل والدراسة، طرق الدفع والمواقف).
          </p>

          {(() => {
            const sec = sections.find(s => s.key === 'atmosphere');
            const content = sec?.content || {};

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#F8F6F2', padding: '14px', borderRadius: '4px' }}>
                  <div className="text-editor-row">
                    <div className="text-editor-col">
                      <label className="form-label">بطاقة 1 (عربي)</label>
                      <input
                        type="text"
                        value={content.card1_title_ar || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('atmosphere', { content: { ...content, card1_title_ar: e.target.value } })}
                        className="form-input"
                      />
                    </div>
                    <div className="text-editor-col">
                      <label className="form-label">Card 1 (English)</label>
                      <input
                        type="text"
                        value={content.card1_title_en || ''}
                        disabled={isReadOnly}
                        onChange={(e) => updateSection('atmosphere', { content: { ...content, card1_title_en: e.target.value } })}
                        className="form-input"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
