// core/State.js
export class State {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = new Set();
    }

    get(key) {
        return key ? this.state[key] : this.state;
    }

    set(key, value) {
        if (typeof key === 'object') {
            this.state = { ...this.state, ...key };
        } else {
            this.state = { ...this.state, [key]: value };
        }
        
        this.notify();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}