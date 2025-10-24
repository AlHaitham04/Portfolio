<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

$host = 'sql303.infinityfree.com';
$db = 'if0_40248807_portfolio';
$user = 'if0_40248807';
$pass = 'QrBImVKhu3bUDt';

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset('utf8mb4');

$method = $_SERVER['REQUEST_METHOD'];

$apiKey = '2cf30ea2bc5543928e6d8cce44572862';
$baseUrl = 'https://api.twelvedata.com/price';


if ($method === 'GET' && isset($_GET['price'])) {
    $symbol = strtoupper(trim($_GET['price']));
    if (!$symbol) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing stock symbol']);
        exit;
    }

    $url = "$baseUrl?symbol=$symbol&apikey=$apiKey";
    $response = @file_get_contents($url);

    if ($response === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch live price']);
        exit;
    }

    $data = json_decode($response, true);
    echo json_encode([
        'symbol' => $symbol,
        'price' => isset($data['price']) ? floatval($data['price']) : null
    ]);
    exit;
}


if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $ticker = strtoupper(trim($data['ticker']));
    $shares = intval($data['shares']);
    $price = floatval($data['price']);
    $type = $data['type']; 
    $user_id = intval($data['user_id']); 

    if (!$user_id || !$ticker || !$shares || !$price || !in_array($type, ['buy', 'sell'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO transactions (ticker, shares, price, type, user_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('sidsi', $ticker, $shares, $price, $type, $user_id);
    $stmt->execute();

    echo json_encode(['success' => true]);
    exit;
}


if ($method === 'GET' && isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);

    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing or invalid user_id']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();

    $result = $stmt->get_result();
    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode($rows);
    exit;
}
?>
