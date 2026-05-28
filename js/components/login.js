export class Login {
    constructor(containerSelector = '.login-card') {
        this.container = document.querySelector(containerSelector);
    }

    init() {
        if (!this.container) return;
        this.bindTabs();
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
    }
}
