# Juris Mobile Renderer - Complete Headless Solution

> **Universal mobile rendering for iOS and Android through headless architecture**

Transform your Juris web applications into native mobile apps with zero code changes. The Mobile Renderer headless service automatically detects the platform and replaces the DOM renderer with native mobile rendering, while maintaining full Juris reactivity and component compatibility.

## 🚀 Features

- **🎯 Auto Platform Detection** - Automatically detects iOS, Android, React Native, Capacitor, Cordova
- **📱 Native UI Rendering** - Real native components (UIKit for iOS, Android Views)
- **🔄 Full Reactivity** - Complete state management and reactive updates
- **👆 Gesture Recognition** - Touch, swipe, pinch, pan, long press support
- **⚡ High Performance** - DocumentFragment-style batching for mobile
- **🔥 Hot Reload** - Live development with instant updates
- **🛠️ Debug Tools** - Comprehensive debugging and inspection tools
- **🎨 Style Mapping** - Automatic CSS-to-native style conversion
- **📦 Zero Dependencies** - Pure JavaScript, no additional frameworks

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Platform Support](#platform-support)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Native Bridge Setup](#native-bridge-setup)
- [Performance Guide](#performance-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🔧 Installation

### Browser/WebView Integration

```html
<!-- Include after Juris core -->
<script src="juris.js"></script>
<script src="juris-mobile-renderer.js"></script>
```

### React Native Integration

```javascript
// Install the mobile renderer
import { MobileRendererService } from './juris-mobile-renderer';

// Your React Native app will need the native bridge modules
// See "Native Bridge Setup" section below
```

### Capacitor/Ionic Integration

```javascript
// The renderer automatically detects Capacitor
// Just include the script and configure
```

## 🚀 Quick Start

### Basic Setup

```javascript
// 1. Create your Juris app as usual
const app = new Juris({
  states: {
    count: 0,
    user: { name: 'John' }
  },
  
  headlessComponents: {
    mobileRenderer: { fn: MobileRendererService, options: { autoInit: true } }
  },
  
  layout: {
    safe: {
      children: [{ ContactForm: {} }]
    }
  }
});
```

### Navigation App with Platform-Specific UI

```javascript
const NavigationApp = new Juris({
  states: {
    currentScreen: 'home',
    user: { name: 'John Doe', avatar: 'avatar.jpg' },
    notifications: 3
  },
  
  components: {
    HomeScreen: (props, context) => ({
      vstack: {
        style: { padding: 20, spacing: 20 },
        children: [
          {
            text: {
              text: () => `Welcome, ${context.getState('user.name')}!`,
              style: { 
                fontSize: 24, 
                fontWeight: 'bold',
                textAlign: 'center' 
              }
            }
          },
          {
            button: {
              text: 'Go to Profile',
              onclick: () => context.setState('currentScreen', 'profile'),
              style: {
                backgroundColor: '#007AFF',
                color: 'white',
                padding: 15,
                borderRadius: 10
              }
            }
          },
          {
            button: {
              text: () => {
                const count = context.getState('notifications');
                return `Notifications (${count})`;
              },
              onclick: () => context.setState('currentScreen', 'notifications'),
              style: {
                backgroundColor: '#FF9500',
                color: 'white',
                padding: 15,
                borderRadius: 10
              }
            }
          }
        ]
      }
    }),
    
    ProfileScreen: (props, context) => ({
      vstack: {
        style: { padding: 20, spacing: 20 },
        children: [
          {
            hstack: {
              style: { alignItems: 'center', spacing: 15 },
              children: [
                {
                  image: {
                    src: () => context.getState('user.avatar'),
                    style: {
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#ddd'
                    }
                  }
                },
                {
                  vstack: {
                    style: { flex: 1, spacing: 5 },
                    children: [
                      {
                        text: {
                          text: () => context.getState('user.name'),
                          style: { 
                            fontSize: 22, 
                            fontWeight: 'bold' 
                          }
                        }
                      },
                      {
                        text: {
                          text: 'Premium Member',
                          style: { 
                            fontSize: 16, 
                            color: '#666' 
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            button: {
              text: 'Edit Profile',
              onclick: () => alert('Edit Profile clicked'),
              style: {
                backgroundColor: '#34C759',
                color: 'white',
                padding: 15,
                borderRadius: 10
              }
            }
          },
          {
            button: {
              text: 'Settings',
              onclick: () => alert('Settings clicked'),
              style: {
                backgroundColor: '#8E8E93',
                color: 'white',
                padding: 15,
                borderRadius: 10
              }
            }
          },
          {
            button: {
              text: 'Back to Home',
              onclick: () => context.setState('currentScreen', 'home'),
              style: {
                backgroundColor: '#FF3B30',
                color: 'white',
                padding: 15,
                borderRadius: 10
              }
            }
          }
        ]
      }
    }),
    
    NotificationsScreen: (props, context) => ({
      vstack: {
        style: { padding: 20, spacing: 15 },
        children: [
          {
            text: {
              text: 'Notifications',
              style: { 
                fontSize: 24, 
                fontWeight: 'bold',
                marginBottom: 20 
              }
            }
          },
          {
            scroll: {
              style: { flex: 1 },
              children: [
                {
                  card: {
                    style: { 
                      padding: 15, 
                      marginBottom: 10,
                      backgroundColor: 'white',
                      borderRadius: 10,
                      elevation: 2
                    },
                    children: [
                      {
                        text: {
                          text: 'New message from Sarah',
                          style: { fontSize: 16, fontWeight: 'medium' }
                        }
                      },
                      {
                        text: {
                          text: '2 minutes ago',
                          style: { fontSize: 14, color: '#666', marginTop: 5 }
                        }
                      }
                    ]
                  }
                },
                {
                  card: {
                    style: { 
                      padding: 15, 
                      marginBottom: 10,
                      backgroundColor: 'white',
                      borderRadius: 10,
                      elevation: 2
                    },
                    children: [
                      {
                        text: {
                          text: 'Your order has shipped',
                          style: { fontSize: 16, fontWeight: 'medium' }
                        }
                      },
                      {
                        text: {
                          text: '1 hour ago',
                          style: { fontSize: 14, color: '#666', marginTop: 5 }
                        }
                      }
                    ]
                  }
                },
                {
                  card: {
                    style: { 
                      padding: 15, 
                      marginBottom: 10,
                      backgroundColor: 'white',
                      borderRadius: 10,
                      elevation: 2
                    },
                    children: [
                      {
                        text: {
                          text: 'Weekly report available',
                          style: { fontSize: 16, fontWeight: 'medium' }
                        }
                      },
                      {
                        text: {
                          text: '3 hours ago',
                          style: { fontSize: 14, color: '#666', marginTop: 5 }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            button: {
              text: 'Back to Home',
              onclick: () => context.setState('currentScreen', 'home'),
              style: {
                backgroundColor: '#007AFF',
                color: 'white',
                padding: 15,
                borderRadius: 10
              }
            }
          }
        ]
      }
    }),
    
    App: (props, context) => {
      const currentScreen = context.getState('currentScreen');
      
      return {
        safe: {
          style: { backgroundColor: '#f5f5f5' },
          children: [
            currentScreen === 'home' ? { HomeScreen: {} } :
            currentScreen === 'profile' ? { ProfileScreen: {} } :
            currentScreen === 'notifications' ? { NotificationsScreen: {} } :
            { HomeScreen: {} }
          ]
        }
      };
    }
  },
  
  headlessComponents: {
    mobileRenderer: { 
      fn: MobileRendererService, 
      options: { 
        autoInit: true,
        enableDebugTools: true 
      } 
    }
  },
  
  layout: {
    App: {}
  }
});
```

## 🔧 Native Bridge Setup

To enable native rendering, you need to set up the native bridge for your platform:

### iOS Bridge Setup (Swift)

Create `JurisMobileRenderer.swift`:

```swift
import UIKit
import WebKit

@objc(JurisMobileRenderer)
class JurisMobileRenderer: NSObject, WKScriptMessageHandler {
    
    private var viewRegistry: [String: UIView] = [:]
    private var webView: WKWebView?
    
    func setupWebView(_ webView: WKWebView) {
        self.webView = webView
        webView.configuration.userContentController.add(self, name: "JurisMobileRenderer")
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let method = body["method"] as? String,
              let params = body["params"] as? [String: Any] else {
            return
        }
        
        DispatchQueue.main.async {
            self.handleBridgeCall(method: method, params: params)
        }
    }
    
    private func handleBridgeCall(method: String, params: [String: Any]) {
        switch method {
        case "createView":
            createView(params: params)
        case "setProperty":
            setProperty(params: params)
        case "addChildView":
            addChildView(params: params)
        case "removeView":
            removeView(params: params)
        case "addEventListener":
            addEventListener(params: params)
        case "setRootView":
            setRootView(params: params)
        default:
            print("Unknown bridge method: \(method)")
        }
    }
    
    private func createView(params: [String: Any]) {
        guard let viewId = params["viewId"] as? String,
              let viewType = params["type"] as? String else {
            return
        }
        
        let view = createNativeView(type: viewType, properties: params["properties"] as? [String: Any])
        viewRegistry[viewId] = view
        view.accessibilityIdentifier = viewId
    }
    
    private func createNativeView(type: String, properties: [String: Any]?) -> UIView {
        let view: UIView
        
        switch type {
        case "UIView":
            view = UIView()
        case "UILabel":
            let label = UILabel()
            label.numberOfLines = 0
            view = label
        case "UIButton":
            view = UIButton(type: .system)
        case "UITextField":
            view = UITextField()
        case "UIStackView":
            let stackView = UIStackView()
            stackView.axis = .vertical
            stackView.distribution = .fill
            view = stackView
        case "UIScrollView":
            view = UIScrollView()
        case "UIImageView":
            let imageView = UIImageView()
            imageView.contentMode = .scaleAspectFit
            view = imageView
        default:
            view = UIView()
        }
        
        // Apply initial properties
        if let properties = properties {
            applyProperties(to: view, properties: properties)
        }
        
        return view
    }
    
    private func setProperty(params: [String: Any]) {
        guard let viewId = params["viewId"] as? String,
              let property = params["property"] as? String,
              let view = viewRegistry[viewId] else {
            return
        }
        
        let value = params["value"]
        applyProperty(to: view, property: property, value: value)
    }
    
    private func applyProperty(to view: UIView, property: String, value: Any?) {
        switch property {
        case "backgroundColor":
            if let colorString = value as? String {
                view.backgroundColor = UIColor(hexString: colorString)
            }
        case "text":
            if let label = view as? UILabel {
                label.text = value as? String
            } else if let button = view as? UIButton {
                button.setTitle(value as? String, for: .normal)
            }
        case "textColor":
            if let colorString = value as? String, let color = UIColor(hexString: colorString) {
                if let label = view as? UILabel {
                    label.textColor = color
                } else if let button = view as? UIButton {
                    button.setTitleColor(color, for: .normal)
                }
            }
        case "font.pointSize":
            if let fontSize = value as? CGFloat {
                if let label = view as? UILabel {
                    label.font = UIFont.systemFont(ofSize: fontSize)
                }
            }
        // Add more property mappings as needed
        default:
            print("Unhandled property: \(property)")
        }
    }
    
    private func addChildView(params: [String: Any]) {
        guard let parentId = params["parentViewId"] as? String,
              let childId = params["childViewId"] as? String,
              let parentView = viewRegistry[parentId],
              let childView = viewRegistry[childId] else {
            return
        }
        
        if let stackView = parentView as? UIStackView {
            stackView.addArrangedSubview(childView)
        } else {
            parentView.addSubview(childView)
        }
    }
    
    // Add more bridge methods...
}

// Color extension
extension UIColor {
    convenience init?(hexString: String) {
        let hex = hexString.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        
        self.init(
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            alpha: Double(a) / 255
        )
    }
}
```

### Android Bridge Setup (Kotlin)

Create `JurisMobileRenderer.kt`:

```kotlin
package com.yourapp.juris

import android.content.Context
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.*
import androidx.constraintlayout.widget.ConstraintLayout
import com.google.gson.Gson
import java.util.concurrent.ConcurrentHashMap

class JurisMobileRenderer(private val context: Context, private val webView: WebView) {
    
    private val viewRegistry = ConcurrentHashMap<String, View>()
    private val gson = Gson()
    
    init {
        webView.addJavascriptInterface(this, "JurisAndroidRenderer")
    }
    
    @JavascriptInterface
    fun callNative(jsonData: String) {
        try {
            val message = gson.fromJson(jsonData, BridgeMessage::class.java)
            handleBridgeCall(message.method, message.params)
        } catch (e: Exception) {
            android.util.Log.e("JurisRenderer", "Error parsing bridge call: ${e.message}")
        }
    }
    
    private fun handleBridgeCall(method: String, params: Map<String, Any>) {
        // Ensure UI operations run on main thread
        if (android.os.Looper.myLooper() != android.os.Looper.getMainLooper()) {
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                handleBridgeCall(method, params)
            }
            return
        }
        
        when (method) {
            "createView" -> createView(params)
            "setProperty" -> setProperty(params)
            "addChildView" -> addChildView(params)
            "removeView" -> removeView(params)
            "addEventListener" -> addEventListener(params)
            "setRootView" -> setRootView(params)
            else -> android.util.Log.w("JurisRenderer", "Unknown bridge method: $method")
        }
    }
    
    private fun createView(params: Map<String, Any>) {
        val viewId = params["viewId"] as? String ?: return
        val viewType = params["type"] as? String ?: return
        val properties = params["properties"] as? Map<String, Any>
        
        val view = createNativeView(viewType, properties)
        viewRegistry[viewId] = view
        view.tag = viewId
    }
    
    private fun createNativeView(type: String, properties: Map<String, Any>?): View {
        val view = when (type) {
            "View" -> View(context)
            "TextView" -> TextView(context)
            "Button" -> Button(context)
            "EditText" -> EditText(context)
            "ImageView" -> ImageView(context)
            "ScrollView" -> ScrollView(context)
            "LinearLayout" -> LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
            }
            "FrameLayout" -> FrameLayout(context)
            "ConstraintLayout" -> ConstraintLayout(context)
            else -> View(context)
        }
        
        properties?.let { applyProperties(view, it) }
        return view
    }
    
    private fun setProperty(params: Map<String, Any>) {
        val viewId = params["viewId"] as? String ?: return
        val property = params["property"] as? String ?: return
        val value = params["value"]
        val view = viewRegistry[viewId] ?: return
        
        applyProperty(view, property, value)
    }
    
    private fun applyProperty(view: View, property: String, value: Any?) {
        when (property) {
            "background" -> {
                when (value) {
                    is String -> view.setBackgroundColor(parseColor(value))
                }
            }
            "text" -> {
                when (view) {
                    is TextView -> view.text = value as? String
                    is Button -> view.text = value as? String
                }
            }
            "textColor" -> {
                val color = parseColor(value as? String)
                when (view) {
                    is TextView -> view.setTextColor(color)
                    is Button -> view.setTextColor(color)
                }
            }
            "textSize" -> {
                val size = (value as? Number)?.toFloat() ?: 16f
                when (view) {
                    is TextView -> view.textSize = size
                    is Button -> view.textSize = size
                }
            }
            // Add more property mappings...
        }
    }
    
    private fun addChildView(params: Map<String, Any>) {
        val parentId = params["parentViewId"] as? String ?: return
        val childId = params["childViewId"] as? String ?: return
        val parentView = viewRegistry[parentId] ?: return
        val childView = viewRegistry[childId] ?: return
        
        when (parentView) {
            is ViewGroup -> {
                parentView.addView(childView)
                setupLayoutParams(childView, parentView)
            }
        }
    }
    
    private fun parseColor(colorString: String?): Int {
        return try {
            Color.parseColor(colorString ?: "#000000")
        } catch (e: IllegalArgumentException) {
            Color.BLACK
        }
    }
    
    // Add more bridge methods...
    
    data class BridgeMessage(
        val method: String,
        val params: Map<String, Any>
    )
}
```

### React Native Bridge Setup

For React Native, create native modules:

**iOS (RCTJurisMobileRenderer.m)**:
```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(JurisMobileRenderer, NSObject)

RCT_EXTERN_METHOD(callNative:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

**Android (JurisMobileRendererModule.kt)**:
```kotlin
class JurisMobileRendererModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "JurisMobileRenderer"
    }
    
    @ReactMethod
    fun callNative(params: ReadableMap, promise: Promise) {
        // Implementation
    }
}
```

## ⚡ Performance Guide

### Rendering Performance

The mobile renderer is optimized for high performance:

1. **DocumentFragment-style Batching**: Multiple view operations are batched into single native calls
2. **View Recycling**: Views are reused when possible to reduce allocation overhead
3. **Reactive Precision**: Only properties that actually changed are updated
4. **Native Threading**: UI operations are automatically dispatched to the main thread

### Performance Monitoring

```javascript
// Enable performance monitoring
const app = new Juris({
  headlessComponents: {
    mobileRenderer: {
      fn: MobileRendererService,
      options: {
        performance: {
          enableMetrics: true,
          logThreshold: 16, // Log renders taking longer than 16ms
          enableProfiling: true
        }
      }
    }
  }
});

// Get performance metrics
const metrics = app.mobileRenderer.getMetrics();
console.log('Rendering metrics:', metrics);
// Output: {
//   platform: 'ios',
//   renderMode: 'fine-grained',
//   viewCount: 45,
//   renderCount: 123,
//   averageRenderTime: 8.5,
//   totalRenderTime: 1047.5
// }
```

### Optimization Tips

1. **Use Batch Mode for Complex UIs**:
   ```javascript
   app.mobileRenderer.setRenderMode('batch');
   ```

2. **Minimize Reactive Dependencies**:
   ```javascript
   // Bad: Creates dependency on entire user object
   text: () => `Hello ${context.getState('user').name}`
   
   // Good: Creates dependency only on user.name
   text: () => `Hello ${context.getState('user.name')}`
   ```

3. **Use Keys for List Items**:
   ```javascript
   children: () => {
     const items = context.getState('items');
     return items.map(item => ({
       ListItem: { key: item.id, item }
     }));
   }
   ```

4. **Avoid Inline Style Objects**:
   ```javascript
   // Bad: Creates new object on every render
   style: { backgroundColor: 'red', padding: 10 }
   
   // Good: Static object
   const itemStyle = { backgroundColor: 'red', padding: 10 };
   style: itemStyle
   ```

## 🐛 Troubleshooting

### Common Issues

**1. "Mobile renderer not initialized"**
- Ensure the platform supports native rendering
- Check that the native bridge is properly set up
- Verify the headless service is registered with `autoInit: true`

**2. "Native bridge not available"**
- Check that the native bridge modules are properly linked
- Verify WebView message handlers are configured correctly
- Ensure the bridge is ready before making calls

**3. "View not found" errors**
- Check that view IDs are unique
- Verify views are created before being referenced
- Ensure proper cleanup when views are removed

**4. Performance issues**
- Enable performance monitoring to identify bottlenecks
- Use batch render mode for complex UIs
- Minimize reactive dependencies
- Consider view recycling for large lists

### Debug Tools

Enable debug tools to inspect the mobile renderer:

```javascript
const app = new Juris({
  headlessComponents: {
    mobileRenderer: {
      fn: MobileRendererService,
      options: {
        enableDebugTools: true
      }
    }
  }
});

// Debug tools are available at window.jurisMobileDebug
jurisMobileDebug.getMetrics();        // Performance metrics
jurisMobileDebug.logViews();          // Log all views
jurisMobileDebug.inspectView(viewId); // Inspect specific view
jurisMobileDebug.testBridge();        // Test native bridge
```

### Logging

Enable detailed logging:

```javascript
// Enable debug logging
localStorage.setItem('juris-mobile-debug', 'true');

// Enable performance logging
localStorage.setItem('juris-mobile-perf', 'true');
```

## 🤝 Contributing

We welcome contributions to improve the mobile renderer! Here's how to get started:

### Development Setup

1. Clone the repository
2. Set up development environment for your target platform
3. Run the example apps to test functionality
4. Make your changes and test thoroughly
5. Submit a pull request

### Areas for Contribution

- **New Platform Support** (Windows, macOS native apps)
- **Additional Native Components** (Camera, GPS, Sensors)
- **Performance Optimizations** (View pooling, lazy loading)
- **Developer Tools** (Visual inspector, performance profiler)
- **Documentation** (More examples, tutorials)

### Testing

Run the test suite:

```bash
# Unit tests
npm test

# Integration tests (requires native bridges)
npm run test:integration

# Performance tests
npm run test:performance
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 What's Next?

The Juris Mobile Renderer opens up exciting possibilities:

- **Desktop Apps** with Electron renderer
- **Games** with Unity/Canvas renderers  
- **AR/VR** with WebXR/native AR renderers
- **Voice Interfaces** with speech synthesis renderers
- **IoT Devices** with embedded system renderers

The same Juris application code can run anywhere with the appropriate renderer! 🚀

---

**Ready to build universal mobile apps with Juris? Start with the Quick Start guide above and see your web app transform into a native mobile experience!**
  components: {
    Counter: (props, context) => ({
      stack: { // Automatically becomes UIStackView (iOS) or LinearLayout (Android)
        children: [
          {
            text: { // Automatically becomes UILabel (iOS) or TextView (Android)
              text: () => `Count: ${context.getState('count')}`,
              style: { fontSize: 18, textAlign: 'center' }
            }
          },
          {
            button: { // Automatically becomes UIButton (iOS) or Button (Android)
              text: 'Increment',
              onclick: () => {
                const current = context.getState('count');
                context.setState('count', current + 1);
              },
              style: {
                backgroundColor: '#007AFF',
                color: 'white',
                padding: 12,
                borderRadius: 8
              }
            }
          }
        ]
      }
    })
  },
  
  // 2. Add the mobile renderer as a headless service
  headlessComponents: {
    mobileRenderer: {
      fn: MobileRendererService,
      options: {
        autoInit: true,
        enableHotReload: true,
        enableDebugTools: true,
        performance: {
          enableMetrics: true,
          logThreshold: 16
        }
      }
    }
  },
  
  layout: {
    safe: { // Automatically becomes UISafeAreaLayoutGuide (iOS) or safe area handling (Android)
      children: [
        { Counter: {} }
      ]
    }
  }
});

// 3. Render - automatically uses mobile renderer on mobile platforms
app.render('#app');
```

### Advanced Configuration

```javascript
const app = new Juris({
  headlessComponents: {
    mobileRenderer: {
      fn: MobileRendererService,
      options: {
        // Platform override (auto-detected by default)
        platform: 'ios', // 'ios', 'android', 'react-native', null (auto)
        
        // Performance settings
        renderMode: 'fine-grained', // 'fine-grained' or 'batch'
        performance: {
          enableMetrics: true,
          logThreshold: 16, // Log renders taking longer than 16ms
          batchTimeout: 0,  // Batching delay in ms
          recycleViews: true // Enable view recycling
        },
        
        // Development features
        enableHotReload: true,
        enableDebugTools: true,
        
        // Platform-specific options
        ios: {
          safeAreaHandling: 'automatic',
          statusBarStyle: 'default',
          navigationBarStyle: 'default'
        },
        android: {
          edgeToEdge: true,
          navigationBarColor: '#000000',
          statusBarColor: '#000000'
        }
      }
    }
  }
});
```

## 📱 Platform Support

### Automatic Detection

The mobile renderer automatically detects and supports:

| Platform | Detection | Native Rendering | Bridge Required |
|----------|-----------|------------------|-----------------|
| **iOS App** | React Native Platform.OS | ✅ UIKit | ✅ |
| **Android App** | React Native Platform.OS | ✅ Android Views | ✅ |
| **iOS WebView** | webkit.messageHandlers | ✅ UIKit | ✅ |
| **Android WebView** | AndroidBridge object | ✅ Android Views | ✅ |
| **Capacitor iOS** | window.Capacitor | ✅ UIKit | ✅ |
| **Capacitor Android** | window.Capacitor | ✅ Android Views | ✅ |
| **Cordova** | window.cordova | ✅ Native | ✅ |
| **Mobile Web** | User agent | ❌ Web (fallback) | ❌ |
| **Desktop Web** | User agent | ❌ Web (fallback) | ❌ |

### Platform-Specific Features

#### iOS Features
- Native UIKit components (UIButton, UILabel, UIStackView, etc.)
- iOS-specific gestures (3D Touch, Force Touch)
- Safe area handling
- Native navigation patterns
- iOS-style animations

#### Android Features  
- Native Android Views (Button, TextView, LinearLayout, etc.)
- Material Design components
- Android-specific gestures
- Edge-to-edge layouts
- Material animations

## 📚 API Reference

### MobileRendererService API

```javascript
// Access the mobile renderer service
const mobileRenderer = app.mobileRenderer;

// Platform information
mobileRenderer.getPlatform()      // 'ios', 'android', 'web', etc.
mobileRenderer.isMobile()         // true if on mobile platform
mobileRenderer.supportsNative()   // true if native rendering supported

// Renderer control
mobileRenderer.getRenderer()      // Get current renderer instance
mobileRenderer.getBridge()        // Get native bridge instance
mobileRenderer.setRenderMode(mode) // 'fine-grained' or 'batch'
mobileRenderer.forceRerender()    // Force complete re-render

// Performance monitoring
mobileRenderer.getMetrics()       // Get rendering performance metrics
mobileRenderer.enableDebugMode()  // Enable debug tools

// Native bridge communication
mobileRenderer.callNative(method, params, callback)

// View management  
mobileRenderer.findViewById(viewId)  // Find view by ID
mobileRenderer.getAllViews()         // Get all rendered views
mobileRenderer.setRootView(viewId)   // Set root view
```

### Component Element Mapping

#### Universal Elements (Work on all platforms)

```javascript
// Basic layout
{ view: {} }        // iOS: UIView, Android: View
{ stack: {} }       // iOS: UIStackView, Android: LinearLayout  
{ scroll: {} }      // iOS: UIScrollView, Android: ScrollView

// Text and input
{ text: {} }        // iOS: UILabel, Android: TextView
{ button: {} }      // iOS: UIButton, Android: Button
{ input: {} }       // iOS: UITextField, Android: EditText

// Media
{ image: {} }       // iOS: UIImageView, Android: ImageView

// Layout containers
{ safe: {} }        // iOS: UISafeAreaLayoutGuide, Android: Safe area
{ hstack: {} }      // Horizontal stack layout
{ vstack: {} }      // Vertical stack layout
```

#### iOS-Specific Elements

```javascript
{ nav: {} }         // UINavigationController
{ tab: {} }         // UITabBarController  
{ picker: {} }      // UIPickerView
{ slider: {} }      // UISlider
{ switch: {} }      // UISwitch
{ progress: {} }    // UIProgressView
{ activity: {} }    // UIActivityIndicatorView
{ web: {} }         // WKWebView
```

#### Android-Specific Elements

```javascript
{ frame: {} }       // FrameLayout
{ constraint: {} }  // ConstraintLayout
{ relative: {} }    // RelativeLayout
{ card: {} }        // CardView
{ fab: {} }         // FloatingActionButton
{ toolbar: {} }     // Toolbar
{ drawer: {} }      // DrawerLayout
{ chip: {} }        // Chip
{ checkbox: {} }    // CheckBox
{ radio: {} }       // RadioButton
{ bottom: {} }      // BottomNavigationView
```

### Style Property Mapping

```javascript
// Universal styles (work on all platforms)
{
  backgroundColor: '#FF0000',  // iOS: backgroundColor, Android: background
  color: '#000000',           // iOS: textColor, Android: textColor
  fontSize: 16,               // iOS: font.pointSize, Android: textSize
  fontWeight: 'bold',         // iOS: font.weight, Android: typeface
  padding: 10,                // iOS: layoutMargins, Android: padding
  margin: 5,                  // iOS: frame.origin, Android: layout_margin
  borderRadius: 8,            // iOS: layer.cornerRadius, Android: background.cornerRadius
  opacity: 0.8,               // iOS: alpha, Android: alpha
  hidden: false,              // iOS: isHidden, Android: visibility
  width: 100,                 // iOS: frame.size.width, Android: layout_width
  height: 50                  // iOS: frame.size.height, Android: layout_height
}
```

### Event Mapping

```javascript
// Universal events (work on all platforms)
{
  onclick: handler,       // iOS: touchUpInside, Android: click
  onlongpress: handler,   // iOS: longPress, Android: longClick
  onchange: handler,      // iOS: valueChanged, Android: textChanged
  onfocus: handler,       // iOS: editingDidBegin, Android: focusChange
  onblur: handler,        // iOS: editingDidEnd, Android: focusChange
  onscroll: handler,      // iOS: scrollViewDidScroll, Android: scroll
  
  // Touch events
  ontouchstart: handler,  // iOS: touchDown, Android: touch
  ontouchend: handler,    // iOS: touchUpInside, Android: touch
  
  // Gesture events  
  onswipe: handler,       // iOS: swipe, Android: swipe
  onpan: handler,         // iOS: pan, Android: pan
  onpinch: handler,       // iOS: pinch, Android: pinch
  onrotate: handler       // iOS: rotation, Android: rotation
}
```

## 💡 Examples

### Simple Counter App

```javascript
const CounterApp = new Juris({
  states: { count: 0 },
  
  components: {
    Counter: (props, context) => ({
      vstack: {
        style: { 
          padding: 20, 
          backgroundColor: '#f5f5f5',
          spacing: 10 
        },
        children: [
          {
            text: {
              text: () => `Count: ${context.getState('count')}`,
              style: { 
                fontSize: 24, 
                fontWeight: 'bold',
                textAlign: 'center' 
              }
            }
          },
          {
            hstack: {
              style: { spacing: 10 },
              children: [
                {
                  button: {
                    text: '-',
                    onclick: () => context.setState('count', context.getState('count') - 1),
                    style: { 
                      backgroundColor: '#ff4444',
                      color: 'white',
                      padding: 15,
                      borderRadius: 25,
                      minWidth: 50
                    }
                  }
                },
                {
                  button: {
                    text: '+',
                    onclick: () => context.setState('count', context.getState('count') + 1),
                    style: { 
                      backgroundColor: '#44ff44',
                      color: 'white',
                      padding: 15,
                      borderRadius: 25,
                      minWidth: 50
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })
  },
  
  headlessComponents: {
    mobileRenderer: { fn: MobileRendererService, options: { autoInit: true } }
  },
  
  layout: {
    safe: {
      children: [{ Counter: {} }]
    }
  }
});
```

### Todo List with Native Lists

```javascript
const TodoApp = new Juris({
  states: {
    todos: [
      { id: 1, text: 'Learn Juris', completed: false },
      { id: 2, text: 'Build mobile app', completed: false }
    ],
    newTodo: ''
  },
  
  components: {
    TodoItem: (props, context) => ({
      hstack: {
        style: { 
          padding: 15, 
          backgroundColor: 'white',
          borderRadius: 8,
          margin: 5,
          spacing: 10
        },
        children: [
          {
            checkbox: {
              checked: props.todo.completed,
              onchange: () => {
                const todos = context.getState('todos');
                const updated = todos.map(t => 
                  t.id === props.todo.id 
                    ? { ...t, completed: !t.completed }
                    : t
                );
                context.setState('todos', updated);
              }
            }
          },
          {
            text: {
              text: props.todo.text,
              style: {
                fontSize: 16,
                color: props.todo.completed ? '#888' : '#000',
                textDecoration: props.todo.completed ? 'line-through' : 'none',
                flex: 1
              }
            }
          }
        ]
      }
    }),
    
    TodoList: (props, context) => ({
      vstack: {
        style: { padding: 20 },
        children: [
          {
            text: {
              text: 'My Todos',
              style: { 
                fontSize: 28, 
                fontWeight: 'bold',
                marginBottom: 20 
              }
            }
          },
          {
            hstack: {
              style: { marginBottom: 20, spacing: 10 },
              children: [
                {
                  input: {
                    placeholder: 'Add new todo...',
                    value: () => context.getState('newTodo'),
                    oninput: (e) => context.setState('newTodo', e.target.value),
                    style: { 
                      flex: 1, 
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#ddd'
                    }
                  }
                },
                {
                  button: {
                    text: 'Add',
                    onclick: () => {
                      const newTodo = context.getState('newTodo');
                      if (newTodo.trim()) {
                        const todos = context.getState('todos');
                        const newId = Math.max(...todos.map(t => t.id)) + 1;
                        context.setState('todos', [
                          ...todos,
                          { id: newId, text: newTodo.trim(), completed: false }
                        ]);
                        context.setState('newTodo', '');
                      }
                    },
                    style: {
                      backgroundColor: '#007AFF',
                      color: 'white',
                      padding: 10,
                      borderRadius: 8
                    }
                  }
                }
              ]
            }
          },
          {
            scroll: {
              style: { flex: 1 },
              children: () => {
                const todos = context.getState('todos');
                return todos.map(todo => ({
                  TodoItem: { key: todo.id, todo }
                }));
              }
            }
          }
        ]
      }
    })
  },
  
  headlessComponents: {
    mobileRenderer: { fn: MobileRendererService, options: { autoInit: true } }
  },
  
  layout: {
    safe: {
      children: [{ TodoList: {} }]
    }
  }
});
```

### Form with Native Input Components

```javascript
const FormApp = new Juris({
  states: {
    form: {
      name: '',
      email: '',
      age: 25,
      subscribe: false,
      country: 'US'
    },
    errors: {}
  },
  
  components: {
    FormField: (props, context) => ({
      vstack: {
        style: { marginBottom: 20, spacing: 5 },
        children: [
          {
            text: {
              text: props.label,
              style: { 
                fontSize: 16, 
                fontWeight: 'medium',
                color: '#333' 
              }
            }
          },
          props.type === 'slider' ? {
            slider: {
              value: () => context.getState(`form.${props.field}`),
              minimum: props.min || 0,
              maximum: props.max || 100,
              onchange: (value) => {
                context.setState(`form.${props.field}`, value);
              },
              style: { height: 30 }
            }
          } : props.type === 'switch' ? {
            switch: {
              checked: () => context.getState(`form.${props.field}`),
              onchange: (checked) => {
                context.setState(`form.${props.field}`, checked);
              }
            }
          } : {
            input: {
              value: () => context.getState(`form.${props.field}`),
              placeholder: props.placeholder,
              keyboardType: props.keyboardType || 'default',
              oninput: (e) => {
                context.setState(`form.${props.field}`, e.target.value);
                // Clear error when user starts typing
                const errors = context.getState('errors');
                if (errors[props.field]) {
                  context.setState('errors', { ...errors, [props.field]: null });
                }
              },
              style: {
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: () => {
                  const errors = context.getState('errors');
                  return errors[props.field] ? '#ff4444' : '#ddd';
                },
                backgroundColor: 'white'
              }
            }
          },
          // Error message
          () => {
            const errors = context.getState('errors');
            const error = errors[props.field];
            return error ? {
              text: {
                text: error,
                style: { 
                  fontSize: 14, 
                  color: '#ff4444',
                  marginTop: 5 
                }
              }
            } : null;
          }
        ]
      }
    }),
    
    ContactForm: (props, context) => ({
      scroll: {
        style: { flex: 1 },
        children: [
          {
            vstack: {
              style: { padding: 20, spacing: 20 },
              children: [
                {
                  text: {
                    text: 'Contact Information',
                    style: { 
                      fontSize: 24, 
                      fontWeight: 'bold',
                      textAlign: 'center',
                      marginBottom: 20 
                    }
                  }
                },
                {
                  FormField: {
                    label: 'Full Name',
                    field: 'name',
                    placeholder: 'Enter your full name'
                  }
                },
                {
                  FormField: {
                    label: 'Email',
                    field: 'email',
                    placeholder: 'Enter your email',
                    keyboardType: 'email'
                  }
                },
                {
                  FormField: {
                    label: () => {
                      const age = context.getState('form.age');
                      return `Age: ${age}`;
                    },
                    field: 'age',
                    type: 'slider',
                    min: 13,
                    max: 100
                  }
                },
                {
                  hstack: {
                    style: { alignItems: 'center', spacing: 10 },
                    children: [
                      {
                        FormField: {
                          label: '',
                          field: 'subscribe',
                          type: 'switch'
                        }
                      },
                      {
                        text: {
                          text: 'Subscribe to newsletter',
                          style: { fontSize: 16 }
                        }
                      }
                    ]
                  }
                },
                {
                  button: {
                    text: 'Submit',
                    onclick: () => {
                      const form = context.getState('form');
                      const errors = {};
                      
                      // Validation
                      if (!form.name.trim()) errors.name = 'Name is required';
                      if (!form.email.trim()) errors.email = 'Email is required';
                      else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email';
                      
                      if (Object.keys(errors).length > 0) {
                        context.setState('errors', errors);
                      } else {
                        // Submit form
                        console.log('Form submitted:', form);
                        alert('Form submitted successfully!');
                      }
                    },
                    style: {
                      backgroundColor: '#007AFF',
                      color: 'white',
                      padding: 15,
                      borderRadius: 10,
                      fontSize: 18,
                      fontWeight: 'bold'
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })
  },
  