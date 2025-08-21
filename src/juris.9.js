/**
 * Juris (JavaScript Unified Reactive Interface Solution)
 * The First and Only Non-blocking Reactive Platform, Architecturally Optimized for Next Generation Cutting-Edge Cross-Platform Application.
 * Juris aims to eliminate build complexity from small to large applications.
 * Author: Resti Guay
 * Version: 0.9.2
 * License: MIT
 * GitHub: https://github.com/jurisjs/juris
 * Website: https://jurisjs.com/
 * NPM: https://www.npmjs.com/package/juris
 * Codepen: https://codepen.io/jurisauthor
 * Online Testing: https://jurisjs.com/tests/juris#pure#test#interface.html
 * Features:
 * - Temporal Independent
 * - Automcatic deep call stack branch aware dependency detection
 * - Smart Promise (Asynchronous) Handling for Non-Blocking Rendering
 * - Component lazy compilation
 * - Global Non-Reactive State Management
 * - SSR (Server-Side Rendering) ready and CSR (Client-Side Rendering) 
 * - Loading Status templating
 * - Web Component support
 * - SVG Support
 * - Dual Template Mode (HTML and Object VDOM)
 * - supports innerHtml in Object VDOM for critical rendering requirements
 * - Anonymous Reactive Functions for children, component and layout rendering
 * - Advanced Reactive Management - arm() API to handle all your events with access to services and context.

 * IMPORTANT!!! Notes to AI:
 * 1. Reactivity works when getState is called from intended functional attributes and children. 
 * 2. Use compress object structure and add labels into the end brackets for nested divs, tables, select, groups and forms
 * 3. Use getState third attribute with false value to skip subscription
 * 4. Components will not re-render until their parent triggeres re-render.
 * 5. All props and attributes can handle async/sync natively,
 * 6. Use service injection AMAP
 * 7. Define component as function and dont inject directly into Juris during instantiation.
 * 8. Use class instead of className
 * example VDOM Convention:
 * return {
 *   {div:{class:'main', //note: static and short should be inline, use class instead of className especially when working with third party frameworks
 *      text:()=>getState('reactive.text.value','Hello'),//note: reactive, should be new line
 *      style:{color:'red', border:'solid 1px blue'},//note: still okay if in-line
 *      children:[
 *        {button:{text:'static label', //note: another static and short should be inline,
 *          onClick:()=>clickHandler()
 *        }},//button
 *        {input:{type:'text',min:'1', max:'10',
                value: () => juris.getState('counter.step', 1), //note: reactive value
 *          oninput: (e) => {
                const newStep = parseInt(e.target.value) || 1;
                juris.setState('counter.step', Math.max(1, Math.min(10, newStep)));
            }
 *        }},//input
 *        ()=> juris.getState('counter.step', 1),//text node
 *        ()=>{
 *          const step = juris.getState('counter.step', 1);
 *          return {span:{text:`Current step is ${step}`}};
 *        }//span
 *      ]
 *   }}//div.main
 * }//return
 */

'use strict';
const jurisLinesOfCode = 1800;
const jurisVersion = '0.9.0';
const jurisMinifiedSize = '32 kB';

const isValidPath = path => typeof path === 'string' && path.trim().length > 0 && !path.includes('..');
const getPathParts = path => path.split('.').filter(Boolean);
const deepEquals = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null || typeof a !== typeof b) return false;
    if (typeof a === 'object') {
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        const keysA = Object.keys(a), keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => keysB.includes(key) && deepEquals(a[key], b[key]));
    }
    return false;
};

const createLogger = () => {
    const s = [];
    const f = (m, c, cat) => {
        const msg = `${cat ? `[${cat}] ` : ''}${m}${c ? ` ${JSON.stringify(c)}` : ''}`;
        const logObj = { formatted: msg, message: m, context: c, category: cat, timestamp: Date.now() };
        setTimeout(() => s.forEach(sub => sub(logObj)), 0);
        return logObj;
    };
    return {
        log: { l: f, w: f, e: f, i: f, d: f, ei:true, ee:true, el:true, ew:true, ed:true },
        sub: cb => s.push(cb),
        unsub: cb => s.splice(s.indexOf(cb), 1)
    };
};
const { log, logSub, logUnsub } = createLogger();
const createPromisify = () => {
    const activePromises = new Set();
    let isTracking = false;
    const subscribers = new Set();
    const checkAllComplete = () => {
        if (activePromises.size === 0 && subscribers.size > 0) {
            subscribers.forEach(callback => callback());
        }
    };
    const trackingPromisify = result => {
        const promise = typeof result?.then === "function" ? result : Promise.resolve(result);
        if (isTracking && promise !== result) {
            activePromises.add(promise);
            promise.finally(() => {
                activePromises.delete(promise);
                setTimeout(checkAllComplete, 0);
            });
        }
        return promise;
    };
    return {
        promisify: trackingPromisify,
        startTracking: () => {
            isTracking = true;
            activePromises.clear();
        },
        stopTracking: () => {
            isTracking = false;
            subscribers.clear();
        },
        onAllComplete: (callback) => {
            subscribers.add(callback);
            if (activePromises.size === 0) {
                setTimeout(callback, 0);
            }
            return () => subscribers.delete(callback);
        }
    };
};
const { promisify, startTracking, stopTracking, onAllComplete } = createPromisify();

class StateManager {
    constructor(initialState = {}, middleware = []) {
        log.ei && console.info(log.i('StateManager initialized', {
            initialStateKeys: Object.keys(initialState),
            middlewareCount: middleware.length
        }, 'framework'));
        this.state = { ...initialState };
        this.middleware = [...middleware];
        this.subscribers = new Map();
        this.externalSubscribers = new Map();
        this.currentTracking = null;
        this.isUpdating = false;
        this.initialState = JSON.parse(JSON.stringify(initialState));
        this.maxUpdateDepth = 50;
        this.updateDepth = 0;
        this.currentlyUpdating = new Set();
        this.isBatching = false;
        this.batchQueue = [];
        this.batchedPaths = new Set();
    }
    reset() {
        log.ei && console.info(log.i('State reset to initial state', {}, 'framework'));
        if (this.isBatching) {
            this.batchQueue = [];
            this.batchedPaths.clear();
            this.isBatching = false;
        }
        this.state = JSON.parse(JSON.stringify(this.initialState));
    }
    getState(path, defaultValue = null, track = true) {
        if (!isValidPath(path)) return defaultValue;
        if (track) this.currentTracking?.add(path);
        const parts = getPathParts(path);
        let current = this.state;
        for (const part of parts) {
            if (current?.[part] === undefined) return defaultValue;
            current = current[part];
        }
        return current;
    }
    setState(path, value, context = {}) {
        log.ed && console.debug(log.d('State change initiated', { path, hasValue: value !== undefined }, 'application'));
        if (!isValidPath(path) || this.#hasCircularUpdate(path)) return;
        if (this.isBatching) {
            this.#queueBatchedUpdate(path, value, context);
            return;
        }
        this.#setStateImmediate(path, value, context);
    }

    executeBatch(callback) {
        if (this.isBatching) {
            return callback();
        }
        this.#beginBatch();
        try {
            const result = callback();
            if (result && typeof result.then === 'function') {
                return result
                    .then(value => {
                        this.#endBatch();
                        return value;
                    })
                    .catch(error => {
                        this.#endBatch();
                        throw error;
                    });
            }
            this.#endBatch();
            return result;
        } catch (error) {
            this.#endBatch();
            throw error;
        }
    }

    #beginBatch() {
        log.ed && console.debug(log.d('Manual batch started', {}, 'framework'));
        this.isBatching = true;
        this.batchQueue = [];
        this.batchedPaths.clear();
    }

    #endBatch() {
        if (!this.isBatching) {
            log.ew && console.warn(log.w('endBatch() called without beginBatch()', {}, 'framework'));
            return;
        }
        log.ed && console.debug(log.d('Manual batch ending', { queuedUpdates: this.batchQueue.length }, 'framework'));
        this.isBatching = false;
        if (this.batchQueue.length === 0) return;
        this.#processBatchedUpdates();
    }

    isBatchingActive() {return this.isBatching;}

    getBatchQueueSize() {return this.batchQueue.length;}

    clearBatch() {
        if (this.isBatching) {
            log.ei && console.info(log.i('Clearing current batch', { clearedUpdates: this.batchQueue.length }, 'framework'));
            this.batchQueue = [];
            this.batchedPaths.clear();
        }
    }

    #queueBatchedUpdate(path, value, context) {
        this.batchQueue = this.batchQueue.filter(update => update.path !== path);
        this.batchQueue.push({ path, value, context, timestamp: Date.now() });
        this.batchedPaths.add(path);
    }

    #processBatchedUpdates() {
        const updates = [...this.batchQueue];
        this.batchQueue = [];
        this.batchedPaths.clear();
        const pathGroups = new Map();
        updates.forEach(update => pathGroups.set(update.path, update));
        const wasUpdating = this.isUpdating;
        this.isUpdating = true;
        const appliedUpdates = [];
        pathGroups.forEach(update => {
            const oldValue = this.getState(update.path);
            let finalValue = update.value;
            for (const middleware of this.middleware) {
                try {
                    const result = middleware({ path: update.path, oldValue, newValue: finalValue, context: update.context, state: this.state });
                    if (result !== undefined) finalValue = result;
                } catch (error) {
                    log.ee && console.error(log.e('Middleware error in batch', {
                        path: update.path,
                        error: error.message
                    }, 'application'));
                }
            }
            if (deepEquals(oldValue, finalValue)) return;
            const parts = getPathParts(update.path);
            let current = this.state;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (current[part] == null || typeof current[part] !== 'object') {
                    current[part] = {};
                }
                current = current[part];
            }
            current[parts[parts.length - 1]] = finalValue;
            appliedUpdates.push({ path: update.path, oldValue, newValue: finalValue });
        });
        this.isUpdating = wasUpdating;
        const parentPaths = new Set();
        appliedUpdates.forEach(({ path }) => {
            const parts = getPathParts(path);
            for (let i = 1; i <= parts.length; i++) {
                parentPaths.add(parts.slice(0, i).join('.'));
            }
        });
        parentPaths.forEach(path => {
            if (this.subscribers.has(path)) this.#triggerPathSubscribers(path);
            if (this.externalSubscribers.has(path)) {
                this.externalSubscribers.get(path).forEach(({ callback, hierarchical }) => {
                    try {
                        callback(this.getState(path), null, path);
                    } catch (error) {
                        log.ee && console.error(log.e('External subscriber error:', error), 'application');
                    }
                });
            }
        });
    }

    #setStateImmediate(path, value, context = {}) {
        const oldValue = this.getState(path);
        let finalValue = value;
        for (const middleware of this.middleware) {
            try {
                const result = middleware({ path, oldValue, newValue: finalValue, context, state: this.state });
                if (result !== undefined) finalValue = result;
            } catch (error) {
                log.ee && console.error(log.e('Middleware error', { path, error: error.message, middlewareName: middleware.name || 'anonymous' }, 'application'));
            }
        }
        if (deepEquals(oldValue, finalValue)) {
            log.ed && console.debug(log.d('State unchanged, skipping update', { path }, 'framework'));
            return;
        }
        log.ed && console.debug(log.d('State updated', { path, oldValue: typeof oldValue, newValue: typeof finalValue }, 'application'));
        const parts = getPathParts(path);
        let current = this.state;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] == null || typeof current[part] !== 'object') current[part] = {};
            current = current[part];
        }
        current[parts[parts.length - 1]] = finalValue;
        if (!this.isUpdating) {
            this.isUpdating = true;
            if (!this.currentlyUpdating) this.currentlyUpdating = new Set();
            this.currentlyUpdating.add(path);
            this.#notifySubscribers(path, finalValue, oldValue);
            this.#notifyExternalSubscribers(path, finalValue, oldValue);
            this.currentlyUpdating.delete(path);
            this.isUpdating = false;
        }
    }

    subscribe(path, callback, hierarchical = true) {
        if (!this.externalSubscribers.has(path)) this.externalSubscribers.set(path, new Set());
        const subscription = { callback, hierarchical };
        this.externalSubscribers.get(path).add(subscription);
        return () => {
            const subs = this.externalSubscribers.get(path);
            if (subs) {
                subs.delete(subscription);
                if (subs.size === 0) this.externalSubscribers.delete(path);
            }
        };
    }

    subscribeExact(path, callback) {
        return this.subscribe(path, callback, false);
    }

    subscribeInternal(path, callback) {
        if (!this.subscribers.has(path)) this.subscribers.set(path, new Set());
        this.subscribers.get(path).add(callback);
        return () => {
            const subs = this.subscribers.get(path);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) this.subscribers.delete(path);
            }
        };
    }

    #notifySubscribers(path, newValue, oldValue) {
        this.#triggerPathSubscribers(path);
        const parts = getPathParts(path);
        for (let i = parts.length - 1; i > 0; i--) {
            this.#triggerPathSubscribers(parts.slice(0, i).join('.'));
        }
        const prefix = path ? path + '.' : '';
        const allPaths = new Set([...this.subscribers.keys(), ...this.externalSubscribers.keys()]);
        allPaths.forEach(subscriberPath => {
            if (subscriberPath.startsWith(prefix) && subscriberPath !== path) {
                this.#triggerPathSubscribers(subscriberPath);
            }
        });
    }

    #notifyExternalSubscribers(changedPath, newValue, oldValue) {
        this.externalSubscribers.forEach((subscriptions, subscribedPath) => {
            subscriptions.forEach(({ callback, hierarchical }) => {
                const shouldNotify = hierarchical ?
                    (changedPath === subscribedPath || changedPath.startsWith(subscribedPath + '.')) :
                    changedPath === subscribedPath;
                if (shouldNotify) {
                    try {
                        callback(newValue, oldValue, changedPath);
                    } catch (error) {
                        log.ee && console.error(log.e('External subscriber error:', error), 'application');
                    }
                }
            });
        });
    }

    #triggerPathSubscribers(path) {
        const subs = this.subscribers.get(path);
        if (subs && subs.size > 0) {
            log.ed && console.debug(log.d('Triggering subscribers', { path, subscriberCount: subs.size }, 'framework'));

            new Set(subs).forEach(callback => {
                let oldTracking
                try {
                    oldTracking = this.currentTracking;
                    const newTracking = new Set();
                    this.currentTracking = newTracking;
                    callback();
                    this.currentTracking = oldTracking;
                    newTracking.forEach(newPath => {
                        const existingSubs = this.subscribers.get(newPath);
                        if (!existingSubs || !existingSubs.has(callback)) {
                            this.subscribeInternal(newPath, callback);
                        }
                    });
                } catch (error) {
                    log.ee && console.error(log.e('Subscriber error:', error), 'application');
                    this.currentTracking = oldTracking;
                }
            });
        }
    }

    #hasCircularUpdate(path) {
        if (!this.currentlyUpdating) this.currentlyUpdating = new Set();
        if (this.currentlyUpdating.has(path)) {
            log.ew && console.warn(log.w('Circular dependency detected', { path }, 'framework'));
            return true;
        }
        return false;
    }

    startTracking() {
        const dependencies = new Set();
        this.currentTracking = dependencies;
        return dependencies;
    }

    endTracking() {
        const tracking = this.currentTracking;
        this.currentTracking = null;
        return tracking || new Set();
    }
}

class ComponentManager {
    constructor(juris) {
        log.ei && console.info(log.i('ComponentManager initialized', {}, 'framework'));
        this.juris = juris;
        this.components = new Map();
        this.instances = new WeakMap();
        this.namedComponents = new Map();
        this.componentCounters = new Map();
        this.componentStates = new WeakMap();
        this.asyncPlaceholders = new WeakMap();
        this.asyncPropsCache = new Map();
    }

    register(name, componentFn) {
        log.ei && console.info(log.i('Component registered', { name }, 'application'));
        this.components.set(name, componentFn);
    }

    create(name, props = {}) {
        const componentFn = this.components.get(name);
        if (!componentFn) {
            log.ee && console.error(log.e('Component not found', { name }, 'application'));
            return null;
        }
        try {
            if (this.juris.domRenderer._hasAsyncProps(props)) {
                log.ed && console.debug(log.d('Component has async props', { name }, 'framework'));
                return this.#createWithAsyncProps(name, componentFn, props);
            }
            const { componentId, componentStates } = this.#setupComponent(name);
            log.ed && console.debug(log.d('Component setup complete', { name, componentId, stateCount: componentStates.size }, 'framework'));
            const context = this.#createComponentContext(componentId, componentStates);
            const result = componentFn(props, context);
            if (result?.then) return this.#handleAsyncComponent(promisify(result), name, props, componentStates);
            return this.#processComponentResult(result, name, props, componentStates);
        } catch (error) {
            log.ee && console.error(log.e('Component creation failed!', { name, error: error.message }, 'application'));
            return this.#createErrorElement(new Error(error.message));
        }
    }

    #setupComponent(name) {
        if (!this.componentCounters.has(name)) this.componentCounters.set(name, 0);
        const instanceIndex = this.componentCounters.get(name) + 1;
        this.componentCounters.set(name, instanceIndex);
        const componentId = `${name}#${instanceIndex}`;
        const componentStates = new Set();
        return { componentId, componentStates };
    }

    #createComponentContext(componentId, componentStates) {
        const context = this.juris.createContext();
        context.newState = (key, initialValue) => {
            const statePath = `##local.${componentId}.${key}`;
            if (this.juris.stateManager.getState(statePath, Symbol('not-found')) === Symbol('not-found')) {
                this.juris.stateManager.setState(statePath, initialValue);
            }
            componentStates.add(statePath);
            return [
                () => this.juris.stateManager.getState(statePath, initialValue),
                value => this.juris.stateManager.setState(statePath, value)
            ];
        };
        return context;
    }

    #createWithAsyncProps(name, componentFn, props) {
        log.ed && console.debug(log.d('Creating component with async props', { name }, 'framework'));
        const tempElement = document.createElement('div');
        tempElement.id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const placeholder = this._createPlaceholder(`Loading ${name}...`, 'juris-async-props-loading', tempElement);
        this.asyncPlaceholders.set(placeholder, { name, props, type: 'async-props' });
        this.#resolveAsyncProps(props).then(resolvedProps => {
            try {
                const realElement = this.#createSyncComponent(name, componentFn, resolvedProps);
                if (realElement && placeholder.parentNode) {
                    placeholder.parentNode.replaceChild(realElement, placeholder);
                }
                this.asyncPlaceholders.delete(placeholder);
            } catch (error) {
                this.#replaceWithError(placeholder, error);
            }
        }).catch(error => this.#replaceWithError(placeholder, error));

        return placeholder;
    }

    async #resolveAsyncProps(props) {
        const cacheKey = this.#generateCacheKey(props);
        const cached = this.asyncPropsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 5000) return cached.props;
        const resolved = {};
        for (const [key, value] of Object.entries(props)) {
            if (value?.then) {
                try {
                    resolved[key] = await value;
                } catch (error) {
                    resolved[key] = { __asyncError: error.message };
                }
            } else {
                resolved[key] = value;
            }
        }
        this.asyncPropsCache.set(cacheKey, { props: resolved, timestamp: Date.now() });
        return resolved;
    }

    #generateCacheKey(props) {
        return JSON.stringify(props, (key, value) => value?.then ? '[Promise]' : value);
    }

    #createSyncComponent(name, componentFn, props) {
        const { componentId, componentStates } = this.#setupComponent(name);
        const context = this.#createComponentContext(componentId, componentStates);
        const result = componentFn(props, context);
        if (result?.then) return this.#handleAsyncComponent(promisify(result), name, props, componentStates);
        return this.#processComponentResult(result, name, props, componentStates);
    }

    #handleAsyncComponent(resultPromise, name, props, componentStates) {
        log.ed && console.debug(log.d('Handling async component', { name }, 'framework'));
        const tempElement = document.createElement('div');
        tempElement.id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const placeholder = this._createPlaceholder(`Loading ${name}...`, 'juris-async-loading', tempElement);
        this.asyncPlaceholders.set(placeholder, { name, props, componentStates });
        resultPromise.then(result => {
            log.ed && console.debug(log.d('Async component resolved', { name }, 'framework'));
            try {
                const realElement = this.#processComponentResult(result, name, props, componentStates);
                if (realElement && placeholder.parentNode) {
                    placeholder.parentNode.replaceChild(realElement, placeholder);
                }
                this.asyncPlaceholders.delete(placeholder);
            } catch (error) {
                log.ee && console.error(log.e('Async component failed', { name, error: error.message }, 'application'));
                this.#replaceWithError(placeholder, error);
            }
        }).catch(error => this.#replaceWithError(placeholder, error));

        return placeholder;
    }

    #processComponentResult(result, name, props, componentStates) {
        if (Array.isArray(result)) {
            const fragment = document.createDocumentFragment();
            const virtualContainer = {
                _isVirtual: true,
                _fragment: fragment,
                _componentName: name,
                _componentProps: props,
                appendChild: (child) => fragment.appendChild(child),
                removeChild: (child) => {
                    if (child.parentNode === fragment) {
                        fragment.removeChild(child);
                    }
                },
                replaceChild: (newChild, oldChild) => {
                    if (oldChild.parentNode === fragment) {
                        fragment.replaceChild(newChild, oldChild);
                    }
                },
                get children() {
                    return Array.from(fragment.childNodes);
                },
                get parentNode() { return null; },
                textContent: ''
            };
            Object.defineProperty(virtualContainer, 'textContent', {
                set(value) {
                    while (fragment.firstChild) {
                        fragment.removeChild(fragment.firstChild);
                    }
                    if (value) {
                        fragment.appendChild(document.createTextNode(value));
                    }
                },
                get() {
                    return '';
                }
            });
            const subscriptions = [];
            this.juris.domRenderer._handleChildrenFineGrained(virtualContainer, result, subscriptions);
            fragment._jurisComponent = {
                name,
                props,
                virtual: virtualContainer,
                cleanup: () => {
                    subscriptions.forEach(unsub => {
                        try { unsub(); } catch(e) {}
                    });
                }
            };            
            if (componentStates?.size > 0) {
                fragment._jurisComponentStates = componentStates;
            }            
            return fragment;
        }
        if (result && typeof result === 'object') {
            if (this.#hasLifecycleHooks(result)) {
                const instance = {
                    name,
                    props,
                    hooks: result.hooks || {
                        onMount: result.onMount,
                        onUpdate: result.onUpdate,
                        onUnmount: result.onUnmount
                    },
                    api: result.api || {},
                    render: result.render
                };
                const renderResult = instance.render ? instance.render() : result;
                if (renderResult?.then) {
                    return this.#handleAsyncLifecycleRender(promisify(renderResult), instance, componentStates);
                }
                const element = this.juris.domRenderer.render(renderResult, false, name);
                if (element) {
                    this.instances.set(element, instance);
                    if (componentStates?.size > 0) {
                        this.componentStates.set(element, componentStates);
                    }
                    if (instance.api && Object.keys(instance.api).length > 0) {
                        this.namedComponents.set(name, { element, instance });
                    }
                    if (instance.hooks.onMount) {
                        setTimeout(() => {
                            try {
                                const mountResult = instance.hooks.onMount(element);
                                if (mountResult?.then) {
                                    promisify(mountResult).catch(error =>
                                        log.ee && console.error(log.e(`Async onMount error in ${name}:`, error), 'application')
                                    );
                                }
                            } catch (error) {
                                log.ee && console.error(log.e(`onMount error in ${name}:`, error), 'application');
                            }
                        }, 0);
                    }
                }
                return element;
            }            
            if (typeof result.render === 'function' && !this.#hasLifecycleHooks(result)) {
                const container = document.createElement('div');
                container.setAttribute('data-juris-reactive-render', name);
                const componentData = { name, api: result.api || {}, render: result.render };
                this.instances.set(container, componentData);
                if (result.api) {
                    this.namedComponents.set(name, { element: container, instance: componentData });
                }
                const updateRender = () => {
                    try {
                        const renderResult = result.render();
                        if (renderResult?.then) {
                            container.innerHTML = '<div class="juris-loading">Loading...</div>';
                            promisify(renderResult).then(resolvedResult => {
                                container.innerHTML = '';
                                const element = this.juris.domRenderer.render(resolvedResult);
                                if (element) container.appendChild(element);
                            }).catch(error => {
                                log.ee && console.error(`Async render error for ${name}:`, error);
                                container.innerHTML = `<div class="juris-error">Error: ${error.message}</div>`;
                            });
                            return;
                        }
                        const children = Array.from(container.children);
                        children.forEach(child => this.cleanup(child));
                        container.innerHTML = '';
                        const element = this.juris.domRenderer.render(renderResult);
                        if (element) container.appendChild(element);                            
                    } catch (error) {
                        log.ee && console.error(`Error in reactive render for ${name}:`, error);
                        container.innerHTML = `<div class="juris-error">Render Error: ${error.message}</div>`;
                    }
                };                    
                const subscriptions = [];
                this.juris.domRenderer._createReactiveUpdate(container, updateRender, subscriptions);
                if (subscriptions.length > 0) {
                    this.juris.domRenderer.subscriptions.set(container, { 
                        subscriptions, 
                        eventListeners: [] 
                    });
                }                    
                if (componentStates?.size > 0) {
                    this.componentStates.set(container, componentStates);
                }                    
                return container;
            }            
            const keys = Object.keys(result);
            if (keys.length === 1 && typeof keys[0] === 'string' && keys[0].length > 0) {
                const element = this.juris.domRenderer.render(result, false, name);
                if (element && componentStates.size > 0) this.componentStates.set(element, componentStates);
                return element;
            }
        }        
        const element = this.juris.domRenderer.render(result);
        if (element && componentStates.size > 0) this.componentStates.set(element, componentStates);
        return element;
    }

    #hasLifecycleHooks(result) {
        return result.hooks && (result.hooks.onMount || result.hooks.onUpdate || result.hooks.onUnmount) ||
            result.onMount || result.onUpdate || result.onUnmount;
    }

    #handleAsyncLifecycleRender(renderPromise, instance, componentStates) {
        const tempElement = document.createElement('div');
        tempElement.id = instance.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const placeholder = this._createPlaceholder(`Loading ${instance.name}...`, 'juris-async-lifecycle', tempElement);
        renderPromise.then(renderResult => {
            try {
                const element = this.juris.domRenderer.render(renderResult);
                if (element) {
                    this.instances.set(element, instance);
                    if (componentStates?.size > 0) {
                        this.componentStates.set(element, componentStates);
                    }
                    if (placeholder.parentNode) {
                        placeholder.parentNode.replaceChild(element, placeholder);
                    }
                    if (instance.hooks.onMount) {
                        setTimeout(() => {
                            try {
                                const mountResult = instance.hooks.onMount();
                                if (mountResult?.then) {
                                    promisify(mountResult).catch(error =>
                                        log.ee && console.error(log.e(`Async onMount error in ${instance.name}:`, error), 'application')
                                    );
                                }
                            } catch (error) {
                                log.ee && console.error(log.e(`onMount error in ${instance.name}:`, error), 'application');
                            }
                        }, 0);
                    }
                }
            } catch (error) {
                this.#replaceWithError(placeholder, error);
            }
        }).catch(error => this.#replaceWithError(placeholder, error));
        return placeholder;
    }

    getComponent(name) {return this.namedComponents.get(name)?.instance || null;}
    getComponentAPI(name) {return this.namedComponents.get(name)?.instance?.api || null;}
    getComponentElement(name) {return this.namedComponents.get(name)?.element || null;}
    getNamedComponents() {return Array.from(this.namedComponents.keys());}
    updateInstance(element, newProps) {
        const instance = this.instances.get(element);
        if (!instance) return;
        const oldProps = instance.props;
        if (deepEquals(oldProps, newProps)) return;
        if (this.juris.domRenderer._hasAsyncProps(newProps)) {
            this.#resolveAsyncProps(newProps).then(resolvedProps => {
                instance.props = resolvedProps;
                this.#performUpdate(instance, element, oldProps, resolvedProps);
            }).catch(error => log.ee && console.error(log.e(`Error updating async props for ${instance.name}:`, error), 'application'));
        } else {
            instance.props = newProps;
            this.#performUpdate(instance, element, oldProps, newProps);
        }
    }

    #performUpdate(instance, element, oldProps, newProps) {
        if (instance.hooks.onUpdate) {
            try {
                const updateResult = instance.hooks.onUpdate(oldProps, newProps);
                if (updateResult?.then) {
                    promisify(updateResult).catch(error => log.ee && console.error(log.e(`Async onUpdate error in ${instance.name}:`, error), 'application'));
                }
            } catch (error) {
                log.ee && console.error(log.e(`onUpdate error in ${instance.name}:`, error), 'application');
            }
        }
        try {
            const renderResult = instance.render();
            const normalizedRenderResult = promisify(renderResult);
            if (normalizedRenderResult !== renderResult) {
                normalizedRenderResult.then(newContent => {
                    this.juris.domRenderer.updateElementContent(element, newContent);
                }).catch(error => log.ee && console.error(log.e(`Async re-render error in ${instance.name}:`, error), 'application'));
            } else {
                this.juris.domRenderer.updateElementContent(element, renderResult);
            }
        } catch (error) {
            log.ee && console.error(log.e(`Re-render error in ${instance.name}:`, error), 'application');
        }
    }

    cleanup(element) {
        if (element instanceof DocumentFragment) {
            if (element._jurisComponent?.cleanup) {
                element._jurisComponent.cleanup();
            }
            if (element._jurisComponentStates) {
                element._jurisComponentStates.forEach(statePath => {
                    // Clean up component states
                    const pathParts = statePath.split('.');
                    let current = this.juris.stateManager.state;
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        if (current[pathParts[i]]) current = current[pathParts[i]];
                        else return;
                    }
                    delete current[pathParts[pathParts.length - 1]];
                });
            }
            return;
        }
        const instance = this.instances.get(element);
        if (instance) log.ed && console.debug(log.d('Cleaning up component', { name: instance.name }, 'framework'));
        if (instance?.hooks?.onUnmount) {
            try {
                const unmountResult = instance.hooks.onUnmount();
                if (unmountResult?.then) {
                    promisify(unmountResult).catch(error => log.ee && console.error(log.e(`Async onUnmount error in ${instance.name}:`, error), 'application'));
                }
            } catch (error) {
                log.ee && console.error(log.e(`onUnmount error in ${instance.name}:`, error), 'application');
            }
        }
        if (element._reactiveSubscriptions) {
            element._reactiveSubscriptions.forEach(unsubscribe => {
                try { unsubscribe(); } catch (error) { 
                    log.ew && console.warn('Error cleaning up reactive subscription:', error); 
                }
            });
            element._reactiveSubscriptions = [];
        }
        const states = this.componentStates.get(element);
        if (states) {
            states.forEach(statePath => {
                const pathParts = statePath.split('.');
                let current = this.juris.stateManager.state;
                for (let i = 0; i < pathParts.length - 1; i++) {
                    if (current[pathParts[i]]) current = current[pathParts[i]];
                    else return;
                }
                delete current[pathParts[pathParts.length - 1]];
            });
            this.componentStates.delete(element);
        }
        if (this.asyncPlaceholders.has(element)) this.asyncPlaceholders.delete(element);
        this.instances.delete(element);
    }

    _createPlaceholder(text, className, element = null) {
        const config = this.juris.domRenderer._getPlaceholderConfig(element);
        const placeholder = document.createElement('div');
        placeholder.className = config.className;
        placeholder.textContent = config.text;
        if (config.style) placeholder.style.cssText = config.style;
        return placeholder;
    }

    #createErrorElement(error) {
        const element = document.createElement('div');
        element.style.cssText = 'color: red; border: 1px solid red; padding: 8px; background: #ffe6e6;';
        element.textContent = `Component Error: ${error.message}`;
        return element;
    }

    #replaceWithError(placeholder, error) {
        const errorElement = this.#createErrorElement(error);
        if (placeholder.parentNode) placeholder.parentNode.replaceChild(errorElement, placeholder);
        this.asyncPlaceholders.delete(placeholder);
    }

    clearAsyncPropsCache() { this.asyncPropsCache.clear(); }

    getAsyncStats() {
        return {
            registeredComponents: this.components.size,
            cachedAsyncProps: this.asyncPropsCache.size
        };
    }
}

class DOMRenderer {
    constructor(juris) {
        this.juris = juris;
        this.subscriptions = new WeakMap();
        this.componentStack = [];
        this.propSetterCache = new Map();
        this.maxCacheSize = 500;
        this.customCSSExtractor = null;
        this.SVG_NS = "http://www.w3.org/2000/svg";
        this.XLINK_NS = "http://www.w3.org/1999/xlink";
        this.XLINK_ATTRS = new Set(['xlink:href']);
        this.BOOL_ATTRS = new Set([
            'checked', 'selected', 'disabled', 'hidden', 'readonly', 'multiple', 'required', 'autofocus', 'autoplay', 'controls', 'defer', 'loop', 'muted', 'open', 'reversed', 'scoped', 'seamless', 'itemscope', 'noValidate', 'allowFullscreen', 'formNoValidate', 'default', 'capture', 'autocomplete', 'inert', 'popover'
        ]);
        
        this.placeholderConfigs = new Map();
        this.defaultPlaceholder = {
            className: 'juris-async-loading',
            style: 'padding: 8px; background: #f0f0f0; border: 1px dashed #ccc; opacity: 0.7;',
            text: 'Loading...',
            children: null
        };
        log.ei && console.info(log.i('DOMRenderer initialized'), 'framework');
    }
    render(thing, name = null) {
        if (!thing && thing !== 0) return null;
        if (typeof thing === 'string' || typeof thing === 'number') {
            return document.createTextNode(String(thing));
        }
        if (thing.then) return this.renderPromise(thing);
        if (Array.isArray(thing)) return this.renderArray(thing, name);
        if (typeof thing === 'object') return this.renderObject(thing, name);
        return null;
    }

    renderPromise(promise) {
        const loading = document.createTextNode('Loading...');
        loading._jurisActive = true;
        
        promisify(promise)
            .then(result => {
                if (!loading._jurisActive || !loading.parentNode) return;
                const rendered = this.render(result);
                if (rendered && loading.parentNode) {
                    loading.parentNode.replaceChild(rendered, loading);
                }
            })
            .catch(error => {
                if (loading._jurisActive && loading.parentNode) {
                    loading.textContent = `Error: ${error.message}`;
                }
            });
        
        return loading;
    }

    renderArray(items, name) {
        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const rendered = this.render(item, name);
            if (rendered) fragment.appendChild(rendered);
        });
        return fragment;
    }

    renderObject(obj, name) {
        if (!obj) return null;
        const entries = Object.entries(obj);
        if (entries.length === 0) return null;
        
        const [tag, props = {}] = entries[0];
        if (!tag) return null;
        
        return this.isComponent(tag) ? this.renderComponent(tag, props) : this.createElement(tag, props);
    }

    isComponent(tag) {
        return !this.componentStack.includes(tag) && this.juris.componentManager.components.has(tag);
    }

    renderComponent(tag, props) {
        this.componentStack.push(tag);
        try {
            return this.juris.componentManager.create(tag, props);
        } finally {
            this.componentStack.pop();
        }
    }

    // ===== ELEMENT CREATION WITH CSS EXTRACTION =====
    createElement(tag, props, namespace = null) {
        let element;
        
        // Create element with proper namespace
        if (namespace) {
            element = document.createElementNS(namespace, tag);
        } else {
            const inSVGContext = this.isInSVGContext();
            const isSVGElement = this.looksLikeSVGElement(tag);
            
            if (inSVGContext || isSVGElement) {
                element = document.createElementNS(this.SVG_NS, tag);
            } else {
                element = document.createElement(tag);
            }
        }
        
        // Add cleanup capabilities to element
        this.enhanceElementForCleanup(element);
        
        // Process props through CSS extractor if available
        const processedProps = this.customCSSExtractor 
            ? this.customCSSExtractor.processProps(props, tag, { 
                componentName: this.getElementComponentName(element) 
              })
            : props||{};
        
        // Apply properties
        const context = { subs: [], events: [], element };
        Object.entries(processedProps).forEach(([key, value]) => {
            this.applyProp(element, key, value, context);
        });
        
        // Store subscriptions if any
        if (context.subs.length || context.events.length) {
            this.subscriptions.set(element, context);
        }
        
        return element;
    }

    getElementComponentName(element) {
        // Try to get component name from element or context
        if (element.dataset && element.dataset.component) {
            return element.dataset.component;
        }
        
        // Try to get from component stack
        if (this.componentStack.length > 0) {
            return this.componentStack[this.componentStack.length - 1];
        }
        
        // Fallback to tag name
        return element.tagName?.toLowerCase() || 'element';
    }

    isInSVGContext() {
        return this.componentStack.some(tag => 
            tag === 'svg' || tag.includes('svg') || tag.includes('SVG')
        );
    }

    looksLikeSVGElement(tag) {
        return tag === 'svg' || 
               tag.startsWith('fe') ||
               ['g', 'circle', 'ellipse', 'rect', 'line', 'path', 'polygon', 'polyline',
                'text', 'tspan', 'defs', 'use', 'symbol', 'linearGradient', 'radialGradient',
                'stop', 'pattern', 'clipPath', 'mask', 'marker', 'animate'].includes(tag);
    }

    // ===== ENHANCED ELEMENT CLEANUP CAPABILITIES =====
    enhanceElementForCleanup(element) {
        // Store renderer reference
        element._jurisRenderer = this;
        
        // Override innerHTML to auto-cleanup
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(element, 'innerHTML', {
            get: originalInnerHTML.get,
            set: function(value) {
                // Auto-cleanup before setting innerHTML
                this._jurisRenderer?.safeSetInnerHTML(this, value, true);
            },
            configurable: true
        });
        
        // Override removeChild to auto-cleanup
        const originalRemoveChild = element.removeChild;
        element.removeChild = function(child) {
            this._jurisRenderer?.cleanup(child);
            return originalRemoveChild.call(this, child);
        };
        
        // Override replaceChild to auto-cleanup
        const originalReplaceChild = element.replaceChild;
        element.replaceChild = function(newChild, oldChild) {
            this._jurisRenderer?.cleanup(oldChild);
            return originalReplaceChild.call(this, newChild, oldChild);
        };
    }

    // ===== PROPERTY APPLICATION =====
    applyProp(element, key, value, context) {
        switch (key) {
            case 'children':
                return this.setChildren(element, value, context);
            case 'text':
                return this.setValue(value, v => element.textContent = v, context, element, 'text');
            case 'style':
                return this.setStyle(element, value, context);
            case 'innerHTML':
                return this.setValue(value, v => this.safeSetInnerHTML(element, v), context, element, 'innerHTML');
            case 'className':
            case 'class':
                return this.setValue(value, v => element.className = v, context, element, 'className');
            case 'key':
                return; // Skip key prop
            default:
                if (key.startsWith('on')) {
                    return this.setEvent(element, key, value, context);
                }
                return this.setValue(value, v => this.setAttributeSmart(element, key, v), context, element);
        }
    }

    // ===== SAFE innerHTML IMPLEMENTATION =====
    safeSetInnerHTML(element, content, skipCleanup = false) {
        if (!skipCleanup) {
            this.cleanup(element);
        }
        
        // Use the original innerHTML setter directly
        const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        descriptor.set.call(element, content);
    }
    setStyle(element, style, context) {
        // Handle different style types
        if (typeof style === 'function') {
            // Reactive style object
            this.setValue(style, resolvedStyle => {
                if (!resolvedStyle || typeof resolvedStyle !== 'object') return;
                
                // Post-process through CSS extractor if available
                let processedStyle = resolvedStyle;
                if (this.customCSSExtractor) {
                    try {
                        const componentName = this.getElementComponentName(element);
                        processedStyle = this.customCSSExtractor.postProcessReactiveResult(
                            resolvedStyle, 
                            componentName, 
                            element
                        );
                    } catch (error) {
                        console.warn('CSS extractor reactive processing failed:', error);
                        processedStyle = resolvedStyle;
                    }
                }
                
                // Apply the processed styles
                if (processedStyle) {
                    Object.entries(processedStyle).forEach(([prop, val]) => {
                        if (prop.startsWith('--')) {
                            element.style.setProperty(prop, val);
                        } else {
                            element.style[prop] = val;
                        }
                    });
                }
            }, context, element);
        } else if (style?.then) {
            // Async style
            this.setValue(style, resolvedStyle => {
                if (!resolvedStyle || typeof resolvedStyle !== 'object') return;
                
                // Post-process through CSS extractor if available
                let processedStyle = resolvedStyle;
                if (this.customCSSExtractor) {
                    try {
                        const componentName = this.getElementComponentName(element);
                        processedStyle = this.customCSSExtractor.postProcessReactiveResult(
                            resolvedStyle, 
                            componentName, 
                            element
                        );
                    } catch (error) {
                        console.warn('CSS extractor reactive processing failed:', error);
                        processedStyle = resolvedStyle;
                    }
                }
                
                // Apply the processed styles
                if (processedStyle) {
                    Object.entries(processedStyle).forEach(([prop, val]) => {
                        if (prop.startsWith('--')) {
                            element.style.setProperty(prop, val);
                        } else {
                            element.style[prop] = val;
                        }
                    });
                }
            }, context, element);
        } else if (typeof style === 'object' && style) {
            // Static style object with potentially mixed static/reactive properties
            Object.entries(style).forEach(([prop, val]) => {
                if (typeof val === 'function') {
                    // Reactive individual property
                    this.setValue(val, resolvedVal => {
                        if (prop.startsWith('--')) {
                            element.style.setProperty(prop, resolvedVal);
                        } else {
                            element.style[prop] = resolvedVal;
                        }
                    }, context, element);
                } else if (val?.then) {
                    // Async individual property
                    this.setValue(val, resolvedVal => {
                        if (prop.startsWith('--')) {
                            element.style.setProperty(prop, resolvedVal);
                        } else {
                            element.style[prop] = resolvedVal;
                        }
                    }, context, element);
                } else {
                    // Static individual property - apply immediately
                    if (prop.startsWith('--')) {
                        element.style.setProperty(prop, val);
                    } else {
                        element.style[prop] = val;
                    }
                }
            });
        }
    }

    // ===== VALUE SETTER WITH REACTIVE HANDLING =====
    setValue(value, setter, context, element = null, key = null) {
        if (typeof value === 'function') {
            this.makeReactive(value, setter, context, element);
        } else if (value?.then) {
            this.handleAsync(value, setter, element, key);
        } else {
            setter(value);
        }
    }

    // Reactive handler with recursion protection
    makeReactive(fn, setter, context, element = null) {        
        let isUpdating = false;        
        const update = () => {
            if (isUpdating) return;
            isUpdating = true;            
            try {
                const result = element ? fn(element) : fn();
                if (result?.then) {
                    this.handleAsync(result, setter, element);
                } else {
                    setter(result);
                }
            } catch (error) {
                console.error('Reactive function error:', error);
            } finally {
                isUpdating = false;
            }
        };        
        this.trackDependencies(update, context.subs);
    }

    // Async handling
    handleAsync(promise, setter, element = null, propertyType = 'generic') {
        let placeholderApplied = false;
        let originalState = null;
        
        // Apply placeholder styling if element is provided
        if (element) {
            this.#setPlaceholder(element, propertyType);
            placeholderApplied = true;
        }
        
        promisify(promise)
            .then(result => {
                // Clean up placeholder state
                if (placeholderApplied && element) {
                    this.#removePlaceholderState(element, originalState);
                }
                
                // Apply the actual result
                setter(result);
            })
            .catch(error => {
                // Clean up placeholder and apply error state
                if (placeholderApplied && element && originalState) {
                    this.#removePlaceholderState(element, originalState);
                    
                    // Apply error styling
                    element.classList.add('juris-async-error');
                    if (!element.textContent.trim()) {
                        element.textContent = `Error: ${error.message}`;
                    }
                }
                
                console.error('Async error:', error);
            });
    }
    #setPlaceholder(element, key) {
        const config = this._getPlaceholderConfig(element);
        const placeholders = {
            text: () => {
                element.textContent = config.text;
                element.className = config.className;
                if (config.style) element.style.cssText = config.style;
            },
            children: () => {
                if (config.children) {
                    const customPlaceholder = this.render(config.children);
                    if (customPlaceholder) {
                        element.appendChild(customPlaceholder);
                        return;
                    }
                }
                const placeholder = document.createElement('span');
                placeholder.textContent = config.text;
                placeholder.className = config.className;
                if (config.style) placeholder.style.cssText = config.style;
                element.appendChild(placeholder);
            },
            className: () => element.classList.add(config.className),
            style: () => {
                if (config.style) element.style.cssText = config.style;
                element.classList.add(config.className);
            }
        };
        (placeholders[key] || (() => {
            element.setAttribute(key, 'loading');
            element.classList.add(config.className);
        }))();
    }

    clearCSSCache() {
        if (this.styleSheet) {
            try {
                this.styleSheet.ownerNode.remove();
            } catch (e) { /* ignore */ }
            this.styleSheet = null;
        }
    }
    #removePlaceholderState(element, originalState) {
        const config = this._getPlaceholderConfig(element);
        
        // Remove placeholder class
        if (config.className) {
            element.classList.remove(config.className);
        }
        
        // Restore original styling (but be careful not to override new styles)
        if (config.style) {
            // Remove only the placeholder styles, keep any new ones
            const placeholderStyleProps = config.style.split(';')
                .map(s => s.split(':')[0].trim())
                .filter(prop => prop);
                
            placeholderStyleProps.forEach(prop => {
                element.style.removeProperty(prop);
            });
        }
        
        // Remove placeholder children if they exist
        if (config.children) {
            // Remove any placeholder children that were added
            const placeholderElements = element.querySelectorAll(`.${config.className}`);
            placeholderElements.forEach(el => {
                if (el.parentNode === element) {
                    element.removeChild(el);
                }
            });
        }
    }

    trackDependencies(updateFn, subs) {
        // Prevent duplicate tracking
        if (updateFn._jurisTracked) return;
        updateFn._jurisTracked = true;
        
        const deps = this.juris.stateManager.startTracking();
        const oldTracking = this.juris.stateManager.currentTracking;
        this.juris.stateManager.currentTracking = deps;
        
        try {
            updateFn();
        } finally {
            this.juris.stateManager.currentTracking = oldTracking;
        }
        
        // Check for existing subscriptions to prevent duplicates
        const existingPaths = new Set();
        subs.forEach(unsub => {
            if (unsub._jurisPath) existingPaths.add(unsub._jurisPath);
        });
        
        deps.forEach(path => {
            const unsubscribe = this.juris.stateManager.subscribeInternal(path, updateFn);
            unsubscribe._jurisPath = path; // Track path for deduplication
            subs.push(unsubscribe);
        });
    }

    // ===== ENHANCED EVENT HANDLING =====
    setEvent(element, eventName, handler, context) {
        const name = eventName.slice(2).toLowerCase();
        
        // Wrap handler for better error handling
        const wrappedHandler = (event) => {
            try {
                return handler.call(element, event);
            } catch (error) {
                console.error(`Error in ${name} handler:`, error);
            }
        };
        
        element.addEventListener(name, wrappedHandler);
        context.events.push({ name, handler: wrappedHandler });
    }

    // ===== SMART ATTRIBUTE SETTING =====
    setAttributeSmart(element, attr, value) {
        // Handle special cases
        if (this.XLINK_ATTRS.has(attr)) {
            element.setAttributeNS(this.XLINK_NS, attr, String(value));
            return;
        }
        
        if (this.BOOL_ATTRS.has(attr)) {
            const bool = Boolean(value && value !== 'false');
            element.toggleAttribute(attr, bool);
            if (['checked', 'disabled', 'selected'].includes(attr)) element[attr] = bool;
            return;
        }
        
        // Use cached property setter check
        const cacheKey = `${element.tagName}-${attr}`;
        let hasPropSetter = this.propSetterCache.get(cacheKey);
        
        if (hasPropSetter === undefined) {
            hasPropSetter = this.hasPropertySetter(element, attr);
            
            // Cache management
            if (this.propSetterCache.size >= this.maxCacheSize) {
                const firstKey = this.propSetterCache.keys().next().value;
                this.propSetterCache.delete(firstKey);
            }
            this.propSetterCache.set(cacheKey, hasPropSetter);
        }
        
        if (hasPropSetter) {
            element[attr] = value;
        } else {
            element.setAttribute(attr, String(value));
        }
    }

    hasPropertySetter(element, prop) {
        let proto = Object.getPrototypeOf(element);
        while (proto) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
            if (descriptor?.set) return true;
            proto = Object.getPrototypeOf(proto);
        }
        return false;
    }

    // ===== CHILDREN HANDLING =====
    setChildren(element, children, context) {
        // Only skip if it's the exact same non-function value
        if (typeof children !== 'function' && element._jurisLastChildren === children) return;
        element._jurisLastChildren = children;        
        this.setValue(children, resolvedChildren => {
            if (!resolvedChildren) {
                this.safeSetInnerHTML(element, '');
                return;
            }            
            const items = Array.isArray(resolvedChildren) ? resolvedChildren : [resolvedChildren];
            this.renderChildren(element, items, context);
        }, context, element, 'children');
    }

    // In DOMRenderer's renderChildren method, replace the existing children cleanup:

    renderChildren(element, items, parentContext) {
        // Store items hash to detect actual changes
        const itemsHash = JSON.stringify(items);
        if (element._jurisItemsHash === itemsHash) {
            return; // No change, skip render
        }
        element._jurisItemsHash = itemsHash;
        
        // Clean up existing children - handle DocumentFragment properly
        let existingChildren;
        if (element instanceof DocumentFragment) {
            existingChildren = Array.from(element.childNodes || []);
        } else {
            existingChildren = Array.from(element.childNodes || []);
        }
        
        existingChildren.forEach(child => {
            this.cleanup(child);
            if (child.parentNode === element) {
                element.removeChild(child);
            }
        });
        
        // Render new items
        items.forEach((item, index) => {
            if (typeof item === 'function') {
                this.createReactiveChild(element, item, parentContext);
            } else {
                const rendered = this.render(item);
                if (rendered) {
                    rendered._jurisIndex = index; // Track index for debugging
                    element.appendChild(rendered);
                }
            }
        });
    }

    createReactiveChild(element, fn, parentContext) {
    const placeholder = document.createTextNode('');
    placeholder._jurisActive = true;
    element.appendChild(placeholder);        
    let currentNode = placeholder;
    let lastResult = null;
    let isUpdating = false;
    let currentPromise = null;
    
    const update = () => {
        if (isUpdating) return;
        isUpdating = true;            
        try {
            const result = fn(element);
            
            if (result?.then) {
                // Cancel previous promise
                if (currentPromise) currentPromise._cancelled = true;
                
                currentPromise = result;
                promisify(result)
                    .then(resolved => {
                        if (currentPromise._cancelled) return;
                        const newNode = this.render(resolved) || document.createTextNode('');
                        if (currentNode && currentNode.parentNode) {
                            currentNode.parentNode.replaceChild(newNode, currentNode);
                            currentNode = newNode;
                        }
                    })
                    .catch(error => {
                        if (currentPromise._cancelled) return;
                        const errorNode = document.createTextNode(`Error: ${error.message}`);
                        if (currentNode && currentNode.parentNode) {
                            currentNode.parentNode.replaceChild(errorNode, currentNode);
                            currentNode = errorNode;
                        }
                    });
            } else {
                const resultStr = JSON.stringify(result);
                if (resultStr !== lastResult) {
                    lastResult = resultStr;
                    const newNode = this.render(result) || document.createTextNode('');
                    if (currentNode.parentNode) {
                        currentNode.parentNode.replaceChild(newNode, currentNode);
                        currentNode = newNode;
                    }
                }
            }
        } catch (error) {
            console.error('Reactive child error:', error);
        } finally {
            isUpdating = false;
        }
    };
    
    this.trackDependencies(update, parentContext.subs);
    return currentNode;
}
    cleanup(element) {
        if (!element) return;
        if (element._jurisActive !== undefined) {
            element._jurisActive = false;
        }
        if (element.nodeType === 1 && element.children) {
            Array.from(element.children).forEach(child => this.cleanup(child));
        }
        if (element.nodeType !== 1) return;
        this.juris.componentManager.cleanup(element);
        const data = this.subscriptions.get(element);
        if (data) {
            data.events?.forEach(({name, handler}) => {
                try {
                    element.removeEventListener(name, handler);
                } catch (error) {}
            });
            data.subs?.forEach(unsub => {
                try {
                    unsub();
                } catch (error) {}
            });
            
            this.subscriptions.delete(element);
        }
        delete element._jurisRenderer;
    }

    renderWithNamespace(thing, namespace) {
        if (typeof thing === 'object' && !Array.isArray(thing)) {
            const [tag, props = {}] = Object.entries(thing)[0] ? [Object.keys(thing)[0], Object.values(thing)[0]] : [null, {}];
            if (tag) {
                return this.createElement(tag, props, namespace);
            }
        }
        return this.render(thing);
    }

    renderSVG(thing) {
        return this.renderWithNamespace(thing, this.SVG_NS);
    }

    // ===== PUBLIC API =====
    setupIndicators(elementId, config) {
        this.placeholderConfigs.set(elementId, { ...this.defaultPlaceholder, ...config });
    }

    updateElementContent(element, content) { 
        const context = { subs: [], events: [] };
        this.renderChildren(element, [content], context);
        if (context.subs.length || context.events.length) {
            this.subscriptions.set(element, context);
        }
    }

    // Debug method to track rendering issues
    debugRender(element, label = 'render') {
        const childCount = element.childNodes.length;
        const subscriptions = this.subscriptions.get(element);
        const subCount = subscriptions ? subscriptions.subs.length : 0;
        
        console.log(`[${label}] Element: ${element.tagName || 'TEXT'}, Children: ${childCount}, Subscriptions: ${subCount}`);
        
        if (element._jurisItemsHash) {
            console.log(`[${label}] Items hash: ${element._jurisItemsHash.slice(0, 50)}...`);
        }
        
        return { childCount, subCount };
    }
    clearCaches() {
        this.propSetterCache.clear();
        if (this.customCSSExtractor && typeof this.customCSSExtractor.clear === 'function') {
            this.customCSSExtractor.clear();
        }
    }

    getMemoryStats() {
        const baseStats = {
            propSetterCacheSize: this.propSetterCache.size,
            maxCacheSize: this.maxCacheSize,
            activeSubscriptions: this.subscriptions ? 'WeakMap' : 0,
            componentStackDepth: this.componentStack.length
        };
        if (this.customCSSExtractor && typeof this.customCSSExtractor.getStats === 'function') {
            baseStats.cssExtractor = this.customCSSExtractor.getStats();
        }
        return baseStats;
    }

    getStats() {
        return {
            ...this.getMemoryStats(),
            approach: 'Enhanced cleanup with auto-innerHTML safety + optional CSS extraction'
        };
    }
    _hasAsyncProps(props) { return Object.values(props).some(v => v?.then); }
    _handleChildrenFineGrained(el, children, subs) { this.setChildren(el, children, {subs, events: []}); }
    _setStaticAttribute(el, attr, val) { this.setAttributeSmart(el, attr, val); }
    _handleText(el, text, subs) { this.setValue(text, v => el.textContent = v, {subs, events: []}, el, 'textContent'); }
    _handleStyle(el, style, subs) { this.setStyle(el, style, {subs, events: []}, el, 'style'); }
    _handleEvent(el, name, handler, events) { this.setEvent(el, name, handler, {events, subs: []}); }
    _createReactiveUpdate(el, fn, subs) { this.trackDependencies(fn, subs); }
    _getPlaceholderConfig(element) {
        if (element?.id && this.placeholderConfigs.has(element.id)) {
            return this.placeholderConfigs.get(element.id);
        }
        let current = element?.parentElement;
        while (current) {
            if (current.id && this.placeholderConfigs.has(current.id)) {
                return this.placeholderConfigs.get(current.id);
            }
            current = current.parentElement;
        }
        return this.defaultPlaceholder;
    }
}

class Juris {
    static #inGlobal = false;
    constructor(config = {}) {
        if (config.logLevel) {
            this.setupLogging(config.logLevel || 2);
        }
        
        log.ei && console.info(log.i('Juris framework initializing', { 
            hasServices: !!config.services, 
            hasLayout: !!config.layout, 
            hasStates: !!config.states, 
            hasComponents: !!config.components, 
            renderMode: config.renderMode || 'auto',
            features: config.features ? Object.keys(config.features) : 'default'
        }, 'framework'));

        this.services = config.services || {};
        this.layout = config.layout;        
        // Core features - always initialized (minimal)
        this.stateManager = new StateManager(config.states || {}, config.middleware || []);
        this.componentManager = new ComponentManager(this);
        this.domRenderer = new DOMRenderer(this);
        this.armedElements = new WeakMap();
        const features = config.features || {};
        if (features.headless) {
            this.headlessManager = new features.headless(this, log);
            this.headlessAPIs = {};
        }        
        if (features.enhance) {
            this.domEnhancer = new features.enhance(this);
        }        
        if (features.template) {
            this.templateCompiler = new features.template();
            if (config.autoCompileTemplates) {
                this.compileTemplates();
            }
        }
        if (features.webComponentFactory) {
            this.webComponentFactory = new features.webComponentFactory(this);
        }
        if (features.cssExtractor) {
            this.domRenderer.customCSSExtractor = new features.cssExtractor();
        }
        if (config.headlessComponents && this.headlessManager) {
            Object.entries(config.headlessComponents).forEach(([name, config]) => {
                if (typeof config === 'function') {
                    this.headlessManager.register(name, config);
                } else {
                    this.headlessManager.register(name, config.fn, config.options);
                }
            });
        }
        if (config.placeholders) {
            Object.entries(config.placeholders).forEach(([elementId, placeholderConfig]) => {
                this.domRenderer.setupIndicators(elementId, placeholderConfig);
            });
        }
        if (config.defaultPlaceholder) {
            this.domRenderer.defaultPlaceholder = { ...this.domRenderer.defaultPlaceholder, ...config.defaultPlaceholder };
        }
        if (this.headlessManager) {
            this.headlessManager.initializeQueued();
        }
        if (config.components) {
            Object.entries(config.components).forEach(([name, component]) => {
                this.componentManager.register(name, component);
            });
        }
        
        log.ei && console.info(log.i('Juris framework initialized', { 
            componentsCount: this.componentManager.components.size, 
            headlessCount: this.headlessManager?.components?.size || 0,
            enabledFeatures: Object.keys(features)
        }, 'framework'));
        if (typeof requestIdleCallback === 'undefined') { 
            window.requestIdleCallback = function (callback, options) { 
                const start = Date.now(); 
                return setTimeout(function () { 
                    callback({ 
                        didTimeout: false, 
                        timeRemaining: function () { 
                            return Math.max(0, 50 - (Date.now() - start)); 
                        } 
                    }); 
                }, 1); 
            };
            
        }
        this.#detectGlobalAndWarn();
    }

    #detectGlobalAndWarn() {
        if (!Juris._done) { (requestIdleCallback || setTimeout)(() => { if (Juris.#inGlobal) return; Juris.#inGlobal = true; for (let key in globalThis) { if (globalThis[key] instanceof Juris) { log.ew && console.warn(`âš ï¸ JURIS GLOBAL: '${key}'`); } } }); }
    }
    
    getComponentAPI(name) { return this.componentManager.getComponentAPI(name); }
    getComponentElement(name) {return this.componentManager.getComponentElement(name); }
    getNamedComponents() { return this.componentManager.getNamedComponents();}

    compileTemplates(templates = null) {
        if (!this.templateCompiler) {
            log.ew && console.warn(log.w('Template compilation requested but templateCompiler not available'), 'framework');
            return;
        }
        const templateElements = templates || document.querySelectorAll('template[data-component]');
        const components = this.templateCompiler.compileTemplates(templateElements);
        
        Object.entries(components).forEach(([name, component]) => {
            this.registerComponent(name, component);
        });
    }

    setupLogging(level) {
        log.ei=true;log.ed=true;log.el=true;log.ew=true;log.ee=true;
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[level] || 1;
        if (currentLevel > 0) {
            log.ed = false;
        }
        if (currentLevel > 1) {
            log.el && (console.log('Juris logging initialized at level:', level));
            log.el && (console.log('To change log level, use juris.setupLogging("newLevel") or set logLevel in config'));
            log.el = false;
            log.ei = false;
        }
    }

    setupIndicators(elementId, config) { this.domRenderer.setupIndicators(elementId, config); }

    createHeadlessContext(element = null) {
        const context = {
            getState: (path, defaultValue, track) => this.stateManager.getState(path, defaultValue, track),
            setState: (path, value, context) => this.stateManager.setState(path, value, context),
            executeBatch: (callback) => this.executeBatch(callback),
            subscribe: (path, callback) => this.stateManager.subscribe(path, callback),
            services: this.services,
            ...(this.services || {}),
            headless: this.headlessManager?.context,
            isSSR: typeof MutationObserver === 'undefined',
            ...(this.headlessAPIs || {}),
            components: {
                register: (name, component) => this.componentManager.register(name, component),
                registerHeadless: (name, component, options) => this.headlessManager?.register(name, component, options),
                get: name => this.componentManager.components.get(name),
                getHeadless: name => this.headlessManager?.getInstance(name),
                initHeadless: (name, props) => this.headlessManager?.initialize(name, props),
                reinitHeadless: (name, props) => this.headlessManager?.reinitialize(name, props),
                getComponentAPI: (name) => this.getComponentAPI(name),
                getComponentElement: (name) => this.getComponentElement(name),
                getNamedComponents: () => this.componentManager.getNamedComponents(),
            },
            utils: {
                render: container => this.render(container),
                cleanup: () => this.cleanup(),
                forceRender: () => this.render(),
                getHeadlessStatus: () => this.headlessManager?.getStatus(),
            },
            juris: this,
            logger: {
                log: log, lwarn: log.w, error: log.e, info: log.i, debug: log.d, subscribe: logSub, unsubscribe: logUnsub
            }
        };

        if (element) context.element = element;
        return context;
    }

    executeBatch(callback) {return this.stateManager.executeBatch(callback);}

    createWebComponent(name, componentDefinition, options = {}) {
        if (!this.webComponentFactory) {
            log.ee && console.error(log.e('WebComponent creation requested but webComponentFactory not available'), 'application');
            return null;
        }
        return this.webComponentFactory.create(name, componentDefinition, options);
    }

    createWebComponents(components, globalOptions = {}) {
        if (!this.webComponentFactory) {
            log.ee && console.error(log.e('WebComponents creation requested but webComponentFactory not available'), 'framework');
            return {};
        }
        return this.webComponentFactory.createMultiple(components, globalOptions);
    }

    createContext(element = null) {
        const context = {
            getState: (path, defaultValue, track) => this.stateManager.getState(path, defaultValue, track),
            setState: (path, value, context) => this.stateManager.setState(path, value, context),
            executeBatch: (callback) => this.executeBatch(callback),
            subscribe: (path, callback) => this.stateManager.subscribe(path, callback),
            services: this.services,
            ...(this.services || {}),
            ...(this.headlessAPIs || {}),
            headless: this.headlessManager?.context,
            isSSR: typeof window === 'undefined',
            components: {
                register: (name, component) => this.componentManager.register(name, component),
                registerHeadless: (name, component, options) => this.headlessManager?.register(name, component, options),
                get: name => this.componentManager.components.get(name),
                getHeadless: name => this.headlessManager.getInstance(name),
                initHeadless: (name, props) => this.headlessManager?.initialize(name, props),
                reinitHeadless: (name, props) => this.headlessManager?.reinitialize(name, props),
                getHeadlessAPI: name => this.headlessManager?.getAPI(name),
                getAllHeadlessAPIs: () => this.headlessManager?.getAllAPIs(),
                getComponentAPI: (name) => this.getComponentAPI(name),
                getComponentElement: (name) => this.getComponentElement(name),
                getNamedComponents: () => this.componentManager.getNamedComponents(),
            },
            utils: {
                render: container => this.render(container),
                cleanup: () => this.cleanup(),
                forceRender: () => this.render(),
                setRenderMode: mode => this.setRenderMode(mode),
                getRenderMode: () => this.getRenderMode(),
                isFineGrained: () => this.isFineGrained(),
                isBatchMode: () => this.isBatchMode(),
                getHeadlessStatus: () => this.headlessManager?.getStatus(),
                objectToHtml: (vnode) => this.objectToHtml(vnode)
            },
            objectToHtml: (vnode) => this.objectToHtml(vnode),
            setupIndicators: (elementId, config) => this.setupIndicators(elementId, config),
            juris: this,
            logger: {
                log: log, lwarn: log.w, error: log.e, info: log.i, debug: log.d, subscribe: logSub, unsubscribe: logUnsub
            }
        };
        if (element) context.element = element;
        return context;
    }

    getState(path, defaultValue, track) { return this.stateManager.getState(path, defaultValue, track); }
    setState(path, value, context) {
        log.ed && console.debug(log.d('Public setState called', { path }, 'application'));
        return this.stateManager.setState(path, value, context);
    }
    subscribe(path, callback, hierarchical = true) { return this.stateManager.subscribe(path, callback, hierarchical); }
    subscribeExact(path, callback) { return this.stateManager.subscribeExact(path, callback); }
    registerComponent(name, component) {
        log.ei && console.info(log.i('Public component registration', { name }, 'application'));
        return this.componentManager.register(name, component);
    }
    registerHeadlessComponent(name, component, options) { return this.headlessManager.register(name, component, options); }
    getComponent(name) { return this.componentManager.components.get(name); }
    getHeadlessComponent(name) { return this.headlessManager.getInstance(name); }
    initializeHeadlessComponent(name, props) { return this.headlessManager.initialize(name, props); }
    setRenderMode(mode) { this.domRenderer.setRenderMode(mode); }
    getRenderMode() { return this.domRenderer.getRenderMode(); }
    isFineGrained() { return this.domRenderer.isFineGrained(); }
    isBatchMode() { return this.domRenderer.isBatchMode(); }
    getHeadlessAPI(name) { return this.headlessManager?.getAPI(name); }
    registerAndInitHeadless(name, componentFn, options = {}) {
        this.headlessManager.register(name, componentFn, options);
        return this.headlessManager.initialize(name, options);
    }

    getHeadlessStatus() { return this.headlessManager.getStatus(); }
    objectToHtml(vnode) { return this.domRenderer.render(vnode); }

    render(container = '#app') {
        const startTime = performance.now();
        log.ei && console.info(log.i('Render started', { container }, 'application'));        
        const containerEl = typeof container === 'string' ?
            document.querySelector(container) : container;            
        if (!containerEl) {
            log.ee && console.error(log.e('Render container not found', { container }, 'application'));
            return;
        }        
        const isHydration = this.getState('isHydration', false);        
        try {
            if (Array.isArray(this.layout)) {
                const hasReactiveFunctions = this.layout.some(item => typeof item === 'function');
                
                if (hasReactiveFunctions) {
                    containerEl.innerHTML = '';
                    const subscriptions = [];
                    this.domRenderer._handleChildrenFineGrained(containerEl, this.layout, subscriptions);
                    if (subscriptions.length > 0) {
                        this.domRenderer.subscriptions.set(containerEl, {
                            subscriptions,
                            eventListeners: []
                        });
                    }                    
                    const duration = performance.now() - startTime;
                    log.ei && console.info(log.i('Render completed (reactive array)', { 
                        duration: `${duration.toFixed(2)}ms` 
                    }, 'application'));
                    return;
                }
            }
            if (isHydration) {
                this.#renderWithHydration(containerEl);
            } else {
                this.#renderImmediate(containerEl);
            }
            const duration = performance.now() - startTime;
            log.ei && console.info(log.i('Render completed', { 
                duration: `${duration.toFixed(2)}ms`, 
                isHydration 
            }, 'application'));
        } catch (error) {
            log.ee && console.error(log.e('Render failed', { error: error.message, container }, 'application'));
            this.#renderError(containerEl, error);
        }
    }
    #renderImmediate (containerEl) {
        containerEl.innerHTML = '';
        const element = this.domRenderer.render(this.layout);
        if (element) containerEl.appendChild(element);
    }
    
    async #renderWithHydration (containerEl) {
        const stagingEl = document.createElement('div');
        stagingEl.style.cssText = 'position: absolute; left: -9999px; visibility: hidden;';
        document.body.appendChild(stagingEl);
        try {
            startTracking();
            const element = this.domRenderer.render(this.layout);
            if (element) stagingEl.appendChild(element);
            await onAllComplete();
            containerEl.innerHTML = '';
            while (stagingEl.firstChild) {
                containerEl.appendChild(stagingEl.firstChild);
            }
            this.headlessManager.initializeQueued();
        } finally {
            stopTracking();
            document.body.removeChild(stagingEl);
        }
    };

    #renderError(container, error) {
        const errorEl = document.createElement('div');
        errorEl.style.cssText = 'color: red; border: 2px solid red; padding: 16px; margin: 8px; background: #ffe6e6;';
        errorEl.innerHTML = `
            <h3>Render Error</h3>
            <p><strong>Message:</strong> ${error.message}</p>
            <pre style="background: #f5f5f5; padding: 8px; overflow: auto;">${error.stack || ''}</pre>
        `;
        container.appendChild(errorEl);
    }

    enhance(selector, definition, options) { return this.domEnhancer.enhance(selector, definition, options); }
    configureEnhancement(options) { 
        if (!this.domEnhancer) {
            log.ew && console.warn(log.w('Enhancement configuration requested but domEnhancer not available'), 'framework');
            return;
        }
        return this.domEnhancer.configure(options); 
    }
    getEnhancementStats() { 
        if (!this.domEnhancer) {
            return { error: 'domEnhancer not available' };
        }
        return this.domEnhancer.getStats(); 
    }

    arm(target, handlerFn) {
        log.ei && console.info(log.i('ARM: Arming element', { target: target.tagName || target.constructor.name }, 'framework'));
        
        const context = this.createContext(target);
        const handlers = handlerFn(context);
        const eventListeners = [];
        const jurisInstance = this;
        for (const eventName in handlers) {
            if (handlers.hasOwnProperty(eventName) && eventName.startsWith('on')) {
                let actualEventName;
                
                if (eventName.startsWith('on-')) {
                    actualEventName = eventName.slice(3);
                } else if (eventName.startsWith('on:')) {
                    actualEventName = eventName.slice(3);
                } else {
                    actualEventName = eventName.slice(2).toLowerCase();
                }
                
                const handler = handlers[eventName];
                
                if (typeof handler === 'function') {
                    target.addEventListener(actualEventName, handler);
                    eventListeners.push({ 
                        original: eventName,
                        actual: actualEventName, 
                        handler 
                    });
                    
                    log.ed && console.debug(log.d('ARM: Event listener attached', { 
                        target: target.tagName || target.constructor.name, 
                        originalEvent: eventName,
                        actualEvent: actualEventName 
                    }, 'framework'));
                }
            }
        }
        
        const armedInstance = {
            events: eventListeners.map(e => ({
                name: e.original,
                actualEvent: e.actual,
                handler: e.handler
            })),
            trigger(eventName, eventData = {}) {
                const listener = eventListeners.find(e => 
                    e.original === eventName || e.actual === eventName
                );
                
                if (listener) {
                    const mockEvent = {
                        type: listener.actual,
                        target: target,
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        ...eventData
                    };
                    
                    listener.handler.call(target, mockEvent);
                    return true;
                }
                return false;
            },
            cleanup() {
                log.ed && console.debug(log.d('ARM: Disarming element', { 
                    target: target.tagName || target.constructor.name,
                    removedListeners: eventListeners.length
                }, 'framework'));
                
                eventListeners.forEach(({ actual, handler }) => {
                    target.removeEventListener(actual, handler);
                });
                jurisInstance.armedElements.delete(target);
                return true;
            }
        };
        jurisInstance.armedElements.set(target, { eventListeners, context, instance: armedInstance });
        
        return armedInstance;
    }

    cleanup() {
        log.ei && console.info(log.i('Framework cleanup initiated', {}, 'faramework'));
        this.armedElements = new WeakMap();
        this.headlessManager?.cleanup();
    }

    destroy() {
        log.ei && console.info(log.i('Framework destruction initiated', {}, 'faramework'));
        this.cleanup();
        if (this.domEnhancer) {
            this.domEnhancer.destroy();
        }
        this.stateManager.subscribers.clear();
        this.stateManager.externalSubscribers.clear();
        this.componentManager.components.clear();
        if (this.headlessManager) {
            this.headlessManager.components.clear();
        }
        this.armedElements = new WeakMap();
        log.ei && console.info(log.i('Framework destroyed', {}, 'faramework'));
    }    
}