<?php
// Overwrite Hostinger default welcome page and serve React SPA index.html
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
    exit;
}
if (file_exists(__DIR__ . '/frontend/dist/index.html')) {
    include __DIR__ . '/frontend/dist/index.html';
    exit;
}
echo "Karviyam E-Commerce Web Application";
