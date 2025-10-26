<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);


$host = 'sql12.freesqldatabase.com';
$db = 'sql12804643';
$user = 'sql12804643';
$pass = '54NSMjwlGs';

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset('utf8mb4');

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $conn->connect_error
    ]);
    exit;
}

$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON, true);

// Validate JSON
if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

$action = $data['action'] ?? '';
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

// Check required fields
if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

if ($action === 'signup') {
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $hashedPassword);

    if ($stmt->execute()) {
        $newUserId = $stmt->insert_id;
        echo json_encode(['success' => true, 'message' => 'User registered successfully', 'user_id' => $newUserId]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }

} elseif ($action === 'signin') {
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $stmt->bind_result($userId, $hashedPasswordFromDB);
    $stmt->fetch();

    if (password_verify($password, $hashedPasswordFromDB)) {
        echo json_encode(['success' => true, 'message' => 'Login successful', 'user_id' => $userId]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }


} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>
