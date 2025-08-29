/**
 * Profile Manager Component
 * JavaScript-only version using localStorage (no PHP required)
 * Last updated: 2025-08-07 12:08:15 by MrCoolGh
 */
function profileManager() {
    return {
        // User data
        user: {
            id: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dob: '',
            address: '',
            role: '',
            avatar: '../images/avatar/avatar-12.jpg',
            avatarPreview: null,
            username: 'Lyk-no-boss'
        },

        // Original user data for reset functionality
        originalUser: {},

        // Password change data
        password: {
            current: '',
            new: '',
            confirm: ''
        },

        // UI state
        showCurrentPass: false,
        showNewPass: false,
        showConfirmPass: false,
        deleteConfirmation: '',
        showSuccessModal: false,
        showErrorModal: false,
        showDeleteConfirmModal: false,
        modalTitle: '',
        modalText: '',
        redirectAfterModal: false,
        currentDateTime: '2025-08-07 12:08:15',

        /**
         * Initialize component
         */
        init() {
            this.initUserData();
            this.updateCurrentTime();
            setInterval(() => this.updateCurrentTime(), 60000); // Update every minute
        },

        /**
         * Update current time display
         */
        updateCurrentTime() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            this.currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        },

        /**
         * Format date for HTML date input (requires YYYY-MM-DD)
         */
        formatDateForInput(dateString) {
            if (!dateString) return '';

            console.log('Original date string:', dateString);

            // If it's already in YYYY-MM-DD format, return as is
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }

            try {
                // Try to parse the date string
                const date = new Date(dateString);

                if (isNaN(date.getTime())) {
                    console.warn("Invalid date format:", dateString);
                    return '';
                }

                // Format as YYYY-MM-DD
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                console.log('Formatted date:', formattedDate);
                return formattedDate;
            } catch (error) {
                console.error("Error formatting date:", error);
                return '';
            }
        },

        /**
         * Initialize user data from localStorage
         */
        initUserData() {
            try {
                // Get user data from localStorage
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                console.log('Current user from localStorage:', currentUser);

                if (currentUser && Object.keys(currentUser).length > 0) {
                    // Fill in the form with user data
                    this.user.id = currentUser.id || 'user_' + Math.random().toString(36).substr(2, 9);
                    this.user.firstName = currentUser.firstName || '';
                    this.user.lastName = currentUser.lastName || '';
                    this.user.email = currentUser.email || '';
                    this.user.phone = currentUser.phone || '';
                    this.user.username = currentUser.username || 'Lyk-no-boss';
                    this.user.role = currentUser.role || 'User';
                    this.user.address = currentUser.address || '';

                    // Format DOB for HTML date input
                    if (currentUser.dob) {
                        console.log('DOB from localStorage before formatting:', currentUser.dob);
                        this.user.dob = this.formatDateForInput(currentUser.dob);
                        console.log('DOB after formatting:', this.user.dob);
                    }

                    // Set avatar if available
                    if (currentUser.avatar &&
                        currentUser.avatar !== 'null' &&
                        currentUser.avatar !== 'undefined') {
                        this.user.avatar = currentUser.avatar;
                    }

                    // Store original data for reset
                    this.originalUser = {...this.user};
                } else {
                    // Create a demo user if none exists
                    const demoUser = {
                        id: 'user_' + Math.random().toString(36).substr(2, 9),
                        firstName: 'Demo',
                        lastName: 'User',
                        email: 'demo@example.com',
                        phone: '555-1234',
                        username: 'Lyk-no-boss',
                        role: 'User',
                        address: '123 Main St',
                        dob: '1990-01-01',
                        avatar: '../images/avatar/avatar-12.jpg',
                        // Store a demo password hash
                        passwordHash: '$2a$10$demohashdemohashdemoha'
                    };

                    // Set current user to demo user
                    this.user = {...demoUser};
                    delete this.user.passwordHash;

                    // Save to localStorage
                    localStorage.setItem('currentUser', JSON.stringify(demoUser));

                    // Store original data
                    this.originalUser = {...this.user};

                    console.log('Created demo user:', demoUser);
                }
            } catch (error) {
                console.error('Error initializing user data:', error);
                this.handleError('Initialization Error', 'Failed to load user data');
            }
        },

        /**
         * Save user profile changes to localStorage and database
         */
        async saveUserProfile() {
            try {
                // Validate required fields
                if (!this.user.firstName || !this.user.lastName || !this.user.email) {
                    this.handleError('Validation Error', 'First name, last name, and email are required.');
                    return;
                }

                console.log('Saving profile data:', this.user);

                // Get current user data with password hash
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

                // Handle avatar upload if there's a preview
                if (this.user.avatarPreview && this.user.avatarPreview !== this.user.avatar) {
                    try {
                        // Convert the preview URL to a blob
                        const response = await fetch(this.user.avatarPreview);
                        if (!response.ok) throw new Error('Failed to process avatar image');

                        const blob = await response.blob();
                        const formData = new FormData();
                        formData.append('avatar', blob, 'avatar.jpg');

                        // Send the avatar to the server
                        console.log('Uploading avatar...');
                        const uploadResponse = await fetch('/auth/upload-avatar', {
                            method: 'POST',
                            body: formData
                        });

                        if (!uploadResponse.ok) {
                            throw new Error('Failed to upload avatar');
                        }

                        const uploadResult = await uploadResponse.json();
                        console.log('Avatar uploaded successfully:', uploadResult);

                        // Update avatar path
                        this.user.avatar = uploadResult.avatarPath;
                    } catch (error) {
                        console.error('Avatar upload error:', error);
                        this.handleError('Avatar Upload Failed', 'Could not upload your profile picture. Please try again.');
                        return;
                    }
                }

                // Create the user data object with correct field names
                const userData = {
                    first_name: this.user.firstName,
                    last_name: this.user.lastName,
                    email: this.user.email,
                    phone: this.user.phone,
                    dob: this.user.dob,
                    address: this.user.address,
                    role: this.user.role || currentUser.role,
                    avatar: this.user.avatar,
                };

                // Send profile update request
                try {
                    console.log('Updating profile with data:', userData);
                    const updateResponse = await fetch(`/auth/update-profile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: this.user.id,
                            userData: userData
                        })
                    });

                    if (!updateResponse.ok) {
                        const errorData = await updateResponse.text();
                        console.error('Profile update error response:', errorData);
                        throw new Error('Failed to update profile');
                    }

                    const updateResult = await updateResponse.json();
                    console.log('Profile update result:', updateResult);

                    // Update user data in localStorage
                    const updatedUser = {
                        ...currentUser,
                        firstName: this.user.firstName,
                        lastName: this.user.lastName,
                        email: this.user.email,
                        phone: this.user.phone,
                        dob: this.user.dob,
                        address: this.user.address,
                        avatar: this.user.avatar,
                        username: this.user.username
                    };

                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    console.log('User profile saved:', updatedUser);

                    // Update original user data for reset
                    this.originalUser = {...this.user};

                    // Show success message
                    this.handleSuccess('Profile Updated', 'Your profile has been updated successfully.');
                } catch (error) {
                    console.error('Profile update error:', error);
                    this.handleError('Update Failed', error.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error saving profile:', error);
                this.handleError('Update Failed', 'An unexpected error occurred while saving your profile.');
            }
        },

        /**
         * Reset form to original values
         */
        resetForm() {
            this.user = {...this.originalUser};
            this.user.avatarPreview = null;
        },

        /**
         * Handle avatar upload
         */
        handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Check file type
            if (!file.type.match('image.*')) {
                this.handleError('Invalid File', 'Please select an image file');
                return;
            }

            // Check file size (max 2MB)
            if (file.size > 10 * 1024 * 1024) {
                this.handleError('File Too Large', 'Avatar image must be less than 10MB');
                return;
            }

            // Create a preview
            this.user.avatarPreview = URL.createObjectURL(file);
            console.log('Avatar preview created:', this.user.avatarPreview);
        },

        /**
         * Change user password
         */
        changePassword() {
            try {
                // Validate password inputs
                if (!this.password.current) {
                    this.handleError('Validation Error', 'Current password is required.');
                    return;
                }

                if (!this.password.new || this.password.new.length < 8) {
                    this.handleError('Validation Error', 'New password must be at least 8 characters.');
                    return;
                }

                if (this.password.new !== this.password.confirm) {
                    this.handleError('Password Mismatch', 'New password and confirmation do not match.');
                    return;
                }

                // Send password change request to backend
                fetch('/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: this.user.id,
                        currentPassword: this.password.current,
                        newPassword: this.password.new
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(data => {
                                throw new Error(data.message || 'Password change failed');
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Reset password fields
                        this.password = {
                            current: '',
                            new: '',
                            confirm: ''
                        };

                        this.handleSuccess('Password Changed', 'Your password has been updated successfully.');
                    })
                    .catch(error => {
                        console.error('Password change error:', error);
                        this.handleError('Password Change Failed', error.message || 'Current password is incorrect or server error');
                    });
            } catch (error) {
                console.error('Error changing password:', error);
                this.handleError('Password Change Failed', 'An error occurred while changing your password.');
            }
        },

        /**
         * Delete user account
         */
        async deleteAccount() {
            try {
                // Close the confirmation modal
                this.showDeleteConfirmModal = false;

                // Check confirmation text
                if (this.deleteConfirmation !== 'DELETE') {
                    this.handleError('Confirmation Required', 'Please type "DELETE" to confirm account deletion.');
                    return;
                }

                try {
                    console.log('Sending account deletion request...');
                    const response = await fetch('/auth/delete-account', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: this.user.id
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Account deletion error response:', errorText);
                        throw new Error('Failed to delete account');
                    }

                    const result = await response.json();
                    console.log('Account deletion result:', result);

                    // Remove user data from localStorage
                    localStorage.removeItem('currentUser');
                    console.log('User data removed from localStorage');

                    // Set redirect flag
                    this.redirectAfterModal = true;

                    // Show success message
                    this.handleSuccess('Account Deleted', 'Your account has been permanently deleted.');
                } catch (error) {
                    console.error('Account deletion error:', error);
                    this.handleError('Deletion Failed', error.message || 'An error occurred while deleting your account.');
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                this.handleError('Deletion Failed', 'An unexpected error occurred while deleting your account.');
            }
        },

        /**
         * Handle successful operations
         */
        handleSuccess(title, text) {
            this.modalTitle = title;
            this.modalText = text;
            this.showSuccessModal = true;
        },

        /**
         * Handle error messages
         */
        handleError(title, text) {
            this.modalTitle = title;
            this.modalText = text;
            this.showErrorModal = true;
        },

        /**
         * Handle modal close actions
         */
        handleModalClose() {
            this.showSuccessModal = false;
            this.showErrorModal = false;

            // Redirect to login if account was deleted
            if (this.redirectAfterModal) {
                window.location.href = '../auth/sign_in.html';
            }
        }
    };
}