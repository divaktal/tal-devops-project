// Validation functions
const validation = {
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>&"']/g, '');
    },

    isValidName: (name) => {
        if (!name || typeof name !== 'string') return false;
        const sanitized = name.trim();
        if (sanitized.length < 2 || sanitized.length > 50) return false;
        
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(sanitized);
    },

    isValidPhone: (phone) => {
        if (!phone || typeof phone !== 'string') return false;
        
        // Remove all non-digits for validation
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    },

    isValidDate: (date) => {
        if (!date || typeof date !== 'string') return false;
        
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return !isNaN(selectedDate.getTime()) && selectedDate >= today;
    },

    isValidTime: (time) => {
        if (!time || typeof time !== 'string') return false;
        const allowedSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        return allowedSlots.includes(time);
    },

    validateAppointment: (req, res, next) => {
        const appointment = req.body;
        const errors = [];

        console.log('Validation middleware received:', appointment);

        // Check if appointment object exists
        if (!appointment || typeof appointment !== 'object') {
            return res.status(400).json({ 
                error: 'Invalid appointment data' 
            });
        }

        // Validate firstName
        if (!appointment.firstName) {
            errors.push('First name is required');
        } else if (!validation.isValidName(appointment.firstName)) {
            errors.push('First name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
        }

        // Validate familyName
        if (!appointment.familyName) {
            errors.push('Family name is required');
        } else if (!validation.isValidName(appointment.familyName)) {
            errors.push('Family name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
        }

        // Validate phone
        if (!appointment.phone) {
            errors.push('Phone number is required');
        } else if (typeof appointment.phone !== 'string') {
            errors.push('Phone number must be a string');
        } else if (!validation.isValidPhone(appointment.phone)) {
            errors.push('Please enter a valid phone number (10-15 digits)');
        }

        // Validate date
        if (!appointment.date) {
            errors.push('Date is required');
        } else if (!validation.isValidDate(appointment.date)) {
            errors.push('Please select a valid future date');
        }

        // Validate time
        if (!appointment.time) {
            errors.push('Time is required');
        } else if (!validation.isValidTime(appointment.time)) {
            errors.push('Please select a valid time slot');
        }

        if (errors.length > 0) {
            console.log('Validation errors:', errors);
            return res.status(400).json({ 
                error: errors.join(', ') 
            });
        }

        // Clean and sanitize data
        req.body = {
            firstName: validation.sanitizeInput(appointment.firstName),
            familyName: validation.sanitizeInput(appointment.familyName),
            phone: appointment.phone.replace(/\D/g, ''), // Clean phone number
            date: appointment.date,
            time: appointment.time
        };

        console.log('Validation passed, cleaned data:', req.body);
        next();
    }
};

module.exports = validation;