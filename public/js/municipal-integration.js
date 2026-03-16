/**
 * Municipal Services Integration
 * Handles waste management, grievances, water supply
 */

(function() {
  'use strict';

  const { apiCall, requireAuth, showMessage, showLoading, hideLoading } = window.SuvidhaAuth;

  // Auth check
  if (!requireAuth()) return;

  console.log('🏛️ Municipal Integration loaded');

  // === SERVICE LANDING PAGE - ADD CLICK HANDLERS ===
  if (window.location.pathname.includes('municipal-services')) {
    console.log('📍 On municipal services landing page');
    
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
        action.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const card = this.closest('.svc-card');
          const title = card?.querySelector('.svc-title')?.textContent?.trim();
          console.log('🖱️ Service clicked:', title);
          
          // Route to appropriate pages
          if (title.includes('Jan Sunwai') || title.includes('Grievance')) {
            console.log('→ Redirecting to grievance portal');
            window.location.href = '/grievance-portal.html';
          } else if (title.includes('Water')) {
            console.log('→ Redirecting to water supply');
            window.location.href = '/water-supply.html';
          } else if (title.includes('Garbage') || title.includes('Sanitation')) {
            console.log('→ Redirecting to waste management');
            window.location.href = '/waste-management.html';
          } else {
            console.log('→ Service coming soon');
            showMessage(`${title} - Coming Soon!`, 'info');
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

  // === WATER SUPPLY LANDING PAGE - ADD CLICK HANDLERS ===
  if (window.location.pathname.includes('water-supply')) {
    console.log('💧 On water supply landing page');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachWaterServiceHandlers);
    } else {
      attachWaterServiceHandlers();
    }
    
    function attachWaterServiceHandlers() {
      const serviceActions = document.querySelectorAll('.svc-action');
      console.log(`Found ${serviceActions.length} water service action buttons`);
      
      serviceActions.forEach(action => {
        action.style.cursor = 'pointer';
        action.addEventListener('click', async function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const card = this.closest('.svc-card');
          const title = card?.querySelector('.svc-title')?.textContent?.trim();
          const actionText = this.textContent?.trim();
          console.log('🖱️ Water service clicked:', title, '|', actionText);
          
          // Route to modals and API calls based on service type
          if (actionText.includes('Apply Now') || (title && title.includes('New Water Connection'))) {
            // Open new connection modal
            window.openModal('newConnectionModal');
          } else if (actionText.includes('Report Now') || (title && title.includes('Leakage'))) {
            // Open leakage report modal
            window.openModal('leakageReportModal');
          } else if (actionText.includes('Request Tanker') || (title && title.includes('Tanker'))) {
            // Open tanker request modal
            window.openModal('tankerRequestModal');
          } else if (actionText.includes('Submit Reading') || (title && title.includes('Meter Reading'))) {
            // Open meter reading modal
            window.openModal('meterReadingModal');
          } else if (actionText.includes('Pay Now') || title.includes('Bill Payment')) {
            // Get water bills
            const result = await apiCall('/municipal/water/bills', 'GET');
            if (result.success && result.data.data.length > 0) {
              const bills = result.data.data;
              let message = `You have ${bills.length} water bill(s):\n`;
              bills.forEach(b => {
                message += `\n${b.bill_number}: ₹${b.amount} (${b.status})`;
              });
              showMessage(message, 'info');
            } else {
              showMessage('No water bills found', 'info');
            }
          } else if (actionText.includes('Track Status') || actionText.includes('View') || title.includes('Connection Status')) {
            // Get water connections
            const result = await apiCall('/municipal/water/connections', 'GET');
            if (result.success && result.data.data.length > 0) {
              const connections = result.data.data;
              let message = `Your water connections:\n`;
              connections.forEach(c => {
                message += `\n${c.application_number}: ${c.status} (${c.connection_type})`;
              });
              showMessage(message, 'info');
            } else {
              showMessage('No water connections found', 'info');
            }
          } else if (actionText.includes('Download Report') || title.includes('Quality Report')) {
            showMessage('Water quality reports - Coming Soon!', 'info');
          } else if (actionText.includes('File Complaint') || title.includes('Complaint')) {
            // Show existing waste reports as complaints
            const result = await apiCall('/municipal/waste/reports', 'GET');
            if (result.success && result.data.data.length > 0) {
              showMessage(`You have ${result.data.data.length} complaint(s) filed. Latest: ${result.data.data[0].report_number}`, 'info');
            } else {
              showMessage('No complaints found. You can file one from the waste management page.', 'info');
            }
          } else {
            // Default: Show coming soon
            showMessage(`${title} - Coming Soon! This feature will be available in the next update.`, 'info');
          }
        });
      });
      
      // Handle filter tabs
      const filterTabs = document.querySelectorAll('.filter-tab');
      filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
          filterTabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          console.log('Water filter selected:', this.textContent);
        });
      });

      // Handle hero buttons
      const heroButtons = document.querySelectorAll('.hero-btn');
      heroButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
          e.preventDefault();
          const btnText = this.textContent?.trim();
          console.log('Hero button clicked:', btnText);
          
          if (btnText.includes('New Connection')) {
            // Open new connection modal
            window.openModal('newConnectionModal');
          } else if (btnText.includes('Pay Bill')) {
            // Get water bills
            const result = await apiCall('/municipal/water/bills', 'GET');
            if (result.success && result.data.data.length > 0) {
              const bills = result.data.data;
              let message = `You have ${bills.length} water bill(s):\n`;
              bills.forEach(b => {
                message += `\n${b.bill_number}: ₹${b.amount} (${b.status})`;
              });
              showMessage(message, 'info');
            } else {
              showMessage('No water bills found', 'info');
            }
          } else {
            showMessage(`${btnText} - Coming Soon!`, 'info');
          }
        });
      });
      
      // === FORM HANDLERS ===
      
      // New Connection Form
      const newConnectionForm = document.getElementById('newConnectionForm');
      if (newConnectionForm) {
        newConnectionForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(this);
          const data = {
            connection_type: formData.get('connection_type'),
            property_type: formData.get('property_type'),
            address: formData.get('address'),
            ward_number: formData.get('ward_number')
          };
          
          const btn = this.querySelector('button[type="submit"]');
          showLoading(btn);
          
          const result = await apiCall('/municipal/water/apply', 'POST', data);
          
          hideLoading(btn);
          
          if (result.success) {
            showMessage(`Water connection application submitted! Application Number: ${result.data.data.application_number}`, 'success');
            this.reset();
            window.closeModal('newConnectionModal');
          } else {
            showMessage(result.data.message || 'Failed to submit application', 'error');
          }
        });
      }
      
      // Leakage Report Form
      const leakageReportForm = document.getElementById('leakageReportForm');
      if (leakageReportForm) {
        leakageReportForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(this);
          const data = {
            location: formData.get('location'),
            ward_number: formData.get('ward_number'),
            waste_type: formData.get('waste_type'),
            description: formData.get('description'),
            priority: formData.get('priority')
          };
          
          const btn = this.querySelector('button[type="submit"]');
          showLoading(btn);
          
          const result = await apiCall('/municipal/waste/report', 'POST', data);
          
          hideLoading(btn);
          
          if (result.success) {
            showMessage(`Leakage report submitted! Report Number: ${result.data.data.report_number || result.data.data.complaint_number}`, 'success');
            this.reset();
            window.closeModal('leakageReportModal');
          } else {
            showMessage(result.data.message || 'Failed to submit report', 'error');
          }
        });
      }
      
      // Tanker Request Form
      const tankerRequestForm = document.getElementById('tankerRequestForm');
      if (tankerRequestForm) {
        tankerRequestForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(this);
          showMessage(`Tanker request for ${formData.get('capacity')} liters scheduled for ${formData.get('delivery_date')}. Coming Soon!`, 'info');
          this.reset();
          window.closeModal('tankerRequestModal');
        });
      }
      
      // Meter Reading Form
      const meterReadingForm = document.getElementById('meterReadingForm');
      if (meterReadingForm) {
        meterReadingForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const formData = new FormData(this);
          showMessage(`Meter reading ${formData.get('reading')} submitted for connection ${formData.get('connection_number')}. Coming Soon!`, 'info');
          this.reset();
          window.closeModal('meterReadingModal');
        });
      }
    }
  }

  // Waste Management - Report Form
  const wasteForm = document.getElementById('wasteReportForm') || document.querySelector('form[action*="waste"]');
  if (wasteForm) {
    wasteForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {
        location: formData.get('location') || formData.get('address'),
        ward_number: formData.get('ward') || formData.get('ward_number'),
        waste_type: formData.get('type') || formData.get('waste_type') || 'mixed',
        description: formData.get('description') || formData.get('details'),
        priority: formData.get('priority') || 'normal'
      };
      
      const btn = this.querySelector('button[type="submit"]');
      showLoading(btn);
      
      const result = await apiCall('/municipal/waste/report', 'POST', data);
      
      hideLoading(btn);
      
      if (result.success) {
        showMessage(`Waste report submitted! Complaint ID: ${result.data.data.complaint_number}`, 'success');
        this.reset();
      } else {
        showMessage(result.data.message || 'Failed to submit report', 'error');
      }
    });
  }

  // Grievance Form
  const grievanceForm = document.getElementById('grievanceForm') || document.querySelector('form[action*="grievance"]');
  if (grievanceForm) {
    grievanceForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {
        category: formData.get('category') || 'Infrastructure',
        subject: formData.get('subject') || formData.get('title'),
        description: formData.get('description') || formData.get('details'),
        department: formData.get('department') || 'General',
        priority: formData.get('priority') || 'normal'
      };
      
      const btn = this.querySelector('button[type="submit"]');
      showLoading(btn);
      
      const result = await apiCall('/municipal/grievance/file', 'POST', data);
      
      hideLoading(btn);
      
      if (result.success) {
        showMessage(`Grievance filed! Reference: ${result.data.data.grievance_number}`, 'success');
        this.reset();
      } else {
        showMessage(result.data.message || 'Failed to file grievance', 'error');
      }
    });
  }

  // Water Connection Form
  const waterForm = document.getElementById('waterForm') || document.querySelector('form[action*="water"]');
  if (waterForm) {
    waterForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {
        connection_type: formData.get('connection_type') || formData.get('type') || 'domestic',
        property_type: formData.get('property_type') || 'residential',
        address: formData.get('address') || formData.get('location'),
        ward_number: formData.get('ward') || formData.get('ward_number')
      };
      
      const btn = this.querySelector('button[type="submit"]');
      showLoading(btn);
      
      const result = await apiCall('/municipal/water/apply', 'POST', data);
      
      hideLoading(btn);
      
      if (result.success) {
        showMessage(`Water connection application submitted! Reference: ${result.data.data.application_number}`, 'success');
        this.reset();
      } else {
        showMessage(result.data.message || 'Failed to submit application', 'error');
      }
    });
  }

  // === OVERRIDE INLINE FUNCTIONS ===
  // Override handleGrievanceSubmit for grievance-portal.html
  window.handleGrievanceSubmit = async function() {
    const submitBtn = document.querySelector('.form-submit') || document.querySelector('button[onclick*="Grievance"]');
    if (!submitBtn) return;
    
    // Collect all form inputs
    const inputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    const data = {
      category: 'Infrastructure',
      priority: 'normal'
    };
    
    inputs.forEach(input => {
      const name = input.name;
      const value = input.value;
      
      if (name && value) {
        // Map form fields to API fields
        if (name === 'name') data.name = value;
        else if (name === 'phone') data.phone = value;
        else if (name === 'email') data.email = value;
        else if (name === 'district') data.district = value;
        else if (name === 'department') {
          data.department = value;
          data.category = value; // Use department as category
        }
        else if (name === 'subject') data.subject = value;
        else if (name === 'description') data.description = value;
        else if (name === 'previous_reference') data.previous_reference = value;
        else if (name === 'id_number') data.id_number = value;
      }
    });
    
    showLoading(submitBtn);
    
    const result = await apiCall('/municipal/grievance/file', 'POST', data);
    
    hideLoading(submitBtn);
    
    if (result.success) {
      showMessage(`✅ Grievance filed! Reference: ${result.data.data.grievance_number}`, 'success');
      inputs.forEach(input => input.value = '');
    } else {
      showMessage(result.data.message || 'Failed to file grievance', 'error');
    }
  };

  // Override handleSubmit for waste-management.html
  window.handleSubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const formData = new FormData(form);
    const data = {
      location: formData.get('ward_number') || 'Not specified',
      ward_number: formData.get('ward_number'),
      waste_type: formData.get('waste_type') || 'mixed',
      description: formData.get('description') || '',
      priority: 'normal',
      name: formData.get('name'),
      phone: formData.get('phone')
    };
    
    showLoading(submitBtn);
    
    const result = await apiCall('/municipal/waste/report', 'POST', data);
    
    hideLoading(submitBtn);
    
    if (result.success) {
      showMessage(`✅ Waste report submitted! ID: ${result.data.data.complaint_number}`, 'success');
      form.reset();
    } else {
      showMessage(result.data.message || 'Failed to submit report', 'error');
    }
  };

})();
