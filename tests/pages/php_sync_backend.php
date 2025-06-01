<?php
// config.php - Database configuration
class Config {
    const DB_HOST = 'localhost';
    const DB_NAME = 'juris_sync';
    const DB_USER = 'your_username';
    const DB_PASS = 'your_password';
    
    const ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:8000',
        'https://your-domain.com'
    ];
}

// database.php - Database connection and setup
class Database {
    private $pdo;
    
    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=" . Config::DB_HOST . ";dbname=" . Config::DB_NAME,
                Config::DB_USER,
                Config::DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    // Create tables if they don't exist
    public function createTables() {
        $sql = "CREATE TABLE IF NOT EXISTS sync_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL UNIQUE,
            data TEXT NOT NULL,
            timestamp BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_session_id (session_id),
            INDEX idx_timestamp (timestamp)
        )";
        
        $this->pdo->exec($sql);
    }
}

// sync_service.php - Main sync service
class SyncService {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
        $this->db->createTables();
    }
    
    // Save data to database
    public function saveData($sessionId, $data, $timestamp) {
        $pdo = $this->db->getConnection();
        
        $sql = "INSERT INTO sync_data (session_id, data, timestamp) 
                VALUES (:session_id, :data, :timestamp)
                ON DUPLICATE KEY UPDATE 
                data = VALUES(data), 
                timestamp = VALUES(timestamp)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':session_id' => $sessionId,
            ':data' => json_encode($data),
            ':timestamp' => $timestamp
        ]);
        
        return $pdo->lastInsertId() ?: $this->getDataBySession($sessionId)['id'];
    }
    
    // Get data by session ID
    public function getDataBySession($sessionId) {
        $pdo = $this->db->getConnection();
        
        $sql = "SELECT * FROM sync_data WHERE session_id = :session_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':session_id' => $sessionId]);
        
        $result = $stmt->fetch();
        
        if ($result) {
            $result['data'] = json_decode($result['data'], true);
        }
        
        return $result;
    }
    
    // Get all sessions (for admin purposes)
    public function getAllSessions() {
        $pdo = $this->db->getConnection();
        
        $sql = "SELECT session_id, timestamp, created_at, updated_at FROM sync_data ORDER BY updated_at DESC";
        $stmt = $pdo->query($sql);
        
        return $stmt->fetchAll();
    }
    
    // Clean up old sessions
    public function cleanupOldSessions($olderThanDays = 30) {
        $pdo = $this->db->getConnection();
        
        $sql = "DELETE FROM sync_data WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':days' => $olderThanDays]);
        
        return $stmt->rowCount();
    }
}

// utils.php - Utility functions
class Utils {
    // Set CORS headers
    public static function setCorsHeaders() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, Config::ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    // Send JSON response
    public static function sendJsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit();
    }
    
    // Get JSON input
    public static function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            self::sendJsonResponse([
                'success' => false,
                'error' => 'Invalid JSON input'
            ], 400);
        }
        
        return $data;
    }
    
    // Validate session ID
    public static function validateSessionId($sessionId) {
        if (empty($sessionId) || !is_string($sessionId)) {
            return false;
        }
        
        // Basic validation - adjust as needed
        return preg_match('/^[a-zA-Z0-9_-]+$/', $sessionId) && strlen($sessionId) <= 255;
    }
    
    // Log request for debugging
    public static function logRequest($data = null) {
        $log = [
            'timestamp' => date('Y-m-d H:i:s'),
            'method' => $_SERVER['REQUEST_METHOD'],
            'uri' => $_SERVER['REQUEST_URI'],
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        if ($data) {
            $log['data'] = $data;
        }
        
        // Log to file (adjust path as needed)
        file_put_contents('sync.log', json_encode($log) . "\n", FILE_APPEND);
    }
}

// push.php - Handle data push from client
<?php
require_once 'config.php';
require_once 'database.php';
require_once 'sync_service.php';
require_once 'utils.php';

Utils::setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Utils::sendJsonResponse([
        'success' => false,
        'error' => 'Method not allowed'
    ], 405);
}

try {
    $input = Utils::getJsonInput();
    Utils::logRequest($input);
    
    $sessionId = $input['sessionId'] ?? '';
    $data = $input['data'] ?? null;
    
    if (!Utils::validateSessionId($sessionId)) {
        Utils::sendJsonResponse([
            'success' => false,
            'error' => 'Invalid session ID'
        ], 400);
    }
    
    if (!$data || !isset($data['timestamp'])) {
        Utils::sendJsonResponse([
            'success' => false,
            'error' => 'Invalid data format'
        ], 400);
    }
    
    $syncService = new SyncService();
    $id = $syncService->saveData($sessionId, $data, $data['timestamp']);
    
    Utils::sendJsonResponse([
        'success' => true,
        'id' => $id,
        'timestamp' => $data['timestamp'],
        'message' => 'Data saved successfully'
    ]);
    
} catch (Exception $e) {
    Utils::sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 500);
}
?>

// pull.php - Handle data pull to client
<?php
require_once 'config.php';
require_once 'database.php';
require_once 'sync_service.php';
require_once 'utils.php';

Utils::setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Utils::sendJsonResponse([
        'success' => false,
        'error' => 'Method not allowed'
    ], 405);
}

try {
    $sessionId = $_GET['sessionId'] ?? '';
    
    if (!Utils::validateSessionId($sessionId)) {
        Utils::sendJsonResponse([
            'success' => false,
            'error' => 'Invalid session ID'
        ], 400);
    }
    
    $syncService = new SyncService();
    $result = $syncService->getDataBySession($sessionId);
    
    if ($result) {
        Utils::sendJsonResponse([
            'success' => true,
            'data' => $result['data'],
            'timestamp' => $result['timestamp'],
            'lastUpdated' => $result['updated_at']
        ]);
    } else {
        Utils::sendJsonResponse([
            'success' => true,
            'data' => null,
            'message' => 'No data found for session'
        ]);
    }
    
} catch (Exception $e) {
    Utils::sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 500);
}
?>

// sync.php - Bidirectional sync endpoint
<?php
require_once 'config.php';
require_once 'database.php';
require_once 'sync_service.php';
require_once 'utils.php';

Utils::setCorsHeaders();

try {
    $syncService = new SyncService();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Push data and return latest
        $input = Utils::getJsonInput();
        $sessionId = $input['sessionId'] ?? '';
        $clientData = $input['data'] ?? null;
        
        if (!Utils::validateSessionId($sessionId)) {
            Utils::sendJsonResponse([
                'success' => false,
                'error' => 'Invalid session ID'
            ], 400);
        }
        
        // Get current server data
        $serverData = $syncService->getDataBySession($sessionId);
        
        // If client data is newer or server has no data, save client data
        if (!$serverData || $clientData['timestamp'] > $serverData['timestamp']) {
            $syncService->saveData($sessionId, $clientData, $clientData['timestamp']);
            $responseData = $clientData;
        } else {
            // Server data is newer, return it
            $responseData = $serverData['data'];
        }
        
        Utils::sendJsonResponse([
            'success' => true,
            'data' => $responseData,
            'action' => 'sync_complete'
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Just return latest data
        $sessionId = $_GET['sessionId'] ?? '';
        
        if (!Utils::validateSessionId($sessionId)) {
            Utils::sendJsonResponse([
                'success' => false,
                'error' => 'Invalid session ID'
            ], 400);
        }
        
        $result = $syncService->getDataBySession($sessionId);
        
        Utils::sendJsonResponse([
            'success' => true,
            'data' => $result ? $result['data'] : null,
            'timestamp' => $result ? $result['timestamp'] : null
        ]);
        
    } else {
        Utils::sendJsonResponse([
            'success' => false,
            'error' => 'Method not allowed'
        ], 405);
    }
    
} catch (Exception $e) {
    Utils::sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ], 500);
}
?>

// admin.php - Admin interface for managing sync data
<?php
require_once 'config.php';
require_once 'database.php';
require_once 'sync_service.php';
require_once 'utils.php';

Utils::setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'list';
    $syncService = new SyncService();
    
    switch ($action) {
        case 'list':
            $sessions = $syncService->getAllSessions();
            Utils::sendJsonResponse([
                'success' => true,
                'sessions' => $sessions,
                'count' => count($sessions)
            ]);
            break;
            
        case 'cleanup':
            $days = $_GET['days'] ?? 30;
            $deleted = $syncService->cleanupOldSessions($days);
            Utils::sendJsonResponse([
                'success' => true,
                'deleted' => $deleted,
                'message' => "Cleaned up $deleted old sessions"
            ]);
            break;
            
        case 'session':
            $sessionId = $_GET['sessionId'] ?? '';
            if (!Utils::validateSessionId($sessionId)) {
                Utils::sendJsonResponse([
                    'success' => false,
                    'error' => 'Invalid session ID'
                ], 400);
            }
            
            $data = $syncService->getDataBySession($sessionId);
            Utils::sendJsonResponse([
                'success' => true,
                'session' => $data
            ]);
            break;
            
        default:
            Utils::sendJsonResponse([
                'success' => false,
                'error' => 'Unknown action'
            ], 400);
    }
} else {
    Utils::sendJsonResponse([
        'success' => false,
        'error' => 'Method not allowed'
    ], 405);
}
?>

// install.php - Database setup script
<?php
require_once 'config.php';
require_once 'database.php';

echo "<h1>Juris Sync Database Setup</h1>\n";

try {
    $db = new Database();
    $db->createTables();
    echo "<p style='color: green;'>✅ Database tables created successfully!</p>\n";
    echo "<p>You can now use the sync endpoints:</p>\n";
    echo "<ul>\n";
    echo "<li><code>/api/push.php</code> - Push data from client</li>\n";
    echo "<li><code>/api/pull.php</code> - Pull data to client</li>\n";
    echo "<li><code>/api/sync.php</code> - Bidirectional sync</li>\n";
    echo "<li><code>/api/admin.php</code> - Admin interface</li>\n";
    echo "</ul>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Setup failed: " . $e->getMessage() . "</p>\n";
    echo "<p>Please check your database configuration in config.php</p>\n";
}
?>

// .htaccess - Apache configuration (optional)
RewriteEngine On

# Enable CORS for all requests
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Handle preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Pretty URLs (optional)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1.php [L,QSA]