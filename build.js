// build.js - Build both browser and server packages (Windows compatible)
const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`📋 Copied: ${src} → ${dest}`);
    } else {
        console.log(`⚠️  File not found: ${src} (skipping)`);
    }
}

function cleanRelease() {
    if (fs.existsSync('release')) {
        fs.rmSync('release', { recursive: true, force: true });
        console.log('🧹 Cleaned release directory');
    }
}

function buildBrowserPackage() {
    console.log('🌐 Building browser package (juris)...');
    
    // Read source
    const source = fs.readFileSync('src/juris.js', 'utf8');
    
    // Browser version - script tag optimized
    const browserVersion = source + `
// Browser-only exports (script tag compatible)
if (typeof window !== 'undefined') {
    window.Juris = Juris;
    window.jurisVersion = jurisVersion;
    window.jurisLinesOfCode = jurisLinesOfCode;
    window.jurisMinifiedSize = jurisMinifiedSize;
    Object.freeze(Juris);
    Object.freeze(Juris.prototype);
}

// Basic CommonJS for compatibility
if (typeof module !== 'undefined' && module.exports) {           
    module.exports.Juris = Juris;
    module.exports.default = Juris;
    module.exports.jurisVersion = jurisVersion;
    module.exports.jurisLinesOfCode = jurisLinesOfCode;
    module.exports.jurisMinifiedSize = jurisMinifiedSize;
}
`;

    // Ensure directory exists
    ensureDir('release/browser');
    
    // Write browser package
    fs.writeFileSync('release/browser/juris.js', browserVersion);
    
    // Copy supporting files
    copyFile('docs/browser-README.md', 'release/browser/README.md');
    copyFile('LICENSE', 'release/browser/LICENSE');
    
    console.log('✅ Browser package built at: release/browser/juris.js');
}

function buildServerPackage() {
    console.log('🖥️  Building server package (@jurisjs/juris)...');
    
    // Read source
    const source = fs.readFileSync('src/juris.js', 'utf8');
    
    // Server ESM version
    const serverESMVersion = source + `
// Server-side globals
if (typeof globalThis !== 'undefined') {
    globalThis.Juris = Juris;
    globalThis.jurisVersion = jurisVersion;
    globalThis.jurisLinesOfCode = jurisLinesOfCode;
    globalThis.jurisMinifiedSize = jurisMinifiedSize;
}

// ES Module exports
export default Juris;
export { Juris, jurisVersion, jurisLinesOfCode, jurisMinifiedSize };
`;

    // Server CJS version
    const serverCJSVersion = source + `
// Server-side globals
if (typeof globalThis !== 'undefined') {
    globalThis.Juris = Juris;
    globalThis.jurisVersion = jurisVersion;
    globalThis.jurisLinesOfCode = jurisLinesOfCode;
    globalThis.jurisMinifiedSize = jurisMinifiedSize;
}

// CommonJS exports
module.exports.Juris = Juris;
module.exports.default = Juris;
module.exports.jurisVersion = jurisVersion;
module.exports.jurisLinesOfCode = jurisLinesOfCode;
module.exports.jurisMinifiedSize = jurisMinifiedSize;
`;

    // Ensure directory exists
    ensureDir('release/server');
    
    // Write server packages
    fs.writeFileSync('release/server/juris.mjs', serverESMVersion);
    fs.writeFileSync('release/server/juris.cjs', serverCJSVersion);
    
    // Copy supporting files
    copyFile('docs/server-README.md', 'release/server/README.md');
    copyFile('LICENSE', 'release/server/LICENSE');
    
    console.log('✅ Server ESM built at: release/server/juris.mjs');
    console.log('✅ Server CJS built at: release/server/juris.cjs');
}

function createPackageJsonFiles() {
    console.log('📦 Creating package.json files...');
    
    // Browser package.json
    const browserPackage = {
        "name": "juris",
        "version": "0.9.2",
        "description": "JavaScript Unified Reactive Interface Solution - Browser-optimized version for script tags and CDN usage",
        "main": "juris.js",
        "type": "commonjs",
        "browser": "juris.js",
        "unpkg": "juris.js",
        "jsdelivr": "juris.js",
        "files": [
            "juris.js",
            "juris.mini.js",
            "juris-enhance.js",
            "juris-headless.js",
            "juris-template.js",
            "juris-cssextractor.js",
            "juris-webcomponent.js",
            "headless/juris-fluentstate.js",
            "headless/juris-router.js",
            "README.md",
            "LICENSE"
        ],
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "keywords": [
            "reactive",
            "framework",
            "javascript",
            "browser",
            "web-development",
            "script-tag",
            "cdn",
            "no-build"
        ],
        "author": "Resti Guay <resti.guay@gmail.com>",
        "license": "MIT",
        "repository": {
            "type": "git",
            "url": "git+https://github.com/jurisjs/juris.git"
        },
        "bugs": {
            "url": "https://github.com/jurisjs/juris/issues"
        },
        "homepage": "https://jurisjs.com",
        "engines": {
            "node": ">=14.0.0"
        }
    };
    
    // Server package.json
    const serverPackage = {
        "name": "@jurisjs/juris",
        "version": "0.9.2",
        "description": "JavaScript Unified Reactive Interface Solution - Server-side version with full ES Module and CommonJS support for Node.js, Bun, and Deno",
        "main": "juris.cjs",
        "module": "juris.mjs",
        "type": "module",
        "publishConfig": {
            "access": "public"
        },
        "exports": {
            ".": {
                "import": "./juris.mjs",
                "require": "./juris.cjs",
                "default": "./juris.mjs"
            },
            "./package.json": "./package.json"
        },
        "files": [
            "juris.mjs",
            "juris.cjs",
            "README.md",
            "LICENSE"
        ],
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "keywords": [
            "reactive",
            "framework",
            "javascript",
            "nodejs",
            "bun",
            "deno",
            "server-side",
            "esm",
            "commonjs"
        ],
        "author": "Resti Guay <resti.guay@gmail.com>",
        "license": "MIT",
        "repository": {
            "type": "git",
            "url": "git+https://github.com/jurisjs/juris.git",
            "directory": "release/server"
        },
        "bugs": {
            "url": "https://github.com/jurisjs/juris/issues"
        },
        "homepage": "https://jurisjs.com",
        "engines": {
            "node": ">=14.0.0"
        }
    };
    
    // Write package.json files
    fs.writeFileSync('release/browser/package.json', JSON.stringify(browserPackage, null, 2));
    fs.writeFileSync('release/server/package.json', JSON.stringify(serverPackage, null, 2));
    
    console.log('✅ Package.json files created');
}

function buildAll() {
    console.log('🚀 Starting Juris dual package build...\n');
    
    // Clean first
    cleanRelease();
    
    // Check if source exists
    if (!fs.existsSync('src/juris.js')) {
        console.error('❌ Source file src/juris.js not found!');
        console.log('💡 Create src/juris.js with your framework code');
        process.exit(1);
    }
    
    // Check if README files exist
    if (!fs.existsSync('docs/browser-README.md')) {
        console.error('❌ docs/browser-README.md not found!');
        console.log('💡 Create docs/browser-README.md for browser package');
        process.exit(1);
    }
    
    if (!fs.existsSync('docs/server-README.md')) {
        console.error('❌ docs/server-README.md not found!');
        console.log('💡 Create docs/server-README.md for server package');
        process.exit(1);
    }
    
    // Build packages
    buildBrowserPackage();
    buildServerPackage();
    createPackageJsonFiles();
    
    console.log('\n🎉 Build complete!');
    console.log('\n📁 Release structure:');
    console.log('release\\');
    console.log('├── browser\\     (juris package)');
    console.log('│   ├── juris.js');
    console.log('│   ├── package.json');
    console.log('│   ├── README.md        ← docs\\browser-README.md');
    console.log('│   └── LICENSE');
    console.log('└── server\\      (@jurisjs/juris package)');
    console.log('    ├── juris.mjs');
    console.log('    ├── juris.cjs');
    console.log('    ├── package.json');
    console.log('    ├── README.md        ← docs\\server-README.md');
    console.log('    └── LICENSE');
    
    console.log('\n📦 Ready to publish:');
    console.log('cd release\\browser && npm publish');
    console.log('cd release\\server && npm publish');
}

// Run the build
buildAll();