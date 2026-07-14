<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['app' => 'Inventory System API', 'version' => '0.1.0'];
});
