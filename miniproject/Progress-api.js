/* =========================================================
   Progress-api.js — Progress & Study Analytics Helper
   - Safe API bridge for Nova Study Assistant
   - Ensures no runtime errors in sandboxed iframe environments
========================================================= */

(function () {
  'use strict';

  // Expose Nova API helpers on window.NovaAPI safely
  if (typeof window !== 'undefined') {
    window.NovaAPI = {
      version: '1.0.0',
      getBaseUrl: function () {
        return '';
      },
      getHealth: async function () {
        try {
          const res = await fetch('/api/health');
          return await res.json();
        } catch (e) {
          return { status: 'offline', error: e.message };
        }
      }
    };
  }
})();
