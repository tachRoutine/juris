class ObjectTreeAnalyzer {
    constructor(domRenderer) {
        this.domRenderer = domRenderer;
        this.lastObjectTree = null;
    }

    buildObjectTree(vnode, componentName = null) {
        const tree = this.analyzeVNode(vnode, 0);
        
        this.lastObjectTree = {
            tree,
            timestamp: Date.now(),
            componentName,
            metadata: this.extractMetadata(tree)
        };
        
        return this.lastObjectTree;
    }

    analyzeVNode(vnode, depth = 0) {
        if (typeof vnode === 'string' || typeof vnode === 'number') {
            return { 
                type: 'text', 
                value: String(vnode), 
                depth,
                originalType: typeof vnode
            };
        }
        
        if (vnode === null || vnode === undefined) {
            return { type: 'null', value: vnode, depth };
        }
        
        if (typeof vnode === 'function') {
            return {
                type: 'function',
                depth,
                functionName: vnode.name || 'anonymous',
                isReactive: true
            };
        }
        
        if (Array.isArray(vnode)) {
            return {
                type: 'array',
                length: vnode.length,
                children: vnode.map((child, index) => ({
                    index,
                    node: this.analyzeVNode(child, depth + 1)
                })),
                depth,
                hasReactiveFunctions: vnode.some(item => typeof item === 'function'),
                hasComponents: vnode.some(item => 
                    item && typeof item === 'object' && !Array.isArray(item) &&
                    Object.keys(item).some(key => this.domRenderer.juris.componentManager.components.has(key))
                )
            };
        }

        if (typeof vnode === 'object') {
            const tag = Object.keys(vnode)[0];
            const props = vnode[tag] || {};
            const isComponent = this.domRenderer.juris.componentManager.components.has(tag);
            
            const node = {
                type: isComponent ? 'component' : 'element',
                tag,
                props: this.analyzePropsComplete(props),
                depth,
                registered: isComponent,
                isSVG: this.domRenderer.SVG_ELEMENTS?.has(tag?.toLowerCase()),
                isCapitalized: /^[A-Z]/.test(tag)
            };

            if (props.children !== undefined) {
                node.children = this.analyzeVNode(props.children, depth + 1);
            }

            if (isComponent) {
                try {
                    const component = this.domRenderer.juris.componentManager.components.get(tag);
                    if (component) {
                        const context = this.domRenderer.juris.createContext();
                        const oldTracking = this.domRenderer.juris.stateManager.currentTracking;
                        this.domRenderer.juris.stateManager.currentTracking = null;
                        const result = component(props, context);
                        node.componentOutput = this.analyzeVNode(result, depth + 1);
                        this.domRenderer.juris.stateManager.currentTracking = oldTracking;
                    }
                } catch (error) {
                    node.componentError = error.message;
                }
            }
            
            return node;
        }

        return { 
            type: 'unknown', 
            value: vnode, 
            valueType: typeof vnode,
            depth 
        };
    }

    analyzePropsComplete(props) {
        const result = {};
        for (const key in props) {
            if (!props.hasOwnProperty(key)) continue;
            
            const value = props[key];
            const propInfo = {
                key,
                type: typeof value,
                isFunction: typeof value === 'function',
                isPromise: value && typeof value.then === 'function',
                isEvent: key.startsWith('on'),
                isReactive: typeof value === 'function' && !key.startsWith('on'),
                isAsync: value && typeof value.then === 'function'
            };

            if (typeof value === 'function') {
                propInfo.functionName = value.name || 'anonymous';
                propInfo.preview = '[Function]';
                if (!key.startsWith('on')) {
                    propInfo.isReactiveFunction = true;
                }
            } else if (propInfo.isPromise) {
                propInfo.preview = '[Promise]';
            } else if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    propInfo.preview = `[Array(${value.length})]`;
                    propInfo.arrayLength = value.length;
                    propInfo.arrayItems = value.map((item, index) => ({
                        index,
                        type: typeof item,
                        isFunction: typeof item === 'function',
                        preview: typeof item === 'function' ? '[Function]' : 
                                typeof item === 'object' ? '[Object]' : String(item)
                    }));
                } else {
                    propInfo.preview = '[Object]';
                    propInfo.objectKeys = Object.keys(value);
                    if (key === 'style') {
                        propInfo.styleProperties = {};
                        for (const styleKey in value) {
                            const styleValue = value[styleKey];
                            propInfo.styleProperties[styleKey] = {
                                type: typeof styleValue,
                                value: typeof styleValue === 'function' ? '[Function]' : styleValue,
                                isReactive: typeof styleValue === 'function'
                            };
                        }
                    }
                }
            } else {
                propInfo.value = value;
                propInfo.preview = String(value);
            }

            if (key === 'children') {
                propInfo.hasChildren = true;
                propInfo.childrenType = typeof value;
                if (Array.isArray(value)) {
                    propInfo.childrenCount = value.length;
                    propInfo.hasReactiveChildren = value.some(child => typeof child === 'function');
                }
                propInfo.preview = `[Children: ${propInfo.childrenType}]`;
            }
            
            result[key] = propInfo;
        }
        
        return result;
    }

    extractMetadata(tree) {
        let components = 0, elements = 0, reactive = 0, maxDepth = 0;
        let functions = 0, promises = 0, arrays = 0;
        const componentTypes = new Set();
        const elementTypes = new Set();
        const eventTypes = new Set();
        
        const traverse = (node) => {
            if (!node) return;
            
            maxDepth = Math.max(maxDepth, node.depth || 0);
            
            switch (node.type) {
                case 'component':
                    components++;
                    componentTypes.add(node.tag);
                    break;
                case 'element':
                    elements++;
                    elementTypes.add(node.tag);
                    break;
                case 'function':
                    functions++;
                    reactive++;
                    break;
                case 'array':
                    arrays++;
                    if (node.hasReactiveFunctions) reactive++;
                    break;
            }

            if (node.props) {
                Object.values(node.props).forEach(prop => {
                    if (prop.isReactive) reactive++;
                    if (prop.isFunction) functions++;
                    if (prop.isPromise) promises++;
                    if (prop.isEvent) eventTypes.add(prop.key);
                });
            }

            if (node.children) {
                if (node.children.type === 'array') {
                    node.children.children?.forEach(child => traverse(child.node));
                } else {
                    traverse(node.children);
                }
            }

            if (node.componentOutput) {
                traverse(node.componentOutput);
            }

            if (node.type === 'array' && node.children) {
                node.children.forEach(child => traverse(child.node));
            }
        };
        
        traverse(tree);
        
        return { 
            components, 
            elements, 
            reactive, 
            functions,
            promises,
            arrays,
            maxDepth,
            componentTypes: Array.from(componentTypes),
            elementTypes: Array.from(elementTypes),
            eventTypes: Array.from(eventTypes),
            totalNodes: components + elements + functions + arrays
        };
    }

    getObjectTree() {
        return this.lastObjectTree;
    }
}

if(typeof window !== 'undefined') {
    window.ObjectTreeAnalyzer = ObjectTreeAnalyzer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports.default = ObjectTreeAnalyzer;
		module.exports.ObjectTreeAnalyzer = ObjectTreeAnalyzer;
}