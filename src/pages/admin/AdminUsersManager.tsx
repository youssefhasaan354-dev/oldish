import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { AdminUser, UserRole } from '../../types';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Lock, 
  X,
  Crown
} from 'lucide-react';

import { 
  isFirebaseConfigured, 
  loadAdminsFromFirestore, 
  saveAdminToFirestore, 
  deleteAdminFromFirestore 
} from '../../lib/firebase';

const INITIAL_DEMO_USERS: AdminUser[] = [
  {
    id: 'AeJXyph2xyXUZfQOWIs4gwrJrYT2',
    email: 'owner@oldish.eg',
    role: 'owner',
    created_at: '2026-10-17T00:00:00.000Z',
    last_sign_in_at: new Date().toISOString()
  },
  {
    id: 'user_2',
    email: 'manager@oldish.eg',
    role: 'editor',
    created_at: '2026-10-17T00:00:00.000Z',
    last_sign_in_at: '2026-10-17T12:00:00.000Z'
  },
  {
    id: 'user_3',
    email: 'auditor@oldish.eg',
    role: 'viewer',
    created_at: '2026-10-17T00:00:00.000Z',
    last_sign_in_at: '2026-10-17T14:30:00.000Z'
  }
];

export const AdminUsersManager: React.FC = () => {
  const { user: currentUser, role: currentRole } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_DEMO_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('editor');

  useEffect(() => {
    if (isFirebaseConfigured()) {
      loadAdminsFromFirestore()
        .then((admins) => {
          if (admins.length > 0) {
            setUsers(admins);
          } else if (currentUser) {
            setUsers([currentUser]);
          }
        })
        .catch(err => console.warn('Failed to load admins from Firestore:', err));
    }
  }, [currentUser]);

  // Permission Guard: Only owner can manage users
  if (currentRole !== 'owner') {
    return (
      <div className="admin-page-container">
        <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Lock size={48} style={{ color: '#E53E3E', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#1A202C', margin: '0 0 8px 0' }}>صلاحية مقصورة على المالك (Owner Only)</h2>
          <p style={{ color: '#718096', maxWidth: '440px', margin: '0 auto 24px auto', fontSize: '0.9375rem' }}>
            إدارة المستخدمين والصلاحيات متاحة فقط لحساب مالك النظام. أنت مسجل حالياً بصلاحية ({currentRole}).
          </p>
        </div>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const emailClean = newEmail.trim().toLowerCase();
    const newUser: AdminUser = {
      id: `usr_${Date.now()}`,
      email: emailClean,
      role: newRole,
      created_at: new Date().toISOString()
    };

    if (isFirebaseConfigured()) {
      try {
        await saveAdminToFirestore(newUser);
      } catch (err: any) {
        alert('فشل إضافة المستخدم في قاعدة البيانات: ' + (err?.message || 'خطأ غير معروف'));
        return;
      }
    }

    setUsers([...users, newUser]);
    setNewEmail('');
    setIsModalOpen(false);
    alert(`تمت إضافة المستخدم ${emailClean} بصلاحية (${newRole}). عند تسجيله للمرة الأولى سيتم تطبيق صلاحياته فوراً.`);
  };

  const handleChangeRole = async (userId: string, newRoleVal: UserRole) => {
    if (userId === currentUser?.id) {
      alert('لا يمكنك تغيير صلاحية حسابك الخاص أثناء تسجيل الدخول.');
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updatedUser: AdminUser = { ...target, role: newRoleVal };

    if (isFirebaseConfigured()) {
      try {
        await saveAdminToFirestore(updatedUser);
      } catch (err: any) {
        alert('فشل تحديث الصلاحية: ' + (err?.message || 'خطأ غير معروف'));
        return;
      }
    }

    setUsers(users.map(u => u.id === userId ? updatedUser : u));
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الخاص.');
      return;
    }
    if (confirm(`هل أنت متأكد من سحب صلاحيات الحساب ${user.email}؟`)) {
      if (isFirebaseConfigured()) {
        try {
          await deleteAdminFromFirestore(user.id);
        } catch (err: any) {
          alert('فشل حذف المستخدم: ' + (err?.message || 'خطأ غير معروف'));
          return;
        }
      }
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  return (
    <div className="admin-page-container">
      {/* Top Banner */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.375rem' }}>إدارة المستخدمين والصلاحيات (Users & Roles)</h2>
              <span className="badge badge-gold">
                <Crown size={12} style={{ marginLeft: '4px' }} />
                صلاحية المالك
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#666' }}>
              التحكم في وصول فريق العمل إلى لوحة الإدارة وتحديد أدوار كل مستخدم (مالك، محرر، مشاهد).
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>دعوة مستخدم جديد</span>
          </button>
        </div>
      </div>

      {/* Role Definitions Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="admin-card" style={{ padding: '16px', borderTop: '3px solid var(--color-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Crown size={16} style={{ color: 'var(--color-gold)' }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>المالك (Owner)</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#666', lineHeight: '1.5' }}>
            صلاحيات كاملة تشمل إدارة المستخدمين، تعديل الهوية، نشر التحديثات، واسترجاع النسخ السابقة.
          </p>
        </div>

        <div className="admin-card" style={{ padding: '16px', borderTop: '3px solid #3182CE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={16} style={{ color: '#3182CE' }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>محرر (Editor)</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#666', lineHeight: '1.5' }}>
            تعديل المنيو والأسعار، رفع الصور، تحرير النصوص ومواقع الصور، ونشر التحديثات.
          </p>
        </div>

        <div className="admin-card" style={{ padding: '16px', borderTop: '3px solid #718096' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Users size={16} style={{ color: '#718096' }} />
            <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>مشاهد (Viewer)</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#666', lineHeight: '1.5' }}>
            صلاحية قراءة فقط للاطلاع على الإحصائيات وصندوق الاستفسارات دون إمكانية التعديل.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>البريد الإلكتروني</th>
                <th>الدور الحالي</th>
                <th>تاريخ الإضافة</th>
                <th>آخر تسجيل دخول</th>
                <th style={{ textAlign: 'center' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ background: isCurrent ? '#FFFDF8' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                          style={{ 
                            width: '34px', 
                            height: '34px', 
                            borderRadius: '50%', 
                            background: u.role === 'owner' ? 'var(--color-gold)' : '#E2E8F0', 
                            color: u.role === 'owner' ? '#fff' : '#4A5568',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.875rem'
                          }}
                        >
                          {u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-charcoal)' }}>
                            {u.email}
                          </div>
                          {isCurrent && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                              (حسابك الحالي)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <select
                        className="form-input"
                        style={{ width: '130px', padding: '4px 8px', fontSize: '0.8125rem' }}
                        value={u.role}
                        disabled={isCurrent}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                      >
                        <option value="owner">المالك (Owner)</option>
                        <option value="editor">محرر (Editor)</option>
                        <option value="viewer">مشاهد (Viewer)</option>
                      </select>
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: '#666' }}>
                      {new Date(u.created_at).toLocaleDateString('ar-EG')}
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: '#666' }}>
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('ar-EG') : 'لم يسجل بعد'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {!isCurrent && (
                          <button
                            type="button"
                            className="btn-icon-subtle delete"
                            onClick={() => handleDeleteUser(u)}
                            title="سحب الصلاحية وحذف المستخدم"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="admin-modal-header">
              <h3>دعوة مستخدم جديد للوحة التحكم</h3>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    dir="ltr"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@oldish.eg"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الدور والصلاحية *</label>
                  <select
                    className="form-input"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="editor">محرر (Editor) — تعديل ونشر المحتوى والصور</option>
                    <option value="viewer">مشاهد (Viewer) — استعراض اللوحة والطلبات فقط</option>
                    <option value="owner">مالك (Owner) — صلاحيات إدارية كاملة</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  إرسال الدعوة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
