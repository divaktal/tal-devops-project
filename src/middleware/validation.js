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
        const sanitized = phone.trim();
        if (sanitized.length < 10 || sanitized.length > 20) return false;
        
        const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{10,20}$/;
        return phoneRegex.test(sanitized);
    },

    isValidDate: (date) => {
        if (!date || typeof date !== 'string') return false;
        
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return !isNaN(selectedDate.getTime()) && selectedDate >= today;
    },

    isValidTime: (time) => {
        const allowedSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        return allowedSlots.includes(time);
    },

    validateAppointment: (appointment) => {
        const errors = [];

        if (!appointment.firstName) {
            errors.push('First name is required');
        } else if (!validation.isValidName(appointment.firstName)) {
            errors.push('First name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
        }

        if (!appointment.familyName) {
            errors.push('Family name is required');
        } else if (!validation.isValidName(appointment.familyName)) {
            errors.push('Family name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
        }

        if (!appointment.phone) {
            errors.push('Phone number is required');
        } else if (!validation.isValidPhone(appointment.phone)) {
            errors.push('Please enter a valid phone number (10-20 digits)');
        }

        if (!appointment.date) {
            errors.push('Date is required');
        } else if (!validation.isValidDate(appointment.date)) {
            errors.push('Please select a valid future date');
        }

        if (!appointment.time) {
            errors.push('Time is required');
        } else if (!validation.isValidTime(appointment.time)) {
            errors.push('Please select a valid time slot');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitizedData: {
                firstName: validation.sanitizeInput(appointment.firstName),
                familyName: validation.sanitizeInput(appointment.familyName),
                phone: validation.sanitizeInput(appointment.phone),
                date: appointment.date,
                time: appointment.time
            }
        };
    }
};

module.exports = validation;