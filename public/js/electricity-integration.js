/**
 * Electricity Services Integration
 */

(function() {
  'use strict';

  const { apiCall, requireAuth, showMessage, showLoading, hideLoading } = window.SuvidhaAuth;

  if (!requireAuth()) return;

  console.log('⚡ Electricity Integration loaded');

  // === SERVICE LANDING PAGE - ADD CLICK HANDLERS ===
  if (window.location.pathname.includes('electricity-services')) {
    console.log('📍 On electricity services landing page');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachServiceHandlers);
    } else {
      attachServiceHandlers();
    }
    
    function attachServiceHandlers() {
      const serviceActions = document.querySelectorAll('.svc-action');
      console.log(`Found ${serviceActions.length} service action buttons`);
      
      serviceActions.forEach(action => {
        action.style.cursor = 'pointer';
        action.addEventListener('click', async function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const card = this.closest('.svc-card');
          const title = card?.querySelector('.svc-title')?.textContent?.trim();
          const actionText = this.textContent?.trim();
          console.log('🖱️ Service clicked:', title, '|', actionText);
          
          // Route to actual API calls based on service type
          if (actionText.includes('Pay Bill')) {
            // Fetch bills and show them
            const result = await apiCall('/electricity/bills', 'GET');
            if (result.success && result.data.data.length > 0) {
              const bills = result.data.data;
              let message = `You have ${bills.length} bill(s):\n`;
              bills.forEach(b => {
                message += `\n${b.bill_number}: ₹${b.amount} (${b.status})`;
              });
              showMessage(message, 'info');
            } else {
              showMessage('No bills found', 'info');
            }
          } else if (actionText.includes('Download')) {
            showMessage('Download feature - Coming Soon!', 'info');
          } else if (actionText.includes('Track Status') || actionText.includes('View')) {
            // Get connections
            const result = await apiCall('/electricity/connections', 'GET');
            if (result.success && result.data.data.length > 0) {
              const connections = result.data.data;
              let message = `Your connections:\n`;
              connections.forEach(c => {
                message += `\n${c.application_number}: ${c.status}`;
              });
              showMessage(message, 'info');
            } else {
              showMessage('No connections found', 'info');
            }
          } else if (actionText.includes('Dashboard')) {
            // Get dashboard data
            const result = await apiCall('/electricity/dashboard', 'GET');
            if (result.success) {
              const data = result.data.data;
              showMessage(`Dashboard: ${data.total_connections || 0} connections, ₹${data.total_pending_amount || 0} pending`, 'info');
            } else {
              showMessage('Failed to load dashboard', 'error');
            }
          } else {
            // Default: Show coming soon
            showMessage(`${title} - Coming Soon! This feature will be available in the next update.`, 'info');
          }
        });
      });
      
      // Also handle filter tabs
      const filterTabs = document.querySelectorAll('.filter-tab');
      filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
          filterTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          console.log('Filter selected:', this.textContent);
        });
      });
      
      // Handle quick pay button
      const quickPayBtn = document.querySelector('.qpb-form button');
      if (quickPayBtn) {
        quickPayBtn.addEventListener('click', async function(e) {
          e.preventDefault();
          const consumerId = document.querySelector('.qpb-form input')?.value;
          if (consumerId) {
            console.log('Quick pay for consumer:', consumerId);
            // Fetch bills for this consumer
            const result = await apiCall('/electricity/bills', 'GET');
            if (result.success && result.data.data.length > 0) {
              showMessage(`Found ${result.data.data.length} bills. Payment processing - Coming Soon!`, 'info');
            } else {
              showMessage('No bills found for this Consumer ID', 'info');
            }
          } else {
            showMessage('Please enter Consumer ID', 'error');
          }
        });
      }
    }
  }

  // New Connection Form
  const connectionForm = document.getElementById('electricityConnectionForm') || document.querySelector('form');
  if (connectionForm && window.location.pathname.includes('electricity')) {
    connectionForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {
        connection_type: formData.get('connection_type') || formData.get('type') || 'domestic',
        sanctioned_load: parseFloat(formData.get('load') || formData.get('sanctioned_load') || '3'),
        address: formData.get('address') || formData.get('location'),
        district: formData.get('district') || 'Kamrup Metro'
      };
      
      const btn = this.querySelector('button[type="submit"]');
      showLoading(btn);
      
      const result = await apiCall('/electricity/apply', 'POST', data);
      
      hideLoading(btn);
      
      if (result.success) {
        showMessage(`Connection request submitted! Reference: ${result.data.data.reference_number}`, 'success');
        this.reset();
      } else {
        showMessage(result.data.message || 'Failed to submit application', 'error');
      }
    });
  }

})();
