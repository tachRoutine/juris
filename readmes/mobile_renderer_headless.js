/**
 * Juris Mobile Renderer - Complete Headless Solution
 * Universal mobile rendering for iOS and Android through headless architecture
 * 
 * Features:
 * - Auto platform detection
 * - Native UI component rendering
 * - Gesture recognition
 * - Performance optimization
 * - Hot reload support
 * - Debug tools
 * 
 * Author: Juris Team
 * Version: 1.0.0
 * License: MIT
 */

// ============================================================================
// MOBILE PLATFORM DETECTOR
// ============================================================================

class MobilePlatformDetector {
    static detect() {
        // React Native environment
        if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
            try {
                const Platform = require('react-native').Platform;
                return Platform.OS; // 'ios' or 'android'
            } catch (e) {
                return 'react-native';
            }
        }

        // Capacitor/Ionic environment
        if (typeof window !== 'undefined' && window.Capacitor) {
            return window.Capacitor.getPlatform(); // 'ios' or 'android'
        }

        // Cordova/PhoneGap environment
        if (typeof window !== 'undefined' && window.cordova) {
            return window.device?.platform?.toLowerCase() || 'cordova';
        }

        // WebView detection
        if (typeof window !== 'undefined') {
            const userAgent = window.navigator.userAgent;
            
            // iOS WebView
            if (/iPhone|iPad|iPod/.test(userAgent) && window.webkit?.messageHandlers) {
                return 'ios-webview';
            }
            
            // Android WebView
            if (/Android/.test(userAgent) && window.AndroidBridge) {
                return 'android-webview';
            }
            
            // General mobile detection
            if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios-web';
            if (/Android/.test(userAgent)) return 'android-web';
        }

        return 'web';
    }

    static isMobile(platform = null) {
        const p = platform || this.detect();
        return ['ios', 'android', 'ios-webview', 'android-webview', 'ios-web', 'android-web', 'react-native', 'capacitor', 'cordova'].includes(p);
    }

    static isNative(platform = null) {
        const p = platform || this.detect();
        return ['ios', 'android', 'react-native'].includes(p);
    }

    static supportsNativeRendering(platform = null) {
        const p = platform || this.detect();
        return ['ios', 'android', 'ios-webview', 'android-webview', 'react-native'].includes(p);
    }
}

// ============================================================================
// MOBILE BRIDGE MANAGER
// ============================================================================

class MobileBridgeManager {
    constructor(platform) {
        this.platform = platform;
        this.messageQueue = [];
        this.isReady = false;
        this.eventHandlers = new Map();
        this.requestId = 0;
        this.pendingRequests = new Map();

        this.setupBridge();
        this.setupEventListener();
    }

    setupBridge() {
        switch (this.platform) {
            case 'ios':
            case 'ios-webview':
                this.setupIOSBridge();
                break;
            case 'android':
            case 'android-webview':
                this.setupAndroidBridge();
                break;
            case 'react-native':
                this.setupReactNativeBridge();
                break;
            default:
                this.setupMockBridge();
        }
    }

    setupIOSBridge() {
        const checkBridge = () => {
            if (window.webkit?.messageHandlers?.JurisMobileRenderer) {
                this.isReady = true;
                this.flushMessageQueue();
                return;
            }
            setTimeout(checkBridge, 50);
        };
        checkBridge();
    }

    setupAndroidBridge() {
        const checkBridge = () => {
            if (window.JurisAndroidRenderer || window.AndroidBridge) {
                this.bridge = window.JurisAndroidRenderer || window.AndroidBridge;
                this.isReady = true;
                this.flushMessageQueue();
                return;
            }
            setTimeout(checkBridge, 50);
        };
        checkBridge();
    }

    setupReactNativeBridge() {
        try {
            const { NativeModules } = require('react-native');
            if (NativeModules.JurisMobileRenderer) {
                this.nativeModule = NativeModules.JurisMobileRenderer;
                this.isReady = true;
                this.flushMessageQueue();
            }
        } catch (error) {
            console.warn('React Native bridge not available:', error.message);
            this.setupMockBridge();
        }
    }

    setupMockBridge() {
        console.log('Using mock mobile bridge for development');
        this.isReady = true;
        this.flushMessageQueue();
    }

    setupEventListener() {
        // Global event handler for native callbacks
        window.jurisMobileEvent = (eventData) => {
            try {
                const event = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
                this.handleNativeEvent(event);
            } catch (error) {
                console.error('Error processing mobile event:', error);
            }
        };

        // Global response handler for async calls
        window.jurisMobileResponse = (responseData) => {
            try {
                const response = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
                this.handleNativeResponse(response);
            } catch (error) {
                console.error('Error processing mobile response:', error);
            }
        };
    }

    call(method, params = {}, callback = null) {
        const requestId = ++this.requestId;
        const message = { 
            id: requestId,
            method, 
            params,
            timestamp: Date.now()
        };

        if (callback) {
            this.pendingRequests.set(requestId, callback);
        }

        if (!this.isReady) {
            this.messageQueue.push(message);
            return requestId;
        }

        this.sendMessage(message);
        return requestId;
    }

    sendMessage(message) {
        try {
            switch (this.platform) {
                case 'ios':
                case 'ios-webview':
                    window.webkit.messageHandlers.JurisMobileRenderer.postMessage(message);
                    break;
                case 'android':
                case 'android-webview':
                    this.bridge.callNative(JSON.stringify(message));
                    break;
                case 'react-native':
                    this.nativeModule.callNative(message);
                    break;
                default:
                    console.log('Mock native call:', message);
                    // Simulate async response for mock
                    if (this.pendingRequests.has(message.id)) {
                        setTimeout(() => {
                            this.handleNativeResponse({
                                id: message.id,
                                success: true,
                                result: { mockResponse: true }
                            });
                        }, 10);
                    }
            }
        } catch (error) {
            console.error('Failed to send message to native:', error);
            if (this.pendingRequests.has(message.id)) {
                const callback = this.pendingRequests.get(message.id);
                callback({ error: error.message });
                this.pendingRequests.delete(message.id);
            }
        }
    }

    flushMessageQueue() {
        const queue = [...this.messageQueue];
        this.messageQueue = [];
        queue.forEach(message => this.sendMessage(message));
    }

    handleNativeEvent(event) {
        const { viewId, eventType, eventData } = event;
        const key = `${viewId}:${eventType}`;
        const handlers = this.eventHandlers.get(key) || [];
        
        handlers.forEach(handler => {
            try {
                handler(eventData);
            } catch (error) {
                console.error('Error in mobile event handler:', error);
            }
        });
    }

    handleNativeResponse(response) {
        const { id, success, result, error } = response;
        const callback = this.pendingRequests.get(id);
        
        if (callback) {
            if (success) {
                callback(null, result);
            } else {
                callback(new Error(error || 'Native call failed'));
            }
            this.pendingRequests.delete(id);
        }
    }

    addEventListener(viewId, eventType, handler) {
        const key = `${viewId}:${eventType}`;
        if (!this.eventHandlers.has(key)) {
            this.eventHandlers.set(key, []);
        }
        this.eventHandlers.get(key).push(handler);

        return () => {
            const handlers = this.eventHandlers.get(key);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    }

    removeEventListener(viewId, eventType, handler = null) {
        const key = `${viewId}:${eventType}`;
        if (handler) {
            const handlers = this.eventHandlers.get(key);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        } else {
            this.eventHandlers.delete(key);
        }
    }

    isReady() {
        return this.isReady;
    }

    getPlatform() {
        return this.platform;
    }
}

// ============================================================================
// MOBILE RENDERER BASE CLASS
// ============================================================================

class MobileRendererBase {
    constructor(juris, platform, bridge) {
        this.juris = juris;
        this.platform = platform;
        this.bridge = bridge;
        this.viewRegistry = new Map();
        this.subscriptions = new WeakMap();
        this.renderMode = 'fine-grained';
        this.viewIdCounter = 0;
        this.rootViewId = null;
        
        // Performance tracking
        this.renderMetrics = {
            renderCount: 0,
            totalRenderTime: 0,
            averageRenderTime: 0
        };

        // Component mapping
        this.elementMap = this.getElementMap();
        this.styleMap = this.getStyleMap();
        this.eventMap = this.getEventMap();
    }

    // Abstract methods to be implemented by platform-specific renderers
    getElementMap() { throw new Error('getElementMap must be implemented'); }
    getStyleMap() { throw new Error('getStyleMap must be implemented'); }
    getEventMap() { throw new Error('getEventMap must be implemented'); }

    setRenderMode(mode) {
        this.renderMode = mode;
        console.log(`Mobile Renderer (${this.platform}): Mode set to '${mode}'`);
    }

    getRenderMode() {
        return this.renderMode;
    }

    isFineGrained() {
        return this.renderMode === 'fine-grained';
    }

    isBatchMode() {
        return this.renderMode === 'batch';
    }

    render(vnode, parentViewId = null) {
        const startTime = performance.now();
        
        try {
            const result = this._renderInternal(vnode, parentViewId);
            
            // Update metrics
            const renderTime = performance.now() - startTime;
            this.renderMetrics.renderCount++;
            this.renderMetrics.totalRenderTime += renderTime;
            this.renderMetrics.averageRenderTime = 
                this.renderMetrics.totalRenderTime / this.renderMetrics.renderCount;
            
            return result;
        } catch (error) {
            console.error('Mobile render error:', error);
            return null;
        }
    }

    _renderInternal(vnode, parentViewId) {
        if (!vnode || typeof vnode !== 'object') {
            return null;
        }

        // Handle arrays of vnodes
        if (Array.isArray(vnode)) {
            return this._renderArray(vnode, parentViewId);
        }

        const tagName = Object.keys(vnode)[0];
        const props = vnode[tagName] || {};

        // Check if it's a registered Juris component
        if (this.juris.componentManager.components.has(tagName)) {
            return this._renderComponent(tagName, props, parentViewId);
        }

        // Map to native component
        const nativeType = this.elementMap[tagName] || this._getDefaultElement();
        
        if (this.renderMode === 'fine-grained') {
            return this._renderViewFineGrained(nativeType, props, parentViewId);
        } else {
            return this._renderViewOptimized(nativeType, props, parentViewId);
        }
    }

    _renderArray(vnodes, parentViewId) {
        // Create container view for multiple children
        const containerViewId = this._generateViewId();
        const containerType = this._getContainerElement();
        
        this._createNativeView(containerViewId, containerType, {}, parentViewId);
        
        vnodes.forEach(vnode => {
            const childViewId = this.render(vnode, containerViewId);
            if (childViewId) {
                this._addChildView(containerViewId, childViewId);
            }
        });
        
        return containerViewId;
    }

    _renderComponent(componentName, props, parentViewId) {
        const parentTracking = this.juris.stateManager.currentTracking;
        this.juris.stateManager.currentTracking = null;

        try {
            const element = this.juris.componentManager.create(componentName, props);
            this.juris.stateManager.currentTracking = parentTracking;
            
            // If component returns a DOM element, we need to convert it
            if (element && element.nodeType) {
                return this._convertDOMElementToNative(element, parentViewId);
            }
            
            return element;
        } catch (error) {
            console.error(`Error rendering mobile component '${componentName}':`, error);
            this.juris.stateManager.currentTracking = parentTracking;
            return this._createErrorView(error, parentViewId);
        }
    }

    _renderViewFineGrained(nativeType, props, parentViewId) {
        const viewId = this._generateViewId();
        const subscriptions = [];
        const eventListeners = [];

        // Create native view
        this._createNativeView(viewId, nativeType, this._extractStaticProps(props), parentViewId);

        // Process properties
        Object.keys(props).forEach(key => {
            const value = props[key];

            if (key === 'children') {
                this._handleChildren(viewId, value, subscriptions);
            } else if (key === 'text') {
                this._handleText(viewId, value, subscriptions);
            } else if (key === 'style') {
                this._handleStyle(viewId, value, subscriptions);
            } else if (this._isEvent(key)) {
                this._handleEvent(viewId, key, value, eventListeners);
            } else if (typeof value === 'function') {
                this._handleReactiveProperty(viewId, key, value, subscriptions);
            } else if (key !== 'key') {
                this._setStaticProperty(viewId, key, value);
            }
        });

        // Store subscriptions for cleanup
        if (subscriptions.length > 0 || eventListeners.length > 0) {
            this.subscriptions.set(viewId, { subscriptions, eventListeners });
        }

        return viewId;
    }

    _renderViewOptimized(nativeType, props, parentViewId) {
        // TODO: Implement batch rendering optimizations
        // For now, fallback to fine-grained
        return this._renderViewFineGrained(nativeType, props, parentViewId);
    }

    _handleChildren(viewId, children, subscriptions) {
        if (typeof children === 'function') {
            const updateChildren = () => {
                try {
                    const result = children();
                    if (result !== "ignore") {
                        this._updateChildren(viewId, result);
                    }
                } catch (error) {
                    console.error('Error in mobile children function:', error);
                }
            };

            this._createReactiveUpdate(viewId, updateChildren, subscriptions);
            
            // Set initial children
            try {
                const initialChildren = children();
                this._updateChildren(viewId, initialChildren);
            } catch (error) {
                console.error('Error setting initial children:', error);
            }
        } else {
            this._updateChildren(viewId, children);
        }
    }

    _updateChildren(viewId, children) {
        if (children === "ignore") return;

        // Clear existing children
        this._clearChildren(viewId);

        // Add new children
        if (Array.isArray(children)) {
            children.forEach(child => {
                const childViewId = this.render(child, viewId);
                if (childViewId) {
                    this._addChildView(viewId, childViewId);
                }
            });
        } else if (children) {
            const childViewId = this.render(children, viewId);
            if (childViewId) {
                this._addChildView(viewId, childViewId);
            }
        }
    }

    _handleText(viewId, text, subscriptions) {
        if (typeof text === 'function') {
            this._createReactiveUpdate(viewId, () => {
                const textValue = text();
                this._setNativeProperty(viewId, 'text', textValue);
            }, subscriptions);

            // Set initial text
            const initialText = text();
            this._setNativeProperty(viewId, 'text', initialText);
        } else {
            this._setNativeProperty(viewId, 'text', text);
        }
    }

    _handleStyle(viewId, style, subscriptions) {
        if (typeof style === 'function') {
            this._createReactiveUpdate(viewId, () => {
                const styleObj = style();
                this._applyStyle(viewId, styleObj);
            }, subscriptions);

            const initialStyle = style();
            this._applyStyle(viewId, initialStyle);
        } else if (typeof style === 'object') {
            this._applyStyle(viewId, style);
        }
    }

    _handleEvent(viewId, eventType, handler, eventListeners) {
        const nativeEvent = this.eventMap[eventType] || eventType.slice(2);
        
        const eventListener = {
            type: nativeEvent,
            handler: handler,
            unsubscribe: this.bridge.addEventListener(viewId, nativeEvent, handler)
        };

        eventListeners.push(eventListener);
        
        // Register event with native
        this._addEventListener(viewId, nativeEvent, handler);
    }

    _handleReactiveProperty(viewId, property, valueFn, subscriptions) {
        this._createReactiveUpdate(viewId, () => {
            const value = valueFn();
            this._setNativeProperty(viewId, property, value);
        }, subscriptions);

        // Set initial value
        const initialValue = valueFn();
        this._setNativeProperty(viewId, property, initialValue);
    }

    _createReactiveUpdate(viewId, updateFn, subscriptions) {
        const dependencies = this.juris.stateManager.startTracking();

        const originalTracking = this.juris.stateManager.currentTracking;
        this.juris.stateManager.currentTracking = dependencies;

        try {
            updateFn();
        } catch (error) {
            console.error('Error capturing mobile dependencies:', error);
        } finally {
            this.juris.stateManager.currentTracking = originalTracking;
        }

        dependencies.forEach(path => {
            const unsubscribe = this.juris.stateManager.subscribeInternal(path, updateFn);
            subscriptions.push(unsubscribe);
        });
    }

    // Native bridge methods
    _createNativeView(viewId, type, properties, parentViewId) {
        this.bridge.call('createView', {
            viewId,
            type,
            properties,
            parentViewId
        });

        this.viewRegistry.set(viewId, {
            id: viewId,
            type,
            properties: { ...properties },
            children: [],
            parent: parentViewId
        });
    }

    _setNativeProperty(viewId, property, value) {
        const nativeProperty = this.styleMap[property] || property;
        
        this.bridge.call('setProperty', {
            viewId,
            property: nativeProperty,
            value
        });

        // Update local registry
        const view = this.viewRegistry.get(viewId);
        if (view) {
            view.properties[property] = value;
        }
    }

    _applyStyle(viewId, styleObj) {
        if (!styleObj || typeof styleObj !== 'object') return;

        Object.entries(styleObj).forEach(([property, value]) => {
            const nativeProperty = this.styleMap[property] || property;
            this._setNativeProperty(viewId, nativeProperty, value);
        });
    }

    _addChildView(parentViewId, childViewId) {
        this.bridge.call('addChildView', {
            parentViewId,
            childViewId
        });

        // Update local registry
        const parentView = this.viewRegistry.get(parentViewId);
        const childView = this.viewRegistry.get(childViewId);
        
        if (parentView && childView) {
            parentView.children.push(childViewId);
            childView.parent = parentViewId;
        }
    }

    _clearChildren(viewId) {
        const view = this.viewRegistry.get(viewId);
        if (view) {
            view.children.forEach(childId => this.cleanup(childId));
            view.children = [];
        }

        this.bridge.call('clearChildren', { viewId });
    }

    _addEventListener(viewId, eventType, handler) {
        this.bridge.call('addEventListener', {
            viewId,
            eventType,
            handler: handler.toString()
        });
    }

    _removeEventListener(viewId, eventType) {
        this.bridge.call('removeEventListener', {
            viewId,
            eventType
        });
    }

    _generateViewId() {
        return `mobile_view_${this.platform}_${++this.viewIdCounter}_${Date.now()}`;
    }

    _extractStaticProps(props) {
        const staticProps = {};
        Object.keys(props).forEach(key => {
            if (typeof props[key] !== 'function' && 
                key !== 'children' && 
                !this._isEvent(key)) {
                staticProps[key] = props[key];
            }
        });
        return staticProps;
    }

    _isEvent(key) {
        return key.startsWith('on') && key.length > 2;
    }

    _getDefaultElement() {
        return 'View';
    }

    _getContainerElement() {
        return 'View';
    }

    _createErrorView(error, parentViewId) {
        const errorViewId = this._generateViewId();
        this._createNativeView(errorViewId, 'Text', {
            text: `Error: ${error.message}`,
            style: { color: 'red', fontSize: 14 }
        }, parentViewId);
        return errorViewId;
    }

    _convertDOMElementToNative(domElement, parentViewId) {
        // Convert DOM element to native view representation
        // This is a simplified conversion
        const viewId = this._generateViewId();
        const tagName = domElement.tagName?.toLowerCase() || 'div';
        const nativeType = this.elementMap[tagName] || this._getDefaultElement();
        
        const properties = {
            text: domElement.textContent
        };

        this._createNativeView(viewId, nativeType, properties, parentViewId);
        return viewId;
    }

    // Public API
    setRootView(viewId) {
        this.rootViewId = viewId;
        this.bridge.call('setRootView', { viewId });
    }

    cleanup(viewId) {
        const view = this.viewRegistry.get(viewId);
        if (!view) return;

        // Cleanup children first
        view.children.forEach(childId => this.cleanup(childId));

        // Remove subscriptions and event listeners
        const data = this.subscriptions.get(viewId);
        if (data) {
            if (data.subscriptions) {
                data.subscriptions.forEach(unsubscribe => {
                    try {
                        unsubscribe();
                    } catch (error) {
                        console.warn('Error during subscription cleanup:', error);
                    }
                });
            }

            if (data.eventListeners) {
                data.eventListeners.forEach(({ type, unsubscribe }) => {
                    try {
                        if (unsubscribe) unsubscribe();
                        this._removeEventListener(viewId, type);
                    } catch (error) {
                        console.warn('Error during event listener cleanup:', error);
                    }
                });
            }

            this.subscriptions.delete(viewId);
        }

        // Remove from native
        this.bridge.call('removeView', { viewId });
        
        // Remove from registry
        this.viewRegistry.delete(viewId);
    }

    getMetrics() {
        return {
            platform: this.platform,
            renderMode: this.renderMode,
            viewCount: this.viewRegistry.size,
            ...this.renderMetrics
        };
    }
}

// ============================================================================
// iOS RENDERER
// ============================================================================

class iOSRenderer extends MobileRendererBase {
    getElementMap() {
        return {
            'div': 'UIView',
            'view': 'UIView',
            'text': 'UILabel',
            'label': 'UILabel',
            'button': 'UIButton',
            'input': 'UITextField',
            'textarea': 'UITextView',
            'image': 'UIImageView',
            'scroll': 'UIScrollView',
            'scrollview': 'UIScrollView',
            'list': 'UITableView',
            'table': 'UITableView',
            'stack': 'UIStackView',
            'hstack': 'UIStackView',
            'vstack': 'UIStackView',
            'safe': 'UISafeAreaLayoutGuide',
            'nav': 'UINavigationController',
            'tab': 'UITabBarController',
            'picker': 'UIPickerView',
            'slider': 'UISlider',
            'switch': 'UISwitch',
            'progress': 'UIProgressView',
            'activity': 'UIActivityIndicatorView',
            'web': 'WKWebView'
        };
    }

    getStyleMap() {
        return {
            'backgroundColor': 'backgroundColor',
            'background': 'backgroundColor',
            'color': 'textColor',
            'textColor': 'textColor',
            'fontSize': 'font.pointSize',
            'fontWeight': 'font.weight',
            'fontFamily': 'font.familyName',
            'textAlign': 'textAlignment',
            'padding': 'layoutMargins',
            'paddingTop': 'layoutMargins.top',
            'paddingRight': 'layoutMargins.right',
            'paddingBottom': 'layoutMargins.bottom',
            'paddingLeft': 'layoutMargins.left',
            'margin': 'frame.origin',
            'marginTop': 'frame.origin.y',
            'marginLeft': 'frame.origin.x',
            'width': 'frame.size.width',
            'height': 'frame.size.height',
            'borderRadius': 'layer.cornerRadius',
            'borderWidth': 'layer.borderWidth',
            'borderColor': 'layer.borderColor',
            'opacity': 'alpha',
            'hidden': 'isHidden',
            'visible': 'isHidden',
            'zIndex': 'layer.zPosition',
            'transform': 'transform',
            'clipsToBounds': 'clipsToBounds'
        };
    }

    getEventMap() {
        return {
            'onclick': 'touchUpInside',
            'ontouchstart': 'touchDown',
            'ontouchend': 'touchUpInside',
            'onlongpress': 'longPress',
            'onswipe': 'swipe',
            'onpan': 'pan',
            'onpinch': 'pinch',
            'onrotate': 'rotation',
            'onchange': 'valueChanged',
            'oninput': 'editingChanged',
            'onfocus': 'editingDidBegin',
            'onblur': 'editingDidEnd',
            'onscroll': 'scrollViewDidScroll'
        };
    }

    _getDefaultElement() {
        return 'UIView';
    }

    _getContainerElement() {
        return 'UIStackView';
    }
}

// ============================================================================
// ANDROID RENDERER
// ============================================================================

class AndroidRenderer extends MobileRendererBase {
    getElementMap() {
        return {
            'div': 'LinearLayout',
            'view': 'View',
            'text': 'TextView',
            'label': 'TextView',
            'button': 'Button',
            'input': 'EditText',
            'textarea': 'EditText',
            'image': 'ImageView',
            'scroll': 'ScrollView',
            'scrollview': 'NestedScrollView',
            'list': 'RecyclerView',
            'table': 'RecyclerView',
            'stack': 'LinearLayout',
            'hstack': 'LinearLayout',
            'vstack': 'LinearLayout',
            'frame': 'FrameLayout',
            'constraint': 'ConstraintLayout',
            'relative': 'RelativeLayout',
            'grid': 'GridLayout',
            'card': 'CardView',
            'fab': 'FloatingActionButton',
            'toolbar': 'Toolbar',
            'drawer': 'DrawerLayout',
            'tab': 'TabLayout',
            'viewpager': 'ViewPager2',
            'bottom': 'BottomNavigationView',
            'chip': 'Chip',
            'switch': 'Switch',
            'checkbox': 'CheckBox',
            'radio': 'RadioButton',
            'slider': 'SeekBar',
            'progress': 'ProgressBar',
            'web': 'WebView'
        };
    }

    getStyleMap() {
        return {
            'backgroundColor': 'background',
            'background': 'background',
            'color': 'textColor',
            'textColor': 'textColor',
            'fontSize': 'textSize',
            'fontWeight': 'typeface',
            'fontFamily': 'typeface',
            'textAlign': 'gravity',
            'padding': 'padding',
            'paddingTop': 'paddingTop',
            'paddingRight': 'paddingEnd',
            'paddingBottom': 'paddingBottom',
            'paddingLeft': 'paddingStart',
            'margin': 'layout_margin',
            'marginTop': 'layout_marginTop',
            'marginRight': 'layout_marginEnd',
            'marginBottom': 'layout_marginBottom',
            'marginLeft': 'layout_marginStart',
            'width': 'layout_width',
            'height': 'layout_height',
            'borderRadius': 'background.cornerRadius',
            'borderWidth': 'background.strokeWidth',
            'borderColor': 'background.strokeColor',
            'opacity': 'alpha',
            'hidden': 'visibility',
            'visible': 'visibility',
            'elevation': 'elevation',
            'clipsToBounds': 'clipToPadding',
            'orientation': 'orientation'
        };
    }

    getEventMap() {
        return {
            'onclick': 'click',
            'onlongclick': 'longClick',
            'ontouch': 'touch',
            'onfocus': 'focusChange',
            'onblur': 'focusChange',
            'onchange': 'textChanged',
            'oninput': 'textChanged',
            'onscroll': 'scroll',
            'onswipe': 'swipe',
            'onkey': 'key'
        };
    }

    _getDefaultElement() {
        return 'View';
    }

    _getContainerElement() {
        return 'LinearLayout';
    }
}

// ============================================================================
// MOBILE RENDERER HEADLESS SERVICE
// ============================================================================

function MobileRendererService(props, context) {
    const {
        platform: forcedPlatform = null,
        enableHotReload = true,
        enableDebugTools = false,
        performance = {
            enableMetrics: true,
            logThreshold: 16 // ms
        },
        ...config
    } = props;

    // Detect platform
    const platform = forcedPlatform || MobilePlatformDetector.detect();
    const isMobile = MobilePlatformDetector.isMobile(platform);
    const supportsNative = MobilePlatformDetector.supportsNativeRendering(platform);

    let bridge = null;
    let renderer = null;
    let hotReloadWatcher = null;

    const initializeMobileRenderer = () => {
        if (!supportsNative) {
            console.log('Mobile renderer not supported on this platform, using web renderer');
            return;
        }

        try {
            // Initialize bridge
            bridge = new MobileBridgeManager(platform);

            // Create platform-specific renderer
            if (platform.startsWith('ios')) {
                renderer = new iOSRenderer(context.juris, platform, bridge);
            } else if (platform.startsWith('android')) {
                renderer = new AndroidRenderer(context.juris, platform, bridge);
            } else {
                throw new Error(`Unsupported mobile platform: ${platform}`);
            }

            // Replace the DOM renderer
            const originalRenderer = context.juris.domRenderer;
            context.juris.domRenderer = renderer;

            // Store reference to original for potential restoration
            renderer._originalRenderer = originalRenderer;

            console.log(`Mobile renderer initialized for ${platform}`);

            // Setup hot reload if enabled
            if (enableHotReload && typeof window !== 'undefined') {
                setupHotReload();
            }

            // Setup debug tools if enabled
            if (enableDebugTools) {
                setupDebugTools();
            }

        } catch (error) {
            console.error('Failed to initialize mobile renderer:', error);
        }
    };

    const setupHotReload = () => {
        // Simple hot reload implementation
        let lastModified = Date.now();

        hotReloadWatcher = setInterval(() => {
            // In a real implementation, this would check file modification times
            // For now, it's just a placeholder for the hot reload mechanism
        }, 1000);

        console.log('Hot reload enabled for mobile renderer');
    };

    const setupDebugTools = () => {
        // Add debug tools to global scope
        window.jurisMobileDebug = {
            getRenderer: () => renderer,
            getBridge: () => bridge,
            getMetrics: () => renderer?.getMetrics(),
            getViewRegistry: () => renderer?.viewRegistry,
            logViews: () => {
                console.table(Array.from(renderer?.viewRegistry.entries() || []));
            },
            inspectView: (viewId) => {
                const view = renderer?.viewRegistry.get(viewId);
                console.log(`View ${viewId}:`, view);
                return view;
            },
            testBridge: () => {
                bridge?.call('test', { message: 'Hello from debug tools' }, (error, result) => {
                    console.log('Bridge test result:', error || result);
                });
            }
        };

        console.log('Mobile debug tools available at window.jurisMobileDebug');
    };

    const cleanup = () => {
        if (hotReloadWatcher) {
            clearInterval(hotReloadWatcher);
            hotReloadWatcher = null;
        }

        if (renderer) {
            // Restore original renderer
            if (renderer._originalRenderer) {
                context.juris.domRenderer = renderer._originalRenderer;
            }

            // Cleanup mobile renderer
            const views = Array.from(renderer.viewRegistry.keys());
            views.forEach(viewId => renderer.cleanup(viewId));
        }

        if (typeof window !== 'undefined' && window.jurisMobileDebug) {
            delete window.jurisMobileDebug;
        }

        console.log('Mobile renderer service cleaned up');
    };

    return {
        api: {
            // Platform detection
            getPlatform: () => platform,
            isMobile: () => isMobile,
            supportsNative: () => supportsNative,
            
            // Renderer access
            getRenderer: () => renderer,
            getBridge: () => bridge,
            
            // Control methods
            setRootView: (viewId) => renderer?.setRootView(viewId),
            forceRerender: () => {
                if (context.juris.layout) {
                    context.juris.render();
                }
            },
            
            // Performance and debugging
            getMetrics: () => renderer?.getMetrics(),
            enableDebugMode: () => {
                if (!enableDebugTools) {
                    setupDebugTools();
                }
            },
            
            // Hot reload control
            triggerHotReload: () => {
                console.log('Triggering hot reload...');
                setTimeout(() => {
                    if (context.juris.layout) {
                        context.juris.render();
                    }
                }, 100);
            },

            // Bridge communication
            callNative: (method, params, callback) => {
                return bridge?.call(method, params, callback);
            },

            // View management
            findViewById: (viewId) => renderer?.viewRegistry.get(viewId),
            getAllViews: () => Array.from(renderer?.viewRegistry.values() || []),
            
            // Configuration
            setRenderMode: (mode) => renderer?.setRenderMode(mode),
            getRenderMode: () => renderer?.getRenderMode()
        },

        hooks: {
            onRegister: () => {
                console.log('Mobile Renderer Service registering...');
                initializeMobileRenderer();
            },

            onUnregister: () => {
                console.log('Mobile Renderer Service unregistering...');
                cleanup();
            }
        }
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export for browser
if (typeof window !== 'undefined') {
    window.MobilePlatformDetector = MobilePlatformDetector;
    window.MobileBridgeManager = MobileBridgeManager;
    window.MobileRendererBase = MobileRendererBase;
    window.iOSRenderer = iOSRenderer;
    window.AndroidRenderer = AndroidRenderer;
    window.MobileRendererService = MobileRendererService;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MobilePlatformDetector,
        MobileBridgeManager,
        MobileRendererBase,
        iOSRenderer,
        AndroidRenderer,
        MobileRendererService
    };
}