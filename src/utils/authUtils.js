// Authentication utility functions

/**
 * Generate a unique ID for users and farms
 */
export const generateId = (prefix) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
    return password && password.length >= 6;
};

/**
 * Get all users from localStorage
 */
export const getUsers = () => {
    try {
        const authData = localStorage.getItem('farmSightAuth');
        if (!authData) return [];
        const parsed = JSON.parse(authData);
        return parsed.users || [];
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
};

/**
 * Save users to localStorage
 */
export const saveUsers = (users) => {
    try {
        const authData = JSON.parse(localStorage.getItem('farmSightAuth') || '{}');
        authData.users = users;
        localStorage.setItem('farmSightAuth', JSON.stringify(authData));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
    try {
        const authData = localStorage.getItem('farmSightAuth');
        if (!authData) return null;
        const parsed = JSON.parse(authData);
        if (!parsed.currentUserId) return null;

        const users = parsed.users || [];
        return users.find(u => u.id === parsed.currentUserId) || null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

/**
 * Set current user in localStorage
 */
export const setCurrentUser = (userId) => {
    try {
        const authData = JSON.parse(localStorage.getItem('farmSightAuth') || '{}');
        authData.currentUserId = userId;
        localStorage.setItem('farmSightAuth', JSON.stringify(authData));
        return true;
    } catch (error) {
        console.error('Error setting current user:', error);
        return false;
    }
};

/**
 * Get current farm from localStorage
 */
export const getCurrentFarm = () => {
    try {
        const authData = localStorage.getItem('farmSightAuth');
        if (!authData) return null;
        const parsed = JSON.parse(authData);
        return parsed.currentFarmId || null;
    } catch (error) {
        console.error('Error getting current farm:', error);
        return null;
    }
};

/**
 * Set current farm in localStorage
 */
export const setCurrentFarm = (farmId) => {
    try {
        const authData = JSON.parse(localStorage.getItem('farmSightAuth') || '{}');
        authData.currentFarmId = farmId;
        localStorage.setItem('farmSightAuth', JSON.stringify(authData));
        return true;
    } catch (error) {
        console.error('Error setting current farm:', error);
        return false;
    }
};

/**
 * Check if email already exists
 */
export const emailExists = (email) => {
    const users = getUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
};

/**
 * Authenticate user with email and password
 */
export const authenticateUser = (email, password) => {
    const users = getUsers();
    const user = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return user || null;
};

/**
 * Register a new user
 */
export const registerUser = (userData, farmData) => {
    try {
        // Check if email exists
        if (emailExists(userData.email)) {
            return { success: false, error: 'Email already exists' };
        }

        // Create user object
        const userId = generateId('user');
        const farmId = generateId('farm');

        const newUser = {
            id: userId,
            name: userData.name,
            email: userData.email,
            password: userData.password, // Plain text for demo
            createdAt: new Date().toISOString(),
            isFirstLogin: true,
            farms: [
                {
                    id: farmId,
                    name: farmData.name,
                    location: farmData.location,
                    area: farmData.area || null,
                    areaUnit: farmData.areaUnit || 'acres',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ]
        };

        // Save user
        const users = getUsers();
        users.push(newUser);
        saveUsers(users);

        // Set as current user and farm
        setCurrentUser(userId);
        setCurrentFarm(farmId);

        return { success: true, user: newUser, farmId };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: 'Registration failed' };
    }
};

/**
 * Logout user
 */
export const logoutUser = () => {
    try {
        const authData = JSON.parse(localStorage.getItem('farmSightAuth') || '{}');
        delete authData.currentUserId;
        delete authData.currentFarmId;
        localStorage.setItem('farmSightAuth', JSON.stringify(authData));
        return true;
    } catch (error) {
        console.error('Error logging out:', error);
        return false;
    }
};

/**
 * Add a new farm to user
 */
export const addFarm = (userId, farmData) => {
    try {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }

        const farmId = generateId('farm');
        const newFarm = {
            id: farmId,
            name: farmData.name,
            location: farmData.location,
            area: farmData.area || null,
            areaUnit: farmData.areaUnit || 'acres',
            isActive: false,
            createdAt: new Date().toISOString()
        };

        users[userIndex].farms.push(newFarm);
        saveUsers(users);

        return { success: true, farm: newFarm };
    } catch (error) {
        console.error('Error adding farm:', error);
        return { success: false, error: 'Failed to add farm' };
    }
};

/**
 * Update farm details
 */
export const updateFarm = (userId, farmId, farmData) => {
    try {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }

        const farmIndex = users[userIndex].farms.findIndex(f => f.id === farmId);

        if (farmIndex === -1) {
            return { success: false, error: 'Farm not found' };
        }

        users[userIndex].farms[farmIndex] = {
            ...users[userIndex].farms[farmIndex],
            ...farmData,
            updatedAt: new Date().toISOString()
        };

        saveUsers(users);

        return { success: true, farm: users[userIndex].farms[farmIndex] };
    } catch (error) {
        console.error('Error updating farm:', error);
        return { success: false, error: 'Failed to update farm' };
    }
};

/**
 * Delete a farm
 */
export const deleteFarm = (userId, farmId) => {
    try {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }

        if (users[userIndex].farms.length <= 1) {
            return { success: false, error: 'Cannot delete the only farm' };
        }

        users[userIndex].farms = users[userIndex].farms.filter(f => f.id !== farmId);
        saveUsers(users);

        // If deleted farm was active, set first farm as active
        const currentFarmId = getCurrentFarm();
        if (currentFarmId === farmId && users[userIndex].farms.length > 0) {
            setCurrentFarm(users[userIndex].farms[0].id);
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting farm:', error);
        return { success: false, error: 'Failed to delete farm' };
    }
};

/**
 * Change user password
 */
export const changePassword = (userId, currentPassword, newPassword) => {
    try {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }

        if (users[userIndex].password !== currentPassword) {
            return { success: false, error: 'Current password is incorrect' };
        }

        users[userIndex].password = newPassword;
        saveUsers(users);

        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: 'Failed to change password' };
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = (userId, userData) => {
    try {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }

        users[userIndex] = {
            ...users[userIndex],
            ...userData,
            id: userId, // Preserve ID
            email: users[userIndex].email, // Email cannot be changed
            updatedAt: new Date().toISOString()
        };

        saveUsers(users);

        return { success: true, user: users[userIndex] };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
};

/**
 * Mark first login as complete
 */
export const completeFirstLogin = (userId) => {
    try {
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) return false;

        users[userIndex].isFirstLogin = false;
        saveUsers(users);

        return true;
    } catch (error) {
        console.error('Error completing first login:', error);
        return false;
    }
};
