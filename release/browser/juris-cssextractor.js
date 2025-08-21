/**
 * CSSExtractor - Handles all CSS processing and extraction logic
 * Returns only reactive style props for DOMRenderer consumption
 */
class CSSExtractor {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.debug = options.debug || false;
        
        // Cache management
        this.cache = new Map();
        this.maxCacheSize = options.maxCacheSize || 200;
        
        // Extraction statistics
        this.stats = {
            processedProps: 0,
            cacheHits: 0,
            cacheMisses: 0,
            extractedClasses: 0,
            reactiveProcessed: 0
        };
        
        // Style sheet management
        this.styleSheet = null;
        this.classCounter = 0;
        this.generatedClasses = new Map();
        
        this.initializeStyleSheet();
    }

    // ===== INITIALIZATION =====
    initializeStyleSheet() {
        if (typeof document === 'undefined') return; // SSR safe
        
        const existingSheet = document.querySelector('style[data-css-extractor]');
        if (existingSheet) {
            this.styleSheet = existingSheet.sheet;
            return;
        }
        
        const style = document.createElement('style');
        style.setAttribute('data-css-extractor', '');
        document.head.appendChild(style);
        this.styleSheet = style.sheet;
    }

    // ===== MAIN PROCESSING API =====
    
    /**
     * Process props and return reactive style props
     * @param {Object} props - Original props
     * @param {string} tag - Element tag name
     * @param {Object} context - Additional context (componentName, etc.)
     * @returns {Object} - Processed props with reactive styles
     */
    processProps(props, tag, context = {}) {
        if (!this.enabled || !props.style) {
            return props;
        }
        
        this.stats.processedProps++;
        
        try {
            const cacheKey = this.generateCacheKey(props.style, tag, context);
            let result = this.cache.get(cacheKey);
            
            if (result) {
                this.stats.cacheHits++;
                return result;
            }
            
            this.stats.cacheMisses++;
            result = this.extractAndProcess(props, tag, context);
            
            // Cache management
            this.setCacheEntry(cacheKey, result);
            
            this.logExtraction(tag, props, result, context);
            
            return result;
            
        } catch (error) {
            console.warn(`CSSExtractor failed for <${tag}>:`, error);
            return props;
        }
    }

    /**
     * Post-process reactive style results
     * @param {*} styleResult - Result from reactive function
     * @param {string} componentName - Component context
     * @param {HTMLElement} element - Target element
     * @returns {*} - Processed reactive result
     */
    postProcessReactiveResult(styleResult, componentName, element) {
        if (!this.enabled || !this.looksLikeStyleObject(styleResult)) {
            return styleResult;
        }
        
        this.stats.reactiveProcessed++;
        
        try {
            return this.processStyleObject(styleResult, element?.tagName?.toLowerCase() || 'div', {
                componentName,
                reactive: true
            });
        } catch (error) {
            console.warn('CSSExtractor reactive processing failed:', error);
            return styleResult;
        }
    }

    // ===== EXTRACTION LOGIC =====
    
    extractAndProcess(props, tag, context) {
        const { style, ...otherProps } = props;
        
        if (typeof style === 'function') {
            // Return a reactive function that processes styles
            return {
                ...otherProps,
                style: (...args) => {
                    const styleResult = style(...args);
                    return this.processStyleObject(styleResult, tag, { ...context, reactive: true });
                }
            };
        } else if (style && typeof style === 'object') {
            // Check if any properties are reactive functions
            const hasReactiveProps = Object.values(style).some(value => typeof value === 'function');
            
            if (hasReactiveProps) {
                // FIXED: Preserve reactive sub-properties
                const processedStyle = {};
                const staticProps = {};
                
                Object.entries(style).forEach(([prop, value]) => {
                    if (typeof value === 'function') {
                        // Keep reactive functions as-is for DOMRenderer to handle
                        processedStyle[prop] = value;
                    } else {
                        // Collect static values for extraction
                        staticProps[prop] = value;
                        processedStyle[prop] = value;
                    }
                });
                
                // Process static properties for extraction
                let result = { ...otherProps, style: processedStyle };
                
                if (Object.keys(staticProps).length > 0) {
                    const staticProcessed = this.processStyleObject(staticProps, tag, context);
                    
                    // If CSS classes were generated, add className to result
                    if (staticProcessed && staticProcessed.className) {
                        result.className = staticProcessed.className;
                        
                        // Remove extracted static properties from inline styles
                        const finalStyle = { ...processedStyle };
                        Object.keys(staticProps).forEach(prop => {
                            if (this.shouldExtract(prop, staticProps[prop])) {
                                delete finalStyle[prop];
                            }
                        });
                        result.style = finalStyle;
                    }
                }
                
                return result;
            } else {
                // Process static style object normally
                const processedStyle = this.processStyleObject(style, tag, context);
                return {
                    ...otherProps,
                    ...processedStyle
                };
            }
        }
        
        return props;
    }

    processStyleObject(styleObj, tag, context = {}) {
        if (!styleObj || typeof styleObj !== 'object') {
            return styleObj;
        }
        
        const {
            extractableStyles,
            inlineStyles,
            mediaQueries,
            pseudoSelectors
        } = this.categorizeStyles(styleObj);
        
        let result = { ...inlineStyles };
        
        // Extract complex styles to CSS classes
        if (Object.keys(extractableStyles).length > 0 || mediaQueries.length > 0 || pseudoSelectors.length > 0) {
            const className = this.generateClassName(tag, context);
            const cssText = this.generateCSS(className, extractableStyles, mediaQueries, pseudoSelectors);
            
            if (cssText) {
                this.injectCSS(cssText);
                
                // Return className separately for proper merging
                const processedResult = { style: Object.keys(result).length > 0 ? result : null };
                if (className) {
                    processedResult.className = className;
                }
                
                this.stats.extractedClasses++;
                return processedResult;
            }
        }
        
        return { style: Object.keys(result).length > 0 ? result : null };
    }

    categorizeStyles(styleObj) {
        const extractableStyles = {};
        const inlineStyles = {};
        const mediaQueries = [];
        const pseudoSelectors = [];
        
        Object.entries(styleObj).forEach(([key, value]) => {
            if (key.startsWith('@media')) {
                mediaQueries.push({ query: key, styles: value });
            } else if (key.startsWith('&') || key.includes(':')) {
                pseudoSelectors.push({ selector: key, styles: value });
            } else if (this.shouldExtract(key, value)) {
                extractableStyles[key] = value;
            } else {
                inlineStyles[this.camelToKebab(key)] = value;
            }
        });
        
        return { extractableStyles, inlineStyles, mediaQueries, pseudoSelectors };
    }

    shouldExtract(property, value) {
        // Extract complex properties that benefit from CSS classes
        if (property.startsWith('--')) return true; // CSS variables
        if (typeof value === 'object') return true; // Nested objects
        if (property.includes('gradient')) return true; // Gradients
        if (property === 'transform' && typeof value === 'string' && value.length > 20) return true;
        if (property === 'boxShadow' && typeof value === 'string' && value.includes(',')) return true;
        if (property === 'animation' || property === 'transition') return true;
        
        return false;
    }

    // ===== CSS GENERATION =====
    
    generateClassName(tag, context = {}) {
        const prefix = context.componentName ? `${context.componentName}-` : '';
        const suffix = context.reactive ? '-r' : '';
        const id = ++this.classCounter;
        return `css-${prefix}${tag}${suffix}-${id}`;
    }

    generateCSS(className, styles, mediaQueries, pseudoSelectors) {
        let css = '';
        
        // Base styles
        if (Object.keys(styles).length > 0) {
            css += `.${className} {\n`;
            Object.entries(styles).forEach(([prop, value]) => {
                css += `  ${this.camelToKebab(prop)}: ${value};\n`;
            });
            css += '}\n';
        }
        
        // Pseudo selectors
        pseudoSelectors.forEach(({ selector, styles: pseudoStyles }) => {
            const cleanSelector = selector.replace('&', `.${className}`);
            css += `${cleanSelector} {\n`;
            Object.entries(pseudoStyles).forEach(([prop, value]) => {
                css += `  ${this.camelToKebab(prop)}: ${value};\n`;
            });
            css += '}\n';
        });
        
        // Media queries
        mediaQueries.forEach(({ query, styles: mediaStyles }) => {
            css += `${query} {\n`;
            css += `  .${className} {\n`;
            Object.entries(mediaStyles).forEach(([prop, value]) => {
                css += `    ${this.camelToKebab(prop)}: ${value};\n`;
            });
            css += '  }\n';
            css += '}\n';
        });
        
        return css;
    }

    injectCSS(cssText) {
        if (!this.styleSheet || !cssText) return;
        
        try {
            this.styleSheet.insertRule(cssText, this.styleSheet.cssRules.length);
        } catch (error) {
            console.warn('Failed to inject CSS:', error);
        }
    }

    // ===== UTILITY METHODS =====
    
    generateCacheKey(style, tag, context) {
        if (typeof style === 'function') {
            return `${tag}-fn-${context.componentName || 'anonymous'}-${style.toString().slice(0, 50)}`;
        }
        
        const contextStr = JSON.stringify({
            tag,
            componentName: context.componentName,
            reactive: context.reactive
        });
        
        const styleStr = JSON.stringify(style, Object.keys(style).sort());
        return this.hashString(`${contextStr}-${styleStr}`);
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0x7fffffff;
        }
        return hash.toString(36);
    }

    setCacheEntry(key, value) {
        // LRU cache management
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    looksLikeStyleObject(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return false;
        }
        
        const keys = Object.keys(obj);
        return keys.some(key => 
            typeof key === 'string' && (
                key.includes('color') || 
                key.includes('background') || 
                key.includes('border') || 
                key.includes('padding') || 
                key.includes('margin') ||
                key.includes('width') ||
                key.includes('height') ||
                key.startsWith('--') ||
                key.startsWith('@') ||
                key.startsWith('&') ||
                key.startsWith('$') ||
                ['display', 'position', 'top', 'left', 'right', 'bottom', 'transform', 'opacity'].includes(key)
            )
        );
    }

    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    logExtraction(tag, originalProps, processedProps, context) {
        if (!this.debug) return;
        
        const hasOriginalStyle = originalProps.style && Object.keys(originalProps.style).length > 0;
        const hasProcessedStyle = processedProps.style && Object.keys(processedProps.style).length > 0;
        const hasNewClassName = processedProps.className && processedProps.className !== originalProps.className;
        
        if (hasOriginalStyle && (hasNewClassName || !hasProcessedStyle)) {
            console.debug(`CSSExtractor processed <${tag}>`, {
                component: context.componentName,
                extractedToClass: hasNewClassName ? processedProps.className : false,
                remainingInlineStyles: hasProcessedStyle ? Object.keys(processedProps.style).length : 0,
                originalStyleCount: Object.keys(originalProps.style).length,
                reactive: context.reactive
            });
        }
    }

    // ===== PUBLIC API =====
    
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize,
            generatedClasses: this.generatedClasses.size,
            enabled: this.enabled
        };
    }

    clear() {
        this.cache.clear();
        this.generatedClasses.clear();
        this.stats = {
            processedProps: 0,
            cacheHits: 0,
            cacheMisses: 0,
            extractedClasses: 0,
            reactiveProcessed: 0
        };
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setDebug(debug) {
        this.debug = debug;
    }

    // Remove generated CSS (useful for hot reloading)
    clearGeneratedCSS() {
        if (!this.styleSheet) return;
        
        // Clear all rules from our style sheet
        while (this.styleSheet.cssRules.length > 0) {
            this.styleSheet.deleteRule(0);
        }
        
        this.generatedClasses.clear();
        this.classCounter = 0;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSExtractor;
}
if (typeof window !== 'undefined') {
    window.CSSExtractor = CSSExtractor;
}