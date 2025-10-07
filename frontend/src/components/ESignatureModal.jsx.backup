import React, { useState } from 'react';
import { X, Lock, User, Clock } from 'lucide-react';

export default function ESignatureModal({ 
  isOpen, 
  onClose, 
  onSign, 
  action, 
  context,
  currentUser 
}) {
  const [username, setUsername] = useState(currentUser?.name || '');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSign = (e) => {
    e.preventDefault();
    
    // Validation
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    if (!reason && action !== 'execute_step') {
      setError('Reason/comment is required for this action');
      return;
    }

    if (username !== currentUser?.name) {
      setError('Username does not match current user');
      return;
    }

    // Simple password validation (in production, this would be real authentication)
    if (password.length < 4) {
      setError('Invalid password');
      return;
    }

    const signature = {
      signedBy: username,
      role: currentUser?.role,
      action: action,
      reason: reason,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.1', // In production: get real IP
      method: 'Password',
      context: context
    };

    onSign(signature);
    handleClose();
  };

  const handleClose = () => {
    setUsername(currentUser?.name || '');
    setPassword('');
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-2 text-white">
            <Lock className="w-5 h-5" />
            <h3 className="text-lg font-bold">Electronic Signature Required</h3>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-blue-800 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSign} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <p className="font-semibold text-blue-900">Action: {action}</p>
            {context && <p className="text-blue-700 text-xs mt-1">{context}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Username
            </label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full bg-gray-100"
              value={username}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Password
            </label>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Reason/Comment {action !== 'execute_step' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              className="border rounded px-3 py-2 w-full"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this action..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 rounded p-2">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
            <p className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Signature will be recorded with timestamp and IP address
            </p>
            <p className="mt-1">This signature has the same legal significance as a handwritten signature (21 CFR Part 11)</p>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
            >
              Sign & Confirm
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
