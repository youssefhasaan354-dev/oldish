import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { Sparkles } from 'lucide-react';
import { EditableImageSlot } from './EditableImageSlot';

export const StorySection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { sections, getImageForSlot } = useData();

  const storySection = sections.find(s => s.key === 'story');
  const content = storySection?.content || {};

  const block0Img = getImageForSlot('story.block.0', '/images/oldish_vintage_interior.webp');
  const block1Img = getImageForSlot('story.block.1', '/images/oldish_courtyard_hero.webp');
  const block2Img = getImageForSlot('story.block.2', '/images/oldish_egyptian_tagine.webp');

  const blocks = [
    {
      titleEn: content.block1_title_en || 'The Entrance & Vintage Hall',
      titleAr: content.block1_title_ar || 'المدخل والأروقة التراثية',
      subtitleEn: 'Mid-Century Downtown Cairo House Style',
      subtitleAr: 'طراز بيت قاهري كلاسيكي من منتصف القرن العشرين',
      textEn: content.block1_text_en || 'Stepping into Oldish feels like discovering a cozy Cairo residence from decades past. The entrance is artfully covered in torn vintage newspaper and magazine scraps, while a glass display showcases an antique radio, a classic jacket, and a traditional tarboush. Wooden windows styled after historic Downtown apartments and a drinks bar behind glass set an intimate, welcoming tone.',
      textAr: content.block1_text_ar || 'الدخول إلى أولديش يعيد إليك ذكريات البيوت القاهرية القديمة؛ فالمدخل مزين بقصاصات المجلات والجرائد التراثية، إلى جانب فترينة زجاجية تعرض راديو عتيقاً وبدلة كلاسيكية وطربوشاً، مع نوافذ خشبية تعكس طراز عمارة وسط البلد وبار مشروبات أنيق خلف الزجاج.',
      media: block0Img
    },
    {
      titleEn: content.block2_title_en || 'The Courtyard & Garden',
      titleAr: content.block2_title_ar || 'الفناء والحديقة المفتوحة',
      subtitleEn: 'A Leafy Oasis Steps from Tahrir Square',
      subtitleAr: 'واحة خضراء هادئة على بُعد خطوات من ميدان التحرير',
      textEn: content.block2_text_en || 'Through a rustic wooden gate and a quaint walkway, guests emerge into our signature brick-lined open courtyard. Surrounded by balconies, lush potted plants, and leafy trees, the courtyard is a beloved destination in Downtown Cairo for taking photos, enjoying a sunny breakfast, working, studying with free Wi-Fi, or sharing unhurried conversations with friends.',
      textAr: content.block2_text_ar || 'عبر بوابة خشبية وممر هادئ، ينفتح المكان على فناء فسيح محاط بجدران الطوب الأحمر والشرفات المطلة وأشجار الزينة وأواني الزهور. يعتبر الفناء ملاذاً شهيراً في وسط البلد لالتقاط الصور التذكارية، وتناول الفطور، والدراسة والعمل مع توافر الواي فاي، وقضاء أجمل الأوقات بصحبة الأصدقاء.',
      media: block1Img
    },
    {
      titleEn: content.block3_title_en || 'Comforting Egyptian & Western Dishes',
      titleAr: content.block3_title_ar || 'أطباق مصرية وعالمية مريحة',
      subtitleEn: "Clay Pot Tagines & Oldish's Own Bread",
      subtitleAr: 'طواجن الفخار البلدي وعيش أولديش المميز',
      textEn: content.block3_text_en || "Our kitchen focuses on authentic flavors that satisfy the soul: traditional bubbling clay tagines—such as okra with meat, moussaka with minced meat, and kebab halla—alongside our popular marinated grilled 'Oldish Chicken' (served with mushroom, lemon, or mustard sauce), club sandwiches, and traditional sand-brewed Turkish coffee, all accompanied by Oldish's own freshly baked bread.",
      textAr: content.block3_text_ar || 'يقدم مطبخ أولديش أشهى النكهات التراثية: طواجن الفخار المصرية كطاجن البامية باللحمة، والمسقعة باللحمة المفرومة، وكباب الحلة، وطاجن الفريك بالدجاج، بالإضافة إلى طبق دجاج أولديش المشوي بصوص المشروم أو الليمون أو المستردة، والكلوب ساندوتش، والقهوة على الرمل، وجميعها تقدم مع عيش أولديش الطازج.',
      media: block2Img
    }
  ];

  if (storySection && !storySection.visible) {
    return null;
  }

  return (
    <section id="story" className="section" aria-labelledby="story-heading">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">
            <Sparkles size={14} />
            <span>{isRTL ? 'عن المكان وأجوائه' : 'The Oldish Experience'}</span>
          </div>
          <h2 id="story-heading" className="section-title">
            {isRTL ? content.title_ar : content.title_en}
          </h2>
          <div className="gold-divider">
            <span className="gold-divider-diamond" />
          </div>
          <p className="section-lead">
            {isRTL ? content.lead_ar : content.lead_en}
          </p>
        </div>

        {/* Editorial Alternating Rows */}
        <div className="editorial-container">
          {blocks.map((block, index) => {
            const isReverse = index % 2 === 1;
            return (
              <div 
                key={index} 
                className={`editorial-row ${isReverse ? 'reverse' : ''}`}
              >
                {/* Media with illustrative badge */}
                <div className="editorial-media">
                  <div className="editorial-media-frame">
                    <EditableImageSlot
                      slotKey={`story.block.${index}`}
                      fallbackUrl={block.media.url}
                      width="600"
                      height="400"
                    />
                    {block.media.isAi && (
                      <span 
                        className="badge" 
                        style={{
                          position: 'absolute',
                          bottom: '12px',
                          insetInlineStart: '12px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#E8E5DF',
                          fontSize: '0.7rem',
                          zIndex: 3
                        }}
                      >
                        {isRTL ? 'صورة توضيحية' : 'Illustrative image'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Narrative Text */}
                <div className="editorial-content">
                  <div className="section-eyebrow">
                    <span>
                      {isRTL ? block.subtitleAr : block.subtitleEn}
                    </span>
                  </div>
                  <h3>
                    {isRTL ? block.titleAr : block.titleEn}
                  </h3>
                  <p>
                    {isRTL ? block.textAr : block.textEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
