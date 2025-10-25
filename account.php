<?php
header("Access-Control-Allow-Origin: https://alhaitham04.github.io/Portfolio");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight OPTIONS request from browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);


// DB credentials
$host = 'sql303.infinityfree.com';
$db = 'if0_40248807_portfolio';
$user = 'if0_40248807';
$pass = 'QrBImVKhu3bUDt';

// Create DB connection
$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset('utf8mb4');

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Get input JSON
$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON, true);

// Validate JSON
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Extract and sanitize inputs
$action = $data['action'] ?? '';
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Check required fields
if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

// --- SIGN UP ---
if ($action === 'signup') {
    // Check if email is already registered
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $hashedPassword);

    if ($stmt->execute()) {
        $newUserId = $stmt->insert_id;
        echo json_encode(['success' => true, 'message' => 'User registered successfully', 'user_id' => $newUserId]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }

// --- SIGN IN ---
} elseif ($action === 'signin') {
    // Look up user by email
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    // Get stored password and ID
    $stmt->bind_result($userId, $hashedPasswordFromDB);
    $stmt->fetch();

    // Verify password
    if (password_verify($password, $hashedPasswordFromDB)) {
        echo json_encode(['success' => true, 'message' => 'Login successful', 'user_id' => $userId]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }

// --- INVALID ACTION ---
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

// Close DB connection
$conn->close();
?>
