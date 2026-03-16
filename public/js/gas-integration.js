/**
 * Gas Services Integration
 */

(function() {
  'use strict';

  const { apiCall, requireAuth, showMessage, showLoading, hideLoading } = window.SuvidhaAuth;

  if (!requireAuth()) return;

  console.log('⛽ Gas Integration loaded');

  // === SERVICE LANDING PAGE - ADD CLICK HANDLERS ===
  if (window.location.pathname.includes('gas-services')) {
    console.log('📍 On gas services landing page');
    
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
          if (actionText.includes('Book Now') || title.includes('Booking')) {
            // Get connections first
            const connResult = await apiCall('/gas/connections', 'GET');
            if (connResult.success && connResult.data.data.length > 0) {
              const connection = connResult.data.data[0];
              // Book cylinder for the first connection
              const bookResult = await apiCall('/gas/book', 'POST', {
                connection_id: connection.id,
                quantity: 1,
                delivery_address: connection.address
              });
              if (bookResult.success) {
                showMessage(`Cylinder booked! Booking #${bookResult.data.data.booking_number}`, 'success');
              } else {
                showMessage(bookResult.data.message || 'Booking failed', 'error');
              }
            } else {
              showMessage('No active gas connection found. Please apply for a connection first.', 'info');
            }
          } else if (actionText.includes('View Subsidy') || title.includes('Subsidy')) {
            showMessage('Subsidy tracking - Coming Soon!', 'info');
          } else if (actionText.includes('View Usage') || title.includes('Usage')) {
            // Get bookings history
            const result = await apiCall('/gas/bookings', 'GET');
            if (result.success && result.data.data.length > 0) {
              const bookings = result.data.data;
              showMessage(`You have made ${bookings.length} cylinder booking(s). Last booking: ${bookings[0].booking_number}`, 'info');
            } else {
              showMessage('No booking history found', 'info');
            }
          } else if (actionText.includes('Track') || actionText.includes('View Status')) {
            // Get connections status
            const result = await apiCall('/gas/connections', 'GET');
            if (result.success && result.data.data.length > 0) {
              const connections = result.data.data;
              let message = `Your gas connections:\n`;
              connections.forEach(c => {
                message += `\n${c.application_number}: ${c.status}`;
              });
              showMessage(message, 'info');
            } else {
              showMessage('No connections found', 'info');
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
    }
  }

  // New Connection Form
  const connectionForm = document.getElementById('gasConnectionForm') || document.querySelector('form');
  if (connectionForm && window.location.pathname.includes('gas')) {
    connectionForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {
        connection_type: formData.get('connection_type') || formData.get('type') || 'lpg',
        distributor: formData.get('distributor') || 'Indane Gas',
        address: formData.get('address') || formData.get('location')
      };
      
      const btn = this.querySelector('button[type="submit"]');
      showLoading(btn);
      
      const result = await apiCall('/gas/apply', 'POST', data);
      
      hideLoading(btn);
      
      if (result.success) {
        showMessage(`Gas connection request submitted! Reference: ${result.data.data.reference_number}`, 'success');
        this.reset();
      } else {
        showMessage(result.data.message || 'Failed to submit application', 'error');
      }
    });
  }

})();
