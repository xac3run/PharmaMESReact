import React from 'react';
import { Globe } from 'lucide-react';

export default function Settings({ 
  language, 
  setLanguage, 
  currentUser,
  addAuditEntry
}) {
  return (
    <div className="glass-card">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block font-semibold mb-2 flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Language
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
          <h3 className="font-semibold mb-3">User Profile</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold">{currentUser.role}</span>
            </div>
            {currentUser.department && (
              <div className="flex justify-between">
                <span className="text-gray-600">Department:</span>
                <span className="font-semibold">{currentUser.department}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">System Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Version: 2.0.0</p>
            <p>Last Update: October 2025</p>
            <p>Environment: Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
