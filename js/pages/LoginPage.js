// pages/LoginPage.js
import { Login } from '../components/login.js';

export class LoginPage {
    constructor() {
        this.loginComponent = new Login();
    }

    init() {
        this.loginComponent.init();
    }

    destroy() {}
}
