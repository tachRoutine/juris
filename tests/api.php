<?php
/**
 * Simple PHP API Backend for Juris APIClient Demo
 * Handles CRUD operations and demonstrates cancellation scenarios
 */

// Enable CORS for frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple in-memory data store (in real app, use database)
class DataStore {
    private static $users = [
        ['id' => 1, 'name' => 'Alice Johnson', 'email' => 'alice@example.com', 'department' => 'Engineering'],
        ['id' => 2, 'name' => 'Bob Smith', 'email' => 'bob@example.com', 'department' => 'Marketing'],
        ['id' => 3, 'name' => 'Carol Davis', 'email' => 'carol@example.com', 'department' => 'Design'],
        ['id' => 4, 'name' => 'David Wilson', 'email' => 'david@example.com', 'department' => 'Engineering'],
        ['id' => 5, 'name' => 'Eve Brown', 'email' => 'eve@example.com', 'department' => 'Sales'],
        ['id' => 6, 'name' => 'Frank Miller', 'email' => 'frank@example.com', 'department' => 'Engineering'],
        ['id' => 7, 'name' => 'Grace Lee', 'email' => 'grace@example.com', 'department' => 'HR'],
        ['id' => 8, 'name' => 'Henry Taylor', 'email' => 'henry@example.com', 'department' => 'Marketing']
    ];
    
    private static $products = [
        ['id' => 1, 'name' => 'Laptop Pro', 'description' => 'High-performance laptop', 'price' => 1299],
        ['id' => 2, 'name' => 'Wireless Mouse', 'description' => 'Ergonomic wireless mouse', 'price' => 49],
        ['id' => 3, 'name' => 'Mechanical Keyboard', 'description' => 'RGB mechanical keyboard', 'price' => 129],
        ['id' => 4, 'name' => 'Monitor 4K', 'description' => '27-inch 4K display', 'price' => 399],
        ['id' => 5, 'name' => 'Webcam HD', 'description' => '1080p webcam', 'price' => 89]
    ];
    
    private static $orders = [
        ['id' => 1, 'name' => 'Order #1001', 'status' => 'Shipped', 'total' => 1348],
        ['id' => 2, 'name' => 'Order #1002', 'status' => 'Processing', 'total' => 178],
        ['id' => 3, 'name' => 'Order #1003', 'status' => 'Delivered', 'total' => 528],
        ['id' => 4, 'name' => 'Order #1004', 'status' => 'Pending', 'total' => 89]
    ];
    
    private static $nextUserId = 9;
    
    public static function getUsers() {
        return self::$users;
    }
    
    public static function getProducts() {
        return self::$products;
    }
    
    public static function getOrders() {
        return self::$orders;
    }
    
    public static function searchUsers($query) {
        $query = strtolower($query);
        return array_filter(self::$users, function($user) use ($query) {
            return strpos(strtolower($user['name']), $query) !== false ||
                   strpos(strtolower($user['email']), $query) !== false ||
                   strpos(strtolower($user['department']), $query) !== false;
        });
    }
    
    public static function createUser($name, $email, $department) {
        $newUser = [
            'id' => self::$nextUserId++,
            'name' => $name,
            'email' => $email,
            'department' => $department
        ];
        self::$users[] = $newUser;
        return $newUser;
    }
    
    public static function deleteUser($id) {
        $index = array_search($id, array_column(self::$users, 'id'));
        if ($index !== false) {
            $deletedUser = self::$users[$index];
            array_splice(self::$users, $index, 1);
            return $deletedUser;
        }
        return null;
    }
    
    public static function getUserById($id) {
        $index = array_search($id, array_column(self::$users, 'id'));
        return $index !== false ? self::$users[$index] : null;
    }
}

// Utility functions
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError($message, $status = 400) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit();
}

function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

function simulateDelay($seconds = 1) {
    sleep($seconds);
}

// Get request parameters
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Route handling
try {
    switch ($action) {
        case 'users':
            if ($method === 'GET') {
                // Optional delay for testing
                if (isset($_GET['delay'])) {
                    simulateDelay((int)$_GET['delay']);
                }
                sendResponse(DataStore::getUsers());
            }
            break;
            
        case 'products':
            if ($method === 'GET') {
                if (isset($_GET['delay'])) {
                    simulateDelay((int)$_GET['delay']);
                }
                sendResponse(DataStore::getProducts());
            }
            break;
            
        case 'orders':
            if ($method === 'GET') {
                if (isset($_GET['delay'])) {
                    simulateDelay((int)$_GET['delay']);
                }
                sendResponse(DataStore::getOrders());
            }
            break;
            
        case 'search':
            if ($method === 'GET') {
                $query = $_GET['q'] ?? '';
                if (empty($query)) {
                    sendResponse([]);
                }
                
                // Add small delay to simulate real search
                usleep(500000); // 0.5 seconds
                
                $results = DataStore::searchUsers($query);
                sendResponse(array_values($results));
            }
            break;
            
        case 'create':
            if ($method === 'POST') {
                $input = getJsonInput();
                
                if (!$input || !isset($input['name']) || !isset($input['email'])) {
                    sendError('Name and email are required', 400);
                }
                
                $name = trim($input['name']);
                $email = trim($input['email']);
                $department = trim($input['department'] ?? 'General');
                
                if (empty($name) || empty($email)) {
                    sendError('Name and email cannot be empty', 400);
                }
                
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    sendError('Invalid email format', 400);
                }
                
                // Simulate creation delay
                simulateDelay(1);
                
                $newUser = DataStore::createUser($name, $email, $department);
                sendResponse($newUser, 201);
            }
            break;
            
        case 'delete':
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                
                if ($id <= 0) {
                    sendError('Invalid user ID', 400);
                }
                
                // Simulate deletion delay
                simulateDelay(1);
                
                $deletedUser = DataStore::deleteUser($id);
                if ($deletedUser) {
                    sendResponse(['message' => 'User deleted successfully', 'user' => $deletedUser]);
                } else {
                    sendError('User not found', 404);
                }
            }
            break;
            
        case 'user':
            if ($method === 'GET') {
                $id = (int)($_GET['id'] ?? 0);
                
                if ($id <= 0) {
                    sendError('Invalid user ID', 400);
                }
                
                $user = DataStore::getUserById($id);
                if ($user) {
                    sendResponse($user);
                } else {
                    sendError('User not found', 404);
                }
            }
            break;
            
        case 'slow':
            // Endpoint for testing cancellation
            if ($method === 'GET') {
                $delay = (int)($_GET['delay'] ?? 3);
                simulateDelay($delay);
                sendResponse([
                    'message' => "Slow request completed after {$delay} seconds",
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            break;
            
        case 'ping':
            // Health check endpoint
            sendResponse([
                'status' => 'ok',
                'timestamp' => date('Y-m-d H:i:s'),
                'server' => $_SERVER['SERVER_NAME'] ?? 'localhost'
            ]);
            break;
            
        case 'status':
            // Server status endpoint
            sendResponse([
                'users_count' => count(DataStore::getUsers()),
                'products_count' => count(DataStore::getProducts()),
                'orders_count' => count(DataStore::getOrders()),
                'server_time' => date('Y-m-d H:i:s'),
                'memory_usage' => memory_get_usage(true)
            ]);
            break;
            
        default:
            sendError('Unknown action or endpoint not found', 404);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendError('Internal server error', 500);
}

// If we get here, something went wrong
sendError('Invalid request', 400);
?>