/**
 * Simple Mock Auth Service for PrivaGuard
 * Uses cookies and localStorage to simulate authentication without a database.
 */

const AUTH_COOKIE = 'privaguard_session';

export interface User {
    id: string;
    email: string;
    name?: string;
}

export const authService = {
    // Simulate login
    async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
        // Artificial delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Simulate finding a user
        const users = JSON.parse(localStorage.getItem('privaguard_users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);

        if (user) {
            document.cookie = `${AUTH_COOKIE}=${user.id}; path=/; max-age=86400`;
            localStorage.setItem('privaguard_current_user', JSON.stringify({ id: user.id, email: user.email }));
            return { user: { id: user.id, email: user.email }, error: null };
        }

        return { user: null, error: 'Invalid email or password' };
    },

    // Simulate signup
    async signup(email: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
        await new Promise(resolve => setTimeout(resolve, 800));

        const users = JSON.parse(localStorage.getItem('privaguard_users') || '[]');
        if (users.find((u: any) => u.email === email)) {
            return { user: null, error: 'User already exists' };
        }

        const newUser = { id: Math.random().toString(36).substr(2, 9), email, password, name };
        users.push(newUser);
        localStorage.setItem('privaguard_users', JSON.stringify(users));

        document.cookie = `${AUTH_COOKIE}=${newUser.id}; path=/; max-age=86400`;
        localStorage.setItem('privaguard_current_user', JSON.stringify({ id: newUser.id, email: newUser.email }));

        return { user: { id: newUser.id, email: newUser.email }, error: null };
    },

    // Get current user
    getUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('privaguard_current_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Logout
    signOut() {
        document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        localStorage.removeItem('privaguard_current_user');
    }
};
