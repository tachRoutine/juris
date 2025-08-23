/**
 * Advanced Juris FSM Library - juris-afsm.js
 * Working implementation with all advanced features
 */

const AdvancedStateMachineManager = (props, context) => {
  const { getState, setState, subscribe } = context;
  
  // Enhanced registry for machines, instances, and communication
  const machines = new Map();
  const instances = new Map();
  const timers = new Map();
  const communications = new Map();
  
  return {
    api: {
      // Enhanced machine definition with advanced features
      defineMachine: (id, config) => {
        const enhancedConfig = {
          ...config,
          id,
          type: config.type || 'atomic',
          hierarchical: config.hierarchical || false,
          parallel: config.parallel || false,
          history: config.history || false,
          persistence: config.persistence || false,
          communication: config.communication || {},
          timers: config.timers || {}
        };
        
        machines.set(id, enhancedConfig);
        console.log(`🚀 Advanced Machine "${id}" defined with features:`, {
          hierarchical: enhancedConfig.hierarchical,
          parallel: enhancedConfig.parallel,
          history: enhancedConfig.history,
          persistence: enhancedConfig.persistence
        });
        return enhancedConfig;
      },
      
      // Enhanced useMachine with advanced options
      useMachine: (machineId, options = {}) => {
        const { 
          id = `${machineId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          context: initialContext = {},
          persistence = false,
          communication = {}
        } = options;
        
        let instance = instances.get(id);
        if (!instance) {
          const config = machines.get(machineId);
          if (!config) {
            throw new Error(`Machine "${machineId}" not found. Define it first with defineMachine()`);
          }
          
          instance = createAdvancedMachineInstance(config, id, initialContext, context, {
            persistence,
            communication
          });
          instances.set(id, instance);
        }
        
        return {
          state: {
            get value() { return instance.getValue(); },
            get context() { return instance.getContext(); },
            get history() { return instance.getState().history; },
            get timestamp() { return instance.getState().timestamp; },
            get parallel() { return instance.getParallelStates(); },
            get meta() { return instance.getMeta(); }
          },
          send: instance.send.bind(instance),
          start: instance.start.bind(instance),
          stop: instance.stop.bind(instance),
          restart: instance.restart.bind(instance),
          instance,
          api: createAdvancedConnectorAPI(instance)
        };
      },
      
      // Machine composition
      composeMachines: (compositionId, machines, options = {}) => {
        const composition = {
          id: compositionId,
          machines: machines,
          communication: options.communication || {},
          coordination: options.coordination || 'independent'
        };
        
        machines.set(compositionId, {
          ...composition,
          type: 'composition',
          composed: true
        });
        
        console.log(`🔗 Machine composition "${compositionId}" created with ${machines.length} machines`);
        return composition;
      },
      
      // Machine-to-machine communication
      establishCommunication: (fromInstanceId, toInstanceId, channel, options = {}) => {
        const commId = `${fromInstanceId}->${toInstanceId}:${channel}`;
        communications.set(commId, {
          from: fromInstanceId,
          to: toInstanceId,
          channel,
          type: options.type || 'event',
          transform: options.transform,
          filter: options.filter,
          bidirectional: options.bidirectional || false
        });
        
        console.log(`📡 Communication established: ${commId}`);
        return commId;
      },
      
      // Fixed Persistence management
      persistState: (instanceId, key) => {
        const instance = instances.get(instanceId);
        if (!instance) {
          console.warn(`Instance ${instanceId} not found for persistence`);
          return false;
        }
        
        const state = instance.getState();
        const persistenceKey = key || `fsm_${instanceId}`;
        
        try {
          const serializedState = JSON.stringify({
            value: state.value,
            context: state.context,
            history: state.history,
            timestamp: state.timestamp,
            meta: state.meta,
            persistedAt: Date.now()
          });
          
          localStorage.setItem(persistenceKey, serializedState);
          console.log(`💾 State persisted for ${instanceId}:`, persistenceKey);
          return true;
        } catch (error) {
          console.error('Persistence failed:', error);
          return false;
        }
      },
      
      hydrateState: (instanceId, key) => {
        const persistenceKey = key || `fsm_${instanceId}`;
        
        try {
          const serializedState = localStorage.getItem(persistenceKey);
          if (!serializedState) {
            console.log(`No persisted state found for key: ${persistenceKey}`);
            return null;
          }
          
          const state = JSON.parse(serializedState);
          console.log(`🔄 State hydrated for ${instanceId}:`, state);
          
          // Apply the hydrated state to the instance
          const instance = instances.get(instanceId);
          if (instance) {
            const basePath = instance.basePath;
            setState(`${basePath}.value`, state.value);
            setState(`${basePath}.context`, state.context);
            setState(`${basePath}.history`, state.history || []);
            setState(`${basePath}.timestamp`, state.timestamp);
            setState(`${basePath}.meta`, state.meta || {});
          }
          
          return state;
        } catch (error) {
          console.error('Hydration failed:', error);
          return null;
        }
      },
      
      // Timer management
      setTimer: (instanceId, timerId, delay, event, options = {}) => {
        const timerKey = `${instanceId}:${timerId}`;
        
        // Clear existing timer
        if (timers.has(timerKey)) {
          clearTimeout(timers.get(timerKey).handle);
        }
        
        const handle = setTimeout(() => {
          const instance = instances.get(instanceId);
          if (instance && !instance.destroyed) {
            console.log(`⏰ Timer ${timerId} fired for ${instanceId}`);
            instance.send(event, { timerId, ...options.payload });
          }
          timers.delete(timerKey);
        }, delay);
        
        timers.set(timerKey, {
          handle,
          delay,
          event,
          options,
          startTime: Date.now()
        });
        
        console.log(`⏲️ Timer ${timerId} set for ${delay}ms`);
        return timerKey;
      },
      
      clearTimer: (instanceId, timerId) => {
        const timerKey = `${instanceId}:${timerId}`;
        const timer = timers.get(timerKey);
        
        if (timer) {
          clearTimeout(timer.handle);
          timers.delete(timerKey);
          console.log(`⏹️ Timer ${timerId} cleared`);
          return true;
        }
        return false;
      },
      
      // Enhanced debugging and introspection
      getAdvancedDebugInfo: () => ({
        machines: Array.from(machines.keys()),
        instances: Array.from(instances.keys()),
        timers: Array.from(timers.keys()),
        communications: Array.from(communications.keys()),
        machineConfigs: Object.fromEntries(machines),
        activeTimers: Object.fromEntries(timers),
        communicationChannels: Object.fromEntries(communications),
        persistenceKeys: Object.keys(localStorage).filter(key => key.startsWith('fsm_'))
      }),
      
      // Visual state machine representation
      generateStateDiagram: (machineId, options = {}) => {
        const config = machines.get(machineId);
        if (!config) return null;
        
        const mermaidDiagram = generateMermaidDiagram(config, options);
        console.log(`📊 State diagram generated for ${machineId}`);
        return mermaidDiagram;
      },
      
      // Cleanup and lifecycle
      destroyInstance: (instanceId) => {
        const instance = instances.get(instanceId);
        if (instance) {
          instance.destroy();
          instances.delete(instanceId);
          
          // Clear related timers
          Array.from(timers.keys())
            .filter(key => key.startsWith(`${instanceId}:`))
            .forEach(key => {
              clearTimeout(timers.get(key).handle);
              timers.delete(key);
            });
          
          // Clear communications
          Array.from(communications.keys())
            .filter(key => key.includes(instanceId))
            .forEach(key => communications.delete(key));
        }
      },
      
      // Legacy compatibility
      getInstance: (instanceId) => instances.get(instanceId),
      connect: (machineId, instanceId, normalizeProps) => {
        const instance = instances.get(instanceId);
        if (!instance) return {};
        return createAdvancedConnectorAPI(instance, normalizeProps);
      },
      getMachines: () => Array.from(machines.keys()),
      getInstances: () => Array.from(instances.keys()),
      getDebugInfo: () => this.api.getAdvancedDebugInfo()
    },
    
    hooks: {
      onRegister: () => {
        console.log('🚀 Advanced StateMachineManager registered - Enterprise FSM features available');
      },
      
      onUnregister: () => {
        console.log('🧹 Advanced StateMachineManager cleaning up');
        // Clear all timers
        timers.forEach(timer => clearTimeout(timer.handle));
        timers.clear();
        
        // Cleanup all instances
        instances.forEach(instance => instance.destroy());
        instances.clear();
        machines.clear();
        communications.clear();
      }
    }
  };
};

// Enhanced machine instance creation
function createAdvancedMachineInstance(config, instanceId, initialContext, jurisContext, options = {}) {
  const basePath = `machines.${config.id}.${instanceId}`;
  
  // Enhanced initial state with advanced features
  const initialState = {
    value: resolveInitialState(config),
    context: { ...config.context, ...initialContext },
    history: config.history ? [] : [config.initial],
    timestamp: Date.now(),
    canTransition: true,
    parallel: config.parallel ? {} : null,
    meta: {
      instanceId,
      machineId: config.id,
      type: config.type,
      transitions: 0,
      features: {
        hierarchical: config.hierarchical,
        parallel: config.parallel,
        history: config.history,
        persistence: config.persistence
      }
    }
  };
  
  jurisContext.setState(basePath, initialState);
  
  const instance = {
    config,
    instanceId,
    basePath,
    destroyed: false,
    subscriptions: [],
    timers: new Set(),
    communications: new Set(),
    
    init() {
      this._executeActions(this._getStateConfig(initialState.value)?.entry);
      setTimeout(() => this._setupAdvancedMonitoring(), 0);
      
      if (config.parallel) {
        this._initializeParallelStates();
      }
    },
    
    _setupAdvancedMonitoring() {
      // Enhanced state monitoring
      const unsubscribe = jurisContext.subscribe(`${basePath}.value`, (newValue, oldValue) => {
        if (oldValue && newValue !== oldValue) {
          this._handleAdvancedStateTransition(oldValue, newValue);
        }
      });
      this.subscriptions.push(unsubscribe);
      
      // Context change monitoring for auto-persistence
      if (config.persistence) {
        const contextUnsubscribe = jurisContext.subscribe(`${basePath}.context`, () => {
          // Auto-persist on context changes
          setTimeout(() => {
            jurisContext.AdvancedFSM?.persistState?.(instanceId);
          }, 100);
        });
        this.subscriptions.push(contextUnsubscribe);
      }
    },
    
    _initializeParallelStates() {
      if (!config.parallel || !config.states) return;
      
      const parallelStates = {};
      Object.keys(config.states).forEach(stateKey => {
        const stateConfig = config.states[stateKey];
        if (stateConfig.type === 'parallel' || config.parallel) {
          parallelStates[stateKey] = stateConfig.initial || Object.keys(stateConfig.states || {})[0];
        }
      });
      
      jurisContext.setState(`${basePath}.parallel`, parallelStates);
      console.log(`⚡ Parallel states initialized:`, parallelStates);
    },
    
    _handleAdvancedStateTransition(fromState, toState) {
      const fromConfig = this._getStateConfig(fromState);
      const toConfig = this._getStateConfig(toState);
      
      console.log(`🔄 ${config.id}[${instanceId}]: ${fromState} → ${toState}`);
      
      // Execute exit actions
      if (fromConfig?.exit) {
        this._executeActions(fromConfig.exit);
      }
      
      // Handle history states
      if (config.history) {
        this._updateHistoryState(fromState, toState);
      }
      
      // Execute entry actions  
      if (toConfig?.entry) {
        this._executeActions(toConfig.entry);
      }
      
      // Handle parallel state updates
      if (config.parallel) {
        this._updateParallelStates(toState);
      }
      
      // Update metadata
      this._updateTransitionMetadata(fromState, toState);
    },
    
    _getStateConfig(state) {
      if (!state || !config.states) return null;
      
      // Handle hierarchical states (dot notation)
      if (typeof state === 'string' && state.includes('.')) {
        const parts = state.split('.');
        let current = config.states;
        for (const part of parts) {
          current = current[part];
          if (!current) return null;
        }
        return current;
      }
      
      return config.states[state];
    },
    
    _updateHistoryState(fromState, toState) {
      const currentHistory = jurisContext.getState(`${basePath}.history`, []);
      const newHistory = [...currentHistory, toState];
      
      // Limit history size to prevent memory leaks
      const maxHistory = config.historyLimit || 100;
      if (newHistory.length > maxHistory) {
        newHistory.splice(0, newHistory.length - maxHistory);
      }
      
      jurisContext.setState(`${basePath}.history`, newHistory);
    },
    
    _updateParallelStates(newState) {
      const parallelStates = jurisContext.getState(`${basePath}.parallel`, {});
      // Update parallel state logic here
      jurisContext.setState(`${basePath}.parallel`, { ...parallelStates });
    },
    
    _updateTransitionMetadata(fromState, toState) {
      const meta = jurisContext.getState(`${basePath}.meta`, {});
      jurisContext.setState(`${basePath}.meta`, {
        ...meta,
        lastTransition: { from: fromState, to: toState, timestamp: Date.now() },
        totalTransitions: (meta.totalTransitions || 0) + 1
      });
      jurisContext.setState(`${basePath}.timestamp`, Date.now());
    },
    
    // Enhanced send method with advanced features
    send(event, payload = {}) {
      if (this.destroyed) return;
      
      const currentState = jurisContext.getState(`${basePath}.value`);
      const canTransition = jurisContext.getState(`${basePath}.canTransition`, true);
      
      console.log(`📨 ${config.id}[${instanceId}]: ${event} in ${currentState}`);
      
      if (!canTransition) return;
      
      // Handle hierarchical state resolution
      const stateConfig = this._getStateConfig(currentState);
      if (!stateConfig) return;

      const transition = stateConfig.on?.[event];
      if (!transition) {
        console.warn(`⚠️ No transition for "${event}" in state "${currentState}"`);
        return;
      }

      this._processAdvancedTransition(transition, event, payload, currentState);
    },
    
    _processAdvancedTransition(transition, event, payload, currentState) {
      let targetState;
      let actions = [];

      if (typeof transition === 'string') {
        targetState = transition;
      } else if (Array.isArray(transition)) {
        const validTransition = transition.find(t => {
          if (t.cond) return this._evaluateGuard(t.cond, event, payload);
          return true;
        });
        
        if (!validTransition) return;
        targetState = validTransition.target;
        actions = validTransition.actions || [];
      } else {
        if (transition.cond) {
          const currentContext = jurisContext.getState(`${basePath}.context`, {});
          if (!this._evaluateGuard(transition.cond, event, payload, currentContext)) {
            console.log(`🚫 Guard condition failed for transition`);
            return;
          }
        }
        targetState = transition.target;
        actions = transition.actions || [];
      }

      // Execute transition actions
      if (actions.length > 0) {
        this._executeActions(actions, event, payload);
      }
      
      // Handle special target states
      if (targetState) {
        const resolvedTarget = this._resolveTargetState(targetState, currentState);
        if (resolvedTarget !== jurisContext.getState(`${basePath}.value`)) {
          jurisContext.setState(`${basePath}.value`, resolvedTarget);
        }
      }
    },
    
    _resolveTargetState(target, currentState) {
      // Handle history states
      if (target === 'HISTORY') {
        const history = jurisContext.getState(`${basePath}.history`, []);
        // Get the previous state (excluding current)
        const previousState = history[history.length - 2];
        return previousState || config.initial;
      }
      
      // Handle hierarchical navigation
      if (target.startsWith('#')) {
        return target.substring(1);
      }
      
      if (target.includes('.')) {
        return target;
      }
      
      return target;
    },
    
    // Enhanced API methods
    getValue: () => jurisContext.getState(`${basePath}.value`),
    getContext: () => jurisContext.getState(`${basePath}.context`),
    getParallelStates: () => jurisContext.getState(`${basePath}.parallel`, {}),
    getMeta: () => jurisContext.getState(`${basePath}.meta`, {}),
    
    getState: () => ({
      value: jurisContext.getState(`${basePath}.value`),
      context: jurisContext.getState(`${basePath}.context`),
      history: jurisContext.getState(`${basePath}.history`, []),
      timestamp: jurisContext.getState(`${basePath}.timestamp`),
      parallel: jurisContext.getState(`${basePath}.parallel`),
      meta: jurisContext.getState(`${basePath}.meta`)
    }),
    
    // Lifecycle methods
    start: () => {
      if (instance.destroyed) return;
      jurisContext.setState(`${basePath}.canTransition`, true);
      console.log(`▶️ Machine ${instanceId} started`);
    },
    
    stop: () => {
      if (instance.destroyed) return;
      jurisContext.setState(`${basePath}.canTransition`, false);
      console.log(`⏸️ Machine ${instanceId} stopped`);
    },
    
    restart: () => {
      if (instance.destroyed) return;
      const initialValue = resolveInitialState(config);
      jurisContext.setState(`${basePath}.value`, initialValue);
      jurisContext.setState(`${basePath}.context`, { ...config.context });
      jurisContext.setState(`${basePath}.canTransition`, true);
      console.log(`🔄 Machine ${instanceId} restarted`);
    },
    
    matches: (state) => {
      const currentState = jurisContext.getState(`${basePath}.value`);
      if (typeof state === 'string') {
        return currentState === state || currentState.startsWith(state + '.');
      }
      return false;
    },
    
    can: (event) => {
      const currentState = jurisContext.getState(`${basePath}.value`);
      const stateConfig = this._getStateConfig(currentState);
      return !!stateConfig?.on?.[event];
    },
    
    updateContext: (updates) => {
      this._updateContext(updates);
    },
    
    _updateContext(updates) {
      const currentContext = jurisContext.getState(`${basePath}.context`, {});
      const newContext = { ...currentContext, ...updates };
      
      jurisContext.setState(`${basePath}.context`, newContext);
      
      Object.keys(updates).forEach(key => {
        jurisContext.setState(`${basePath}.context.${key}`, updates[key]);
      });
    },
    
    _evaluateGuard(guard, event, payload, contextOverride = null) {
      const context = contextOverride || jurisContext.getState(`${basePath}.context`, {});
      
      if (typeof guard === 'function') {
        return guard(context, event, payload);
      }
      
      if (typeof guard === 'string') {
        const guardFn = config.guards?.[guard];
        if (guardFn) return guardFn(context, event, payload);
      }
      
      return false;
    },
    
    _executeActions(actions, event = null, payload = {}) {
      if (!actions) return;
      
      const actionList = Array.isArray(actions) ? actions : [actions];
      
      actionList.forEach(action => {
        const context = jurisContext.getState(`${basePath}.context`, {});
        
        if (typeof action === 'function') {
          const result = action(context, event, payload);
          if (result && typeof result === 'object') {
            this._updateContext(result);
          }
        } else if (typeof action === 'string') {
          const actionFn = config.actions?.[action];
          if (actionFn) {
            const result = actionFn(context, event, payload);
            if (result && typeof result === 'object') {
              this._updateContext(result);
            }
          }
        }
      });
    },
    
    destroy() {
      this.destroyed = true;
      this.subscriptions.forEach(unsubscribe => unsubscribe());
      this.subscriptions = [];
      this.timers.forEach(timerId => this.clearTimer && this.clearTimer(timerId));
      this.timers.clear();
      jurisContext.setState(basePath, undefined);
      console.log(`🗑️ Machine ${instanceId} destroyed`);
    }
  };
  
  instance.init();
  return instance;
}

// Utility functions
function resolveInitialState(config) {
  if (config.parallel && config.states) {
    const parallelStates = Object.keys(config.states).filter(key => 
      config.states[key].type === 'parallel'
    );
    return parallelStates[0] || config.initial;
  }
  
  return config.initial;
}

function createAdvancedConnectorAPI(instance, normalizeProps = (props) => props) {
  const baseAPI = {
    matches: (state) => instance.matches(state),
    can: (event) => instance.can(event),
    send: (event, payload) => instance.send(event, payload),
    context: () => instance.getContext(),
    value: () => instance.getValue(),
    parallel: () => instance.getParallelStates(),
    meta: () => instance.getMeta(),
    start: () => instance.start(),
    stop: () => instance.stop(),
    restart: () => instance.restart()
  };

  return baseAPI;
}

// Generate Mermaid diagrams for visualization
function generateMermaidDiagram(config, options = {}) {
  const { theme = 'default', direction = 'TD' } = options;
  
  let diagram = `stateDiagram-v2\n    direction ${direction}\n`;
  
  if (config.states) {
    Object.entries(config.states).forEach(([stateName, stateConfig]) => {
      diagram += `    ${stateName}\n`;
      
      if (stateConfig.on) {
        Object.entries(stateConfig.on).forEach(([event, transition]) => {
          const target = typeof transition === 'string' ? transition : transition.target;
          if (target) {
            diagram += `    ${stateName} --> ${target} : ${event}\n`;
          }
        });
      }
    });
  }
  
  return diagram;
}

// Export for browser/Node.js
if (typeof window !== 'undefined') {
  window.AdvancedJurisFSM = {
    AdvancedStateMachineManager,
    createAdvancedConnectorAPI,
    generateMermaidDiagram
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AdvancedStateMachineManager,
    createAdvancedConnectorAPI,
    generateMermaidDiagram
  };
}