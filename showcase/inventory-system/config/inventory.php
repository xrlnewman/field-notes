<?php

return [
    // 成本核算方法: weighted_average (加权平均) | fifo | lifo
    'cost_method' => env('INVENTORY_COST_METHOD', 'weighted_average'),

    // 是否允许负库存（false = 出库时不足时报错）
    'allow_negative_stock' => (bool) env('INVENTORY_NEGATIVE_STOCK', false),

    // 单据号前缀
    'order_prefix' => [
        'purchase' => 'PO',        // 采购单
        'sales' => 'SO',           // 销售单
        'transfer' => 'TR',        // 调拨单
        'stocktake' => 'ST',       // 盘点单
        'stock_in' => 'IN',        // 其它入库
        'stock_out' => 'OUT',      // 其它出库
    ],

    // 库存预警比例（默认低于安全库存的多少触发预警）
    'low_stock_ratio' => 1.0,
];
