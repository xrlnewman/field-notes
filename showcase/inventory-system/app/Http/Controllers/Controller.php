<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * 统一成功响应
     */
    protected function ok(mixed $data = null, string $message = 'ok'): \Illuminate\Http\JsonResponse
    {
        return response()->json(['code' => 0, 'message' => $message, 'data' => $data]);
    }

    /**
     * 统一失败响应
     */
    protected function fail(string $message = 'error', int $code = 1, mixed $data = null, int $status = 200): \Illuminate\Http\JsonResponse
    {
        return response()->json(['code' => $code, 'message' => $message, 'data' => $data], $status);
    }
}
