import { users } from '../data/users.js';

export class Login {
    constructor(containerSelector = '.login-card') {
        this.container = document.querySelector(containerSelector);
    }

    init() {
        if (!this.container) return;
        this.bindTabs();
        this.bindSignIn();
        this.bindSignUp();
    }

    bindTabs() {
        const tabs = this.container.querySelectorAll('.login-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.showTab(tab.dataset.tab);
            });
        });
    }

    showTab(tab) {
        const signin = document.getElementById('tab-signin');
        const signup = document.getElementById('tab-signup');
        const tabs = this.container.querySelectorAll('.login-tab');

        signin.style.display = tab === 'signin' ? 'flex' : 'none';
        signup.style.display = tab === 'signup' ? 'flex' : 'none';

        tabs.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        this.clearErrors();
    }

    bindSignIn() {
        const form = document.getElementById('tab-signin');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.clearErrors();

            const email = form.querySelector('input[type="email"]').value.trim();
            const password = form.querySelector('input[type="password"]').value;

            if (!email || !password) {
                this.showError(form, 'Заполните все поля');
                return;
            }

            const found = users.find(u => u.email === email && u.password === password);

            if (!found) {
                this.showError(form, 'Неверный email или пароль');
                return;
            }

            const sessionUser = { id: found.id, name: found.name, email: found.email, role: found.role };
            localStorage.setItem('currentUser', JSON.stringify(sessionUser));

            if (window.appState) {
                window.appState.set('user', sessionUser);
            }

            window.location.href = 'index.html';
        });
    }

    bindSignUp() {
        const form = document.getElementById('tab-signup');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.clearErrors();

            const inputs = form.querySelectorAll('input');
            const name = inputs[0].value.trim();
            const email = inputs[1].value.trim();
            const password = inputs[2].value;
            const passwordRepeat = inputs[3].value;

            if (!name || !email || !password || !passwordRepeat) {
                this.showError(form, 'Заполните все поля');
                return;
            }

            if (password !== passwordRepeat) {
                this.showError(form, 'Пароли не совпадают');
                return;
            }

            const exists = users.find(u => u.email === email);
            if (exists) {
                this.showError(form, 'Пользователь с таким email уже существует');
                return;
            }

            const newUser = {
                id: Date.now(),
                name,
                email,
                role: 'user'
            };

            localStorage.setItem('currentUser', JSON.stringify(newUser));

            if (window.appState) {
                window.appState.set('user', newUser);
            }

            window.location.href = 'index.html';
        });
    }

    showError(form, message) {
        let errorEl = form.querySelector('.login-error');
        if (!errorEl) {
            errorEl = document.createElement('p');
            errorEl.className = 'login-error';
            errorEl.style.cssText = 'color: #e74c3c; font-size: 13px; margin: 4px 0 0; text-align: center;';
            form.querySelector('button[type="submit"]').before(errorEl);
        }
        errorEl.textContent = message;
    }

    clearErrors() {
        this.container.querySelectorAll('.login-error').forEach(el => el.remove());
    }
}
