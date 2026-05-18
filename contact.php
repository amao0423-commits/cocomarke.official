<?php
mb_internal_encoding('UTF-8');
mb_language('Japanese');

// CORSヘッダー（本番ドメインに合わせて変更してください）
$allowed_origins = ['https://www.cocomake.com', 'https://cocomake.com', 'https://2026050819310611258312.onamaeweb.jp'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false]);
    exit;
}

function sanitize($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

$to          = 'info@cocomake-guide.com';
$inquiryType = sanitize($_POST['inquiryType'] ?? '');
$company     = sanitize($_POST['company']     ?? '');
$name        = sanitize($_POST['name']        ?? '');
$furigana    = sanitize($_POST['furigana']    ?? '');
$url         = sanitize($_POST['url']         ?? '');
$email       = sanitize($_POST['email']       ?? '');
$phone       = sanitize($_POST['phone']       ?? '');
$referral    = sanitize($_POST['referral']    ?? '');
$message     = sanitize($_POST['message']     ?? '');

// 必須チェック
if (empty($name) || empty($furigana) || empty($email) || empty($phone) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'required']);
    exit;
}

// メールアドレス形式チェック
if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid_email']);
    exit;
}

// ---- 管理者宛メール ----
$subject = '<HPお問い合わせ>';
$body  = "COCOマーケ お問い合わせがありました。\n\n";
$body .= "■ お問い合わせ区分：{$inquiryType}\n";
$body .= "■ 会社・組織名　　：{$company}\n";
$body .= "■ 担当者名　　　　：{$name}\n";
$body .= "■ フリガナ　　　　：{$furigana}\n";
$body .= "■ ホームページURL ：{$url}\n";
$body .= "■ メールアドレス　：{$email}\n";
$body .= "■ お電話番号　　　：{$phone}\n";
$body .= "■ 弊社を知ったきっかけ：{$referral}\n\n";
$body .= "■ お問い合わせ内容：\n{$message}\n";

$headers  = "From: noreply@cocomarke.com\r\n";
$headers .= "Reply-To: {$email}\r\n";

$result = mb_send_mail($to, $subject, $body, $headers);

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'mail_failed']);
    exit;
}

// ---- 自動返信メール ----
$auto_subject = '【COCOマーケ】お問い合わせを受け付けました';
$auto_body  = "{$name} 様\n\n";
$auto_body .= "お問い合わせいただきありがとうございます。\n";
$auto_body .= "以下の内容でお問い合わせを受け付けました。\n\n";
$auto_body .= "■ お問い合わせ区分：{$inquiryType}\n";
$auto_body .= "■ 担当者名：{$name}\n\n";
$auto_body .= "■ お問い合わせ内容：\n{$message}\n\n";
$auto_body .= "担当者より2〜3営業日以内にご連絡いたします。\n";
$auto_body .= "しばらくお待ちくださいませ。\n\n";
$auto_body .= "──────────────────────────\n";
$auto_body .= "COCOマーケ\n";
$auto_body .= "https://www.cocomake.com\n";
$auto_body .= "info@cocomake-guide.com\n";
$auto_body .= "──────────────────────────\n";

$auto_headers = "From: info@cocomake-guide.com\r\n";
mb_send_mail($email, $auto_subject, $auto_body, $auto_headers);

echo json_encode(['success' => true]);
