<?php

use Illuminate\Support\Facades\Route;

// Apply CORS middleware to web routes including storage
Route::middleware('cors')->group(function () {
    Route::get('/', function () {
        return view('welcome');
    });
});
