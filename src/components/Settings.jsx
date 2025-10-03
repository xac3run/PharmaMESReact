import React, { useState } from 'react';
import { Globe, Shield } from 'lucide-react';
import { rolePermissions as initialRolePermissions } from '../data/demoData';

export default function Settings({ 
  language, 
  setLanguage, 
  currentUser,
  addAuditEntry,
  rolePermissions,
  setRolePermissions
}) {
  const [editingRole, setEditingRole] = useState(null);
  
  const t = (key) => {
    const translations = {
      en: {
        settings: "Settings",
        language: "Language",
        userProfile: "User Profile",
        name: "Name",
        role: "Role",
        department: "Department",
        systemInformation: "System Information",
        version: "Version",
        lastUpdate: "Last Update",
        environment: "Environment",
        rolePermissions: "Role Permissions",
        canCreateBatch: "Can Create Batch",
        canStartBatch: "Can Start Batch",
        canExecuteSteps: "Can Execute Steps",
        canApproveFormulas: "Can Approve Formulas",
        canCreateFormulas: "Can Create Formulas",
        canCreateWorkflows: "Can Create Workflows",
        canApproveWorkflows: "Can Approve Workflows",
        canManageMaterials: "Can Manage Materials",
        canValidateMaterials: "Can Validate Materials",
        canManageEquipment: "Can Manage Equipment",
        canManageWorkStations: "Can Manage Work Stations",
        canManagePersonnel: "Can Manage Personnel",
        canCreateUsers: "Can Create Users",
        canViewAudit: "Can View Audit",
        canExportReports: "Can Export Reports",
        canManageRoles: "Can Manage Roles",
        allWorkStations: "Access All Work Stations"
      },
      ru: {
        settings: "Настройки",
        language: "Язык",
        userProfile: "Профиль пользователя",
        name: "Имя",
        role: "Роль",
        department: "Отдел",
        systemInformation: "Информация о системе",
        version: "Версия",
        lastUpdate: "Последнее обновление",
        environment: "Среда",
        rolePermissions: "Права ролей",
        canCreateBatch: "Может создавать партии",
        canStartBatch: "Может запускать партии",
        canExecuteSteps: "Может выполнять шаги",
        canApproveFormulas: "Может утверждать формулы",
        canCreateFormulas: "Может создавать формулы",
        canCreateWorkflows: "Может создавать процессы",
        canApproveWorkflows: "Может утверждать процессы",
        canManageMaterials: "Может управлять материалами",
        canValidateMaterials: "Может валидировать материалы",
        canManageEquipment: "Может управлять оборудованием",
        canManageWorkStations: "Может управлять станциями",
        canManagePersonnel: "Может управлять персоналом",
        canCreateUsers: "Может создавать пользователей",
        canViewAudit: "Может просматривать аудит",
        canExportReports: "Может экспортировать отчеты",
        canManageRoles: "Может управлять ролями",
        allWorkStations: "Доступ ко всем станциям"
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const canManageRoles = currentUser.role === "Admin";

  return (
    <div className="glass-card">
      <h2 className="text-2xl font-bold mb-6">{t('settings')}</h2>
      <div className="space-y-6">
        <div>
          <label className="block font-semibold mb-2 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            {t('language')}
          </label>
          <select 
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              addAuditEntry("Settings Changed", `Language changed to ${e.target.value}`);
            }}
            className="border rounded px-4 py-2"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="ru">Русский</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">{t('userProfile')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('name')}:</span>
              <span className="font-semibold">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('role')}:</span>
              <span className="font-semibold">{currentUser.role}</span>
            </div>
            {currentUser.department && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('department')}:</span>
                <span className="font-semibold">{currentUser.department}</span>
              </div>
            )}
          </div>
        </div>
        
        {canManageRoles && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              {t('rolePermissions')}
            </h3>
            <div className="space-y-4">
              {Object.keys(rolePermissions).map(role => (
                <div key={role} className="border rounded-lg p-4 bg-white/40">
                  <h4 className="font-semibold mb-3">{role}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(rolePermissions[role]).map(permission => (
                      <label key={permission} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={rolePermissions[role][permission]}
                          onChange={(e) => {
                            setRolePermissions(prev => ({
                              ...prev,
                              [role]: {
                                ...prev[role],
                                [permission]: e.target.checked
                              }
                            }));
                            addAuditEntry(
                              "Role Permission Changed", 
                              `${role} - ${permission}: ${e.target.checked}`
                            );
                          }}
                          className="rounded"
                        />
                        <span>{t(permission)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">{t('systemInformation')}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>{t('version')}: 2.0.0</p>
            <p>{t('lastUpdate')}: October 2025</p>
            <p>{t('environment')}: Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}