import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('LabFlow 第二阶段样本送检与报告闭环', () => {
  it('documents the six-step sample status flow and API boundary', () => {
    const source = read('src/content/projects/labflow-platform.md');
    for (const status of ['待送检', '已接收', '检验中', '待复核', '已出报告', '已归档']) expect(source).toContain(status);
    for (const endpoint of ['/samples', 'start-test', 'report', 'review', 'archive']) expect(source).toContain(endpoint);
    expect(source).toContain('受检者别名');
    expect(source).toContain('事件时间线');
  });

  it('keeps both repositories linked to the product detail', () => {
    const source = read('src/content/projects/labflow-platform.md');
    expect(source).toContain('https://github.com/xrlnewman/labflow-admin');
    expect(source).toContain('https://github.com/xrlnewman/labflow-miniapp');
  });
});

describe('TravelFlow 第二阶段旅行预订与售后闭环', () => {
  it('documents inventory-safe booking states and idempotent endpoints', () => {
    const source = read('src/content/projects/travelflow-platform.md');
    for (const status of ['待确认', '已预订', '已支付', '出行中', '已完成', '售后中']) expect(source).toContain(status);
    for (const endpoint of ['/travel-products', '/bookings', '/bookings/:id/confirm', '/bookings/:id/pay', '/bookings/:id/after-sale']) expect(source).toContain(endpoint);
    expect(source).toContain('Idempotency-Key');
    expect(source).toContain('库存');
  });

  it('keeps the miniapp and admin repositories linked', () => {
    const source = read('src/content/projects/travelflow-platform.md');
    expect(source).toContain('https://github.com/xrlnewman/travelflow-admin');
    expect(source).toContain('https://github.com/xrlnewman/travelflow-miniapp');
  });
});
