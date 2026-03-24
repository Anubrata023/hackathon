/**
 * Scholarship Portal Integration
 * Handles scholarship listing, application, tracking
 */

(function() {
  'use strict';

  console.log('Scholarship integration script loaded');

  // Wait for SuvidhaAuth to be available
  if (!window.SuvidhaAuth) {
    console.error('SuvidhaAuth not available! Make sure auth.js is loaded first.');
    return;
  }

  const { apiCall, requireAuth, showMessage, showLoading, hideLoading } = window.SuvidhaAuth;

  console.log('SuvidhaAuth functions:', { apiCall: typeof apiCall, requireAuth: typeof requireAuth });

  // Auth check
  if (!requireAuth()) {
    console.log('Auth check failed, redirecting to login');
    return;
  }

  console.log('User is authenticated');

  // Get available scholarships
  async function loadScholarships() {
    console.log('Loading scholarships from API...');
    try {
      const result = await apiCall('/scholarships?is_active=true', 'GET');
      console.log('Scholarships API result:', result);
      
      if (result.success && result.data.data) {
        displayScholarships(result.data.data);
      } else {
        console.error('Failed to load scholarships:', result);
        showMessage('Failed to load scholarships', 'error');
      }
    } catch (error) {
      console.error('Error loading scholarships:', error);
      showMessage('Error loading scholarships', 'error');
    }
  }

  function displayScholarships(scholarships) {
    const grid = document.querySelector('.schol-grid');
    if (!grid) return;

    // Keep featured card, replace others
    const cards = scholarships.slice(0, 5).map(sch => `
      <div class="schol-card">
        <div class="schol-top">
          <span class="schol-badge">${sch.category}</span>
          <h3 class="schol-title">${sch.name}</h3>
          <p class="schol-amt">₹${sch.amount.toLocaleString()}</p>
        </div>
        <p class="schol-desc">${sch.description}</p>
        <div class="schol-meta">
          <div class="schol-meta-item">
            <strong>Deadline:</strong> ${new Date(sch.deadline).toLocaleDateString()}
          </div>
          <div class="schol-meta-item">
            <strong>Duration:</strong> ${sch.duration}
          </div>
        </div>
        <button class="schol-cta" onclick="applyForScholarship(${sch.id}, '${sch.name}')">Apply Now</button>
      </div>
    `).join('');

    // Append to existing cards
    grid.innerHTML += cards;
  }

  // Apply for scholarship
  window.applyForScholarship = function(scholarshipId, scholarshipName) {
    console.log('applyForScholarship called with:', scholarshipId, scholarshipName);
    
    if (confirm(`Apply for ${scholarshipName}?\n\nYou will need:\n- Student details\n- Academic records\n- Bank information`)) {
      console.log('User confirmed application');
      // Store scholarship ID for application form
      sessionStorage.setItem('applyingScholarshipId', scholarshipId);
      sessionStorage.setItem('applyingScholarshipName', scholarshipName);
      
      // Show application form modal or section
      showApplicationForm();
    } else {
      console.log('User cancelled application');
    }
  };

  function showApplicationForm() {
    console.log('Showing application form modal...');
    const scholarshipId = sessionStorage.getItem('applyingScholarshipId');
    const scholarshipName = sessionStorage.getItem('applyingScholarshipName');
    
    console.log('Application form for scholarship:', scholarshipId, scholarshipName);
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'applicationModal';
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
          <h2 style="margin-bottom: 10px; color: var(--forest);">Apply for Scholarship</h2>
          <p style="margin-bottom: 20px; color: var(--mid-gray);">${scholarshipName}</p>
          
          <form id="scholarshipForm">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Student Name *</label>
              <input type="text" name="student_name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Father's Name *</label>
              <input type="text" name="father_name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Mother's Name *</label>
              <input type="text" name="mother_name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Date of Birth *</label>
              <input type="date" name="dob" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Gender *</label>
              <select name="gender" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Category *</label>
              <select name="category" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">Select</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Annual Income (₹) *</label>
              <input type="number" name="annual_income" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Class/Level *</label>
              <input type="text" name="class_level" required placeholder="e.g., 10, 12, B.Tech" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">School/College Name *</label>
              <input type="text" name="school_college" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Marks Percentage *</label>
              <input type="number" name="marks_percentage" required step="0.01" min="0" max="100" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Bank Account Number *</label>
              <input type="text" name="bank_account" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">IFSC Code *</label>
              <input type="text" name="ifsc_code" required pattern="[A-Z]{4}0[A-Z0-9]{6}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="submit" style="flex: 1; padding: 12px; background: linear-gradient(135deg, var(--forest), var(--leaf)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Submit Application</button>
              <button type="button" onclick="closeApplicationForm()" style="padding: 12px 20px; background: #ddd; color: #333; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    console.log('Application form modal added to DOM');
    
    // Handle form submission
    document.getElementById('scholarshipForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      console.log('Scholarship form submitted');
      
      const formData = new FormData(this);
      const data = {
        scholarship_id: parseInt(scholarshipId)
      };
      
      for (let [key, value] of formData.entries()) {
        if (key === 'annual_income' || key === 'marks_percentage') {
          data[key] = parseFloat(value);
        } else {
          data[key] = value;
        }
      }
      
      console.log('Scholarship application data:', data);
      
      const btn = e.target.querySelector('button[type="submit"]');
      showLoading(btn);
      
      try {
        console.log('Calling API: /scholarships/apply');
        const result = await apiCall('/scholarships/apply', 'POST', data);
        console.log('API response:', result);
        
        hideLoading(btn);
        
        if (result.success) {
          showMessage(`Application submitted successfully! Reference: ${result.data.data.application_number}`, 'success');
          closeApplicationForm();
        } else {
          showMessage(result.data.message || 'Failed to submit application', 'error');
        }
      } catch (error) {
        console.error('Error submitting scholarship application:', error);
        hideLoading(btn);
        showMessage('An error occurred. Please try again.', 'error');
      }
    });
  }

  window.closeApplicationForm = function() {
    const modal = document.getElementById('applicationModal');
    if (modal) modal.remove();
    sessionStorage.removeItem('applyingScholarshipId');
    sessionStorage.removeItem('applyingScholarshipName');
  };

  // Check eligibility
  const eligibilityBanner = document.querySelector('.eligibility-banner');
  if (eligibilityBanner) {
    console.log('Eligibility banner found, attaching click handler');
    const btn = eligibilityBanner.querySelector('a, button');
    if (btn) {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Eligibility check button clicked');
        
        const income = prompt('Enter annual family income (₹):');
        const marks = prompt('Enter percentage of marks:');
        
        if (income && marks) {
          console.log('Checking eligibility with income:', income, 'marks:', marks);
          
          try {
            const result = await apiCall('/scholarships/check-eligibility', 'POST', {
              annual_income: parseFloat(income),
              marks_percentage: parseFloat(marks),
              class_level: '10',
              category: 'General'
            });
            
            console.log('Eligibility check result:', result);
            
            if (result.success) {
              const count = result.data.count || 0;
              showMessage(`You are eligible for ${count} scholarship(s)!`, 'success');
            } else {
              showMessage(result.data.message || 'Failed to check eligibility', 'error');
            }
          } catch (error) {
            console.error('Error checking eligibility:', error);
            showMessage('Error checking eligibility', 'error');
          }
        } else {
          console.log('User cancelled eligibility check');
        }
      });
    } else {
      console.log('No button found in eligibility banner');
    }
  } else {
    console.log('No eligibility banner found on page');
  }

  // Load scholarships on page load
  if (document.querySelector('.schol-grid')) {
    console.log('Scholarship grid found, loading scholarships...');
    loadScholarships();
  } else {
    console.log('No scholarship grid found on this page');
  }

  // Attach click handlers to existing "Apply Now" buttons
  function attachApplyHandlers() {
    console.log('Attaching apply handlers to buttons...');
    
    // Featured card button
    const featuredBtn = document.querySelector('.featured-cta .btn-primary');
    if (featuredBtn) {
      console.log('Featured button found');
      featuredBtn.addEventListener('click', function() {
        console.log('Featured apply button clicked');
        const card = this.closest('.featured-card');
        const scholarshipName = card?.querySelector('.ftitle')?.textContent || 'Featured Scholarship';
        applyForScholarship(1, scholarshipName);
      });
    }

    // All "Apply Now" action divs and buttons
    const applyButtons = document.querySelectorAll('.schol-action, .schol-card button');
    console.log('Found', applyButtons.length, 'apply buttons');
    
    applyButtons.forEach((btn, index) => {
      if (btn.textContent.includes('Apply Now')) {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', function() {
          console.log('Apply button', index, 'clicked');
          const card = this.closest('.schol-card') || this.closest('.featured-card');
          const scholarshipName = card?.querySelector('.schol-name')?.textContent || 
                                  card?.querySelector('.ftitle')?.textContent || 
                                  'Scholarship ' + (index + 1);
          // Use index + 1 as scholarship ID for static cards
          applyForScholarship(index + 1, scholarshipName);
        });
      }
    });
  }

  // Attach handlers after a short delay to ensure DOM is ready
  setTimeout(() => {
    console.log('Running attachApplyHandlers...');
    attachApplyHandlers();
  }, 100);

  console.log('Scholarship integration script initialization complete');

})();
