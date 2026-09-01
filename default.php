<?php
// Overwrite Hostinger default welcome page and serve React SPA index.html
if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
    exit;
}
if (file_exists(__DIR__ . '/frontend/dist/index.html')) {
    include __DIR__ . '/frontend/dist/index.html';
    exit;
}
echo "Karviyam E-Commerce Web Application";
