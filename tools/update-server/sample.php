<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'product' => 'MultimediaPro',
  'version' => '1.0.0',
  'download_url' => '',
  'notes' => 'Initial release'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
